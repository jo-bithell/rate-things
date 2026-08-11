namespace RateThings.Api.Models;

public enum UserRole
{
    User,
    Admin,
}

public class UserDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.User;

    // Defaults true (not false) so existing documents - which predate this field and
    // therefore lack it entirely - deserialize as already-approved. Only Register
    // explicitly sets this false for new signups.
    public bool IsApproved { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
