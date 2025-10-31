import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import type { Post } from './lib/types'

export default function WritePost() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const postId = id ? Number(id) : null
  const { posts, addPost, editPost } = usePostsStore()
  const existing = posts.find((p) => p.id === postId)

  // ✅ 글 상태
  const [title, setTitle] = useState<string>(existing?.title || '')
  const [content, setContent] = useState<string>(existing?.content || '')
  const [password, setPassword] = useState<string>(existing?.password || '')
  const [board, setBoard] = useState<string>(existing?.board || '자유')
  const [tags, setTags] = useState<string>(existing?.tags?.join(', ') || '')

  useEffect(() => {
    // 나중에 권한 체크 가능
  }, [postId, navigate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (id) {
      editPost(Number(id), { title, content, board, tags: tagList })
    } else {
      const newPost: Post = {
        id: Date.now(),
        title,
        content,
        board,
        tags: tagList,
        createdAt: new Date().toISOString(),
        password,
        likes: 0,
        comments: [],
      }
      addPost(newPost)
    }

    navigate('/')
  }

  return (
    <div className="container">
      <h1>{id ? '글 수정' : '새 글 작성'}</h1>

      <form onSubmit={handleSubmit} className="form">
        <select
          value={board}
          onChange={(e) => setBoard(e.target.value)}
        >
          <option value="자유">자유게시판</option>
          <option value="유머">유머게시판</option>
          <option value="질문">질문게시판</option>
        </select>

        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="태그 (쉼표로 구분)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {!id && (
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}

        <button type="submit">{id ? '수정 완료' : '작성 완료'}</button>
      </form>

      <button onClick={() => navigate('/')}>← 돌아가기</button>
    </div>
  )
}
