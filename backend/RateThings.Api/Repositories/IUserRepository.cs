using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public interface IUserRepository
{
    Task<UserDocument?> GetByEmailAsync(string email);
    Task<UserDocument?> GetByIdAsync(string id);
    Task<UserDocument> CreateAsync(UserDocument user);
    Task<UserDocument> UpdateAsync(UserDocument user);
    Task DeleteAsync(string id);
}
