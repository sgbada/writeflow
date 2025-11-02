import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, FormEvent, useEffect } from 'react'
import { usePostsStore } from './store/posts'
import type { Comment } from './lib/types'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const navigate = useNavigate()
  const {
    posts,
    deletePost,
    likePost,
    addComment,
    deleteComment,
    incrementViews, // ✅ 조회수 함수
  } = usePostsStore()
  const post = posts.find((p) => p.id === postId)

  const [liked, setLiked] = useState<boolean>(() => {
    const likedPosts: number[] = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    return likedPosts.includes(postId)
  })

  const [nickname, setNickname] = useState('')
  const [comment, setComment] = useState('')
  const [commentPwd, setCommentPwd] = useState('')
  const [commentDeletePwd, setCommentDeletePwd] = useState('')
  const [commentDeleteId, setCommentDeleteId] = useState<number | null>(null)
  const [commentDeleteError, setCommentDeleteError] = useState('')
  const [editPwd, setEditPwd] = useState('')
  const [editError, setEditError] = useState('')
  const [deletePwd, setDeletePwd] = useState('')
  const [showEditPrompt, setShowEditPrompt] = useState(false)
  const [showDeletePrompt, setShowDeletePrompt] = useState(false)

  // ✅ 조회수 증가 (1시간 중복 방지 + 내 글 제외)
  useEffect(() => {
    if (!post) return

    const myPosts = JSON.parse(localStorage.getItem('myPosts') || '[]') as number[]
    if (myPosts.includes(postId)) return // 내가 쓴 글이면 조회수 증가 X

    const viewedPosts = JSON.parse(localStorage.getItem('viewedPosts') || '{}') as Record<number, number>
    const now = Date.now()
    const HOUR_MS = 60 * 60 * 1000 // 1시간

    if (viewedPosts[postId] && now - viewedPosts[postId] < HOUR_MS) return // 1시간 이내 중복 방지

    incrementViews(postId)
    viewedPosts[postId] = now
    localStorage.setItem('viewedPosts', JSON.stringify(viewedPosts))
  }, [postId])

  if (!post) return <p>존재하지 않는 글입니다.</p>

  // ✅ 좋아요
  const handleLike = () => {
    if (liked) return
    likePost(postId)
    setLiked(true)
    const likedPosts: number[] = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    likedPosts.push(postId)
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts))
  }

  // ✅ 수정
  const handleEditConfirm = () => {
    if (editPwd === post.password) navigate(`/edit/${postId}`)
    else setEditError('비밀번호가 올바르지 않습니다.')
  }

  // ✅ 삭제
  const handleDeleteConfirm = () => {
    deletePost(postId, deletePwd)
    navigate('/')
  }

  // ✅ 댓글 추가
  const handleAddComment = (e: FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    const newComment: Omit<Comment, 'id' | 'createdAt'> & { password?: string } = {
      author: nickname || '익명',
      text: comment.trim(),
      password: commentPwd || undefined,
    }

    addComment(postId, newComment)
    setComment('')
    setNickname('')
    setCommentPwd('')
  }

  // ✅ 댓글 삭제
  const handleCommentDelete = (cid: number) => {
    const success = deleteComment(postId, cid, commentDeletePwd)
    if (success === false) {
      setCommentDeleteError('비밀번호가 올바르지 않습니다.')
    } else {
      setCommentDeleteError('')
      setCommentDeleteId(null)
      setCommentDeletePwd('')
    }
  }

  return (
    <div className="container post-detail">
      <h1>{post.title}</h1>
      <div className="meta">
        익명 | {new Date(post.createdAt).toLocaleString()} | 조회 {post.views ?? 0} | 추천{' '}
        {post.likes ?? 0}
      </div>

      <hr className="post-divider" />

      <div
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>

      <hr className="post-divider" />

      <div className="like-section">
        <button
          className={`like-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={liked}
        >
          {liked ? '👍 추천됨' : '👍 추천하기'}{' '}
          <span className="like-count">{post.likes || 0}</span>
        </button>
      </div>

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

      {/* ✏️ 수정 비밀번호 입력창 */}
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

      {/* 🗑 삭제 비밀번호 입력창 */}
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


      {/* ✅ 댓글 영역 */}
      <div className="comment-area">
        <h2>댓글</h2>

        <ul className="comment-list">
          {(post.comments || []).slice().reverse().map((c) => (
            <li key={c.id} className="comment-item">
              <div className="c-head">
                <strong>{c.author}</strong> ·{' '}
                <span>{new Date(c.createdAt).toLocaleString()}</span>
                <button onClick={() => setCommentDeleteId(c.id)}>삭제</button>
              </div>
              <div className="c-body">{c.text}</div>

              {commentDeleteId === c.id && (
                <div className="popup-box">
                  <input
                    type="password"
                    placeholder="댓글 비밀번호 입력"
                    value={commentDeletePwd}
                    onChange={(e) => setCommentDeletePwd(e.target.value)}
                  />
                  <button onClick={() => handleCommentDelete(c.id)}>삭제 확인</button>
                  {commentDeleteError && (
                    <p className="error">{commentDeleteError}</p>
                  )}
                </div>
              )}
            </li>
          ))}
          {(!post.comments || post.comments.length === 0) && (
            <p>첫 댓글을 남겨보세요.</p>
          )}
        </ul>

        <form onSubmit={handleAddComment} className="comment-form">
          <input
            type="text"
            placeholder="닉네임 (선택)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호 (삭제용)"
            value={commentPwd}
            onChange={(e) => setCommentPwd(e.target.value)}
          />
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <button type="submit">등록</button>
        </form>
      </div>

      <hr className="post-divider" />
      <Link to="/">← 목록으로</Link>
    </div>
  )
}
