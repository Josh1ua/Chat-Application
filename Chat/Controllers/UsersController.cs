using Chat.Models;
using Microsoft.AspNetCore.Mvc;
using Chat.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;

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
    public IActionResult GetUserInfo()
    {
        var userEmail = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        return Ok(new { email = userEmail, role = userRole });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(User user)
    {
        // Ensure `Approved` is set to `false` for new registrations
        user.Approved = false;

        // Validate required fields
        if (string.IsNullOrEmpty(user.fullName) || string.IsNullOrEmpty(user.Email) ||
            string.IsNullOrEmpty(user.Password) || string.IsNullOrEmpty(user.userType))
        {
            return BadRequest("All fields are required.");
        }

        try
        {
            // Call CouchDB service to add the user
            await _couchDbService.AddUserAsync(user);
            Console.WriteLine("User registered successfully.");
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

            // Set the token in an HttpOnly cookie
            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(1)
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
            // Retrieve the user document from CouchDB
            var existingUserDoc = await _couchDbService.GetUserByEmailAsync(userEmail);
            if (existingUserDoc == null)
            {
                return BadRequest("User not found.");
            }

            // Update the IsLoggedIn field to false
            existingUserDoc.IsLoggedIn = false;
            await _couchDbService.UpdateUserAsync(existingUserDoc);

            // Remove the auth token from cookies
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
        // Fetch JWT configuration values from appsettings.json
        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, user.Email),
        new Claim(ClaimTypes.Role, user.userType) // Add the role claim
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
