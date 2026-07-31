using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;
using RateThings.Api.Services;

namespace RateThings.Api.Functions;

public class TopicFunctions
{
    private readonly ITopicRepository _topics;
    private readonly IImageStorageService _images;

    public TopicFunctions(ITopicRepository topics, IImageStorageService images)
    {
        _topics = topics;
        _images = images;
    }

    [Function("GetTopics")]
    public async Task<IActionResult> GetTopics(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        var search = req.Query["search"].FirstOrDefault();
        var topics = await _topics.SearchAsync(search);
        return new OkObjectResult(topics.Where(t => t.IsVisibleTo(userId)).Select(ToDto));
    }

    [Function("GetTopicById")]
    public async Task<IActionResult> GetTopicById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "topics/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        var topic = await _topics.GetByIdAsync(id);
        if (topic is null || !topic.IsVisibleTo(userId))
        {
            // 404 rather than 403 for a private topic you can't see - doesn't confirm it exists.
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

        // Only conflict on a name you can actually see - otherwise this would leak the
        // existence of someone else's private topic through the error message.
        var existing = await _topics.GetByNameAsync(body.Name);
        if (existing is not null && existing.IsVisibleTo(userId))
        {
            return HttpResponseExtensions.ConflictProblem($"A topic named '{body.Name}' already exists.");
        }

        var topic = new TopicDocument
        {
            Name = body.Name.Trim(),
            Description = body.Description?.Trim(),
            IsPrivate = body.IsPrivate,
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
        topic.IsPrivate = body.IsPrivate;
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

        await _images.DeleteAsync(topic.ImageUrl);
        await _topics.DeleteAsync(id);
        return new NoContentResult();
    }

    [Function("UploadTopicImage")]
    public async Task<IActionResult> UploadTopicImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "topics/{id}/image")] HttpRequest req, string id)
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
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can change this topic's image.");
        }

        var form = await req.ReadFormAsync();
        var file = form.Files.GetFile("image");
        if (!ImageUploadValidation.TryValidate(file, out var extension, out var error))
        {
            return HttpResponseExtensions.BadRequestProblem(error);
        }

        await using var stream = file!.OpenReadStream();
        var url = await _images.UploadAsync("topics", stream, file.ContentType, extension);

        await _images.DeleteAsync(topic.ImageUrl);
        topic.ImageUrl = url;
        topic = await _topics.UpdateAsync(topic);

        return new OkObjectResult(ToDto(topic));
    }

    [Function("DeleteTopicImage")]
    public async Task<IActionResult> DeleteTopicImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "topics/{id}/image")] HttpRequest req, string id)
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
            return HttpResponseExtensions.ForbiddenProblem("Only the creator can change this topic's image.");
        }

        await _images.DeleteAsync(topic.ImageUrl);
        topic.ImageUrl = null;
        topic = await _topics.UpdateAsync(topic);

        return new OkObjectResult(ToDto(topic));
    }

    private static TopicDto ToDto(TopicDocument t) =>
        new(t.Id, t.Name, t.Description, t.ImageUrl, t.IsPrivate, t.CreatedBy, t.CreatedByName, t.CreatedAt, t.UpdatedAt);
}
