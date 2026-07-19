namespace RateThings.Api.Dto;

public record RatingDto(string UserId, string UserName, int Score, string? Comment, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

public record EntityDto(
    string Id,
    string TopicId,
    string Name,
    string? Description,
    List<string> Tags,
    string? ImageUrl,
    string CreatedBy,
    string CreatedByName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    double AvgRating,
    int RatingCount,
    List<RatingDto> Ratings);

public record CreateEntityRequest(string Name, string? Description, List<string>? Tags);
public record UpdateEntityRequest(string Name, string? Description, List<string>? Tags);
public record UpsertRatingRequest(int Score, string? Comment);
