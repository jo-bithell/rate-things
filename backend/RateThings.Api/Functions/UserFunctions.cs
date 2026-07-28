using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Repositories;
using RateThings.Api.Services;

namespace RateThings.Api.Functions;

public class UserFunctions
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IImageStorageService _images;

    public UserFunctions(IUserRepository users, IPasswordHasher passwordHasher, IJwtService jwtService, IImageStorageService images)
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _images = images;
    }

    [Function("GetMe")]
    public async Task<IActionResult> GetMe(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "users/me")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        return new OkObjectResult(new UserDto(user.Id, user.Email, user.DisplayName, user.ImageUrl));
    }

    [Function("UpdateProfile")]
    public async Task<IActionResult> UpdateProfile(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "users/me")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var body = await req.ReadFromJsonAsync<UpdateProfileRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.DisplayName))
        {
            return HttpResponseExtensions.BadRequestProblem("Email and display name are required.");
        }

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        var existing = await _users.GetByEmailAsync(body.Email);
        if (existing is not null && existing.Id != userId)
        {
            return HttpResponseExtensions.ConflictProblem("An account with that email already exists.");
        }

        user.Email = body.Email.Trim();
        user.DisplayName = body.DisplayName.Trim();
        user = await _users.UpdateAsync(user);

        // Email/display name are embedded in the JWT's claims, so the caller needs a
        // fresh token - otherwise their existing token keeps presenting stale values
        // to every other endpoint until it expires.
        var token = _jwtService.GenerateToken(user);
        return new OkObjectResult(new AuthResponse(token, new UserDto(user.Id, user.Email, user.DisplayName, user.ImageUrl)));
    }

    [Function("ChangePassword")]
    public async Task<IActionResult> ChangePassword(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "users/me/password")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var body = await req.ReadFromJsonAsync<ChangePasswordRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.CurrentPassword) || string.IsNullOrWhiteSpace(body.NewPassword))
        {
            return HttpResponseExtensions.BadRequestProblem("Current and new password are required.");
        }

        if (body.NewPassword.Length < 8)
        {
            return HttpResponseExtensions.BadRequestProblem("New password must be at least 8 characters.");
        }

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (!_passwordHasher.Verify(body.CurrentPassword, user.PasswordHash))
        {
            return HttpResponseExtensions.UnauthorizedProblem("Current password is incorrect.");
        }

        user.PasswordHash = _passwordHasher.Hash(body.NewPassword);
        await _users.UpdateAsync(user);

        return new OkObjectResult(new { message = "Password updated." });
    }

    [Function("DeleteAccount")]
    public async Task<IActionResult> DeleteAccount(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "users/me")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var body = await req.ReadFromJsonAsync<DeleteAccountRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Password))
        {
            return HttpResponseExtensions.BadRequestProblem("Password confirmation is required.");
        }

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        if (!_passwordHasher.Verify(body.Password, user.PasswordHash))
        {
            return HttpResponseExtensions.UnauthorizedProblem("Password is incorrect.");
        }

        await _images.DeleteAsync(user.ImageUrl);
        await _users.DeleteAsync(userId);
        return new NoContentResult();
    }

    [Function("UploadProfileImage")]
    public async Task<IActionResult> UploadProfileImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "users/me/image")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        var form = await req.ReadFormAsync();
        var file = form.Files.GetFile("image");
        if (!ImageUploadValidation.TryValidate(file, out var extension, out var error))
        {
            return HttpResponseExtensions.BadRequestProblem(error);
        }

        await using var stream = file!.OpenReadStream();
        var url = await _images.UploadAsync("users", stream, file.ContentType, extension);

        await _images.DeleteAsync(user.ImageUrl);
        user.ImageUrl = url;
        user = await _users.UpdateAsync(user);

        return new OkObjectResult(new UserDto(user.Id, user.Email, user.DisplayName, user.ImageUrl));
    }

    [Function("DeleteProfileImage")]
    public async Task<IActionResult> DeleteProfileImage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "users/me/image")] HttpRequest req)
    {
        var userId = req.HttpContext.User.GetUserId();
        if (userId is null)
        {
            return HttpResponseExtensions.UnauthorizedProblem();
        }

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return HttpResponseExtensions.NotFoundProblem();
        }

        await _images.DeleteAsync(user.ImageUrl);
        user.ImageUrl = null;
        user = await _users.UpdateAsync(user);

        return new OkObjectResult(new UserDto(user.Id, user.Email, user.DisplayName, user.ImageUrl));
    }
}
