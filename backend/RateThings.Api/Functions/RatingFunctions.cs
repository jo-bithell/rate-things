using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;

namespace RateThings.Api.Functions;

public class RatingFunctions
{
    private readonly IEntityRepository _entities;

    public RatingFunctions(IEntityRepository entities) => _entities = entities;

    [Function("UpsertRating")]
    public async Task<IActionResult> UpsertRating(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "entities/{id}/rating")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        var userName = req.HttpContext.User.GetDisplayName();
        if (userId is null || userName is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var body = await req.ReadFromJsonAsync<UpsertRatingRequest>();
        if (body is null || body.Score is < 0 or > 10)
        {
            return HttpResponseExtensions.BadRequestProblem("Score must be between 0 and 10.");
        }

        var entity = await _entities.GetByIdAsync(id);
        if (entity is null)
        {
            return HttpResponseExtensions.NotFoundProblem("Entity not found.");
        }

        var existing = entity.Ratings.FirstOrDefault(r => r.UserId == userId);
        if (existing is not null)
        {
            existing.Score = body.Score;
            existing.Comment = body.Comment?.Trim();
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            entity.Ratings.Add(new RatingEntry
            {
                UserId = userId,
                UserName = userName,
                Score = body.Score,
                Comment = body.Comment?.Trim(),
            });
        }

        entity.RecalculateAggregate();
        entity = await _entities.UpdateAsync(entity);

        return new OkObjectResult(EntityFunctions.ToDto(entity));
    }

    [Function("DeleteRating")]
    public async Task<IActionResult> DeleteRating(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "entities/{id}/rating")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var entity = await _entities.GetByIdAsync(id);
        if (entity is null)
        {
            return HttpResponseExtensions.NotFoundProblem("Entity not found.");
        }

        var removed = entity.Ratings.RemoveAll(r => r.UserId == userId);
        if (removed == 0)
        {
            return HttpResponseExtensions.NotFoundProblem("You haven't rated this entity.");
        }

        entity.RecalculateAggregate();
        entity = await _entities.UpdateAsync(entity);

        return new OkObjectResult(EntityFunctions.ToDto(entity));
    }
}
