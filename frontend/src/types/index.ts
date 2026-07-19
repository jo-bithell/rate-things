export interface User {
  id: string
  email: string
  displayName: string
}

export interface Topic {
  id: string
  name: string
  description?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface Rating {
  userId: string
  userName: string
  score: number
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
