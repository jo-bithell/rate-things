namespace RateThings.Api.Dto;

public record FriendDto(string UserId, string DisplayName, string? ImageUrl);
public record FriendRequestDto(string Id, string UserId, string DisplayName, string? ImageUrl, DateTimeOffset CreatedAt);
public record FriendsResponse(List<FriendDto> Friends, List<FriendRequestDto> Incoming, List<FriendRequestDto> Outgoing);
public record SendFriendRequestRequest(string ToUserId);
