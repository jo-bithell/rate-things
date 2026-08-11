using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public interface IUserRepository
{
    Task<UserDocument?> GetByDisplayNameAsync(string displayName);
    Task<UserDocument?> GetByIdAsync(string id);
    Task<List<UserDocument>> SearchByDisplayNameAsync(string query, string excludeUserId);
    Task<List<UserDocument>> GetPendingApprovalAsync();
    Task<bool> AnyAdminExistsAsync();
    Task<UserDocument> CreateAsync(UserDocument user);
    Task<UserDocument> UpdateAsync(UserDocument user);
    Task DeleteAsync(string id);
}
