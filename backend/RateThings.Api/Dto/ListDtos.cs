namespace RateThings.Api.Dto;

public record ListEntryDto(string EntityId, int Position);

public record ListDto(
    string Id,
    string TopicId,
    string OwnerId,
    string OwnerName,
    string Name,
    string? Description,
    List<ListEntryDto> Entries,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record CreateListRequest(string TopicId, string Name, string? Description);
public record UpdateListRequest(string Name, string? Description);
public record ReplaceListEntriesRequest(List<string> EntityIdsInOrder);
