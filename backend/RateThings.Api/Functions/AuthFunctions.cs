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
        if (body is null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password) || string.IsNullOrWhiteSpace(body.DisplayName))
        {
            return HttpResponseExtensions.BadRequestProblem("Email, password, and display name are required.");
        }

        if (body.Password.Length < 8)
        {
            return HttpResponseExtensions.BadRequestProblem("Password must be at least 8 characters.");
        }

        var existing = await _users.GetByEmailAsync(body.Email);
        if (existing is not null)
        {
            return HttpResponseExtensions.ConflictProblem("An account with that email already exists.");
        }

        var user = new UserDocument
        {
            Email = body.Email,
            DisplayName = body.DisplayName.Trim(),
            PasswordHash = _passwordHasher.Hash(body.Password),
        };

        user = await _users.CreateAsync(user);
        var token = _jwtService.GenerateToken(user);

        _logger.LogInformation("New user registered: {UserId}", user.Id);

        return new ObjectResult(new AuthResponse(token, new UserDto(user.Id, user.Email, user.DisplayName)))
        {
            StatusCode = StatusCodes.Status201Created,
        };
    }

    [Function("Login")]
    public async Task<IActionResult> Login(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/login")] HttpRequest req)
    {
        var body = await req.ReadFromJsonAsync<LoginRequest>();
        if (body is null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
        {
            return HttpResponseExtensions.BadRequestProblem("Email and password are required.");
        }

        var user = await _users.GetByEmailAsync(body.Email);
        if (user is null || !_passwordHasher.Verify(body.Password, user.PasswordHash))
        {
            return HttpResponseExtensions.UnauthorizedProblem("Invalid email or password.");
        }

        var token = _jwtService.GenerateToken(user);
        return new OkObjectResult(new AuthResponse(token, new UserDto(user.Id, user.Email, user.DisplayName)));
    }
}
