using Chat.DTO;
using Chat.Models;
using Chat.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Linq;
using System.Threading.Tasks;

namespace Chat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequestController : ControllerBase
    {
        private readonly CouchDbService _couchDbService;
        private readonly IHubContext<MessageHub> _hubContext;

        public RequestController(IHubContext<MessageHub> hubContext)
        {
            _couchDbService = new CouchDbService();
            _hubContext = hubContext;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            try
            {
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
                user._id = request._id; 
                user._rev = request._rev;

                await _couchDbService.UpdateUserAsync(user);

                await _hubContext.Clients.All.SendAsync("UserAdded", new
                {
                    user.fullName,
                    user.Email
                });

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
                var user = await _couchDbService.GetUserByIdAsync(request.Id);
                if (user == null) return NotFound("User not found");

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
