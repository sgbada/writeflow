export interface Comment {
  id: number
  author: string
  text: string
  password?: string
  createdAt: string
}

export interface Post {
  id: number
  title: string
  content: string
  password: string
  board: string
  tags: string[]
  likes: number
  comments: Comment[]
  createdAt: string
  images?: string[]
}
