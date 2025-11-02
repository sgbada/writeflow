import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import type { Post } from './lib/types'

export default function PostsList() {
  const { boardName, tagName } = useParams<{ boardName?: string; tagName?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { posts } = usePostsStore()

  const [board, setBoard] = useState<string>(boardName || '전체')
  const [query, setQuery] = useState<string>(tagName ? `#${tagName}` : '')
  const [mode, setMode] = useState<'all' | 'title' | 'content' | 'tag'>(tagName ? 'tag' : 'all')
  const [page, setPage] = useState<number>(1)
  const postsPerPage = 10
  const TITLE_LIMIT = 25

  // ✅ 인기 라우트 여부/기준
  const isPopular = location.pathname.startsWith('/popular')
  const POPULAR_THRESHOLD = 1

  // 경로/파라미터 변화에 따른 상태 초기화
  useEffect(() => {
    if (isPopular) {
      setBoard('인기')
      setQuery('')
      setMode('all')
    } else {
      setBoard(boardName || '전체')
      if (tagName) {
        setQuery(`#${tagName}`)
        setMode('tag')
      } else if (location.pathname === '/') {
        setQuery('')
        setMode('all')
      }
    }
    setPage(1)
  }, [boardName, tagName, location.pathname, isPopular])

  // 태그 검색이 아닌데 /tag/* 경로라면 홈으로
  useEffect(() => {
    if (!query.startsWith('#')) {
      if (location.pathname.startsWith('/tag/')) navigate('/')
    }
  }, [query, navigate, location.pathname])

  const handleBoardChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    setBoard(selected)
    if (selected === '전체') navigate('/')
    else navigate(`/board/${selected}`)
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  // 1차 필터: 말머리/검색어/태그 (인기는 말머리 무시)
  const baseFiltered = posts.filter((p: Post) => {
    const q = query.replace(/^#/, '').toLowerCase()
    const boardMatch = isPopular ? true : (board === '전체' || p.board === board)

    if (mode === 'tag') {
      return boardMatch && (p.tags || []).some((t) => t.toLowerCase() === q)
    }

    const match =
      mode === 'title'
        ? p.title.toLowerCase().includes(q)
        : mode === 'content'
        ? p.content.toLowerCase().includes(q)
        : p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)

    return boardMatch && match
  })

  // ✅ 인기 전용 필터/정렬: 추천 내림차순, 같으면 최신순
  const filtered = isPopular
    ? baseFiltered
        .filter((p) => (p.likes ?? 0) >= POPULAR_THRESHOLD)
        .sort(
          (a, b) =>
            (b.likes ?? 0) - (a.likes ?? 0) ||
            +new Date(b.createdAt) - +new Date(a.createdAt)
        )
    // 일반 목록은 최신글이 위로 (reverse)
    : baseFiltered.slice().reverse()

  const totalPages = Math.ceil(filtered.length / postsPerPage)
  const start = (page - 1) * postsPerPage
  const end = start + postsPerPage
  const currentPosts = filtered.slice(start, end)

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

      {/* ✅ 게시판 탭 + 새 글 작성 버튼 */}
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

      {/* ✅ 게시글 표 헤더 */}
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

        {/* 게시글 리스트 */}
        {currentPosts.map((p, idx) => (
          <div key={p.id} className="post-row">
            <div className="col-num">{filtered.length - (start + idx)}</div>
            <div className="col-board">[{p.board}]</div>
            <div className="col-title">
              <Link to={`/post/${p.id}`} className="title-link">
              {(p.likes ?? 0) >= POPULAR_THRESHOLD && (
                <span className="badge-hot">🔥 인기</span>
              )}
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

      {/* ✅ 페이지네이션 */}
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

      {/* ✅ 페이지네이션 밑에 검색창 */}
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-box"
          />

          <button type="submit" className="search-btn">🔍 검색</button>
        </form>
      </div>
    </div>
  )
}
