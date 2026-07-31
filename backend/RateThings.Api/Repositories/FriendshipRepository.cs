using Microsoft.Azure.Cosmos;
using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public class FriendshipRepository : IFriendshipRepository
{
    private readonly Container _container;

    public FriendshipRepository(CosmosContainers containers) => _container = containers.Friendships;

    public async Task<FriendshipDocument?> GetByIdAsync(string id)
    {
        try
        {
            var response = await _container.ReadItemAsync<FriendshipDocument>(id, new PartitionKey(id));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<FriendshipDocument?> GetBetweenAsync(string userIdA, string userIdB)
    {
        var query = new QueryDefinition(
                "SELECT * FROM c WHERE (c.requesterId = @a AND c.recipientId = @b) OR (c.requesterId = @b AND c.recipientId = @a)")
            .WithParameter("@a", userIdA)
            .WithParameter("@b", userIdB);

        using var iterator = _container.GetItemQueryIterator<FriendshipDocument>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault();
        }

        return null;
    }

    public async Task<List<FriendshipDocument>> GetForUserAsync(string userId)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.requesterId = @userId OR c.recipientId = @userId")
            .WithParameter("@userId", userId);

        var results = new List<FriendshipDocument>();
        using var iterator = _container.GetItemQueryIterator<FriendshipDocument>(query);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync());
        }

        return results;
    }

    public async Task<HashSet<string>> GetFriendIdsAsync(string userId)
    {
        // Bind status as a parameter rather than a literal so it goes through the same
        // serializer used to write documents - avoids assuming enums are stored as strings.
        var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.status = @status AND (c.requesterId = @userId OR c.recipientId = @userId)")
            .WithParameter("@status", FriendshipStatus.Accepted)
            .WithParameter("@userId", userId);

        var friendIds = new HashSet<string>();
        using var iterator = _container.GetItemQueryIterator<FriendshipDocument>(query);
        while (iterator.HasMoreResults)
        {
            foreach (var friendship in await iterator.ReadNextAsync())
            {
                friendIds.Add(friendship.OtherUserId(userId));
            }
        }

        return friendIds;
    }

    public async Task<FriendshipDocument> CreateAsync(FriendshipDocument friendship)
    {
        var response = await _container.CreateItemAsync(friendship, new PartitionKey(friendship.Id));
        return response.Resource;
    }

    public async Task<FriendshipDocument> UpdateAsync(FriendshipDocument friendship)
    {
        friendship.UpdatedAt = DateTimeOffset.UtcNow;
        var response = await _container.ReplaceItemAsync(friendship, friendship.Id, new PartitionKey(friendship.Id));
        return response.Resource;
    }

    public Task DeleteAsync(string id) => _container.DeleteItemAsync<FriendshipDocument>(id, new PartitionKey(id));
}
