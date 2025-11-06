import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, FormEvent, useEffect } from 'react'
import { usePostsStore } from './store/posts'
import type { Comment } from './lib/types'

export default function PostDetail() {
  const { id, slug } = useParams<{ id: string; slug?: string }>()
  const postId = Number(id)
  const navigate = useNavigate()
  const { posts, deletePost, likePost, addComment, deleteComment, incrementViews } = usePostsStore()
  const post = posts.find((p) => p.id === postId)
  const location = useLocation()
  const fromPage = location.state?.fromPage || 1

  // ✅ 현재 로그인한 사용자명 (없으면 익명)
  const currentUser = localStorage.getItem('username') || '익명'

  // ✅ 상태들
  const [liked, setLiked] = useState<boolean>(() => {
    const likedPosts: number[] = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    return likedPosts.includes(postId)
  })
  const [nickname, setNickname] = useState('')
  const [comment, setComment] = useState('')
  const [commentPwd, setCommentPwd] = useState('')
  const [commentDeletePwd, setCommentDeletePwd] = useState('')
  const [commentDeleteId, setCommentDeleteId] = useState<number | null>(null)
  const [anonymousMap, setAnonymousMap] = useState<Record<string, number>>({})
  const [replyInputs, setReplyInputs] = useState<Record<number, { nickname: string; password: string; text: string }>>({})
  const [commentDeleteError, setCommentDeleteError] = useState('')
  const [editPwd, setEditPwd] = useState('')
  const [editError, setEditError] = useState('')
  const [deletePwd, setDeletePwd] = useState('')
  const [showEditPrompt, setShowEditPrompt] = useState(false)
  const [showDeletePrompt, setShowDeletePrompt] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)

  // ✅ 댓글 정렬 및 페이지네이션
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest')
  const sortedComments = [...(post?.comments || [])].sort((a, b) => {
    if (sortOrder === 'newest')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const commentsPerPage = 15
  const [commentPage, setCommentPage] = useState(1)
  const totalComments = sortedComments.length
  const totalCommentPages = Math.ceil(totalComments / commentsPerPage)
  const groupStart = Math.floor((commentPage - 1) / 10) * 10 + 1
  const groupEnd = Math.min(groupStart + 9, totalCommentPages)
  const currentComments = sortedComments.slice(
    (commentPage - 1) * commentsPerPage,
    commentPage * commentsPerPage
  )
  const [replyToId, setReplyToId] = useState<number | null>(null)

  // ✅ 슬러그 정규화
  useEffect(() => {
    if (post && slug !== post.slug) navigate(`/post/${post.id}/${post.slug}`, { replace: true })
  }, [post, slug, navigate])

  // ✅ 조회수 증가 (1시간 중복 방지)
  useEffect(() => {
    if (!post) return
    const viewedPosts = JSON.parse(localStorage.getItem('viewedPosts') || '{}') as Record<
      number,
      number
    >
    const now = Date.now()
    const HOUR_MS = 60 * 60 * 1000
    if (viewedPosts[postId] && now - viewedPosts[postId] < HOUR_MS) return
    incrementViews(postId)
    viewedPosts[postId] = now
    localStorage.setItem('viewedPosts', JSON.stringify(viewedPosts))
  }, [postId, post, incrementViews])

  if (!post) return <p>존재하지 않는 글입니다.</p>

  const currentUserId = localStorage.getItem('userId')
const isAuthor =
  (post.authorId && post.authorId === currentUserId) ||
  (!post.authorId && post.author === currentUser) // old post fallback

  // ✅ 좋아요
  const handleLike = () => {
    if (isAuthor) {
      alert('자신의 글은 추천할 수 없습니다!')
      return
    }
    if (liked) return
    likePost(postId)
    setLiked(true)
    const likedPosts: number[] = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    likedPosts.push(postId)
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts))
  }


  // ✅ 수정 / 삭제
  const handleEditConfirm = () => {
    if (editPwd === post.password) navigate(`/edit/${postId}`)
    else setEditError('비밀번호가 올바르지 않습니다.')
  }
  const handleDeleteConfirm = () => {
    deletePost(postId, deletePwd)
    navigate('/')
  }

const handleAddComment = (e: FormEvent, parentId?: number) => {
  e.preventDefault()
  const input = parentId
    ? replyInputs[parentId]
    : { nickname, password: commentPwd, text: comment }
  if (!input.text.trim()) return

  const userId = localStorage.getItem('userId') || crypto.randomUUID()
  localStorage.setItem('userId', userId)
  const currentUserId = localStorage.getItem('userId')
  const isAuthor =
  (post.authorId && post.authorId === currentUserId) ||
  (!post.authorId && post.author === currentUser)

  // ✅ 실제 저장 (언급 제거 버전)
addComment(postId, {
  author: input.nickname || '익명',
  authorId: userId,
  text: input.text.trim(), // ✅ @닉네임 제거
  password: input.password || undefined,
  parentId,
})


  // ✅ 입력 초기화
  if (parentId) {
    setReplyInputs((prev) => ({
      ...prev,
      [parentId]: { nickname: '', password: '', text: '' },
    }))
    setReplyToId(null)
  } else {
    setComment('')
    setNickname('')
    setCommentPwd('')
  }
}


  const handleCommentDelete = (cid: number) => {
    const success = deleteComment(postId, cid, commentDeletePwd)
    if (!success) setCommentDeleteError('비밀번호가 올바르지 않습니다.')
    else {
      setCommentDeleteError('')
      setCommentDeleteId(null)
      setCommentDeletePwd('')
    }
  }
  // ✅ 들여쓰기 기반의 간단한 재귀 함수 (최대 3단계)
