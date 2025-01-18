using Newtonsoft.Json;

namespace Chat.Models
{
    public class User
    {
        [JsonProperty("Name")]
        public string fullName { get; set; } = string.Empty;

        [JsonProperty("Email")]
        public string Email { get; set; } = string.Empty;

        [JsonProperty("Password")]
        public string Password { get; set; } = string.Empty;

        [JsonProperty("UserType")]
        public string userType { get; set; } = string.Empty;

        [JsonProperty("Approved")]
        public bool Approved { get; set; } = false;
        [JsonProperty("IsLoggedIn")]
        public bool IsLoggedIn { get; set; } = false;
    }
}