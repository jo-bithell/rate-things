using System.Security.Claims;
using RateThings.Api.Models;

namespace RateThings.Api.Services;

public interface IJwtService
{
    string GenerateToken(UserDocument user);
    ClaimsPrincipal? ValidateToken(string token);
}
