namespace RateThings.Api.Models;

public class TopicDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }

    // Empty for now - reserved for inviting specific users to a private topic later.
    public List<string> InvitedUserIds { get; set; } = new();

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public bool IsVisibleTo(string? userId) =>
        !IsPrivate || (userId is not null && (CreatedBy == userId || InvitedUserIds.Contains(userId)));
}
