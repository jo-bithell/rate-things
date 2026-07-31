using RateThings.Api.Models;

namespace RateThings.Api.Repositories;

public interface IFriendshipRepository
{
    Task<FriendshipDocument?> GetByIdAsync(string id);
    Task<FriendshipDocument?> GetBetweenAsync(string userIdA, string userIdB);
    Task<List<FriendshipDocument>> GetForUserAsync(string userId);
    Task<HashSet<string>> GetFriendIdsAsync(string userId);
    Task<FriendshipDocument> CreateAsync(FriendshipDocument friendship);
    Task<FriendshipDocument> UpdateAsync(FriendshipDocument friendship);
    Task DeleteAsync(string id);
}
