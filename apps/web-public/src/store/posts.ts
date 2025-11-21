import { create } from 'zustand'
import type { Post, Report } from '../lib/types'

// 🔹 유저 고유 ID (로그인 기반)
const ensureUserId = (): string => {
  let id = localStorage.getItem('userId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('userId', id)
  }
  return id
}

// 🔹 LocalStorage helpers
const persistPosts = (posts: Post[]) =>
  localStorage.setItem('posts', JSON.stringify(posts))

const getInitialPosts = (): Post[] =>
  JSON.parse(localStorage.getItem('posts') || '[]')

const persistReports = (r: Report[]) =>
  localStorage.setItem('reports', JSON.stringify(r))

const getInitialReports = (): Report[] =>
  JSON.parse(localStorage.getItem('reports') || '[]')

// Reaction 중복 방지
// reactions[postId][stamp][userId] = true
const REACTION_KEY = 'userReactions'
const getReactions = () =>
  JSON.parse(localStorage.getItem(REACTION_KEY) || '{}')
const saveReactions = (r: any) =>
  localStorage.setItem(REACTION_KEY, JSON.stringify(r))

// -------------------------------
// 🔥 Store 타입
// -------------------------------
interface PostsStore {
  posts: Post[]
  reports: Report[]

  addPost: (data: {
    content: string
    emotionCategory: string
    emotionStamps: string[]
    summaryByLLM?: string
  }) => void

  deletePost: (postId: number, userId: string) => void

  addStamp: (postId: number, stamp: string) => void

  addReport: (postId: number, reason: string) => void
}

// -------------------------------
// 🔥 실제 Store
// -------------------------------
export const usePostsStore = create<PostsStore>((set, get) => ({
  posts: getInitialPosts(),
  reports: getInitialReports(),

  // -----------------------------------
  // ✨ 글 생성
  // -----------------------------------
addPost: ({ content, emotionCategory, emotionStamps, summaryByLLM }) =>
  set((state) => {
    const userId = ensureUserId()

    const initialStampCounts = Object.fromEntries(
      emotionStamps.map((stamp) => [stamp.id, 0])
    )

    const newPost: Post = {
      id: Date.now(),
      content,
      emotionCategory,
      emotionStamps,
      emotionStampCounts: initialStampCounts,
      summaryByLLM: summaryByLLM ?? '',
      createdAt: new Date().toISOString(),
      author: localStorage.getItem('username') || '사용자',
      authorId: userId,
    }

    const updated = [...state.posts, newPost]
    persistPosts(updated)

    return { posts: updated }   // ← ✔ 상태 업데이트!
  }),

  // -----------------------------------
  // ✨ 글 삭제 (작성자만)
  // -----------------------------------
  deletePost: (postId, userId) =>
    set((state) => {
      const target = state.posts.find((p) => p.id === postId)
      if (!target) return state
      if (target.authorId !== userId) return state // 작성자만 삭제 가능

      const updated = state.posts.filter((p) => p.id !== postId)
      persistPosts(updated)
      return { posts: updated }
    }),

  // -----------------------------------
  // ✨ 감정 스탬프 Reaction
  // -----------------------------------
  addStamp: (postId, stampId) =>
  set((state) => {
    const userId = ensureUserId();
    const reactions = getReactions();

    reactions[postId] ??= {};
    reactions[postId][stampId] ??= {};

    if (reactions[postId][stampId][userId]) return state;

    reactions[postId][stampId][userId] = true;
    saveReactions(reactions);

    const updated = state.posts.map((p) => {
      if (p.id !== postId) return p;
      return {
        ...p,
        emotionStampCounts: {
          ...p.emotionStampCounts,
          [stampId]: (p.emotionStampCounts[stampId] ?? 0) + 1,
        },
      };
    });

    persistPosts(updated);
    return { posts: updated };
  })
,

  // -----------------------------------
  // ✨ 신고 기능 (중복 방지)
  // -----------------------------------
addReport: (postId, reason) =>
  set((state) => {
    const userId = ensureUserId()

    const already = state.reports.some(
      (r) => r.postId === postId && r.reporterId === userId
    )
    if (already) return {}   // 아무 것도 업데이트 안 함

    const newReport: Report = {
      id: Date.now(),
      postId,
      reporterId: userId,
      reason,
      createdAt: new Date().toISOString(),
    }

    const updated = [...state.reports, newReport]
    persistReports(updated)

    return { reports: updated }
  }),

}))
