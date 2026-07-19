using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public interface IEntityRepository
{
    Task<List<EntityDocument>> SearchAsync(string topicId, string? search, string? tag);
    Task<EntityDocument?> GetByIdAsync(string id);
    Task<EntityDocument?> GetByNameInTopicAsync(string topicId, string name);
    Task<List<string>> GetDistinctTagsAsync(string topicId);
    Task<EntityDocument> CreateAsync(EntityDocument entity);
    Task<EntityDocument> UpdateAsync(EntityDocument entity);
    Task DeleteAsync(string id, string topicId);
}
