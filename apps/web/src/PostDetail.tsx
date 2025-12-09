import { useParams, useNavigate } from "react-router-dom";
import { usePostsStore } from "./store/posts";
import { useEffect, useState } from "react";
import { authApi } from "./lib/authApi"; 
import "./WritePost.css";
import "./PostList.css";
import "./PostDetail.css";

export default function PostDetail() {
  const { emotion, id } = useParams<{ emotion: string; id: string }>();
const postId = Number(id);


  const navigate = useNavigate();
const { getPost, clickButton, deletePost, reportPost } = usePostsStore();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
  authApi.getCurrentUser()
    .then(u => setCurrentUser(u))
    .catch(() => setCurrentUser(null));
}, []);
useEffect(() => {
   setPost(null);
  setLoading(true);

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
// 삼점 메뉴 외부 클릭 시 닫힘 처리
useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".menu-popup") && !target.closest(".menu-btn-detail")) {
      setMenuOpen(false);
    }
  };

  document.addEventListener("click", handleClick);
  return () => document.removeEventListener("click", handleClick);
}, []);



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
    setPost((prev:any) => ({ ...prev, buttons: updated.buttons }));
  } catch (e:any) {

    let msg = "오류가 발생했습니다.";

    try {
      // message에 JSON 문자열이 들어온 경우 자동 처리
      const parsed = JSON.parse(e.message);
      msg = parsed.message || msg;
    } catch {
      msg = e?.response?.data?.message || e?.message || msg;
    }

    setErrorPopup(msg);
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
  
  const onReport = async () => {
  if (!window.confirm("정말 신고하시겠습니까?")) return;

  try {
    await reportPost(post.id);
    const updated = await getPost(post.id).catch(() => null);

    // 1) 서버에서 이미 숨김 처리된 경우
    if (!updated || updated.hidden === true) {
      setErrorPopup("🚨 신고가 누적되어 글이 숨김 처리되었습니다.");
      setTimeout(()=> navigate("/read"), 1500); // 1.5초 뒤 목록으로 자동 이동
      return;
    }

    // 2) 숨김 전 일반 신고
    setPost(updated);
    setErrorPopup("🚨 신고 완료되었습니다.");

  } catch (e:any) {
    let msg = "신고 실패";

    try {
      const parsed = JSON.parse(e.message);
      msg = parsed.message ?? msg;
    } catch {
      msg = e?.response?.data?.message || e.message || msg;
    }

    setErrorPopup(msg);
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

        {/* 카드 상단 날짜 + 메뉴(⋮) */}
<div className="card-top" style={{ 
  marginBottom: "14px",
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center"
}}>
  <span className="card-date">{formatDate(post.createdAt)}</span>

  {/* ⋮ 메뉴 버튼 */}
  <button 
    className="menu-btn-detail"
    onClick={() => setMenuOpen(prev => !prev)}
  >⋮</button>

  {menuOpen && (
    <div className="menu-popup detail-menu">
      <button onClick={()=>{
        navigator.clipboard.writeText(window.location.href);
        setErrorPopup("🔗 URL 복사 완료");
      }}>🔗 URL 공유</button>

      <button onClick={onReport}>🚨 신고</button>

      {currentUser?.username === post.authorName && (
        <button className="delete-btn" onClick={onDelete}>
          🗑 내 글 삭제
        </button>
      )}
    </div>
  )}
</div>


{/* 본문 */}
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


        </div>
        {errorPopup && (
      <div className="modal-overlay" onClick={() => setErrorPopup(null)}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h3>⚠ 알림</h3>
          <p>{errorPopup}</p>
          <button className="modal-btn" onClick={() => setErrorPopup(null)}>확인</button>
        </div>
      </div>
    )}
      </div>
      
    </div>
    
  );
}
