namespace RateThings.Api.Dto;

public record RegisterRequest(string Password, string DisplayName);
public record LoginRequest(string DisplayName, string Password);
public record AuthResponse(string Token, UserDto User);
public record UserDto(string Id, string DisplayName, string? ImageUrl, string Role);
public record UpdateProfileRequest(string DisplayName);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record DeleteAccountRequest(string Password);
public record UserSearchResultDto(string Id, string DisplayName, string? ImageUrl, string RelationshipStatus);
public record PendingUserDto(string Id, string DisplayName, DateTimeOffset CreatedAt);
