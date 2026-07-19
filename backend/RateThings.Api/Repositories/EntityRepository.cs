using Microsoft.Azure.Cosmos;
using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public class EntityRepository : IEntityRepository
{
    private readonly Container _container;

    public EntityRepository(CosmosContainers containers) => _container = containers.Entities;

    public async Task<List<EntityDocument>> SearchAsync(string topicId, string? search, string? tag)
    {
        var qb = new QueryDefinition(BuildSearchSql(search, tag))
            .WithParameter("@topicId", topicId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            qb = qb.WithParameter("@search", search.Trim().ToLowerInvariant());
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            qb = qb.WithParameter("@tag", tag.Trim().ToLowerInvariant());
        }

        var results = new List<EntityDocument>();
        var requestOptions = new QueryRequestOptions { PartitionKey = new PartitionKey(topicId) };
        using var iterator = _container.GetItemQueryIterator<EntityDocument>(qb, requestOptions: requestOptions);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync());
        }

        return results;
    }

    private static string BuildSearchSql(string? search, string? tag)
    {
        var sql = "SELECT * FROM c WHERE c.topicId = @topicId";
        if (!string.IsNullOrWhiteSpace(search))
        {
            sql += " AND CONTAINS(LOWER(c.name), @search)";
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            sql += " AND ARRAY_CONTAINS(c.tags, @tag, true)";
        }

        sql += " ORDER BY c.name";
        return sql;
    }

    public async Task<EntityDocument?> GetByIdAsync(string id)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.id = @id").WithParameter("@id", id);
        using var iterator = _container.GetItemQueryIterator<EntityDocument>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault();
        }

        return null;
    }

    public async Task<EntityDocument?> GetByNameInTopicAsync(string topicId, string name)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.topicId = @topicId AND LOWER(c.name) = @name")
            .WithParameter("@topicId", topicId)
            .WithParameter("@name", name.Trim().ToLowerInvariant());

        var requestOptions = new QueryRequestOptions { PartitionKey = new PartitionKey(topicId) };
        using var iterator = _container.GetItemQueryIterator<EntityDocument>(query, requestOptions: requestOptions);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault();
        }

        return null;
    }

    public async Task<List<string>> GetDistinctTagsAsync(string topicId)
    {
        var query = new QueryDefinition("SELECT DISTINCT VALUE t FROM c JOIN t IN c.tags WHERE c.topicId = @topicId")
            .WithParameter("@topicId", topicId);

        var requestOptions = new QueryRequestOptions { PartitionKey = new PartitionKey(topicId) };
        var results = new List<string>();
        using var iterator = _container.GetItemQueryIterator<string>(query, requestOptions: requestOptions);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync());
        }

        return results.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(t => t).ToList();
    }

    public async Task<EntityDocument> CreateAsync(EntityDocument entity)
    {
        var response = await _container.CreateItemAsync(entity, new PartitionKey(entity.TopicId));
        return response.Resource;
    }

    public async Task<EntityDocument> UpdateAsync(EntityDocument entity)
    {
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        var response = await _container.ReplaceItemAsync(entity, entity.Id, new PartitionKey(entity.TopicId));
        return response.Resource;
    }

    public Task DeleteAsync(string id, string topicId) =>
        _container.DeleteItemAsync<EntityDocument>(id, new PartitionKey(topicId));
}
