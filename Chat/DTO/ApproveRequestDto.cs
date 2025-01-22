using Chat.Models;
using Newtonsoft.Json;

namespace Chat.DTO
{
    public class ApproveRequestDto:UserDocument
    { 

        public string Role { get; set; } = string.Empty; 
    }
}
