import { useState, useRef, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import type { Post } from './lib/types'

import ReactQuill, { Quill } from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'

if (typeof window !== 'undefined') {
  window.katex = katex
}

// 🔧 모듈 import
import ImageResize from 'quill-image-resize-module-react'
import QuillBetterTable from 'quill-better-table'

// ✅ Quill에 모듈 등록
if (typeof window !== 'undefined' && Quill) {
  if (!Quill.imports['modules/better-table']) {
    Quill.register({
      'modules/imageResize': ImageResize,
      'modules/better-table': QuillBetterTable,
    }, true)
  }
}

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

  const [isInsertingImage, setIsInsertingImage] = useState(false)

const imageHandler = () => {
  if (isInsertingImage) return // 방어코드
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.click()

  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const quill = quillRef.current?.getEditor()
      const range = quill?.getSelection(true)
      if (range) {
        const imageUrl = reader.result as string

        // 🚫 삽입 중엔 onChange 방지
        setIsInsertingImage(true)
        quill.insertEmbed(range.index, 'image', imageUrl, 'user')
        quill.setSelection(range.index + 1)

        // 저장용 배열 업데이트
        setImages((prev) =>
          prev.includes(imageUrl) ? prev : [...prev, imageUrl]
        )

        // ⏱ 약간의 지연 후 다시 허용
        setTimeout(() => setIsInsertingImage(false), 300)
      }
    }
    reader.readAsDataURL(file)
  }
}


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
        ['table'],
      ],
      handlers: { image: imageHandler },
    },
    imageResize: { parchment: Quill.import('parchment') },
    'better-table': {
      operationMenu: {
        items: {
          unmergeCells: true,
          insertColumnRight: true,
          insertColumnLeft: true,
          insertRowUp: true,
          insertRowDown: true,
          deleteColumn: true,
          deleteRow: true,
        },
      },
    },
  }

  // ✅ 수식 모듈 활성화
  useEffect(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return

    // formula 모듈이 없다면 추가
    const Formula = Quill.import('formats/formula')
    if (Formula && !quill.getModule('formula')) {
      quill.root.addEventListener('click', () => {})
    }
  }, [])

  // 🔧 태그 입력 처리 함수
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    // 입력 시 실시간 파싱
    const tagList = input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    // ✅ 중복 제거 + 최대 30개 제한
    const uniqueTags = Array.from(new Set(tagList)).slice(0, 30)

    // 다시 문자열로 조합
    setTags(uniqueTags.join(', '))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)

    const newPost: Post = {
      id: postId || Date.now(),
      title,
      content,
      board,
      tags: tagList,
      createdAt: new Date().toISOString(),
      password,
      likes: 0,
      comments: [],
      images,
    }

    if (id) editPost(postId!, newPost)
    else addPost(newPost)
    navigate('/')
  }

  return (
    <div className="container">
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
          onChange={(e) => {
            if (e.target.value.length <= 50) setTitle(e.target.value)
          }}
          maxLength={50}
          required
        />

        <div className="editor-wrapper">
          <ReactQuill
  ref={quillRef}
  theme="snow"
  value={content}
  onChange={(value) => {
    if (!isInsertingImage) setContent(value)
  }}
  modules={modules}
  placeholder="내용을 입력하세요."
/>

        </div>

        <input
          type="text"
          placeholder="태그 (쉼표로 구분, 최대 30개)"
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
