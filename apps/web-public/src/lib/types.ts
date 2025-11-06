export interface Comment {
  id: number
  author: string
  authorId: string // ✅ 추가
  text: string
  password?: string
  createdAt: string
  parentId?: number
}

export interface Post {
  id: number
  title: string
  slug?: string
  content: string
  password: string
  board: string
  tags: string[]
  likes: number
  comments: Comment[]
  createdAt: string
  images?: string[]
  author: string
  authorId: string
  isRegisteredUser?: boolean
}
