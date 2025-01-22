using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Chat.Controllers
{
    [Authorize]
    public class MessageHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            try
            {
                var user = Context.User;
                if (user != null && user.Identity?.IsAuthenticated == true)
                {
                    var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
                    var userEmail = user.FindFirst(ClaimTypes.Email)?.Value;

                    if (!string.IsNullOrEmpty(userRole))
                    {
                        await Groups.AddToGroupAsync(Context.ConnectionId, userRole);
                    }

                    if (!string.IsNullOrEmpty(userEmail))
                    {
                        Context.Items["UserEmail"] = userEmail;
                    }
                }

                await base.OnConnectedAsync();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userRole = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.IsNullOrEmpty(userRole))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userRole);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}