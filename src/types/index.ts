export interface User {
  id: number
  uuid: string
  deviceId: string
  currentMastheadId: number | null
  energy: number
  totalPosts: number
  totalPatsReceived: number
  createdAt: string
  updatedAt: string
}

export interface Masthead {
  id: number
  userId: number
  nickname: string
  avatarUrl: string
  avatarEmoji: string
  isFixed: boolean
  usedCount: number
  lastUsedAt: string
}

export interface Tag {
  id: number
  name: string
  icon: string
  sortOrder: number
}

export interface Post {
  id: number
  userId: number
  mastheadId: number
  masthead?: Masthead
  content: string
  images: string[] | null
  privacyType: number
  locationCity: string | null
  patCount: number
  echoCount: number
  status: number
  tags: Tag[]
  createdAt: string
  updatedAt: string
  isPatted?: boolean
}

export interface Echo {
  id: number
  postId: number
  userId: number
  mastheadId: number
  masthead?: Masthead
  type: number
  resourceUrl: string
  duration: number
  textPreview: string | null
  createdAt: string
}

export interface TreeholeSession {
  id: number
  initiatorId: number
  receiverId: number
  receiverMasthead?: Masthead
  matchedTags: string[] | null
  matchScore: number
  expiresAt: string
  status: number
  createdAt: string
}

export interface TreeholeMessage {
  id: number
  sessionId: number
  senderId: number
  msgType: number
  content: string | null
  resourceUrl: string | null
  duration: number
  isRead: boolean
  createdAt: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface MessageItem {
  id: number
  type: 'pat' | 'echo' | 'system' | 'treehole'
  title: string
  content: string
  postId?: number
  sessionId?: number
  isRead: boolean
  createdAt: string
}
