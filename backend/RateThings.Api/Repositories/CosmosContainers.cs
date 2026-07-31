using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using RateThings.Api.Common;

namespace RateThings.Api.Repositories;

/// <summary>Resolves and holds references to the five containers provisioned by Terraform.</summary>
public class CosmosContainers
{
    public Container Users { get; }
    public Container Topics { get; }
    public Container Entities { get; }
    public Container Lists { get; }
    public Container Friendships { get; }

    public CosmosContainers(CosmosClient client, IOptions<CosmosOptions> options)
    {
        var database = client.GetDatabase(options.Value.DatabaseName);
        Users = database.GetContainer("users");
        Topics = database.GetContainer("topics");
        Entities = database.GetContainer("entities");
        Lists = database.GetContainer("lists");
        Friendships = database.GetContainer("friendships");
    }
}
