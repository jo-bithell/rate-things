using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;

namespace RateThings.Api.Functions;

public class ListFunctions
{
    private readonly IListRepository _lists;
    private readonly ITopicRepository _topics;
    private readonly IEntityRepository _entities;

    public ListFunctions(IListRepository lists, ITopicRepository topics, IEntityRepository entities)
    {
        _lists = lists;
        _topics = topics;
        _entities = entities;
    }

    [Function("GetListsByTopic")]
    public async Task<IActionResult> GetListsByTopic(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics/{topicId}/lists")] HttpRequest req, string topicId)
    {
        var lists = await _lists.GetByTopicAsync(topicId);
        return new OkObjectResult(lists.Select(ToDto));
    }

    [Function("GetMyLists")]
    public async Task<IActionResult> GetMyLists(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "lists/mine")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var lists = await _lists.GetByOwnerAsync(userId);
        return new OkObjectResult(lists.Select(ToDto));
    }

    [Function("GetListById")]
    public async Task<IActionResult> GetListById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "lists/{id}")] HttpRequest req, string id)
    {
        var list = await _lists.GetByIdAsync(id);
        if (list is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        return new OkObjectResult(ToDto(list));
    }

    [Function("CreateList")]
    public async Task<IActionResult> CreateList(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "lists")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        var userName = req.HttpContext.User.GetDisplayName();
        if (userId is null || userName is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var body = await req.ReadFromJsonAsync<CreateListRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.TopicId))
        {
            return HttpResponseExtensions.BadRequestProblem("TopicId and name are required.");
        }

        var topic = await _topics.GetByIdAsync(body.TopicId);
        if (topic is null)
        {
            return HttpResponseExtensions.NotFoundProblem("Topic not found.");
        }

        var list = new ListDocument
        {
            TopicId = body.TopicId,
            OwnerId = userId,
            OwnerName = userName,
            Name = body.Name.Trim(),
            Description = body.Description?.Trim(),
        };

        list = await _lists.CreateAsync(list);
        return new ObjectResult(ToDto(list)) { StatusCode = StatusCodes.Status201Created };
    }

    [Function("UpdateList")]
    public async Task<IActionResult> UpdateList(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "lists/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (list.OwnerId != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the owner can edit this list.");
        }

        var body = await req.ReadFromJsonAsync<UpdateListRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Name))
        {
            return HttpResponseExtensions.BadRequestProblem("Name is required.");
        }

        list.Name = body.Name.Trim();
        list.Description = body.Description?.Trim();
        list = await _lists.UpdateAsync(list);

        return new OkObjectResult(ToDto(list));
    }

    [Function("ReplaceListEntries")]
    public async Task<IActionResult> ReplaceListEntries(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "lists/{id}/entries")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (list.OwnerId != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the owner can edit this list.");
        }

        var body = await req.ReadFromJsonAsync<ReplaceListEntriesRequest>();
        if (body?.EntityIdsInOrder is null)
        {
            return HttpResponseExtensions.BadRequestProblem("EntityIdsInOrder is required.");
        }

        var distinctIds = body.EntityIdsInOrder.Distinct().ToList();

        var topicEntities = await _entities.SearchAsync(list.TopicId, search: null, tag: null);
        var validEntityIds = topicEntities.Select(e => e.Id).ToHashSet();
        var unknownIds = distinctIds.Where(id => !validEntityIds.Contains(id)).ToList();
        if (unknownIds.Count > 0)
        {
            return HttpResponseExtensions.BadRequestProblem(
                $"These entity IDs don't belong to this list's topic: {string.Join(", ", unknownIds)}.");
        }

        list.Entries = distinctIds
            .Select((entityId, index) => new ListEntry { EntityId = entityId, Position = index })
            .ToList();

        list = await _lists.UpdateAsync(list);
        return new OkObjectResult(ToDto(list));
    }

    [Function("DeleteList")]
    public async Task<IActionResult> DeleteList(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "lists/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (list.OwnerId != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the owner can delete this list.");
        }

        await _lists.DeleteAsync(id, list.OwnerId);
        return new NoContentResult();
    }

    private static ListDto ToDto(ListDocument l) => new(
        l.Id, l.TopicId, l.OwnerId, l.OwnerName, l.Name, l.Description,
        l.Entries.OrderBy(e => e.Position).Select(e => new ListEntryDto(e.EntityId, e.Position)).ToList(),
        l.CreatedAt, l.UpdatedAt);
}
