using Microsoft.Azure.Cosmos;
using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly Container _container;

    public UserRepository(CosmosContainers containers) => _container = containers.Users;

    public async Task<UserDocument?> GetByDisplayNameAsync(string displayName)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE LOWER(c.displayName) = @displayName")
            .WithParameter("@displayName", displayName.Trim().ToLowerInvariant());

        using var iterator = _container.GetItemQueryIterator<UserDocument>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault();
        }

        return null;
    }

    public async Task<List<UserDocument>> SearchByDisplayNameAsync(string query, string excludeUserId)
    {
        var sql = new QueryDefinition(
                "SELECT * FROM c WHERE c.id != @excludeUserId AND CONTAINS(LOWER(c.displayName), @query) ORDER BY c.displayName")
            .WithParameter("@excludeUserId", excludeUserId)
            .WithParameter("@query", query.Trim().ToLowerInvariant());

        var results = new List<UserDocument>();
        using var iterator = _container.GetItemQueryIterator<UserDocument>(sql);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync());
        }

        return results;
    }

    public async Task<List<UserDocument>> GetPendingApprovalAsync()
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.isApproved = false ORDER BY c.createdAt");

        var results = new List<UserDocument>();
        using var iterator = _container.GetItemQueryIterator<UserDocument>(query);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync());
        }

        return results;
    }

    public async Task<bool> AnyAdminExistsAsync()
    {
        // Bind role as a parameter rather than a literal so it goes through the same
        // serializer used to write documents - avoids assuming enums are stored as strings.
        var query = new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.role = @role")
            .WithParameter("@role", UserRole.Admin);

        using var iterator = _container.GetItemQueryIterator<int>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault() > 0;
        }

        return false;
    }

    public async Task<UserDocument?> GetByIdAsync(string id)
    {
        try
        {
            var response = await _container.ReadItemAsync<UserDocument>(id, new PartitionKey(id));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<UserDocument> CreateAsync(UserDocument user)
    {
        var response = await _container.CreateItemAsync(user, new PartitionKey(user.Id));
        return response.Resource;
    }

    public async Task<UserDocument> UpdateAsync(UserDocument user)
    {
        var response = await _container.ReplaceItemAsync(user, user.Id, new PartitionKey(user.Id));
        return response.Resource;
    }

    public Task DeleteAsync(string id) =>
        _container.DeleteItemAsync<UserDocument>(id, new PartitionKey(id));
}
