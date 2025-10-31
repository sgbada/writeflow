import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import { useState, useEffect, ChangeEvent } from 'react'
import type { Post } from './lib/types'

export default function PostsList() {
  const { boardName, tagName } = useParams<{ boardName?: string; tagName?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { posts } = usePostsStore()

  const [board, setBoard] = useState<string>(boardName || '전체')
  const [query, setQuery] = useState<string>(tagName ? `#${tagName}` : '')
  const [mode, setMode] = useState<'all' | 'title' | 'content' | 'tag'>(
    tagName ? 'tag' : 'all'
  )
  const [page, setPage] = useState<number>(1)
  const postsPerPage = 10

  useEffect(() => {
    setBoard(boardName || '전체')
    if (tagName) {
      setQuery(`#${tagName}`)
      setMode('tag')
    } else if (location.pathname === '/') {
      setQuery('')
      setMode('all')
    }
    setPage(1)
  }, [boardName, tagName, location.pathname])

  useEffect(() => {
    if (!query.startsWith('#')) {
      if (location.pathname.startsWith('/tag/')) navigate('/')
    }
  }, [query, navigate, location.pathname])

  const handleTagClick = (tag: string) => {
    navigate(`/tag/${tag}`)
  }

  const filtered = posts.filter((p: Post) => {
    const q = query.replace(/^#/, '').toLowerCase()
    const boardMatch = board === '전체' || p.board === board

    if (mode === 'tag') {
      return boardMatch && (p.tags || []).some(t => t.toLowerCase() === q)
    }

    const match =
      mode === 'title'
        ? p.title.toLowerCase().includes(q)
        : mode === 'content'
        ? p.content.toLowerCase().includes(q)
        : p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)

    return boardMatch && match
  })

  const totalPages = Math.ceil(filtered.length / postsPerPage)
  const start = (page - 1) * postsPerPage
  const end = start + postsPerPage
  const currentPosts = filtered.slice().reverse().slice(start, end)

  const handleBoardChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    setBoard(selected)
    if (selected === '전체') navigate('/')
    else navigate(`/board/${selected}`)
  }

  // ✅ 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    if (isToday) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
      })
    }
  }

  return (
    <div className="container">
      <h1>익명 게시판</h1>

      {/* 게시판 탭 */}
      <div className="board-tabs">
        {['전체', '자유', '유머', '질문'].map((b) => (
          <button
            key={b}
            className={board === b ? 'tab active' : 'tab'}
            onClick={() => navigate(b === '전체' ? '/' : `/board/${b}`)}
          >
            {b}
          </button>
        ))}
      </div>

      {/* 검색창 */}
      <div className="filter-row">
        <select value={board} onChange={handleBoardChange}>
          <option value="전체">전체 게시판</option>
          <option value="자유">자유게시판</option>
          <option value="유머">유머게시판</option>
          <option value="질문">질문게시판</option>
        </select>

        <input
          type="text"
          placeholder="검색어를 입력하세요 (#태그 검색 가능)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-box"
        />

        <div className="search-mode">
          <button
            className={mode === 'all' ? 'active' : ''}
            onClick={() => setMode('all')}
          >
            전체
          </button>
          <button
            className={mode === 'title' ? 'active' : ''}
            onClick={() => setMode('title')}
          >
            제목
          </button>
          <button
            className={mode === 'content' ? 'active' : ''}
            onClick={() => setMode('content')}
          >
            본문
          </button>
        </div>
      </div>

      <Link to="/write" className="write-btn">
        ✏️ 새 글 작성
      </Link>

      {/* 게시글 표 헤더 */}
<div className="post-table">
  <div className="post-table-header">
    <div className="col-num">번호</div>
    <div className="col-board">말머리</div>
    <div className="col-title">제목</div>
    <div className="col-writer">글쓴이</div>
    <div className="col-date">작성일</div>
    <div className="col-views">조회</div>
    <div className="col-likes">추천</div>
  </div>

  {/* 게시글 리스트 */}
  {currentPosts.map((p, idx) => (
    <div key={p.id} className="post-row">
      <div className="col-num">{filtered.length - (start + idx)}</div>
      <div className="col-board">[{p.board}]</div>
      <div className="col-title">
        <Link to={`/post/${p.id}`} className="title-link">
          {p.title}
          {p.comments?.length > 0 && (
            <span className="comment-count">[{p.comments.length}]</span>
          )}
        </Link>
      </div>
      <div className="col-writer">익명</div>
      <div className="col-date">{formatDate(p.createdAt)}</div>
      <div className="col-views">{p.views ?? 0}</div>
      <div className="col-likes">{p.likes ?? 0}</div>
    </div>
  ))}
</div>


      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={page === i + 1 ? 'active' : ''}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
