using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public interface IListRepository
{
    Task<List<ListDocument>> GetByTopicAsync(string topicId);
    Task<List<ListDocument>> GetByOwnerAsync(string ownerId);
    Task<ListDocument?> GetByIdAsync(string id);
    Task<ListDocument> CreateAsync(ListDocument list);
    Task<ListDocument> UpdateAsync(ListDocument list);
    Task DeleteAsync(string id, string ownerId);
}
