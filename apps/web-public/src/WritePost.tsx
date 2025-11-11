import { useState, useRef, FormEvent, useEffect } from 'react'
import type { Post } from './lib/types'
import { useNavigate, useParams } from 'react-router-dom'
import { usePostsStore } from './store/posts'

import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import ImageResize from 'quill-image-resize-module-react'
import BlotFormatter from 'quill-blot-formatter'
import { canDo, record, formatRemain } from './lib/antispam';

Quill.register('modules/imageResize', ImageResize)
Quill.register('modules/blotFormatter', BlotFormatter)

// ✅ 수식 렌더링용
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.katex = katex
}
// ✅ 유저 고유 ID를 localStorage에 한 번만 생성
if (!localStorage.getItem('userId')) {
  localStorage.setItem('userId', crypto.randomUUID())
}

// ✅ 남은 정지 시간 계산 (댓글/게시글 공통)
function formatRemainingTime(expiresAt: number): string {
  const diffMs = expiresAt - Date.now()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const diffMinutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))

  if (diffDays >= 1) return `${diffDays}일 ${diffHours}시간 남음`
  if (diffHours >= 1) return `${diffHours}시간 ${diffMinutes}분 남음`
  return `${diffMinutes}분 남음`
}


export default function WritePost() {
  // ✅ 항상 고정된 유저 ID 확보 (컴포넌트 안 최상단에서 실행)
const [userId] = useState(() => {
  let stored = localStorage.getItem('userId')
  if (!stored) {
    stored = crypto.randomUUID()
    localStorage.setItem('userId', stored)
  }
  return stored
})

  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const postId = id ? Number(id) : null
  const { posts, addPost, editPost } = usePostsStore()
  const existing = posts.find((p) => p.id === postId)
  const [author, setAuthor] = useState(existing?.author || '')
  const [title, setTitle] = useState(existing?.title || '')
  const [content, setContent] = useState(existing?.content || '')
  const [password, setPassword] = useState(existing?.password || '')
  const [board, setBoard] = useState(existing?.board || '자유')
  const [tags, setTags] = useState(existing?.tags?.join(', ') || '')
  const [images, setImages] = useState<string[]>(existing?.images || [])
  const [tagInput, setTagInput] = useState(existing?.tags?.join(', ') || '')

  // 🕒 최근 자동 저장 시각 표시용
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(true) // ✅ 저장 여부 추적
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

  // ✅ 태그 입력 핸들러
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setTagInput(input)
    setIsSaved(false)

    const tagList = input
      .split(/[\s,]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)

    const uniqueTags = Array.from(new Set(tagList)).slice(0, 30)
    setTags(uniqueTags)
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

  // ✅ [1] 새 글일 때 localStorage에서 임시 저장 복원
  useEffect(() => {
    if (!id) {
      const saved = localStorage.getItem('tempPost')
      if (saved) {
        const draft = JSON.parse(saved)
        setTitle(draft.title || '')
        setContent(draft.content || '')
        setTagInput(draft.tagInput || '')
        setTags(draft.tags || [])
        setBoard(draft.board || '자유')
        setLastSaved(draft.lastSaved || null)
      }
    }
  }, [id])

  // ✅ [2] 자동 저장 (3분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (title || content || tagInput) {
        const now = new Date()
        const formatted = now.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const draft = { title, content, tagInput, tags, board, lastSaved: formatted }
        localStorage.setItem('tempPost', JSON.stringify(draft))
        setLastSaved(formatted)
        setIsSaved(true)
      }
    }, 180000)
    return () => clearInterval(interval)
  }, [title, content, tagInput, tags, board])

  // ✅ [3] 내용 수정 시 저장 상태 해제
  useEffect(() => {
    if (title || content || tagInput) setIsSaved(false)
  }, [title, content, tagInput, tags, board])

  // ✅ [4] 브라우저 새로고침/닫기 감지 (임시 저장 안 된 경우 경고)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved && (title || content || tagInput)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSaved, title, content, tagInput])

  // ✅ 임시 저장 버튼 (수동)
  const handleTempSave = () => {
    const now = new Date()
    const formatted = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const draft = { title, content, tagInput, tags, board, lastSaved: formatted }
    localStorage.setItem('tempPost', JSON.stringify(draft))
    setLastSaved(formatted)
    setIsSaved(true)
    alert('📝 임시 저장 완료! (새로고침해도 유지됩니다)')
  }
  const existingAuthorId = existing?.authorId || localStorage.getItem('userId')!


const COOLDOWN_MS = 30000

