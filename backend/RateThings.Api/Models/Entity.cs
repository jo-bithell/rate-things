namespace RateThings.Api.Models;

public class RatingEntry
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;

    /// <summary>Score from 0 to 10, inclusive.</summary>
    public int Score { get; set; }

    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class EntityDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TopicId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? ImageUrl { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<RatingEntry> Ratings { get; set; } = new();

    // Denormalized so list/search views don't need to aggregate on every read.
    public double AvgRating { get; set; }
    public int RatingCount { get; set; }

    public void RecalculateAggregate()
    {
        RatingCount = Ratings.Count;
        AvgRating = RatingCount == 0 ? 0 : Math.Round(Ratings.Average(r => r.Score), 2);
    }
}
