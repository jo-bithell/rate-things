namespace RateThings.Api.Common;

public class CosmosOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "ratethings";
}

public class JwtOptions
{
    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "ratethings-api";
    public string Audience { get; set; } = "ratethings-client";
    public int ExpiryMinutes { get; set; } = 60 * 24 * 14; // 2 weeks — small trusted-group app, favor convenience
}
