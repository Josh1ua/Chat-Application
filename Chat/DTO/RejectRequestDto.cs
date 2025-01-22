using Newtonsoft.Json;

namespace Chat.DTO
{
    public class RejectRequestDto
    {
        [JsonProperty("_id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("_rev")]
        public string Rev { get; set; } = string.Empty;
    }
}
