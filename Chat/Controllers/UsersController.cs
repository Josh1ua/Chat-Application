using Chat.Models;
using Microsoft.AspNetCore.Mvc;
using Chat.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using Chat.Controllers;
using Microsoft.AspNetCore.SignalR;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{

    private readonly IConfiguration _configuration;
    private readonly CouchDbService _couchDbService;

    public UsersController(IConfiguration configuration)
    {
        _configuration = configuration;
        _couchDbService = new CouchDbService();
    }

    [HttpGet("user-info")]
    [Authorize]
    public async Task<IActionResult> GetUserInfo()
    {
        var userEmail = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userEmail))
        {
            return BadRequest("User email not found.");
        }

        
        var userDoc = await _couchDbService.GetUserByEmailAsync(userEmail);

        if (userDoc == null)
        {
            return NotFound("User not found.");
        }

        return Ok(userDoc);
    }

    [HttpGet("get-all-users")]
    [Authorize]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _couchDbService.GetAllUsersAsync();

            var userSummaries = users.Select(user => new
            {
                user.fullName,
                user.Email,
                user.Approved
            });

            return Ok(userSummaries);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching users: {ex.Message}");
            return StatusCode(500, "Internal server error.");
        }
    }



    [HttpPost("register")]
    public async Task<IActionResult> Register(User user)
    {
        user.Approved = false;

        if (string.IsNullOrEmpty(user.fullName) || string.IsNullOrEmpty(user.Email) ||
            string.IsNullOrEmpty(user.Password) || string.IsNullOrEmpty(user.userType))
        {
            return BadRequest("All fields are required.");
        }

        try
        {
            await _couchDbService.AddUserAsync(user);
            
            return Ok(new { message = "Request Sent Successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during registration: {ex.Message}");
            return StatusCode(500, "Internal server error.");
        }
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] User loginRequest)
    {
        if (string.IsNullOrEmpty(loginRequest.Email) || string.IsNullOrEmpty(loginRequest.Password))
        {
            return BadRequest("Email and password are required.");
        }

        try
        {
            var existingUserDoc = await _couchDbService.GetUserByEmailAsync(loginRequest.Email);
            if (existingUserDoc == null || existingUserDoc.Password != loginRequest.Password)
            {
                return Unauthorized("Invalid credentials.");
            }

            if (existingUserDoc.IsLoggedIn)
            {
                return BadRequest("User is already logged in.");
            }

            if (!existingUserDoc.Approved)
            {
                return Unauthorized(new
                {
                    message = "Your account is not approved yet. Please contact the administrator.",
                    user = existingUserDoc
                });
            }

            existingUserDoc.IsLoggedIn = true;
            await _couchDbService.UpdateUserAsync(existingUserDoc);

            var token = GenerateJwtToken(existingUserDoc);

            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(30)
            });

            Console.WriteLine("User logged in successfully.");
            return Ok(new { message = "Login successful.", role = existingUserDoc.userType });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during login: {ex.Message}");
            return StatusCode(500, "Internal server error.");
        }
    }



    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userEmail = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userEmail))
        {
            return BadRequest("User email not found in the token.");
        }

        try
        {
            var existingUserDoc = await _couchDbService.GetUserByEmailAsync(userEmail);
            if (existingUserDoc == null)
            {
                return BadRequest("User not found.");
            }

            existingUserDoc.IsLoggedIn = false;
            await _couchDbService.UpdateUserAsync(existingUserDoc);

            Response.Cookies.Delete("auth_token");
            return Ok(new { message = "Logged out successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during logout: {ex.Message}");
            return StatusCode(500, "Internal server error.");
        }
    }



    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, user.Email),
        new Claim(ClaimTypes.Role, user.userType) 
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = jwtIssuer,
            Audience = jwtIssuer,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}