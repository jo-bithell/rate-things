using Microsoft.Azure.Cosmos;
using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly Container _container;

    public UserRepository(CosmosContainers containers) => _container = containers.Users;

    public async Task<UserDocument?> GetByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var query = new QueryDefinition("SELECT * FROM c WHERE c.email = @email")
            .WithParameter("@email", normalized);

        using var iterator = _container.GetItemQueryIterator<UserDocument>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            return page.FirstOrDefault();
        }

        return null;
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
        user.Email = user.Email.Trim().ToLowerInvariant();
        var response = await _container.CreateItemAsync(user, new PartitionKey(user.Id));
        return response.Resource;
    }
}
