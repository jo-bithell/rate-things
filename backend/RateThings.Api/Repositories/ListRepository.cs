using Microsoft.Azure.Cosmos;
using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public class ListRepository : IListRepository
{
    private readonly Container _container;

    public ListRepository(CosmosContainers containers) => _container = containers.Lists;

    public async Task<List<ListDocument>> GetByTopicAsync(string topicId)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.topicId = @topicId ORDER BY c.name")
            .WithParameter("@topicId", topicId);

        var results = new List<ListDocument>();
        using var iterator = _container.GetItemQueryIterator<ListDocument>(query);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync());
        }

        return results;
    }

    public async Task<ListDocument?> GetByIdAsync(string id)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.id = @id").WithParameter("@id", id);
        using var iterator = _container.GetItemQueryIterator<ListDocument>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault();
        }

        return null;
    }

    public async Task<ListDocument> CreateAsync(ListDocument list)
    {
        var response = await _container.CreateItemAsync(list, new PartitionKey(list.OwnerId));
        return response.Resource;
    }

    public async Task<ListDocument> UpdateAsync(ListDocument list)
    {
        list.UpdatedAt = DateTimeOffset.UtcNow;
        var response = await _container.ReplaceItemAsync(list, list.Id, new PartitionKey(list.OwnerId));
        return response.Resource;
    }

    public Task DeleteAsync(string id, string ownerId) =>
        _container.DeleteItemAsync<ListDocument>(id, new PartitionKey(ownerId));
}
