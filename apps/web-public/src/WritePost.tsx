import { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import type { Post } from './lib/types'

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

const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (!files) return

  const base64List: string[] = []
  for (const file of Array.from(files)) {
    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    base64List.push(base64)
  }
  setImages((prev) => [...prev, ...base64List])
}


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (id) {
      editPost(Number(id), { title, content, board, tags: tagList, images })
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
        images,
      }
      addPost(newPost)
    }
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

        {/* ✅ 이미지 첨부 */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />

        {/* ✅ 미리보기 */}
        {images.length > 0 && (
          <div className="image-preview">
            {images.map((src, idx) => (
              <img key={idx} src={src} alt={`preview-${idx}`} />
            ))}
          </div>
        )}

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
