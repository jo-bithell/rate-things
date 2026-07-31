namespace RateThings.Api.Models;

public enum FriendshipStatus
{
    Pending,
    Accepted,
}

public class FriendshipDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RequesterId { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RecipientId { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public string OtherUserId(string userId) => RequesterId == userId ? RecipientId : RequesterId;
}
