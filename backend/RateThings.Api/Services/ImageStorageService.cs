using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;

namespace RateThings.Api.Services;

/// <summary>
/// Stores uploaded images in a blob container on the same storage account already provisioned
/// for the Function App's own runtime (AzureWebJobsStorage) - avoids standing up a separate
/// storage account just for this.
/// </summary>
public class ImageStorageService : IImageStorageService
{
    private const string ContainerName = "images";

    private readonly BlobContainerClient _container;

    public ImageStorageService(IConfiguration configuration)
    {
        var connectionString = configuration["AzureWebJobsStorage"]
            ?? throw new InvalidOperationException("AzureWebJobsStorage is not configured.");

        var serviceClient = new BlobServiceClient(connectionString);
        _container = serviceClient.GetBlobContainerClient(ContainerName);
        _container.CreateIfNotExists(PublicAccessType.Blob);
    }

    public async Task<string> UploadAsync(string folder, Stream content, string contentType, string fileExtension)
    {
        var blobName = $"{folder}/{Guid.NewGuid()}{fileExtension}";
        var blobClient = _container.GetBlobClient(blobName);
        await blobClient.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType },
        });

        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return;
        }

        if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
        {
            return;
        }

        var prefix = $"/{ContainerName}/";
        if (!uri.AbsolutePath.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var blobName = uri.AbsolutePath[prefix.Length..];
        await _container.GetBlobClient(blobName).DeleteIfExistsAsync();
    }
}
