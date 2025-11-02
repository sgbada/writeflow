
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import type { Post } from './lib/types'

export default function PostsList() {
  const { boardName, tagName } = useParams<{ boardName?: string; tagName?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { posts } = usePostsStore()


  const [board, setBoard] = useState(boardName || '전체')
  const [query, setQuery] = useState(tagName ? `#${tagName}` : '')
  const [mode, setMode] = useState<'all' | 'title' | 'content' | 'tag'>(tagName ? 'tag' : 'all')
  const [page, setPage] = useState(1)
  const postsPerPage = 15
  const TITLE_LIMIT = 25
  const isPopular = location.pathname.startsWith('/popular')
  const POPULAR_THRESHOLD = 1
  const [inputValue, setInputValue] = useState('')
  // ✅ 검색어를 주소에서 불러오기 (/search?q=...)
  useEffect(() => {
  const sp = new URLSearchParams(location.search)
  const q = sp.get('q')?.trim() || ''
  if (location.pathname.startsWith('/search')) {
    setBoard('검색 결과')
    setQuery(q)
    setInputValue(q) // ✅ 입력창에도 반영
    setMode(q.startsWith('#') ? 'tag' : 'all')
  } else if (isPopular) {
    setBoard('인기')
    setQuery('')
    setInputValue('')
    setMode('all')
  } else {
    setBoard(boardName || '전체')
    if (tagName) {
      setQuery(`#${tagName}`)
      setInputValue(`#${tagName}`)
      setMode('tag')
    } else {
      setQuery('')
      setInputValue('')
      setMode('all')
    }
  }
  setPage(1)
}, [location.pathname, location.search, boardName, tagName, isPopular])

// ✅ 검색 제출 시 query 갱신
const handleSearchSubmit = (e: FormEvent) => {
  e.preventDefault()
  const trimmed = inputValue.trim()
  if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
}

  // ✅ 실시간 필터링 → 검색 페이지에서만 적용
  const baseFiltered = posts.filter((p: Post) => {
    const isSearchPage = location.pathname.startsWith('/search')
    const q = (isSearchPage ? query : '').replace(/^#/, '').toLowerCase()
    const boardMatch =
      isPopular || isSearchPage
        ? true
        : board === '전체' || p.board === board

    if (!q) return boardMatch

    if (mode === 'tag' || query.startsWith('#')) {
      return boardMatch && (p.tags || []).some((t) => t.toLowerCase() === q)
    }

    const match =
      mode === 'title'
        ? p.title.toLowerCase().includes(q)
        : mode === 'content'
        ? (p.content || '').toLowerCase().includes(q)
        : (p.title + (p.content || '')).toLowerCase().includes(q)

    return boardMatch && match
  })


  // ✅ 인기/일반 정렬
  const filtered = isPopular
    ? baseFiltered
        .filter((p) => (p.likes ?? 0) >= POPULAR_THRESHOLD)
        .sort(
          (a, b) =>
            (b.likes ?? 0) - (a.likes ?? 0) ||
            +new Date(b.createdAt) - +new Date(a.createdAt)
        )
    : baseFiltered.slice().reverse()

  // ✅ 페이지네이션
  const totalPages = Math.ceil(filtered.length / postsPerPage)
  const start = (page - 1) * postsPerPage
  const end = start + postsPerPage
  const currentPosts = filtered.slice(start, end)

  // ✅ 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    return isToday
      ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
      : date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
  }

  return (
    <div className="container">
      <h1>
        {location.pathname.startsWith('/search')
          ? `🔍 검색 결과 (${filtered.length}건)`
          : board === '인기'
          ? '🔥 인기글'
          : '익명 게시판'}
      </h1>

      {/* 탭 */}
      <div className="board-tabs-row">
        <div className="board-tabs">
          {['전체', '자유', '유머', '질문', '인기'].map((b) => (
            <button
              key={b}
              className={board === b ? 'tab active' : 'tab'}
              onClick={() =>
                b === '전체'
                  ? navigate('/')
                  : b === '인기'
                  ? navigate('/popular')
                  : navigate(`/board/${b}`)
              }
            >
              {b}
            </button>
          ))}
        </div>
        <Link to="/write" className="write-btn">✏️ 새 글 작성</Link>
      </div>

      {/* 게시글 */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#777' }}>
          게시글이 없습니다.
        </p>
      ) : (
        <div className="post-table">
          <div className="post-table-header">
            <div className="col-num">번호</div>
            <div className="col-board">말머리</div>
            <div className="col-title header-title">제목</div>
            <div className="col-writer">글쓴이</div>
            <div className="col-date">작성일</div>
            <div className="col-views">조회</div>
            <div className="col-likes">추천</div>
          </div>
          {currentPosts.map((p, idx) => (
            <div key={p.id} className="post-row">
              <div className="col-num">{filtered.length - (start + idx)}</div>
              <div className="col-board">[{p.board}]</div>
              <div className="col-title">
                <Link to={`/post/${p.id}`} className="title-link">
                  {(p.likes ?? 0) >= POPULAR_THRESHOLD && <span className="badge-hot">🔥 인기</span>}
                  {p.title.length > TITLE_LIMIT ? p.title.slice(0, TITLE_LIMIT) + '...' : p.title}
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
      )}

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

      {/* 검색창 */}
      <div className="search-area">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'all' | 'title' | 'content' | 'tag')}
            className="search-select"
          >
            <option value="all">전체</option>
            <option value="title">제목</option>
            <option value="content">본문</option>
          </select>

          <input
            type="text"
            placeholder="검색어를 입력하세요 (#태그 검색 가능)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)} // ✅ 이제 query는 안 바뀜
            className="search-box"
          />


          <button type="submit" className="search-btn">🔍 검색</button>
        </form>
      </div>
    </div>
  )
}
