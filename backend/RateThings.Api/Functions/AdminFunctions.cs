using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;
using RateThings.Api.Services;

namespace RateThings.Api.Functions;

public class AdminFunctions
{
    private readonly IUserRepository _users;
    private readonly IJwtService _jwtService;

    public AdminFunctions(IUserRepository users, IJwtService jwtService)
    {
        _users = users;
        _jwtService = jwtService;
    }

    /// <summary>Self-service bootstrap for the very first admin - any approved, logged-in
    /// user can call this, but it permanently refuses once any admin already exists, so
    /// there's no standing risk once the app has its first admin.</summary>
    [Function("BootstrapAdmin")]
    public async Task<IActionResult> BootstrapAdmin(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/bootstrap")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        if (await _users.AnyAdminExistsAsync())
        {
            return HttpResponseExtensions.ForbiddenProblem("An admin already exists.");
        }

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        user.Role = UserRole.Admin;
        user = await _users.UpdateAsync(user);

        // Their existing token still carries the old role claim - issue a fresh one so
        // the promotion takes effect immediately instead of waiting for re-login.
        var token = _jwtService.GenerateToken(user);
        return new OkObjectResult(new AuthResponse(token, new UserDto(user.Id, user.Email, user.DisplayName, user.ImageUrl, user.Role.ToString())));
    }

    [Function("GetPendingUsers")]
    public async Task<IActionResult> GetPendingUsers(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/pending-users")] HttpRequest req)
    {
        if (!req.HttpContext.User.IsAdmin())
        {
            return HttpResponseExtensions.ForbiddenProblem();
        }

        var pending = await _users.GetPendingApprovalAsync();
        return new OkObjectResult(pending.Select(u => new PendingUserDto(u.Id, u.Email, u.DisplayName, u.CreatedAt)));
    }

    [Function("ApproveUser")]
    public async Task<IActionResult> ApproveUser(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/users/{id}/approve")] HttpRequest req, string id)
    {
        if (!req.HttpContext.User.IsAdmin())
        {
            return HttpResponseExtensions.ForbiddenProblem();
        }

        var user = await _users.GetByIdAsync(id);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        user.IsApproved = true;
        await _users.UpdateAsync(user);
        return new OkObjectResult(new { message = "Account approved." });
    }

    [Function("RejectUser")]
    public async Task<IActionResult> RejectUser(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/users/{id}/reject")] HttpRequest req, string id)
    {
        if (!req.HttpContext.User.IsAdmin())
        {
            return HttpResponseExtensions.ForbiddenProblem();
        }

        var user = await _users.GetByIdAsync(id);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        // Only ever hard-deletes a still-pending account - it hasn't created anything
        // yet, so there's nothing to unlink, unlike the self-service DeleteAccount flow.
        if (user.IsApproved)
        {
            return HttpResponseExtensions.BadRequestProblem("This account is already approved.");
        }

        await _users.DeleteAsync(id);
        return new OkObjectResult(new { message = "Account rejected." });
    }
}
