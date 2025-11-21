import { useParams, useNavigate } from "react-router-dom";
import { usePostsStore } from "./store/posts";
import "./WritePost.css";
import "./PostList.css";

const EMOTION_LABELS: Record<string, string> = {
  joy: "😊 기쁨",
  sad: "😢 슬픔",
  anger: "😠 분노",
  fear: "😨 두려움",
  love: "💕 사랑",
};

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);

  const navigate = useNavigate();
  const { posts, addStamp, deletePost } = usePostsStore();

  const post = posts.find((p) => p.id === postId);

  if (!post) return <p style={{ textAlign: "center" }}>글을 찾을 수 없습니다.</p>;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const userId = localStorage.getItem("userId");

  return (
<div className={`writepage-bg theme-${post.emotionCategory}`}>

      <div className="feed-wrapper">

        {/* 🔙 뒤로가기 (글자 없음, PostList와 동일 스타일) */}
        <div className="step2-header">
          <div className="step1-back-wrapper">
            <button className="step-back" onClick={() => navigate(-1)}>←</button>
          </div>
          <h3 className="step2-title">{EMOTION_LABELS[post.emotionCategory]}</h3>
        </div>

        {/* ----------------------------- */}
        {/* 카드 전체 (PostList 스타일) */}
        {/* ----------------------------- */}
        <div className="write-wrapper detail-appear">


          {/* 상단: 날짜 & 작성자 */}
          <div className="card-top" style={{ marginBottom: "14px" }}>

{/*
            <span className="emotion-pill">{EMOTION_LABELS[post.emotionCategory]}</span>
            */}
            <span className="card-date">{formatDate(post.createdAt)}</span>
          </div>

          {/* 작성자 */}
          {/*
          <div className="detail-author" style={{ fontSize: "13px", opacity: 0.75, marginBottom: "10px" }}>
            작성자: {post.author || "익명"}
</div>
*/}
          {/* 본문 */}
          <div className="card-content">
            <p className="post-content">{post.content}</p>
          </div>
            <div className="stamp-divider"></div>
          {/* 스탬프 */}
          {post.emotionStamps?.length > 0 && (
            <div className="stamp-list" style={{ marginTop: "16px" }}>
              {post.emotionStamps.map((s) => (
                <button
                  key={s.id}
                  className="stamp-item"
                  onClick={() => addStamp(post.id, s.id)}
                >
                  {s.label} &nbsp;
                  {(post.emotionStampCounts?.[s.id] ?? 0).toString()}
                </button>
              ))}
            </div>
          )}

          {/* LLM 요약 */}
          {post.summaryByLLM && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(8px)",
                fontSize: "14px",
                lineHeight: "1.45",
              }}
            >
              <strong>🧠 AI 해석</strong>
              <p style={{ marginTop: "6px" }}>{post.summaryByLLM}</p>
            </div>
          )}

          {/* -------------------------------------- */}
          {/* 하단 신고/삭제 — 카드 아래 작게 */}
          {/* -------------------------------------- */}
          <div
            style={{
              marginTop: "22px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "14px",
              fontSize: "13px",
              opacity: 0.75,
            }}
          >
            <button
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: "4px 6px",
              }}
              onClick={() => alert("🚨 신고 기능 준비 중입니다.")}
            >
              🚨
            </button>

            {/* 작성자에게만 삭제 버튼 표시 */}
            {post.authorId === userId && (
  <button
    style={{
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: "4px 6px",
    }}
    onClick={() => {
      if (window.confirm("정말 삭제하시겠습니까?")) {
        const userId = localStorage.getItem("userId");
        deletePost(post.id, userId!);
        navigate("/read");
      }
    }}
  >
    🗑️
  </button>
)}

          </div>
        </div>
      </div>
    </div>
    
  );
}
