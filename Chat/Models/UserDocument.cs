using Newtonsoft.Json;

namespace Chat.Models
{
    public class UserDocument: User
    {
        [JsonProperty("_id")]
        public string _id { get; set; } = string.Empty;

        [JsonProperty("_rev")]
        public string _rev { get; set; } = string.Empty;
    }
}
