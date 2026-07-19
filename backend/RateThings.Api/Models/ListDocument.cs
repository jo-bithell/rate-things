namespace RateThings.Api.Models;

public class ListEntry
{
    public string EntityId { get; set; } = string.Empty;
    public int Position { get; set; }
}

public class ListDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TopicId { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<ListEntry> Entries { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
