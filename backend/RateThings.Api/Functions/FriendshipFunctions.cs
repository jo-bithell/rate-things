using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;

namespace RateThings.Api.Functions;

public class FriendshipFunctions
{
    private readonly IFriendshipRepository _friendships;
    private readonly IUserRepository _users;

    public FriendshipFunctions(IFriendshipRepository friendships, IUserRepository users)
    {
        _friendships = friendships;
        _users = users;
    }

    [Function("GetFriends")]
    public async Task<IActionResult> GetFriends(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "friends")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        return new OkObjectResult(await BuildFriendsResponseAsync(userId));
    }

    [Function("SendFriendRequest")]
    public async Task<IActionResult> SendFriendRequest(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "friends/requests")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        var userName = req.HttpContext.User.GetDisplayName();
        if (userId is null || userName is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var body = await req.ReadFromJsonAsync<SendFriendRequestRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.ToUserId))
        {
            return HttpResponseExtensions.BadRequestProblem("ToUserId is required.");
        }

        if (body.ToUserId == userId)
        {
            return HttpResponseExtensions.BadRequestProblem("You can't send a friend request to yourself.");
        }

        var toUser = await _users.GetByIdAsync(body.ToUserId);
        if (toUser is null)
        {
            return HttpResponseExtensions.NotFoundProblem("User not found.");
        }

        var existing = await _friendships.GetBetweenAsync(userId, body.ToUserId);
        if (existing is not null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
            {
                return HttpResponseExtensions.ConflictProblem("You're already friends.");
            }

            if (existing.RequesterId == body.ToUserId)
            {
                // Crossed requests: they already asked you - accept theirs instead of
                // creating a second pending row that would otherwise never resolve.
                existing.Status = FriendshipStatus.Accepted;
                await _friendships.UpdateAsync(existing);
            }
            else
            {
                return HttpResponseExtensions.ConflictProblem("Friend request already sent.");
            }
        }
        else
        {
            await _friendships.CreateAsync(new FriendshipDocument
            {
                RequesterId = userId,
                RequesterName = userName,
                RecipientId = body.ToUserId,
                RecipientName = toUser.DisplayName,
            });
        }

        return new OkObjectResult(await BuildFriendsResponseAsync(userId));
    }

    [Function("AcceptFriendRequest")]
    public async Task<IActionResult> AcceptFriendRequest(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "friends/requests/{id}/accept")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var request = await _friendships.GetByIdAsync(id);
        if (request is null || request.RecipientId != userId || request.Status != FriendshipStatus.Pending)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        request.Status = FriendshipStatus.Accepted;
        await _friendships.UpdateAsync(request);

        return new OkObjectResult(await BuildFriendsResponseAsync(userId));
    }

    [Function("DeclineFriendRequest")]
    public async Task<IActionResult> DeclineFriendRequest(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "friends/requests/{id}/decline")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var request = await _friendships.GetByIdAsync(id);
        if (request is null || request.RecipientId != userId || request.Status != FriendshipStatus.Pending)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        await _friendships.DeleteAsync(id);
        return new OkObjectResult(await BuildFriendsResponseAsync(userId));
    }

    [Function("CancelFriendRequest")]
    public async Task<IActionResult> CancelFriendRequest(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "friends/requests/{id}")] HttpRequest req, string id)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var request = await _friendships.GetByIdAsync(id);
        if (request is null || request.RequesterId != userId || request.Status != FriendshipStatus.Pending)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        await _friendships.DeleteAsync(id);
        return new OkObjectResult(await BuildFriendsResponseAsync(userId));
    }

    [Function("RemoveFriend")]
    public async Task<IActionResult> RemoveFriend(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "friends/{userId}")] HttpRequest req, string userId)
    {
        var currentUserId = req.HttpContext.User.GetUserId();
        if (currentUserId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var friendship = await _friendships.GetBetweenAsync(currentUserId, userId);
        if (friendship is null || friendship.Status != FriendshipStatus.Accepted)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        await _friendships.DeleteAsync(friendship.Id);
        return new OkObjectResult(await BuildFriendsResponseAsync(currentUserId));
    }

    private async Task<FriendsResponse> BuildFriendsResponseAsync(string userId)
    {
        var relationships = await _friendships.GetForUserAsync(userId);

        var friends = new List<FriendDto>();
        var incoming = new List<FriendRequestDto>();
        var outgoing = new List<FriendRequestDto>();

        foreach (var f in relationships)
        {
            // Live lookup rather than the denormalized Requester/RecipientName+ImageUrl -
            // a stale avatar/name here would be just as jarring as it was for rating avatars.
            var otherUser = await _users.GetByIdAsync(f.OtherUserId(userId));
            if (otherUser is null)
            {
                continue;
            }

            if (f.Status == FriendshipStatus.Accepted)
            {
                friends.Add(new FriendDto(otherUser.Id, otherUser.DisplayName, otherUser.ImageUrl));
            }
            else if (f.RequesterId == userId)
            {
                outgoing.Add(new FriendRequestDto(f.Id, otherUser.Id, otherUser.DisplayName, otherUser.ImageUrl, f.CreatedAt));
            }
            else
            {
                incoming.Add(new FriendRequestDto(f.Id, otherUser.Id, otherUser.DisplayName, otherUser.ImageUrl, f.CreatedAt));
            }
        }

        return new FriendsResponse(friends, incoming, outgoing);
    }
}
