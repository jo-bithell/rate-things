using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;
using RateThings.Api.Services;

namespace RateThings.Api.Functions;

public class EntityFunctions
{
    private readonly IEntityRepository _entities;
    private readonly ITopicRepository _topics;
    private readonly IImageStorageService _images;
    private readonly IUserRepository _users;
    private readonly IFriendshipRepository _friendships;

    public EntityFunctions(IEntityRepository entities, ITopicRepository topics, IImageStorageService images, IUserRepository users, IFriendshipRepository friendships)
    {
        _entities = entities;
        _topics = topics;
        _images = images;
        _users = users;
        _friendships = friendships;
    }

    private Task<HashSet<string>> GetFriendIdsAsync(string? userId) =>
        userId is null ? Task.FromResult(new HashSet<string>()) : _friendships.GetFriendIdsAsync(userId);

    [Function("GetEntities")]
    public async Task<IActionResult> GetEntities(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics/{topicId}/entities")] HttpRequest req, string topicId)
    {
        var userId = req.HttpContext.User.GetUserId();
        var topic = await _topics.GetByIdAsync(topicId);
        if (topic is null || !topic.IsVisibleTo(userId, await GetFriendIdsAsync(userId)))
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        var search = req.Query["search"].FirstOrDefault();
        var tag = req.Query["tag"].FirstOrDefault();
        var entities = await _entities.SearchAsync(topicId, search, tag);
        return new OkObjectResult(await Task.WhenAll(entities.Select(e => ToDtoAsync(e, _users))));
    }

    [Function("GetEntityById")]
    public async Task<IActionResult> GetEntityById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "entities/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        var entity = await _entities.GetByIdAsync(id);
        if (entity is null || !await CanAccessTopicAsync(entity.TopicId, userId))
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        return new OkObjectResult(await ToDtoAsync(entity, _users));
    }

    [Function("GetEntityTags")]
    public async Task<IActionResult> GetEntityTags(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics/{topicId}/entities/tags")] HttpRequest req, string topicId)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (!await CanAccessTopicAsync(topicId, userId))
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

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
        if (topic is null || !topic.IsVisibleTo(userId, await GetFriendIdsAsync(userId)))
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
        return new ObjectResult(await ToDtoAsync(entity, _users)) { StatusCode = StatusCodes.Status201Created };
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
        if (entity is null || !await CanAccessTopicAsync(entity.TopicId, userId))
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

        return new OkObjectResult(await ToDtoAsync(entity, _users));
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
        if (entity is null || !await CanAccessTopicAsync(entity.TopicId, userId))
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (entity.CreatedBy != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can delete this entity.");
        }

        await _images.DeleteAsync(entity.ImageUrl);
        await _entities.DeleteAsync(id, entity.TopicId);
        return new NoContentResult();
    }

    [Function("UploadEntityImage")]
    public async Task<IActionResult> UploadEntityImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "entities/{id}/image")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var entity = await _entities.GetByIdAsync(id);
        if (entity is null || !await CanAccessTopicAsync(entity.TopicId, userId))
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (entity.CreatedBy != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can change this entity's image.");
        }

        var form = await req.ReadFormAsync();
        var file = form.Files.GetFile("image");
        if (!ImageUploadValidation.TryValidate(file, out var extension, out var error))
        {
            return HttpResponseExtensions.BadRequestProblem(error);
        }

        await using var stream = file!.OpenReadStream();
        var url = await _images.UploadAsync("entities", stream, file.ContentType, extension);

        await _images.DeleteAsync(entity.ImageUrl);
        entity.ImageUrl = url;
        entity = await _entities.UpdateAsync(entity);

        return new OkObjectResult(await ToDtoAsync(entity, _users));
    }

    [Function("DeleteEntityImage")]
    public async Task<IActionResult> DeleteEntityImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "entities/{id}/image")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var entity = await _entities.GetByIdAsync(id);
        if (entity is null || !await CanAccessTopicAsync(entity.TopicId, userId))
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (entity.CreatedBy != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can change this entity's image.");
        }

        await _images.DeleteAsync(entity.ImageUrl);
        entity.ImageUrl = null;
        entity = await _entities.UpdateAsync(entity);

        return new OkObjectResult(await ToDtoAsync(entity, _users));
    }

    private async Task<bool> CanAccessTopicAsync(string topicId, string? userId)
    {
        var topic = await _topics.GetByIdAsync(topicId);
        return topic is not null && topic.IsVisibleTo(userId, await GetFriendIdsAsync(userId));
    }

    private static List<string> NormalizeTags(List<string>? tags) =>
        (tags ?? new List<string>())
            .Select(t => t.Trim().ToLowerInvariant())
            .Where(t => t.Length > 0)
            .Distinct()
            .OrderBy(t => t)
            .ToList();

    /// <summary>
    /// Resolves each rater's *current* profile picture rather than freezing it at rating
    /// time - unlike a stale display name, a stale avatar reads as actively wrong.
    /// </summary>
    internal static async Task<EntityDto> ToDtoAsync(EntityDocument e, IUserRepository users)
    {
        var raterIds = e.Ratings.Select(r => r.UserId).Distinct().ToList();
        var raters = await Task.WhenAll(raterIds.Select(id => users.GetByIdAsync(id)));
        var imageByUserId = raterIds
            .Zip(raters, (id, user) => (id, imageUrl: user?.ImageUrl))
            .ToDictionary(x => x.id, x => x.imageUrl);

        return new(
            e.Id, e.TopicId, e.Name, e.Description, e.Tags, e.ImageUrl,
            e.CreatedBy, e.CreatedByName, e.CreatedAt, e.UpdatedAt,
            e.AvgRating, e.RatingCount,
            e.Ratings.Select(r => new RatingDto(
                r.UserId, r.UserName, imageByUserId.GetValueOrDefault(r.UserId),
                r.Score, r.Comment, r.CreatedAt, r.UpdatedAt)).ToList());
    }
}
