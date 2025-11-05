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
  slug?: string
  content: string
  password: string
  board: string
  tags: string[]
  likes: number
  comments: Comment[]
  createdAt: string
  images?: string[]

  // ✅ 작성자 이름(혹은 ID)을 추가
  author: string
}
