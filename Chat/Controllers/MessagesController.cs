using Chat.Controllers;
using Chat.Data;
using Chat.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<MessageHub> _hubContext;

    public MessagesController(AppDbContext context, IHubContext<MessageHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // POST: api/messages
    [HttpPost("sendmessage")]
    public async Task<IActionResult> SendMessage([FromBody] Message message)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        message.Timestamp = DateTime.UtcNow;
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("ReceiveMessage", message);
        return Ok(message);
    }

    // GET: api/messages
    [HttpGet("getmessage")]
    public async Task<IActionResult> GetMessages()
    {
        var messages = await _context.Messages.ToListAsync();
        return Ok(messages);
    }


}
