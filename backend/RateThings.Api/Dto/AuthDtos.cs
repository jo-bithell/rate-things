namespace RateThings.Api.Dto;

public record RegisterRequest(string Email, string Password, string DisplayName);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, UserDto User);
public record UserDto(string Id, string Email, string DisplayName, string? ImageUrl);
public record UpdateProfileRequest(string Email, string DisplayName);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record DeleteAccountRequest(string Password);
public record UserSearchResultDto(string Id, string DisplayName, string? ImageUrl, string RelationshipStatus);