const renderReplies = (parentId: number, depth = 1): JSX.Element | null => {
  const childReplies = sortedComments.filter((r) => r.parentId === parentId)
  if (childReplies.length === 0) return null
  if (depth > 3) return null // ✅ 3단계 제한

  return (
    <ul className="reply-list" style={{ marginLeft: `${depth * 20}px` }}>
      {childReplies.map((r) => {
        const isReplyWriter = r.authorId && post.authorId && r.authorId === post.authorId
        return (
          <li key={r.id} className="reply-item">
            <div className="c-head">
              <div className="c-info">
                <strong className="c-author">
                  {getDisplayName(r)}
                  {isReplyWriter && <span className="badge-writer">작성자</span>}
                </strong>
                <span className="c-time">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="c-actions">
                <button
                  className="reply-btn"
                  onClick={() => setReplyToId(r.id)}
                  title="답글 달기"
                >
                  ⤷
                </button>
                <button
                  className="c-delete"
                  onClick={() => setCommentDeleteId(r.id)}
                  title="댓글 삭제"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              className="c-body"
              dangerouslySetInnerHTML={{
                __html: r.text,
              }}
            />

            {/* ✅ 답글 입력창 */}
            {replyToId === r.id && (
              <form onSubmit={(e) => handleAddComment(e, r.id)} className="reply-form">
                <div className="replying-info">
                  💬 {getDisplayName(r)}님에게 답글 작성 중...
                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="cancel-reply"
                  >
                    취소
                  </button>
                </div>
                <div className="reply-fields">
                  <div className="reply-left">
                    <input
                      type="text"
                      placeholder="닉네임"
                      value={replyInputs[r.id]?.nickname || ''}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [r.id]: { ...(prev[r.id] || {}), nickname: e.target.value },
                        }))
                      }
                    />
                    <input
                      type="password"
                      placeholder="비밀번호"
                      value={replyInputs[r.id]?.password || ''}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [r.id]: { ...(prev[r.id] || {}), password: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="reply-right">
                    <textarea
                      placeholder="답글을 입력하세요."
                      value={replyInputs[r.id]?.text || ''}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [r.id]: { ...(prev[r.id] || {}), text: e.target.value },
                        }))
                      }
                      required
                    />
                    <button type="submit">등록</button>
                  </div>
                </div>
              </form>
            )}

            {/* ✅ 하위 답글 렌더링 (깊이 제한 포함) */}
            {renderReplies(r.id, depth + 1)}
          </li>
        )
      })}
    </ul>
  )
}

  // ✅ 익명 넘버링 함수
