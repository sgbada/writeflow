import "./WritePost.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePostsStore } from "./store/posts";
import { authApi } from './lib/authApi'

interface CustomStamp {
  id: string;
  label: string;
}

export default function WritePost() {
  const navigate = useNavigate();
  useEffect(() => {
      if (!authApi.isAuthenticated()) {
        navigate('/login')
      }
    }, [navigate])

  const { createPost } = usePostsStore();

  // 두 단계 UI
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [lastPostId, setLastPostId] = useState<number | null>(null);
  // 글 정보
  const [emotionCategory, setEmotionCategory] = useState("");
  const [content, setContent] = useState("");
  const [stampInput, setStampInput] = useState("");
  const [customStamps, setCustomStamps] = useState<CustomStamp[]>([]);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);



  const MAX_CHAR = 220;
  const countGraphemes = (text: string) => {
    return [...text].length;
  };

  // textarea와 동일한 스타일을 가진 숨겨진 div로 높이 계산
  const updateHeight = (value: string) => {
    const mirror = document.getElementById("textarea-mirror");
    if (!mirror) return;

    mirror.textContent = value + "\u200b";

    const newHeight = mirror.scrollHeight;
    const textarea = document.getElementById("textarea") as HTMLTextAreaElement;
    if (textarea) textarea.style.height = newHeight + "px";
  };

  useEffect(() => {
    // 페이지 진입 시 emotionCategory 초기화
    setEmotionCategory("");
    setStep(1);
  }, []);

  // 스탬프 추가 함수
  const addCustomStamp = () => {
    const trimmedInput = stampInput.trim();
    
    if (!trimmedInput) {
      setErrorPopup("스탬프 내용을 입력해 주세요.");
      return;
    }

    // ✅ 7자 제한
    if (trimmedInput.length > 7) {
      setErrorPopup("스탬프는 최대 7자까지 입력할 수 있습니다.");
      return;
    }

    if (customStamps.length >= 5) {
      setErrorPopup("스탬프는 최대 5개까지 추가할 수 있습니다.");
      return;
    }

    // ✅ 중복 체크 (대소문자 구분 없이)
    const isDuplicate = customStamps.some(
      stamp => stamp.label.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (isDuplicate) {
      setErrorPopup("이미 추가한 스탬프입니다.");
      return;
    }

    const newStamp: CustomStamp = {
      id: Date.now().toString(),
      label: trimmedInput
    };

    setCustomStamps([...customStamps, newStamp]);
    setStampInput("");
  };

  // 스탬프 삭제 함수
  const removeStamp = (id: string) => {
    setCustomStamps(customStamps.filter(s => s.id !== id));
  };

  // ---------------------------------------------------
  // 🔥 뒤로가기 버튼 (Step2 → Step1)
  // ---------------------------------------------------
  const goBackStep = () => {
    setCustomStamps([]);
    setStep(1);
  };

  // ---------------------------------------------------
  // 🔥 최종 제출
  // ---------------------------------------------------
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!emotionCategory) {
      setErrorPopup("감정을 먼저 선택해 주세요.");
      setStep(1);
      return;
    }

    if (!content.trim()) {
      setErrorPopup("내용을 입력해 주세요.");
      return;
    }

    if (customStamps.length === 0) {
      setErrorPopup("감정을 표현할 스탬프를 최소 1개 이상 추가해 주세요.");
      return;
    }

    const payload = {
      content: content,
      emotion: emotionCategory.toUpperCase(),
      buttons: customStamps.map(s => s.label)
    };

    try {
      const newPost = await createPost(payload);
      console.log('🎉 게시글 생성 완료:', newPost);

      const newPostId = newPost.id;
      setLastPostId(newPostId);

      setStep(3);

      // 초기화
      setContent("");
      setCustomStamps([]);
      setStampInput("");

    } catch (err: any) {
      console.error('❌ 게시글 생성 오류:', err);
      alert("게시글 저장 실패: " + (err.message || "알 수 없는 오류"));
    }
  };

  const chooseEmotion = (emotion: string) => {
    setEmotionCategory(emotion);
    setCustomStamps([]);        // 감정 바뀌면 스탬프 초기화
    setStampInput("");
    setTimeout(() => setStep(2), 200);
  };

  return (
    <div className={`writepage-bg ${step === 1 ? "theme-default" : `theme-${emotionCategory}`}`}>
      <div className="write-wrapper">

        {/* STEP 1 - 감정 선택 */}
        <div className={`step step1 ${step === 1 ? "active" : "hidden"}`}>
          <button className="step-back" onClick={() => navigate(-1)}>←</button>
          <h2>지금, 어떤 마음이 드시나요?</h2>
          <p className="subtitle">오늘 당신의 마음을 가장 닮은 감정을 골라주세요.</p>

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

        {/* STEP 2 - 글 작성 */}
        <div className={`step step2 ${step === 2 ? "active" : "hidden"}`}>
          <h3>당신의 감정을 기록해 보세요</h3>

          

          <form onSubmit={handleSubmit} className="write-form">
            <div className="textarea-wrapper">
              <div id="textarea-mirror" className="textarea-mirror"></div>

              <textarea
                id="textarea"
                className="textarea"
                value={content}
                onInput={(e) => {
                  const value = (e.target as HTMLTextAreaElement).value;

                  if (countGraphemes(value) <= MAX_CHAR) {
                    setContent(value);
                  }
                  updateHeight(value);
                }}
                placeholder="지금 느끼는 감정을 자유롭게 남겨보세요… (최대 220자)"
              />
            </div>

            <div className="char-counter">
              {countGraphemes(content)}/{MAX_CHAR}
            </div>
            <div className="write-controls">
            <p className="stamp-guide">
              감정 스탬프 추가 (최소 1개 ~ 최대 5개, 각 7자 이내)
            </p>
          </div>


            {/* 스탬프 입력 영역 */}
            <div className="stamp-input-area">
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={stampInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    // ✅ 7자로 변경
                    if (val.length <= 7) {
                      setStampInput(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomStamp();
                    }
                  }}
                  placeholder="스탬프 입력 (최대 7자)"
                  maxLength={7}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0,0,0,0.1)",
                    fontSize: "14px",
                    background: "rgba(255,255,255,0.7)"
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomStamp}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background: "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  추가
                </button>
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "6px" }}>
                {stampInput.length}/7자 • {customStamps.length}/5개
              </div>
            </div>

            {/* 추가된 스탬프 목록 */}
            {customStamps.length > 0 && (
              <div className="button-select-grid" style={{ marginBottom: "20px" }}>
                {customStamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className={`custom-stamp-item theme-${emotionCategory}`}
                >
                  <span>{stamp.label}</span>
                  <button
                    type="button"
                    className="stamp-remove-btn"
                    onClick={() => removeStamp(stamp.id)}
                  >
                    ×
                  </button>
                </div>
              ))}

              </div>
            )}

            <button type="submit" className="submit-btn">등록하기</button>
          </form>
        </div>

        {step === 2 && (
          <div className="write-bottom-inside">
            <button className="back-btn" onClick={goBackStep}>←</button>
          </div>
        )}

        {/* STEP 3 - 등록 완료 화면 */}
        <div className={`step step3 ${step === 3 ? "active" : "hidden"}`} style={{ textAlign: "center", paddingTop: "40px", paddingBottom: "60px" }}>
          <h2 style={{ marginBottom: "20px" }}>✨ 마음을 꺼내 주셔서 고마워요.</h2>

          <p className="complete-message">
            <span>당신의 감정은 소중하게 간직될 거예요.</span>
            <span>이 순간을 함께해 주셔서 감사합니다.</span>
          </p>


          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              className="submit-btn"
              onClick={() => {
                navigate('/profile?tab=posts');
              }}
            >
              내 글 읽기
            </button>

            <button
              className="submit-btn"
              onClick={() => navigate("/read")}
              style={{ background: "var(--accent-bg)", color: "var(--primary)" }}
            >
              다른 사람 글 읽기
            </button>
          </div>
        </div>
             
      </div>
       {errorPopup && (
  <div className="modal-overlay" onClick={() => setErrorPopup(null)}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h3>⚠ 알림</h3>
      <p>{errorPopup}</p>
      <button className="modal-btn" onClick={() => setErrorPopup(null)}>
        확인
      </button>
    </div>
  </div>
)}

    </div>
  );
}