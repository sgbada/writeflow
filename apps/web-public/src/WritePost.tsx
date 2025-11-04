import { useState, useRef, FormEvent, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import type { Post } from './lib/types'

import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import 'katex/dist/katex.min.css'
import katex from 'katex'

// ✅ 수식 렌더링용
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.katex = katex
}

// ✅ 이미지 리사이즈 모듈 등록
import ImageResize from 'quill-image-resize-module-react'
Quill.register('modules/imageResize', ImageResize)

// ✅ 이미지 이동/정렬용 BlotFormatter 등록
import BlotFormatter from 'quill-blot-formatter'
Quill.register('modules/blotFormatter', BlotFormatter)

export default function WritePost() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const postId = id ? Number(id) : null
  const { posts, addPost, editPost } = usePostsStore()
  const existing = posts.find((p) => p.id === postId)

  const [title, setTitle] = useState(existing?.title || '')
  const [content, setContent] = useState(existing?.content || '')
  const [password, setPassword] = useState(existing?.password || '')
  const [board, setBoard] = useState(existing?.board || '자유')
  const [tags, setTags] = useState(existing?.tags?.join(', ') || '')
  const [images, setImages] = useState<string[]>(existing?.images || [])
  const quillRef = useRef<any>(null)

  // ✅ Quill 모듈 설정
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video', 'formula', 'code-block', 'clean'],
      ],
    },
    blotFormatter: {},
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar'],
    },
  }

  // ✅ 수식 색상 보정
  useEffect(() => {
    const fixKatex = () => {
      const isDark = document.documentElement.dataset.theme === 'dark'
      const color = isDark ? '#f5f5f5' : '#222'
      document.querySelectorAll('.katex, .katex *').forEach((el) => {
        const e = el as HTMLElement
        e.style.background = 'transparent'
        e.style.color = color
        e.style.fill = color
      })
    }
    fixKatex()
    const observer = new MutationObserver(fixKatex)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  // ✅ 태그 입력 시 중복 제거 & 자동 정리
  const [tagInput, setTagInput] = useState(existing?.tags?.join(', ') || '')

const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const input = e.target.value
  setTagInput(input) // ✅ 일단 입력 그대로 반영

  // 입력 중간에서도 파싱 로직은 별도로
  const tagList = input
    .split(/[\s,]+/) // 쉼표/공백 모두 구분자로 처리
    .map((t) => t.trim().replace(/^#/, ''))
    .filter(Boolean)

  const uniqueTags = Array.from(new Set(tagList)).slice(0, 30)
  setTags(uniqueTags)
}

const handleSubmit = (e: FormEvent) => {
  e.preventDefault()

  // ✅ tags는 이미 배열 상태이므로 그대로 정제만 하면 됨
  const uniqueTags = Array.from(
    new Set(
      (Array.isArray(tags) ? tags : tags.split(/[\s,]+/))
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)
    )
  )

  const newPost: Post = {
    id: postId || Date.now(),
    title,
    content,
    board,
    tags: uniqueTags, // ✅ 중복 없는 태그만 저장
    slug: title.trim().toLowerCase().replace(/[^\w가-힣]+/g, '-'),
    createdAt: new Date().toISOString(),
    password,
    likes: existing?.likes ?? 0,
    comments: existing?.comments ?? [],
    images,
  }

  if (id) editPost(postId!, newPost)
  else addPost(newPost)

  navigate('/')
}


  return (
    <div className="container write-page">
      <h1>{id ? '글 수정' : '새 글 작성'}</h1>

      <form onSubmit={handleSubmit} className="form">
        <select value={board} onChange={(e) => setBoard(e.target.value)}>
          <option value="자유">자유게시판</option>
          <option value="유머">유머게시판</option>
          <option value="질문">질문게시판</option>
        </select>

        <input
          type="text"
          placeholder="제목 (최대 50자)"
          value={title}
          onChange={(e) => e.target.value.length <= 50 && setTitle(e.target.value)}
          maxLength={50}
          required
        />

        <div className="editor-wrapper">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            placeholder="내용을 입력하세요."
          />
        </div>

        <input
  type="text"
  placeholder="태그 (쉼표나 띄어쓰기로 구분, 최대 30개)"
  value={tagInput}
  onChange={handleTagChange}
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