const getDisplayName = (c: Comment): string => {
  if (c.author !== '익명') return c.author
  if (!c.authorId) return '익명'
  if (!anonymousMap[c.authorId]) {
    const next = Object.keys(anonymousMap).length + 1
    setAnonymousMap((prev) => ({ ...prev, [c.authorId]: next }))
    return `익명${next}`
  }
  return `익명${anonymousMap[c.authorId]}`
}


  return (
    <div className="container post-detail">
      <h1>{post.title}</h1>

      <div className="meta">
        {post.author || '익명'} | {new Date(post.createdAt).toLocaleString()} | 조회 {post.views ?? 0} | 추천{' '}
        {post.likes ?? 0}
      </div>

      <hr className="post-divider" />

      {/* ✅ 이미지 */}
      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          loading="lazy"
          width="600"
          height="400"
          style={{
            objectFit: 'cover',
            aspectRatio: '3/2',
            display: 'block',
            margin: '1rem auto',
            borderRadius: '8px',
          }}
        />
      )}

      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* 👍 추천 */}
      <div className="like-section">
        <button
          className={`like-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {liked ? '👍 추천됨' : '👍 추천하기'}{' '}
          <span className="like-count">{post.likes || 0}</span>
        </button>
      </div>

      {/* 🔖 태그 */}
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {(showAllTags ? post.tags : post.tags.slice(0, 10)).map((tag, i) => (
            <Link key={i} to={`/search?q=%23${encodeURIComponent(tag)}`} className="tag-link small">
              #{tag}
            </Link>
          ))}
          {post.tags.length > 10 && (
            <button className="tag-more" onClick={() => setShowAllTags((p) => !p)}>
              {showAllTags ? '접기 ▲' : `+${post.tags.length - 10}개 더보기 ▼`}
            </button>
          )}
        </div>
      )}

      {/* ✏️ 수정 / 삭제 */}
      <div className="post-actions">
        <button
          onClick={() => setShowEditPrompt(!showEditPrompt)}
          className={showEditPrompt ? 'btn-toggle active' : 'btn-toggle'}
        >
          ✏️ 수정
        </button>
        <button
          onClick={() => setShowDeletePrompt(!showDeletePrompt)}
          className={showDeletePrompt ? 'btn-toggle active' : 'btn-toggle'}
        >
          🗑 삭제
        </button>
      </div>

      {showEditPrompt && (
        <div className="inline-password-box">
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={editPwd}
            onChange={(e) => setEditPwd(e.target.value)}
          />
          <button onClick={handleEditConfirm}>수정 확인</button>
          {editError && <p className="error">{editError}</p>}
        </div>
      )}

      {showDeletePrompt && (
        <div className="inline-password-box">
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={deletePwd}
            onChange={(e) => setDeletePwd(e.target.value)}
          />
          <button onClick={handleDeleteConfirm}>삭제 확인</button>
        </div>
      )}

{/* 💬 댓글 영역 */}
<div className="comment-area">
  <h2>댓글</h2>

  {/* 정렬 버튼 */}
  <div className="comment-sort">
    <button
      className={sortOrder === 'oldest' ? 'active' : ''}
      onClick={() => setSortOrder('oldest')}
    >
      등록순
    </button>
    <button
      className={sortOrder === 'newest' ? 'active' : ''}
      onClick={() => setSortOrder('newest')}
    >
      최신순
    </button>
  </div>

  <ul className="comment-list">
    {sortedComments
      .filter((c) => !c.parentId) // 부모 댓글만
      .map((c) => {
        const isWriter = c.authorId && post.authorId && c.authorId === post.authorId
        const replies = sortedComments.filter((r) => r.parentId === c.id)

        return (
          <li key={c.id} className="comment-item">
            <div className="c-head">
              <div className="c-info">
                <strong className="c-author">
                  {getDisplayName(c)}
                  {isWriter && <span className="badge-writer">작성자</span>}
                </strong>

                <span className="c-time">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="c-actions">
                <button
                  className="reply-btn"
                  onClick={() => setReplyToId(c.id)}
                  title="답글 달기"
                >
                  ⤷
                </button>
                <button
                  className="c-delete"
                  onClick={() => setCommentDeleteId(c.id)}
                  title="댓글 삭제"
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              className="c-body"
              dangerouslySetInnerHTML={{
                __html: c.text.replace(
                  /@([^\s]+)/g,
                  '<span class="mention">@$1</span>'
                ),
              }}
            />


            {/* ✅ 답글 입력창 */}
            {replyToId === c.id && (
                <form onSubmit={(e) => handleAddComment(e, c.id)} className="reply-form">
                  <div className="replying-info">
                    💬 {getDisplayName(c)}님에게 답글 작성 중...
                    <button
                      type="button"
                      onClick={() => setReplyToId(null)}
                      className="cancel-reply"
                    >
                      취소
                    </button>
                  </div>
                  <div className="reply-fields">
                    <div className="reply-left">
                      <input
                        type="text"
                        placeholder="닉네임"
                        value={replyInputs[c.id]?.nickname || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({
                            ...prev,
                            [c.id]: { ...(prev[c.id] || {}), nickname: e.target.value },
                          }))
                        }
                      />

                      <input
                        type="password"
                        placeholder="비밀번호"
                        value={replyInputs[c.id]?.password || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({
                            ...prev,
                            [c.id]: { ...(prev[c.id] || {}), password: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="reply-right">
                      <textarea
                        placeholder="답글을 입력하세요."
                        value={replyInputs[c.id]?.text || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({
                            ...prev,
                            [c.id]: { ...(prev[c.id] || {}), text: e.target.value },
                          }))
                        }
                        required
                      />
                      <button type="submit">등록</button>
                    </div>
                  </div>
                </form>
              )}
             
            {/* ✅ 답글 목록 (무한 계층) */}
{renderReplies(c.id)}

          </li>
        )
      })}
  </ul>

  {/* ✅ 일반 댓글 입력창 */}
  <form onSubmit={(e) => handleAddComment(e)} className="comment-form">


    <div className="comment-side">
      <input
        type="text"
        placeholder="닉네임 (최대 10자)"
        value={nickname}
        onChange={(e) => {
          if (e.target.value.length <= 10) setNickname(e.target.value)
        }}
        maxLength={10}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={commentPwd}
        onChange={(e) => setCommentPwd(e.target.value)}
      />
    </div>
    <div className="comment-main">
      <textarea
        placeholder="댓글을 입력하세요."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      ></textarea>
      <button type="submit">등록</button>
    </div>
  </form>
</div>



      <hr className="post-divider" />
      <button
        onClick={() => {
          if (window.history.state && window.history.state.idx > 0) navigate(-1)
          else navigate(`/?page=${fromPage}`)
        }}
      >
        ← 목록으로
      </button>
    </div>
  )
}
