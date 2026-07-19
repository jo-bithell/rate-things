using Microsoft.AspNetCore.Mvc;

namespace RateThings.Api.Common;

/// <summary>Small helpers so functions can return consistent JSON error/success shapes.</summary>
public static class HttpResponseExtensions
{
    public static IActionResult Problem(int statusCode, string message) =>
        new ObjectResult(new { error = message }) { StatusCode = statusCode };

    public static IActionResult NotFoundProblem(string message = "Not found.") => Problem(404, message);
    public static IActionResult BadRequestProblem(string message) => Problem(400, message);
    public static IActionResult ForbiddenProblem(string message = "You don't have permission to do that.") => Problem(403, message);
    public static IActionResult UnauthorizedProblem(string message = "Authentication required.") => Problem(401, message);
    public static IActionResult ConflictProblem(string message) => Problem(409, message);
}
