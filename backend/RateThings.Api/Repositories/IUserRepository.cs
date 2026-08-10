using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public interface IUserRepository
{
    Task<UserDocument?> GetByEmailAsync(string email);
    Task<UserDocument?> GetByIdAsync(string id);
    Task<List<UserDocument>> SearchByDisplayNameAsync(string query, string excludeUserId);
    Task<UserDocument> CreateAsync(UserDocument user);
    Task<UserDocument> UpdateAsync(UserDocument user);
    Task DeleteAsync(string id);
}
