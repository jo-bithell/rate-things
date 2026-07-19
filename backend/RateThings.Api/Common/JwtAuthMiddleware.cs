using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Middleware;
using RateThings.Api.Services;

namespace RateThings.Api.Common;

/// <summary>
/// Validates the Authorization: Bearer token on every request except the auth endpoints,
/// and attaches the resulting ClaimsPrincipal to the ASP.NET Core HttpContext so functions
/// can read it off req.HttpContext.User.
/// </summary>
public class JwtAuthMiddleware : IFunctionsWorkerMiddleware
{
    private static readonly string[] AnonymousPathPrefixes =
    {
        "/api/auth/register",
        "/api/auth/login",
    };

    private readonly IJwtService _jwtService;

    public JwtAuthMiddleware(IJwtService jwtService) => _jwtService = jwtService;

    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        var httpContext = context.GetHttpContext();

        if (httpContext is not null)
        {
            var path = httpContext.Request.Path.Value ?? string.Empty;
            var isAnonymous = AnonymousPathPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

            if (!isAnonymous)
            {
                var authHeader = httpContext.Request.Headers.Authorization.FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    await WriteUnauthorized(httpContext, "Missing bearer token.");
                    return;
                }

                var token = authHeader["Bearer ".Length..].Trim();
                var principal = _jwtService.ValidateToken(token);
                if (principal is null)
                {
                    await WriteUnauthorized(httpContext, "Invalid or expired token.");
                    return;
                }

                httpContext.User = principal;
            }
        }

        await next(context);
    }

    private static async Task WriteUnauthorized(HttpContext httpContext, string message)
    {
        httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await httpContext.Response.WriteAsJsonAsync(new { error = message });
    }
}