// ✅ 최종 제출
// ✅ 최종 제출
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();

  // 🚫 정지된 사용자 체크
  localStorage.setItem('userId', userId!);
  const banned = JSON.parse(localStorage.getItem('bannedUsers') || '[]');
  const currentUserId = localStorage.getItem('userId');
  const banInfo = banned.find(
    (b: any) => b.authorId === currentUserId && Date.now() < b.expiresAt
  );

  if (banInfo) {
    const remainingMsg = formatRemainingTime(banInfo.expiresAt);
    alert(`🚫 현재 정지된 상태입니다.
사유: ${banInfo.reason || '사유 없음'}
(${remainingMsg})
게시글을 작성할 수 없습니다.`);
    return;
  }

  // 🕒 도배 방지 (1분에 한 번만)
  const { allowed, remain } = canDo('post');
  if (!allowed) {
    alert(`⏳ 글은 ${formatRemain(remain)} 후에 다시 작성할 수 있습니다.`);
    return;
  }

  // ✅ 정상 등록
  const uniqueTags = Array.from(
    new Set(
      (Array.isArray(tags) ? tags : tags.split(/[\s,]+/))
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)
    )
  );

  const currentUser = localStorage.getItem('username') || '익명';
  const newPost: Post = {
    id: postId || Date.now(),
    title,
    content,
    board,
    tags: uniqueTags,
    slug: title.trim().toLowerCase().replace(/[^\w가-힣]+/g, '-'),
    createdAt: existing?.createdAt || new Date().toISOString(),
    password,
    likes: existing?.likes ?? 0,
    comments: existing?.comments ?? [],
    images,
    author: author.trim() || currentUser,
    authorId: userId || `anon-${Date.now()}`,
    isRegisteredUser: !!localStorage.getItem('username'),
  };

  if (id) editPost(postId!, newPost);
  else addPost(newPost);

  record('post'); // 도배 방지 기록
  localStorage.removeItem('tempPost');
  navigate('/');
};



// 🚫 정지 상태 계산 (렌더링용)
const banned = JSON.parse(localStorage.getItem('bannedUsers') || '[]')
const currentUserId = localStorage.getItem('userId')
const banInfo = banned.find((b: any) => b.authorId === currentUserId && Date.now() < b.expiresAt)
const isBanned = !!banInfo
const remainingMsg = banInfo ? formatRemainingTime(banInfo.expiresAt) : ''


  return (
    <div className="container write-page">
      <h1>{id ? '글 수정' : '새 글 작성'}</h1>
{isBanned && (
  <div
    style={{
      background: 'var(--accent-bg)',
      border: '1px solid var(--border)',
      padding: '14px 16px',
      borderRadius: '10px',
      marginBottom: '16px',
      color: 'var(--text)',
      lineHeight: 1.5,
    }}
  >
    <b>🚫 현재 계정은 정지 상태입니다.</b>
    <br />
    🕒 남은 시간: {remainingMsg}
    <br />
    📝 정지 사유: {banInfo.reason || '사유 없음'}
  </div>
)}


      <form onSubmit={handleSubmit} className="form">
        <select value={board} onChange={(e) => setBoard(e.target.value)}>
          <option value="자유">자유게시판</option>
          <option value="유머">유머게시판</option>
          <option value="질문">질문게시판</option>
        </select>
        {/* 🔹 닉네임 + 비밀번호 한 줄 입력 */}
<div className="nickname-password-row">
  <input
    type="text"
    placeholder="닉네임 (최대 10자)"
    value={author}
    onChange={(e) => setAuthor(e.target.value.slice(0, 10))}
    maxLength={10}
  />
  <input
    type="password"
    placeholder="비밀번호 (최대 20자)"
    value={password}
    onChange={(e) => setPassword(e.target.value.slice(0, 20))}
    maxLength={20}
    required={!id}
  />
</div>

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

        {/* 📝 하단 버튼 영역 */}
        <div className="write-btn-row">
          <div className="write-btn-left">
            <button
              type="button"
              onClick={() => {
                if (!isSaved && (title || content || tagInput)) {
                  const ok = window.confirm('⚠️ 임시 저장되지 않은 내용이 있습니다. 나가시겠습니까?')
                  if (!ok) return
                }
                navigate('/')
              }}
            >
              취소
            </button>
            <button type="button" onClick={handleTempSave}>
              임시 저장
            </button>
          </div>

          <div className="write-btn-right">
            {lastSaved && (
              <span
                className="auto-save-time"
                style={{ color: isSaved ? '#666' : '#c0392b' }}
              >
                {isSaved ? `${lastSaved} 자동 저장됨` : '⚠️ 저장 안 됨'}
              </span>
            )}
            <button
  type="submit"
  className="comment-submit-btn"
  onClick={(e) => {
    if (isBanned && banInfo) {
      e.preventDefault()
      alert(`🚫 현재 정지된 상태입니다.
사유: ${banInfo.reason || '사유 없음'}
(${remainingMsg})
게시글을 작성할 수 없습니다.`)
      return
    }
    // 통과: 작성 가능
  }}
  style={{
    opacity: isBanned ? 0.5 : 1,
    cursor: isBanned ? 'not-allowed' : 'pointer',
    pointerEvents: 'auto', // ✅ 클릭 막히지 않도록 활성화
  }}
>
  {id ? '수정 완료' : '등록'}
</button>



          </div>
        </div>
      </form>
    </div>
  )
}
