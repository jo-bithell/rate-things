using System.Text.Json;
using System.Text.Json.Serialization;

namespace RateThings.Api.Common;

public static class JsonOptionsProvider
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };
}
