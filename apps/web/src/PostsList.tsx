import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { usePostsStore } from "./store/posts";
import type { PostResponse } from "./lib/types";
import { authApi } from "./lib/authApi";  


import "./WritePost.css";
import "./PostList.css";



const EMOTION_LABELS: Record<string, string> = {
  joy: "😊 기쁨",
  anger: "😠 분노",
  sadness: "😢 슬픔",
  pleasure: "😄 즐거움",
  love: "💕 사랑",
  hate: "💔 미움",
  ambition: "🔥 야망",
};
export const FE_TO_BE: Record<string, string> = {
  joy: "JOY",
  anger: "ANGER",
  sadness: "SADNESS",
  pleasure: "PLEASURE",
  love: "LOVE",
  hate: "HATE",
  ambition: "AMBITION",
};


export default function PostsList() {
  /* ------------- 스크롤 복원 ------------- */
  useEffect(() => {
  try {
    const saved = sessionStorage.getItem("scroll-pos");
    if (saved) window.scrollTo(0, parseInt(saved, 10));
  } catch (e) {
    console.warn("⚠ sessionStorage 접근 불가:", e);
  }
}, []);


  const navigate = useNavigate();
  const { loadPosts, clickButton, reportPost } = usePostsStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [emotion, setEmotion] = useState<string>("JOY");

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);

  // 서버 기반 데이터
  const [items, setItems] = useState<PostResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoading = useRef(false);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const emotionFromUrl = params.get("emotion"); // "joy" 등

  const [currentUser, setCurrentUser] = useState<any>(null);
  // 로그인 사용자 로드
useEffect(() => {
  const saved = localStorage.getItem("user");
  if (saved) setCurrentUser(JSON.parse(saved)); // 성능/속도 가장 안정적
  else {
    authApi.getCurrentUser()
      .then(u => setCurrentUser(u))
      .catch(() => setCurrentUser(null));
  }
}, []);
useEffect(() => {
  // 뒤로가기 방지 + 메인으로 리다이렉트
  const handlePopState = () => {
    if (window.location.pathname === "/read") {
      navigate("/", { replace: true });
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, [navigate]);


  // URL 감정 → step 전환 + 서버에서 불러오기
  useEffect(() => {
    if (emotionFromUrl) {
      setEmotion(emotionFromUrl);
      setStep(2);

      // reset
      setItems([]);
      setPage(0);
      setHasMore(true);

      const beEmotion = FE_TO_BE[emotionFromUrl];
      loadPage(0, beEmotion);
    } else {
      setStep(1);
    }
  }, [emotionFromUrl]);
  useEffect(() => {
  if (!emotionFromUrl) {
    navigate("/read", { replace: true });
  }
}, [emotionFromUrl, navigate]);

 /* -------------------- 서버 페이지 로드 -------------------- */
  async function loadPage(loadPageNum: number, emo: string) {
    if (isLoading.current || !hasMore) return;


    isLoading.current = true;

    try {
      const res = await loadPosts({
        emotion: emo,
        page: loadPageNum,
        size: 8,
      });

      // ⭐ page 0 → items를 갈아끼운다
      if (loadPageNum === 0) {
        setItems(res.items);
      } else {
        // ⭐ 페이지 1 이후 → 누적
        setItems((prev) => [...prev, ...res.items]);
      }

      // ⭐ 다음 페이지 존재 여부 체크
      setHasMore(loadPageNum + 1 < res.totalPages);

      // ⭐ 현재 페이지 갱신
      setPage(loadPageNum);
    } finally {
      isLoading.current = false;
    }
  }

   /* -------------------- 무한 스크롤 옵저버 -------------------- */
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && hasMore && !isLoading.current) {
    const fe = emotionFromUrl ?? emotion;    // 두 값 중 확실한 emotion
    const emo = FE_TO_BE[fe];                // BE 변환
    loadPage(page + 1, emo);
  }
});


    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [emotion, page, hasMore]);

  // STEP1 → STEP2 이동
  const chooseEmotion = (emo: string) => {
    setEmotion(FE_TO_BE[emo]); // "JOY"
    navigate(`/read?emotion=${emo}`);
  };

  // 메뉴 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".menu-popup") && !target.closest(".menu-btn")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className={`writepage-bg ${step === 1 ? "theme-default" : `theme-${emotion}`}`}>
      <div className="write-wrapper">

        {/* ----------------------------- */}
        {/* STEP 1 — 감정 선택 화면 */}
        {/* ----------------------------- */}
        <div className={`step step1 ${step === 1 ? "active" : "hidden"}`}>
          <div className="step2-header">
            <div className="step1-back-wrapper">
              <button className="step-back" onClick={() => navigate(-1)}>←</button>
            </div>
            <h3>읽고 싶은 감정을 선택하세요</h3>
          </div>

          <p className="subtitle">해당 감정으로 작성된 글만 보여드립니다.</p>

          <div className="emotion-buttons">
  <button data-emotion="joy" onClick={() => chooseEmotion("joy")}>😊 기쁨</button>
  <button data-emotion="anger" onClick={() => chooseEmotion("anger")}>😠 분노</button>
  <button data-emotion="sadness" onClick={() => chooseEmotion("sadness")}>😢 슬픔</button>
  <button data-emotion="pleasure" onClick={() => chooseEmotion("pleasure")}>😄 즐거움</button>
  <button data-emotion="love" onClick={() => chooseEmotion("love")}>💕 사랑</button>
  <button data-emotion="hate" onClick={() => chooseEmotion("hate")}>💔 미움</button>
  <button data-emotion="ambition" onClick={() => chooseEmotion("ambition")}>🔥 야망</button>
