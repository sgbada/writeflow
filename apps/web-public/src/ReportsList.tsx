import { useEffect, useState } from 'react'

interface Report {
  postId: number
  title: string
  reason: string
  detail: string
  createdAt: string
}

export default function ReportsList() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('reports') || '[]')
    setReports(saved)
  }, [])

  return (
    <div className="container">
      <h1>🚨 신고 내역</h1>
      {reports.length === 0 ? (
        <p>신고 내역이 없습니다.</p>
      ) : (
        <ul className="report-list">
          {reports.map((r, i) => (
            <li key={i} className="report-item">
              <strong>📄 {r.title}</strong>
              <p><b>사유:</b> {r.reason}</p>
              {r.detail && <p><b>내용:</b> {r.detail}</p>}
              <p><b>신고일:</b> {new Date(r.createdAt).toLocaleString()}</p>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
