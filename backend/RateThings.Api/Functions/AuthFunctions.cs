using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using RateThings.Api.Common;
using RateThings.Api.Dto;
using RateThings.Api.Models;
using RateThings.Api.Repositories;
using RateThings.Api.Services;

namespace RateThings.Api.Functions;

public class AuthFunctions
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthFunctions> _logger;

    public AuthFunctions(IUserRepository users, IPasswordHasher passwordHasher, IJwtService jwtService, ILogger<AuthFunctions> logger)
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _logger = logger;
    }

    [Function("Register")]
    public async Task<IActionResult> Register(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/register")] HttpRequest req)
    {
        var body = await req.ReadFromJsonAsync<RegisterRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Password) || string.IsNullOrWhiteSpace(body.DisplayName))
        {
            return HttpResponseExtensions.BadRequestProblem("Password and display name are required.");
        }

        if (body.Password.Length < 8)
        {
            return HttpResponseExtensions.BadRequestProblem("Password must be at least 8 characters.");
        }

        var existing = await _users.GetByDisplayNameAsync(body.DisplayName);
        if (existing is not null)
        {
            return HttpResponseExtensions.ConflictProblem("That display name is already taken.");
        }

        var user = new UserDocument
        {
            DisplayName = body.DisplayName.Trim(),
            PasswordHash = _passwordHasher.Hash(body.Password),
            IsApproved = false,
        };

        user = await _users.CreateAsync(user);

        _logger.LogInformation("New user registered, awaiting approval: {UserId}", user.Id);

        // No token - every new registration is pending until an admin approves it, so
        // there's nothing to log them in with yet.
        return new ObjectResult(new { message = "Account created. An admin needs to approve it before you can log in." })
        {
            StatusCode = StatusCodes.Status201Created,
        };
    }

    [Function("Login")]
    public async Task<IActionResult> Login(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/login")] HttpRequest req)
    {
        var body = await req.ReadFromJsonAsync<LoginRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.DisplayName) || string.IsNullOrWhiteSpace(body.Password))
        {
            return HttpResponseExtensions.BadRequestProblem("Display name and password are required.");
        }

        var user = await _users.GetByDisplayNameAsync(body.DisplayName);
        if (user is null || !_passwordHasher.Verify(body.Password, user.PasswordHash))
        {
            return HttpResponseExtensions.UnauthorizedProblem("Invalid display name or password.");
        }

        if (!user.IsApproved)
        {
            return HttpResponseExtensions.ForbiddenProblem("Your account is awaiting admin approval.");
        }

        var token = _jwtService.GenerateToken(user);
        return new OkObjectResult(new AuthResponse(token, new UserDto(user.Id, user.DisplayName, user.ImageUrl, user.Role.ToString())));
    }
}
