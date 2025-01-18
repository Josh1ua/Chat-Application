using Chat.DTO;
using Chat.Models;
using Chat.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace Chat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequestController : ControllerBase
    {
        private readonly CouchDbService _couchDbService;

        public RequestController()
        {
            _couchDbService = new CouchDbService();
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            try
            {
                // Query to fetch users with "Approved" set to false
                var query = new
                {
                    selector = new
                    {
                        Approved = false
                    }
                };

                var response = await _couchDbService.ExecuteQueryAsync<UserDocument>(query);

                var pendingRequests = response.Select(u => new
                {
                    u._rev,
                    u._id,
                    u.fullName,
                    u.Email,
                    u.Password,
                    u.userType,
                    u.Approved
                });

                return Ok(pendingRequests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while fetching pending requests: {ex.Message}");
            }
        }

        [HttpPost("approve")]
        public async Task<IActionResult> ApproveRequest([FromBody] ApproveRequestDto request)
        {
            try
            {
                var user = await _couchDbService.GetUserByIdAsync(request._id);
                if (user == null) return NotFound("User not found");

                user.Approved = true;
                user.userType = request.Role;
                user._id = request._id; // Set _id for CouchDB
                user._rev = request._rev; // Set _rev for CouchDB

                await _couchDbService.UpdateUserAsync(user);

                return Ok(new { message = "User approved" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while approving the request: {ex.Message}");
            }
        }


        [HttpPost("reject")]
        public async Task<IActionResult> RejectRequest([FromBody] RejectRequestDto request)
        {
            try
            {
                // Fetch user by ID
                var user = await _couchDbService.GetUserByIdAsync(request.Id);
                if (user == null) return NotFound("User not found");

                // Delete user document
                await _couchDbService.DeleteUserAsync(request.Id, user._rev);

                return Ok(new {message= "User rejected" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while rejecting the request: {ex.Message}");
            }
        }
    }
}
