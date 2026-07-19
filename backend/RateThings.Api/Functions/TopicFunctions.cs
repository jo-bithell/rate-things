using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;

namespace RateThings.Api.Functions;

public class TopicFunctions
{
    private readonly ITopicRepository _topics;

    public TopicFunctions(ITopicRepository topics) => _topics = topics;

    [Function("GetTopics")]
    public async Task<IActionResult> GetTopics(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics")] HttpRequest req)
    {
        var search = req.Query["search"].FirstOrDefault();
        var topics = await _topics.SearchAsync(search);
        return new OkObjectResult(topics.Select(ToDto));
    }

    [Function("GetTopicById")]
    public async Task<IActionResult> GetTopicById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics/{id}")] HttpRequest req, string id)
    {
        var topic = await _topics.GetByIdAsync(id);
        if (topic is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        return new OkObjectResult(ToDto(topic));
    }

    [Function("CreateTopic")]
    public async Task<IActionResult> CreateTopic(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "topics")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        var userName = req.HttpContext.User.GetDisplayName();
        if (userId is null || userName is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var body = await req.ReadFromJsonAsync<CreateTopicRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Name))
        {
            return HttpResponseExtensions.BadRequestProblem("Name is required.");
        }

        var existing = await _topics.GetByNameAsync(body.Name);
        if (existing is not null)
        {
            return HttpResponseExtensions.ConflictProblem($"A topic named '{body.Name}' already exists.");
        }

        var topic = new TopicDocument
        {
            Name = body.Name.Trim(),
            Description = body.Description?.Trim(),
            CreatedBy = userId,
            CreatedByName = userName,
        };

        topic = await _topics.CreateAsync(topic);
        return new ObjectResult(ToDto(topic)) { StatusCode = StatusCodes.Status201Created };
    }

    [Function("UpdateTopic")]
    public async Task<IActionResult> UpdateTopic(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "topics/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var topic = await _topics.GetByIdAsync(id);
        if (topic is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (topic.CreatedBy != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can edit this topic.");
        }

        var body = await req.ReadFromJsonAsync<UpdateTopicRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Name))
        {
            return HttpResponseExtensions.BadRequestProblem("Name is required.");
        }

        topic.Name = body.Name.Trim();
        topic.Description = body.Description?.Trim();
        topic = await _topics.UpdateAsync(topic);

        return new OkObjectResult(ToDto(topic));
    }

    [Function("DeleteTopic")]
    public async Task<IActionResult> DeleteTopic(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "topics/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var topic = await _topics.GetByIdAsync(id);
        if (topic is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (topic.CreatedBy != userId)
        {
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can delete this topic.");
        }

        await _topics.DeleteAsync(id);
        return new NoContentResult();
    }

    private static TopicDto ToDto(TopicDocument t) =>
        new(t.Id, t.Name, t.Description, t.CreatedBy, t.CreatedByName, t.CreatedAt, t.UpdatedAt);
}
