import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePostsStore } from './store/posts'
import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import type { Post } from './lib/types'
const slugify = (title: string) =>
  title
    ? title
        .toLowerCase()
        .trim()
        .replace(/[^\w가-힣]+/g, '-') // 특수문자 → 하이픈
        .replace(/^-+|-+$/g, '')
    : 'untitled'

export default function PostsList() {
  // ✅ 파라미터 확장
  const { boardName, tagName, categorySlug, slug, id } = useParams<{
    boardName?: string
    tagName?: string
    categorySlug?: string
    slug?: string
    id?: string
  }>()

  const location = useLocation()
  const navigate = useNavigate()
  const { posts } = usePostsStore()

  const [board, setBoard] = useState(boardName || '전체')
  const [query, setQuery] = useState(tagName ? `#${tagName}` : '')
  const [mode, setMode] = useState<'all' | 'title' | 'content' | 'tag'>(tagName ? 'tag' : 'all')
  const [page, setPage] = useState(1)
  const postsPerPage = 15
  //const TITLE_LIMIT = 25
  const isPopular = location.pathname.startsWith('/popular')
  const [inputValue, setInputValue] = useState('')
  const POPULAR_THRESHOLD = 1

  // ✅ 검색어 및 경로 상태 동기화
  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const q = sp.get('q')?.trim() || ''

    if (location.pathname.startsWith('/search')) {
      setBoard('검색 결과')
      setQuery(q)
      setInputValue(q)
      setMode(q.startsWith('#') ? 'tag' : 'all')
    } else if (isPopular) {
      setBoard('인기')
      setQuery('')
      setInputValue('')
      setMode('all')
    } 
    // ✅ 카테고리 페이지
    else if (categorySlug) {
      setBoard(`카테고리: ${categorySlug}`)
      setQuery('')
      setInputValue('')
      setMode('all')
    } 
    // ✅ 태그 페이지 (/tag/:slug)
    else if (slug) {
      setBoard(`태그: #${slug}`)
      setQuery(`#${slug}`)
      setInputValue(`#${slug}`)
      setMode('tag')
    } 
    // ✅ 작성자 페이지 (/author/:id)
    else if (id) {
      setBoard(`작성자 ${id}`)
      setQuery('')
      setInputValue('')
      setMode('all')
    }
    else {
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
  }, [location.pathname, location.search, boardName, tagName, categorySlug, slug, id, isPopular])

  // ✅ 검색 제출 시 query 갱신
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  // ✅ 필터링 로직
  const baseFiltered = posts.filter((p: Post) => {
    const isSearchPage = location.pathname.startsWith('/search')
    const q = (isSearchPage ? query : '').replace(/^#/, '').toLowerCase()

    // ✅ board 필터
    const boardMatch =
      isPopular || isSearchPage || categorySlug || slug || id
        ? true
        : board === '전체' || p.board === board

    // ✅ category 필터
    const categoryMatch = categorySlug ? p.category?.toLowerCase() === categorySlug.toLowerCase() : true

    // ✅ author 필터
    const authorMatch = id ? String(p.authorId) === id : true

    if (!q && !slug) return boardMatch && categoryMatch && authorMatch

    // ✅ 태그 페이지
    if (slug || mode === 'tag' || query.startsWith('#')) {
      const tagToMatch = slug || query.replace(/^#/, '')
      return (
        boardMatch &&
        categoryMatch &&
        authorMatch &&
        (p.tags || []).some((t) => t.toLowerCase() === tagToMatch.toLowerCase())
      )
    }

    // ✅ 일반 검색
    const match =
      mode === 'title'
        ? p.title.toLowerCase().includes(q)
        : mode === 'content'
        ? (p.content || '').toLowerCase().includes(q)
        : (p.title + (p.content || '')).toLowerCase().includes(q)

    return boardMatch && categoryMatch && authorMatch && match
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
          : location.pathname.startsWith('/category/')
          ? `📂 ${board}`
          : location.pathname.startsWith('/tag/')
          ? `🏷️ ${board}`
          : location.pathname.startsWith('/author/')
          ? `✍️ ${board}`
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
                <Link to={`/post/${p.id}/${slugify(p.title || String(p.id))}`} className="title-link">
                  {(p.likes ?? 0) >= POPULAR_THRESHOLD && <span className="badge-hot">🔥 인기</span>}
                  {p.title}
                  {p.comments?.length > 0 && <span className="comment-count">[{p.comments.length}]</span>}
                </Link>


              </div>
              {/* ✅ 작성자 페이지 링크 */}
              <div className="col-writer">
                {p.authorId ? (
                  <Link to={`/author/${p.authorId}`}>{p.authorName ?? '작성자'}</Link>
                ) : (
                  <span>익명</span>
                )}
              </div>

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
            onChange={(e) => setInputValue(e.target.value)}
            className="search-box"
          />

          <button type="submit" className="search-btn">🔍 검색</button>
        </form>
      </div>
    </div>
  )
}
