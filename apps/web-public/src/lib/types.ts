export interface EmotionStamp {
  id: string
  label: string
}

export interface Post {
  id: number
  content: string
  createdAt: string

  emotionCategory: string
  emotionStamps: EmotionStamp[]
  emotionStampCounts: Record<string, number>  // key는 stamp.id

  summaryByLLM?: string

  author: string
  authorId: string

  images?: string[]
}


export interface Report {
  id: number
  postId: number
  reporterId: string
  reason: string
  createdAt: string
}
