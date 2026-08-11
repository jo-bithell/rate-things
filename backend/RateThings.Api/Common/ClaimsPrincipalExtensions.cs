using System.Security.Claims;
using RateThings.Api.Models;

namespace RateThings.Api.Common;

public static class ClaimsPrincipalExtensions
{
    public static string? GetUserId(this ClaimsPrincipal? principal) =>
        principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    public static string? GetDisplayName(this ClaimsPrincipal? principal) =>
        principal?.FindFirst(ClaimTypes.Name)?.Value;

    public static bool IsAdmin(this ClaimsPrincipal? principal) =>
        principal?.FindFirst(ClaimTypes.Role)?.Value == nameof(UserRole.Admin);
}
