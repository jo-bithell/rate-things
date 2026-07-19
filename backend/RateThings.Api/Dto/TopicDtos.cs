namespace RateThings.Api.Dto;

public record TopicDto(string Id, string Name, string? Description, string CreatedBy, string CreatedByName, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public record CreateTopicRequest(string Name, string? Description);
public record UpdateTopicRequest(string Name, string? Description);
