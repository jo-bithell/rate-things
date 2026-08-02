export interface User {
  id: string
  email: string
  displayName: string
  imageUrl?: string
}

export interface SharedUser {
  id: string
  displayName: string
  imageUrl?: string
}

export interface Topic {
  id: string
  name: string
  description?: string
  imageUrl?: string
  isPrivate: boolean
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  sharedWith: SharedUser[]
}

export interface Rating {
  userId: string
  userName: string
  userImageUrl?: string
  score: number | null
  comment?: string
  createdAt: string
  updatedAt: string
}

export interface Entity {
  id: string
  topicId: string
  name: string
  description?: string
  tags: string[]
  imageUrl?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  avgRating: number
  ratingCount: number
  ratings: Rating[]
}

export interface ListEntry {
  entityId: string
  position: number
}

export interface ListSummary {
  id: string
  topicId: string
  ownerId: string
  ownerName: string
  name: string
  description?: string
  entries: ListEntry[]
  createdAt: string
  updatedAt: string
}

export interface Friend {
  userId: string
  displayName: string
  imageUrl?: string
}

export interface FriendRequest {
  id: string
  userId: string
  displayName: string
  imageUrl?: string
  createdAt: string
}

export interface FriendsResponse {
  friends: Friend[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
}

export type RelationshipStatus = 'none' | 'friends' | 'pending_outgoing' | 'pending_incoming'

export interface UserSearchResult {
  id: string
  displayName: string
  imageUrl?: string
  relationshipStatus: RelationshipStatus
}
