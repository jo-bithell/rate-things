using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public interface ITopicRepository
{
    Task<List<TopicDocument>> SearchAsync(string? search);
    Task<TopicDocument?> GetByIdAsync(string id);
    Task<TopicDocument?> GetByNameAsync(string name);
    Task<TopicDocument> CreateAsync(TopicDocument topic);
    Task<TopicDocument> UpdateAsync(TopicDocument topic);
    Task DeleteAsync(string id);
}
