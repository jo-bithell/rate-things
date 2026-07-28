namespace RateThings.Api.Services;

public interface IImageStorageService
{
    /// <summary>Uploads image content under the given folder and returns its public URL.</summary>
    Task<string> UploadAsync(string folder, Stream content, string contentType, string fileExtension);

    /// <summary>Deletes the blob referenced by a previously-returned URL. No-ops if null/empty or not one of ours.</summary>
    Task DeleteAsync(string? imageUrl);
}
