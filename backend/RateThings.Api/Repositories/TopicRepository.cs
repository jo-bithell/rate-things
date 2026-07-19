using Microsoft.Azure.Cosmos;
using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public class TopicRepository : ITopicRepository
{
    private readonly Container _container;

    public TopicRepository(CosmosContainers containers) => _container = containers.Topics;

    public async Task<List<TopicDocument>> SearchAsync(string? search)
    {
        QueryDefinition query;
        if (string.IsNullOrWhiteSpace(search))
        {
            query = new QueryDefinition("SELECT * FROM c ORDER BY c.name");
        }
        else
        {
            query = new QueryDefinition("SELECT * FROM c WHERE CONTAINS(LOWER(c.name), @search) ORDER BY c.name")
                .WithParameter("@search", search.Trim().ToLowerInvariant());
        }

        var results = new List<TopicDocument>();
        using var iterator = _container.GetItemQueryIterator<TopicDocument>(query);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync());
        }

        return results;
    }

    public async Task<TopicDocument?> GetByIdAsync(string id)
    {
        try
        {
            var response = await _container.ReadItemAsync<TopicDocument>(id, new PartitionKey(id));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<TopicDocument?> GetByNameAsync(string name)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE LOWER(c.name) = @name")
            .WithParameter("@name", name.Trim().ToLowerInvariant());

        using var iterator = _container.GetItemQueryIterator<TopicDocument>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault();
        }

        return null;
    }

    public async Task<TopicDocument> CreateAsync(TopicDocument topic)
    {
        var response = await _container.CreateItemAsync(topic, new PartitionKey(topic.Id));
        return response.Resource;
    }

    public async Task<TopicDocument> UpdateAsync(TopicDocument topic)
    {
        topic.UpdatedAt = DateTimeOffset.UtcNow;
        var response = await _container.ReplaceItemAsync(topic, topic.Id, new PartitionKey(topic.Id));
        return response.Resource;
    }

    public Task DeleteAsync(string id) => _container.DeleteItemAsync<TopicDocument>(id, new PartitionKey(id));
}
