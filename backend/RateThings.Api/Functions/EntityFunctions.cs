using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;

namespace RateThings.Api.Functions;

public class EntityFunctions
{
    private readonly IEntityRepository _entities;
    private readonly ITopicRepository _topics;

    public EntityFunctions(IEntityRepository entities, ITopicRepository topics)
    {
        _entities = entities;
        _topics = topics;
    }

    [Function("GetEntities")]
    public async Task<IActionResult> GetEntities(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics/{topicId}/entities")] HttpRequest req, string topicId)
    {
        var search = req.Query["search"].FirstOrDefault();
        var tag = req.Query["tag"].FirstOrDefault();
        var entities = await _entities.SearchAsync(topicId, search, tag);
        return new OkObjectResult(entities.Select(ToDto));
    }

    [Function("GetEntityById")]
    public async Task<IActionResult> GetEntityById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "entities/{id}")] HttpRequest req, string id)
    {
        var entity = await _entities.GetByIdAsync(id);
        if (entity is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        return new OkObjectResult(ToDto(entity));
    }

    [Function("GetEntityTags")]
    public async Task<IActionResult> GetEntityTags(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics/{topicId}/entities/tags")] HttpRequest req, string topicId)
    {
        var tags = await _entities.GetDistinctTagsAsync(topicId);
        return new OkObjectResult(tags);
    }

    [Function("CreateEntity")]
    public async Task<IActionResult> CreateEntity(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "topics/{topicId}/entities")] HttpRequest req, string topicId)
    {
        var userId = req.HttpContext.User.GetUserId();
        var userName = req.HttpContext.User.GetDisplayName();
        if (userId is null || userName is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var topic = await _topics.GetByIdAsync(topicId);
        if (topic is null)
        {
            return HttpResponseExtensions.NotFoundProblem("Topic not found.");
        }

        var body = await req.ReadFromJsonAsync<CreateEntityRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Name))
        {
            return HttpResponseExtensions.BadRequestProblem("Name is required.");
        }

        // Enforce one instance of each entity per topic — this is what "topics" buys us over a free-for-all pool.
        var existing = await _entities.GetByNameInTopicAsync(topicId, body.Name);
        if (existing is not null)
        {
            return HttpResponseExtensions.ConflictProblem($"'{body.Name}' already exists in this topic. Add your rating to the existing entry instead.");
        }

        var entity = new EntityDocument
        {
            TopicId = topicId,
            Name = body.Name.Trim(),
            Description = body.Description?.Trim(),
            Tags = NormalizeTags(body.Tags),
            CreatedBy = userId,
            CreatedByName = userName,
        };

        entity = await _entities.CreateAsync(entity);
        return new ObjectResult(ToDto(entity)) { StatusCode = StatusCodes.Status201Created };
    }

    [Function("UpdateEntity")]
    public async Task<IActionResult> UpdateEntity(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "entities/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var entity = await _entities.GetByIdAsync(id);
        if (entity is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (entity.CreatedBy != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can edit this entity.");
        }

        var body = await req.ReadFromJsonAsync<UpdateEntityRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Name))
        {
            return HttpResponseExtensions.BadRequestProblem("Name is required.");
        }

        var duplicate = await _entities.GetByNameInTopicAsync(entity.TopicId, body.Name);
        if (duplicate is not null && duplicate.Id != entity.Id)
        {
            return HttpResponseExtensions.ConflictProblem($"'{body.Name}' already exists in this topic.");
        }

        entity.Name = body.Name.Trim();
        entity.Description = body.Description?.Trim();
        entity.Tags = NormalizeTags(body.Tags);
        entity = await _entities.UpdateAsync(entity);

        return new OkObjectResult(ToDto(entity));
    }

    [Function("DeleteEntity")]
    public async Task<IActionResult> DeleteEntity(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "entities/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var entity = await _entities.GetByIdAsync(id);
        if (entity is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (entity.CreatedBy != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can delete this entity.");
        }

        await _entities.DeleteAsync(id, entity.TopicId);
        return new NoContentResult();
    }

    private static List<string> NormalizeTags(List<string>? tags) =>
        (tags ?? new List<string>())
            .Select(t => t.Trim().ToLowerInvariant())
            .Where(t => t.Length > 0)
            .Distinct()
            .OrderBy(t => t)
            .ToList();

    internal static EntityDto ToDto(EntityDocument e) => new(
        e.Id, e.TopicId, e.Name, e.Description, e.Tags, e.ImageUrl,
        e.CreatedBy, e.CreatedByName, e.CreatedAt, e.UpdatedAt,
        e.AvgRating, e.RatingCount,
        e.Ratings.Select(r => new RatingDto(r.UserId, r.UserName, r.Score, r.Comment, r.CreatedAt, r.UpdatedAt)).ToList());
}