</div>


        </div>

        {/* ----------------------------- */}
        {/* STEP 2 — 감정별 글 목록 UI */}
        {/* ----------------------------- */}
        <div className={`step step2 fade-in ${step === 2 ? "active" : "hidden"}`}>

          <div className="step2-header">
            <div className="step1-back-wrapper">
              <button
  className="step-back"
  onClick={() => navigate("/read", { replace: true })}
>
  ←
</button>

            </div>
            <h3 className="step2-title">
              {EMOTION_LABELS[emotion]}의 기록들
            </h3>
          </div>

          {items.length === 0 ? (
  <p style={{ textAlign: "center", opacity: 0.7 }}>아직 글이 없어요.</p>
) : (
  items
    .filter((post) => !post.hidden)
    .map((post) => {
      const listEmotion = post.emotion
        ? post.emotion.toLowerCase()
        : (emotionFromUrl ?? "joy");

      return (
        <div
          key={post.id}
          className="write-wrapper card-appear"
          style={{ marginBottom: "32px" }}
        >
          <div className="card-controls">
  <button
    className="menu-btn"
    onClick={(e) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === post.id ? null : post.id);
    }}
  >
    ⋮
  </button>

  {openMenuId === post.id && (
    <div className="menu-popup">
      {/* 🔗 URL 복사 */}
<button
  onClick={() => {
    navigator.clipboard.writeText(
      `${window.location.origin}/post/${listEmotion}/${post.id}`
    );
    alert("URL이 복사되었습니다.");
  }}
>
  🔗 URL 복사
</button>
      {/* 🔥 신고 기능 */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          if (!window.confirm("정말 신고하시겠습니까?")) return;

          try {
            await reportPost(post.id);

            // 숨김 여부 확인
            const updated = await fetch("/api/posts/" + post.id)
              .then(r => r.json())
              .catch(() => null);

            if (!updated || updated.hidden) {
              setItems(prev => prev.filter(p => p.id !== post.id));
              setErrorPopup("🚨 신고 누적 → 글이 숨김 처리되었습니다.");
              return;
            }

            setErrorPopup("🚨 신고 완료되었습니다.");
          
          } catch (e:any) {
            let msg = "신고 실패";

            try { msg = JSON.parse(e.message).message }
            catch { msg = e?.message || msg }

            setErrorPopup(msg);
          }
        }}
      >
        🚨 신고하기
      </button>

      

{/* 🗑 내 글 삭제 버튼 (로그인 유저 == 작성자일 때만) */}
{currentUser?.username === post.authorName && (
  <button
  className="delete-btn"
  onClick={async (e)=>{
    e.stopPropagation();
    if(!confirm("정말 삭제하시겠습니까?")) return;
    try{
      await usePostsStore.getState().deletePost(post.id);
      setItems(prev => prev.filter(p=>p.id !== post.id)); 
      setErrorPopup("🗑 삭제 완료");
    }catch(err){
      setErrorPopup("삭제 실패");
    }
  }}
>
  <span className="icon-trash">🗑</span> 내 글 삭제
</button>

)}

    
    </div>
  )}
</div>


          <Link
            to={`/post/${listEmotion}/${post.id}`}
            className="card-link"
            onClick={() => {
              try {
                sessionStorage.setItem("scroll-pos", String(window.scrollY));
              } catch {}
            }}
          >
            <div className="card-content">
              <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
            </div>
          </Link>

          <div className="stamp-divider"></div>

                  <div className="stamp-list">
          {post.buttons.map((btn) => (
            <button
              key={btn.buttonType}
              className="stamp-item"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const updated = await clickButton(post.id, btn.buttonType);

                  // 리스트 UI에 즉시 반영
                  setItems(prev =>
                    prev.map(p =>
                      p.id === post.id ? { ...p, buttons: updated.buttons } : p
                    )
                  );
                }  catch (e:any){
  let msg = "스탬프 반영 실패";

  try {
    const parsed = JSON.parse(e.message);
    msg = parsed.message ?? msg;
  } catch {
    msg = e?.response?.data?.message || e?.message || msg;
  }

  setErrorPopup(msg);
}

              }}
            >
              {btn.label} {btn.clickCount}
            </button>
          ))}
        </div>

        </div>
      );
    })
)}


          
          {/* 무한스크롤 로더 */}
          <div ref={loaderRef} style={{ height: "50px" }}></div>
        </div>
      </div>
      {/* 플로팅 버튼 */}
          <div className="floating-buttons">
            <button
              className="floating-btn"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            >
              ↑
            </button>

            <button
              className="floating-btn"
              onClick={() => window.location.reload()}
            >
              ↻
            </button>
          </div>

      {errorPopup && (
  <div className="modal-overlay" onClick={() => setErrorPopup(null)}>
    <div className="modal-box" onClick={(e)=>e.stopPropagation()}>
      <h3>⚠ 알림</h3>
      <p>{errorPopup}</p>
      <button className="modal-btn" onClick={()=>setErrorPopup(null)}>확인</button>
    </div>
  </div>
)}

    </div>
  );
}
