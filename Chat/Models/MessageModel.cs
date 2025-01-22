namespace Chat.Models;
public class MessageModel
{
    public int id { get; set; }
    public string sender { get; set; } = string.Empty;
    public string receiver { get; set; } = string.Empty;
    public string message { get; set; } = string.Empty; 
    public DateTime timestamp { get; set; } = DateTime.UtcNow;
    public string sender_role { get; set; } = "User"; 
    public string MessageType { get; set; } = "single"; 
}
