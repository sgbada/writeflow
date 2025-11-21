
import { usePostsStore } from "./store/posts";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./WritePost.css"; // ⭐ WritePost UI 통일
import "./PostList.css";



// 감정 라벨
const EMOTION_LABELS: Record<string, string> = {
  joy: "😊 기쁨",
  sad: "😢 슬픔",
  anger: "😠 분노",
  fear: "😨 두려움",
  love: "💕 사랑",
};

export default function PostsList() {
  /* ------------- 스크롤 복원 ------------- */
  useEffect(() => {
    const saved = sessionStorage.getItem("scroll-pos");
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }
  }, []);

  const navigate = useNavigate();
  const { posts, addStamp } = usePostsStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [emotion, setEmotion] = useState<string>("joy");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // ---- 무한 스크롤 상태 ----
  const [visibleCount, setVisibleCount] = useState(8);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // 감정별 필터
  const filtered = posts
    .filter((p) => p.emotionCategory === emotion)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const visiblePosts = filtered.slice(0, visibleCount);

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
  const location = useLocation();
const params = new URLSearchParams(location.search);

const emotionFromUrl = params.get("emotion"); // joy, sad, anger ...

useEffect(() => {
  if (emotionFromUrl) {
    setEmotion(emotionFromUrl);
    setStep(2);
  } else {
    setStep(1);
  }
}, [emotionFromUrl]);

  // ==== 무한 스크롤 옵저버 ====
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 6);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  // STEP1 → STEP2 이동
  const chooseEmotion = (emo: string) => {
    navigate(`/read?emotion=${emo}`);
  };
// --- 메뉴 외부 클릭 시 자동 닫힘 ---
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".menu-popup") && !target.closest(".menu-btn")) {
      setOpenMenuId(null);
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

  return (
    <div className={`writepage-bg ${step === 1 ? "theme-default" : `theme-${emotion}`}`}>
      <div className="feed-wrapper">
        
        {/* ---------------------------------- */}
        {/* STEP 1 — WritePost의 감정 선택 화면 그대로 */}
        {/* ---------------------------------- */}
        <div className={`step step1 ${step === 1 ? "active" : "hidden"}`}>
          <div className="step2-header">
            <div className="step1-back-wrapper">
  <button className="step-back" onClick={() => navigate(-1)}>←</button>
  </div>
  <h3>읽고 싶은 감정을 선택하세요</h3>
</div>
          <p className="subtitle">해당 감정으로 작성된 글만 보여드립니다.</p>

          <div className="emotion-buttons">
            <button onClick={() => chooseEmotion("joy")}>😊 기쁨</button>
            <button onClick={() => chooseEmotion("sad")}>😢 슬픔</button>
            <button onClick={() => chooseEmotion("anger")}>😠 분노</button>
            <button onClick={() => chooseEmotion("fear")}>😨 두려움</button>
            <button onClick={() => chooseEmotion("love")}>💕 사랑</button>
          </div>
        </div>

        {/* ---------------------------------- */}
        {/* STEP 2 — 감정별 카드 리스트 (UI 통일 + 애니메이션) */}
        {/* ---------------------------------- */}
        <div className={`step step2 fade-in ${step === 2 ? "active" : "hidden"}`}>
          
          <div className="step2-header">
            <div className="step1-back-wrapper">
  <button
    className="step-back"
    onClick={() => navigate("/read")}
  >
    ←
  </button>
</div>
  <h3 className="step2-title">
    {EMOTION_LABELS[emotion]}의 기록들
  </h3>
</div>



          {visiblePosts.length === 0 ? (
            <p style={{ textAlign: "center", opacity: 0.7 }}>아직 글이 없어요.</p>
          ) : (
            visiblePosts.map((post) => (
              <div key={post.id} className="write-wrapper card-appear" style={{ marginBottom: "32px" }}>
                
                {/* 카드 상단 */}
                <div className="card-controls" style={{ marginBottom: "14px" }}>

                  <button
                    className="menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === post.id ? null : post.id));
                    }}
                  >
                    ⋮
                  </button>

                  {openMenuId === post.id && (
                    <div className="menu-popup">
                      <button onClick={() => alert("신고 기능 준비 중입니다.")}>🚨 신고하기</button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/post/${post.id}`
                          );
                          alert("URL이 복사되었습니다.");
                        }}
                      >🔗 URL 복사</button>
                    </div>
                  )}
                </div>

                <Link
  to={`/post/${post.id}`}
  className="card-link"
  onClick={(e) => {
    // 뒤로 왔을 때 복원할 스크롤 위치 저장
    sessionStorage.setItem("scroll-pos", String(window.scrollY));
  }}
>
  <div className="card-content">
    <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
  </div>
</Link>

                  
{/* 🔹 본문 아래 구분선 */}
<div className="stamp-divider"></div>
                {/* 스탬프 */}
                {post.emotionStamps?.length > 0 && (
                  <div className="stamp-list" style={{ marginTop: "16px" }}>
                    {post.emotionStamps.map((s) => (
                      <button
                        key={s.id}
                        className="stamp-item"
                        onClick={(e) => {
                          e.preventDefault();
                          addStamp(post.id, s.id);
                        }}
                      >
                        {s.label} &nbsp;
                        {(post.emotionStampCounts?.[s.id] ?? 0).toString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* 무한 스크롤 로더 */}
          <div ref={loaderRef} style={{ height: "40px" }}></div>
        </div>
      </div>
    </div>
  );
}
