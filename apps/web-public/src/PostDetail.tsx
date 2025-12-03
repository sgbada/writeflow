import { useParams, useNavigate } from "react-router-dom";
import { usePostsStore } from "./store/posts";
import { useEffect, useState } from "react";
import "./WritePost.css";
import "./PostList.css";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);

  const navigate = useNavigate();

  const { getPost, clickButton, deletePost } = usePostsStore();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 서버에서 글 단건 조회
  useEffect(() => {
    async function load() {
      try {
        const data = await getPost(postId);
        setPost(data);
      } catch (e) {
        alert("글을 불러오는 데 실패했습니다.");
      }
      setLoading(false);
    }
    load();
  }, [postId]);

  if (loading) return <p style={{ textAlign: "center" }}>불러오는 중...</p>;
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

  const onClickButton = async (type: string) => {
    try {
      const updated = await clickButton(postId, type);
      setPost((prev: any) => ({ ...prev, buttons: updated.buttons }));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deletePost(post.id);
      navigate("/read");
    } catch (e: any) {
      alert("삭제 실패: " + e.message);
    }
  };

  const userName = localStorage.getItem("username");

  return (
    <div className={`writepage-bg theme-${post.emotion.toLowerCase()}`}>
      <div className="feed-wrapper">

        {/* 뒤로가기 */}
        <div className="step2-header">
          <div className="step1-back-wrapper">
            <button className="step-back" onClick={() => navigate(-1)}>←</button>
          </div>
          <h3 className="step2-title">{post.emotionLabel}</h3>
        </div>

        <div className="write-wrapper detail-appear">

          <div className="card-top" style={{ marginBottom: "14px" }}>
            <span className="card-date">{formatDate(post.createdAt)}</span>
          </div>

          <div className="card-content">
            <p className="post-content">{post.content}</p>
          </div>

          <div className="stamp-divider"></div>

          {/* 버튼(스탬프) */}
          {post.buttons.length > 0 && (
            <div className="stamp-list" style={{ marginTop: "16px" }}>
              {post.buttons.map((b: any) => (
                <button
                  key={b.buttonType}
                  className="stamp-item"
                  onClick={() => onClickButton(b.buttonType)}
                >
                  {b.label} &nbsp; {b.clickCount}
                </button>
              ))}
            </div>
          )}

          {/* AI 해석 */}
          {post.llmReply && (
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
              <p style={{ marginTop: "6px" }}>{post.llmReply}</p>
            </div>
          )}

          {/* 신고 / 삭제 */}
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

            {/* 작성자만 삭제 가능 */}
            {post.authorName === userName && (
              <button
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                }}
                onClick={onDelete}
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
