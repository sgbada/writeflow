import { create } from 'zustand'
import type { Post, Comment } from '../lib/types'

// 🔹 LocalStorage 도우미
const persist = (posts: Post[]) => localStorage.setItem('posts', JSON.stringify(posts))
const getInitial = (): Post[] => {
  const posts = JSON.parse(localStorage.getItem('posts') || '[]')
  const userId = ensureUserId()
  return posts.map((p: any) => ({
    ...p,
    authorId: p.authorId || userId, // ✅ 없으면 내 userId로 채움
  }))
}


// 🔹 편집 토큰
const EDIT_TOKENS_KEY = 'editTokens'
const getTokens = (): Record<number, boolean> =>
  JSON.parse(localStorage.getItem(EDIT_TOKENS_KEY) || '{}')
const setTokens = (t: Record<number, boolean>) =>
  localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(t))

// 🔹 유저 고유 ID (닉네임 바뀌어도 동일인 식별용)
const ensureUserId = (): string => {
  let id = localStorage.getItem('userId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('userId', id)
  }
  return id
}

// ✅ Zustand store 타입 정의
interface PostsStore {
  posts: Post[]
  addPost: (post: Post) => void
  editPost: (id: number, newData: Partial<Post>) => void
  deletePost: (id: number, password: string) => void
  likePost: (postId: number) => void
  incrementViews: (postId: number, viewerId?: string) => void
  addComment: (postId: number, comment: Partial<Comment> & { parentId?: number }) => void
  deleteComment: (postId: number, commentId: number, password?: string) => boolean
  canEdit: (postId: number) => boolean
  verifyPasswordAndGrantEdit: (postId: number, password: string) => boolean
  revokeEdit: (postId: number) => void
}

// ✅ 실제 Store 구현
export const usePostsStore = create<PostsStore>((set, get) => ({
  posts: getInitial(),

  addPost: (post) =>
    set((state) => {
      const userId = ensureUserId() // ← 고유 ID 확보
      const updated = [
        ...state.posts,
        {
          ...post,
          authorId: userId, // ✅ 작성자 ID 강제 추가
          comments: post.comments ?? [],
          likes: post.likes ?? 0,
        },
      ]
      persist(updated)
      const myPosts = JSON.parse(localStorage.getItem('myPosts') || '[]') as number[]
      if (!myPosts.includes(post.id)) {
        myPosts.push(post.id)
        localStorage.setItem('myPosts', JSON.stringify(myPosts))
      }
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

  incrementViews: (postId: number) =>
    set((state) => {
      const updated = state.posts.map((p) =>
        p.id === postId ? { ...p, views: (p.views ?? 0) + 1 } : p
      )
      persist(updated)
      return { posts: updated }
    }),

  // ✅ 답글 parentId 및 authorId 완벽 반영
  addComment: (postId, comment) =>
    set((state) => {
      const posts = [...state.posts]
      const post = posts.find((p) => p.id === postId)
      if (!post) return state

      const userId = ensureUserId()

      const newComment: Comment = {
        id: Date.now(),
        author: comment.author || '익명',
        authorId: userId, // ✅ 익명이라도 고유 ID 부여
        text: comment.text || '',
        password: comment.password,
        createdAt: new Date().toISOString(),
        parentId: comment.parentId, // ✅ 답글용
      }

      post.comments = [...(post.comments || []), newComment]
      persist(posts)
      return { posts }
    }),

  // ✅ 삭제 (비밀번호 확인)
  deleteComment: (postId, commentId, password) => {
    let success = false
    set((state) => {
      const updated = state.posts.map((p) => {
        if (p.id !== postId) return p
        const comments = (p.comments || []).filter((c) => {
          if (c.id === commentId) {
            if (!password || c.password !== password) {
              success = false
              return true
            }
            success = true
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
