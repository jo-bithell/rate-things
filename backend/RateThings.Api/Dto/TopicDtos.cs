namespace RateThings.Api.Dto;

public record SharedUserDto(string Id, string DisplayName, string? ImageUrl);
public record TopicDto(string Id, string Name, string? Description, string? ImageUrl, bool IsPrivate, string CreatedBy, string CreatedByName, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, IReadOnlyList<SharedUserDto> SharedWith);
public record CreateTopicRequest(string Name, string? Description, bool IsPrivate, List<string>? InvitedUserIds);
public record UpdateTopicRequest(string Name, string? Description, bool IsPrivate, List<string>? InvitedUserIds);
