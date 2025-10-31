import { create } from 'zustand'
import type { Post, Comment } from '../lib/types'

// 🔹 LocalStorage 도우미
const persist = (posts: Post[]) => localStorage.setItem('posts', JSON.stringify(posts))
const getInitial = (): Post[] => JSON.parse(localStorage.getItem('posts') || '[]')

// 🔹 편집 토큰
const EDIT_TOKENS_KEY = 'editTokens'
const getTokens = (): Record<number, boolean> =>
  JSON.parse(localStorage.getItem(EDIT_TOKENS_KEY) || '{}')
const setTokens = (t: Record<number, boolean>) =>
  localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(t))

// ✅ Zustand store 타입 정의
interface PostsStore {
  posts: Post[]
  addPost: (post: Post) => void
  editPost: (id: number, newData: Partial<Post>) => void
  deletePost: (id: number, password: string) => void
  likePost: (postId: number) => void
  addComment: (
    postId: number,
    data: { author?: string; password?: string; text: string }
  ) => void
  deleteComment: (postId: number, commentId: number, password?: string) => void
  canEdit: (postId: number) => boolean
  verifyPasswordAndGrantEdit: (postId: number, password: string) => boolean
  revokeEdit: (postId: number) => void
}

// ✅ 실제 Store 구현
export const usePostsStore = create<PostsStore>((set, get) => ({
  posts: getInitial(),

  addPost: (post) =>
    set((state) => {
      const updated = [
        ...state.posts,
        { ...post, comments: post.comments ?? [], likes: post.likes ?? 0 },
      ]
      persist(updated)
      return { posts: updated }
    }),

  editPost: (id, newData) =>
    set((state) => {
      const updated = state.posts.map((p) => (p.id === id ? { ...p, ...newData } : p))
      persist(updated)
      return { posts: updated }
    }),

  deletePost: (id, password) =>
    set((state) => {
      const target = state.posts.find((p) => p.id === id)
      if (!target || target.password !== password) return state
      const updated = state.posts.filter((p) => p.id !== id)
      persist(updated)
      const tokens = getTokens()
      delete tokens[id]
      setTokens(tokens)
      return { posts: updated }
    }),

  likePost: (postId) =>
    set((state) => {
      const updated = state.posts.map((p) =>
        p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      )
      persist(updated)
      return { posts: updated }
    }),

  addComment: (postId, { author, password, text }) =>
    set((state) => {
      const updated = state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...(p.comments || []),
                {
                  id: Date.now(),
                  author: author || '익명',
                  password,
                  text,
                  createdAt: new Date().toISOString(),
                } as Comment,
              ],
            }
          : p
      )
      persist(updated)
      return { posts: updated }
    }),

  deleteComment: (postId, commentId, password) => {
  let success = false

  set((state) => {
    const updated = state.posts.map((p) => {
      if (p.id !== postId) return p

      const comments = (p.comments || []).filter((c) => {
        if (c.id === commentId) {
          if (!password || c.password !== password) {
            success = false // ❌ 비밀번호 불일치
            return true     // 삭제 안 함
          }
          success = true     // ✅ 삭제 성공
          return false
        }
        return true
      })

      return { ...p, comments }
    })

    persist(updated)
    return { posts: updated }
  })

  return success
},


  canEdit: (postId) => !!getTokens()[postId],

  verifyPasswordAndGrantEdit: (postId, password) => {
    const post = get().posts.find((p) => p.id === postId)
    if (!post) return false
    const ok = post.password === password
    if (ok) {
      const tokens = getTokens()
      tokens[postId] = true
      setTokens(tokens)
    }
    return ok
  },

  revokeEdit: (postId) => {
    const tokens = getTokens()
    delete tokens[postId]
    setTokens(tokens)
  },
}))
