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

    /// <summary>
    /// Published (non-private) topics are visible to the creator's friends, not to every
    /// user - "friendIds" is the requesting user's own accepted-friend set, fetched once
    /// per request by the caller (see IFriendshipRepository.GetFriendIdsAsync).
    /// </summary>
    public bool IsVisibleTo(string? userId, ISet<string> friendIds)
    {
        if (userId is null) return false;
        if (CreatedBy == userId) return true;
        if (IsPrivate) return InvitedUserIds.Contains(userId);
        return friendIds.Contains(CreatedBy);
    }
}
