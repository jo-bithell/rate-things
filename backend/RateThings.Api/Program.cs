using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RateThings.Api.Common;
using RateThings.Api.Repositories;
using RateThings.Api.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication(workerBuilder =>
    {
        // Runs on every request except /api/auth/register and /api/auth/login (see JwtAuthMiddleware).
        workerBuilder.UseMiddleware<JwtAuthMiddleware>();
    })
    .ConfigureServices((context, services) =>
    {
        services.Configure<CosmosOptions>(context.Configuration.GetSection("CosmosDb"));
        services.Configure<JwtOptions>(context.Configuration.GetSection("Jwt"));

        services.AddSingleton(_ =>
        {
            var options = context.Configuration.GetSection("CosmosDb").Get<CosmosOptions>() ?? new CosmosOptions();
            return new CosmosClient(options.ConnectionString, new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase,
                },
            });
        });

        services.AddSingleton<CosmosContainers>();
        services.AddSingleton<IUserRepository, UserRepository>();
        services.AddSingleton<ITopicRepository, TopicRepository>();
        services.AddSingleton<IEntityRepository, EntityRepository>();
        services.AddSingleton<IListRepository, ListRepository>();

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtService, JwtService>();

        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();
    })
    .Build();

host.Run();
