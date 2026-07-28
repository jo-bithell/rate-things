using Microsoft.AspNetCore.Http;

namespace RateThings.Api.Common;

public static class ImageUploadValidation
{
    private const long MaxSizeBytes = 5 * 1024 * 1024;

    private static readonly Dictionary<string, string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/gif"] = ".gif",
    };

    public static bool TryValidate(IFormFile? file, out string extension, out string error)
    {
        extension = string.Empty;

        if (file is null || file.Length == 0)
        {
            error = "No image file provided.";
            return false;
        }

        if (file.Length > MaxSizeBytes)
        {
            error = "Image must be 5 MB or smaller.";
            return false;
        }

        if (!AllowedContentTypes.TryGetValue(file.ContentType, out var ext))
        {
            error = "Only JPEG, PNG, WebP, or GIF images are allowed.";
            return false;
        }

        extension = ext;
        error = string.Empty;
        return true;
    }
}
