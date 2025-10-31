import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, FormEvent } from 'react'
import { usePostsStore } from './store/posts'
import type { Comment } from './lib/types'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const { posts, deletePost, addComment, deleteComment, likePost } = usePostsStore()
  const post = posts.find((p) => p.id === postId)
  const navigate = useNavigate()

  // ✅ 추천 기능
  const [liked, setLiked] = useState<boolean>(() => {
    const likedPosts: number[] = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    return likedPosts.includes(postId)
  })

  const handleLike = () => {
    if (liked) return
    likePost(postId)
    setLiked(true)
    const likedPosts: number[] = JSON.parse(localStorage.getItem('likedPosts') || '[]')
    likedPosts.push(postId)
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts))
  }

  const [deletePwd, setDeletePwd] = useState('')
  const [editPwd, setEditPwd] = useState('')
  const [comment, setComment] = useState('')
  const [nickname, setNickname] = useState('')
  const [commentPwd, setCommentPwd] = useState('')
  const [showEditPrompt, setShowEditPrompt] = useState(false)
  const [showDeletePrompt, setShowDeletePrompt] = useState(false)
  const [editError, setEditError] = useState('')
  const [commentDeleteId, setCommentDeleteId] = useState<number | null>(null)
  const [commentDeletePwd, setCommentDeletePwd] = useState('')

  if (!post) return <p>존재하지 않는 글입니다.</p>

  const handleEditConfirm = () => {
    if (editPwd === post.password) navigate(`/edit/${postId}`)
    else setEditError('비밀번호가 올바르지 않습니다.')
  }

  const handleDeleteConfirm = () => {
    deletePost(postId, deletePwd)
    navigate('/')
  }

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

  const handleCommentDelete = (cid: number) => {
    deleteComment(postId, cid, commentDeletePwd)
    setCommentDeleteId(null)
    setCommentDeletePwd('')
  }

  return (
    <div className="container post-detail">
      <h1>{post.title}</h1>
      <div className="meta">익명 | {new Date(post.createdAt).toLocaleString()}</div>

      <hr className="post-divider" />

      {post.images && post.images.length > 0 && (
        <div className="post-images">
          {post.images.map((src, idx) => (
            <img key={idx} src={src} alt={`uploaded-${idx}`} />
          ))}
        </div>
      )}

      <p className="post-content">{post.content}</p>

      <hr className="post-divider" />

      <div className="like-section">
  <button
    className={`like-btn ${liked ? 'liked' : ''}`}
    onClick={handleLike}
    disabled={liked}
  >
    {liked ? '👍 추천됨' : '👍 추천하기'} <span className="like-count">{post.likes || 0}</span>
  </button>
</div>


      <div className="post-actions">
        <button
  onClick={() => setShowEditPrompt(!showEditPrompt)}
  className={showEditPrompt ? 'btn-toggle active' : 'btn-toggle'}
>✏️ 수정</button>
        <button
  onClick={() => setShowDeletePrompt(!showDeletePrompt)}
  className={showDeletePrompt ? 'btn-toggle active' : 'btn-toggle'}
>🗑 삭제</button>
      </div>

      {showEditPrompt && (
        <div className="popup-box">
          <h4>글 수정 비밀번호 확인</h4>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={editPwd}
            onChange={(e) => setEditPwd(e.target.value)}
          />
          <button onClick={handleEditConfirm}>확인</button>
          {editError && <p className="error">{editError}</p>}
        </div>
      )}

      {showDeletePrompt && (
        <div className="popup-box">
          <h4>글 삭제 비밀번호 확인</h4>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={deletePwd}
            onChange={(e) => setDeletePwd(e.target.value)}
          />
          <button onClick={handleDeleteConfirm}>삭제</button>
        </div>
      )}

      {/* 댓글 섹션 */}
<div className="comment-area">
  <h2>댓글</h2>

  {/* ✅ 댓글 목록 먼저 */}
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
          </div>
        )}
      </li>
    ))}

    {(!post.comments || post.comments.length === 0) && (
      <p>첫 댓글을 남겨보세요.</p>
    )}
  </ul>

  {/* ✅ 댓글 입력창을 아래로 이동 */}
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
