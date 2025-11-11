import { useEffect, useState } from 'react'

interface Report {
  postId: number
  title?: string
  commentId?: number
  author?: string
  authorId?: string
  text?: string
  reason: string
  detail?: string
  createdAt: string
}

interface BannedUser {
  authorId: string
  author?: string
  expiresAt: number
}

export default function ReportsList() {
  const [reports, setReports] = useState<Report[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])

  // ✅ 신고 내역 불러오기
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('reports') || '[]')
    setReports(saved)
    const banned = JSON.parse(localStorage.getItem('bannedUsers') || '[]')
    setBannedUsers(banned)
  }, [])

  // ✅ 신고 삭제
  const handleDeleteReport = (index: number) => {
    if (!confirm('이 신고 내역을 삭제하시겠습니까?')) return
    const updated = reports.filter((_, i) => i !== index)
    setReports(updated)
    localStorage.setItem('reports', JSON.stringify(updated))
  }

  // ✅ 사용자 정지 (익명 포함)
const handleBanUser = (authorId?: string, author?: string) => {
  if (!authorId) {
    alert('식별할 수 없는 사용자입니다.')
    return
  }

  const banned = JSON.parse(localStorage.getItem('bannedUsers') || '[]')
  const already = banned.find((b: BannedUser) => b.authorId === authorId)
  if (already && Date.now() < already.expiresAt) {
    alert('이미 정지 중인 사용자입니다.')
    return
  }

  const daysStr = prompt('정지 기간(일)을 입력하세요 (예: 3)', '3')
  if (!daysStr) return
  const days = parseInt(daysStr, 10)
  if (isNaN(days) || days <= 0) {
    alert('정지 기간이 올바르지 않습니다.')
    return
  }

  const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000
  const updated = [...banned, { authorId, author, expiresAt }]
  localStorage.setItem('bannedUsers', JSON.stringify(updated))
  alert(`✅ ${author || '익명 사용자'}가 ${days}일간 정지되었습니다.`)
}

  // ✅ 정지 해제
  const handleUnbanUser = (authorId: string) => {
    if (!confirm('이 사용자의 정지를 해제하시겠습니까?')) return
    const updated = bannedUsers.filter((b) => b.authorId !== authorId)
    setBannedUsers(updated)
    localStorage.setItem('bannedUsers', JSON.stringify(updated))
    alert('정지가 해제되었습니다.')
  }

  // ✅ 만료된 정지 자동 정리
  useEffect(() => {
    const now = Date.now()
    const active = bannedUsers.filter((b) => b.expiresAt > now)
    if (active.length !== bannedUsers.length) {
      setBannedUsers(active)
      localStorage.setItem('bannedUsers', JSON.stringify(active))
    }
  }, [bannedUsers])

  return (
    <div className="container">
      <h1>🚨 신고 내역 및 사용자 정지 관리</h1>

      {reports.length === 0 ? (
        <p>신고 내역이 없습니다.</p>
      ) : (
        <ul className="report-list">
          {reports.map((r, i) => (
            <li key={i} className="report-item">
              {r.commentId ? (
                <>
                  <strong>💬 댓글 신고 (게시글 ID: {r.postId})</strong>
                  <p><b>작성자:</b> {r.author || '익명'}</p>
                  <p><b>내용:</b> {r.text?.slice(0, 100) || '(없음)'}</p>
                </>
              ) : (
                <>
                  <strong>📄 게시글 신고</strong>
                  <p><b>제목:</b> {r.title || '(제목 없음)'}</p>
                  {r.detail && <p><b>신고 설명:</b> {r.detail}</p>}
                </>
              )}

              <p><b>사유:</b> {r.reason}</p>
              <p><b>신고일:</b> {new Date(r.createdAt).toLocaleString('ko-KR')}</p>

              <div className="report-actions" style={{ marginTop: '8px' }}>
                <button
                  onClick={() => handleDeleteReport(i)}
                  style={{
                    background: '#eee',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  🗑 삭제
                </button>

                {/* ✅ 정지 버튼 (익명도 가능) */}
                <button
                  onClick={() =>
                    handleBanUser(r.authorId, r.author, r.commentId, r.postId)
                  }
                  style={{
                    background: '#ffcccc',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    marginLeft: '8px',
                  }}
                >
                  ⛔ 사용자 정지
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🚫 정지된 사용자 목록 */}
      <div className="banned-users" style={{ marginTop: '30px' }}>
        <h2>🚫 정지된 사용자 목록</h2>
        {bannedUsers.length === 0 ? (
          <p>현재 정지된 사용자가 없습니다.</p>
        ) : (
          <ul>
  {bannedUsers.map((u, i) => {
    const diff = u.expiresAt - Date.now()
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

    let remaining = ''
    if (days > 0) remaining = `${days}일 ${hours}시간 남음`
    else if (hours > 0) remaining = `${hours}시간 ${minutes}분 남음`
    else remaining = `${minutes}분 남음`

    return (
      <li key={i}>
        <b>{u.author || '익명 사용자'}</b> — {remaining}
        <button
          onClick={() => handleUnbanUser(u.authorId)}
          style={{
            marginLeft: '10px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: '#d0f0d0',
          }}
        >
          🔓 해제
        </button>
      </li>
    )
  })}
</ul>

        )}
      </div>
    </div>
  )
}
