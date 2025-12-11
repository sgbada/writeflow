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
    if (!stampInput.trim()) {
      alert("스탬프 내용을 입력해주세요.");
      return;
    }

    if (stampInput.length > 6) {
      alert("스탬프는 최대 6자까지 입력 가능합니다.");
      return;
    }

    if (customStamps.length >= 5) {
      alert("스탬프는 최대 5개까지 추가할 수 있습니다.");
      return;
    }

    const newStamp: CustomStamp = {
      id: Date.now().toString(),
      label: stampInput.trim()
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
      alert("감정을 먼저 선택해 주세요.");
      setStep(1);
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (customStamps.length === 0) {
      alert("최소 1개 이상의 스탬프를 추가해주세요.");
      return;
    }

    // ⚠️ 백엔드 API가 준비되기 전까지는 임시로 기본 버튼 사용
    // TODO: 백엔드에서 사용자 정의 스탬프 API 지원 시 아래 코드로 교체
    // const payload = {
    //   content: content,
    //   emotion: emotionCategory.toUpperCase(),
    //   customButtons: customStamps.map(s => s.label)
    // };

    // 현재는 기존 API 형식 유지 (EMPATHY, COMFORT 등)
    alert("⚠️ 백엔드 API 준비 중입니다.\n사용자 정의 스탬프 기능은 곧 사용 가능합니다.");
    
    // 임시: 기본 버튼으로 대체하여 제출
    const payload = {
      content: content,
      emotion: emotionCategory.toUpperCase(),
      buttons: ["EMPATHY", "COMFORT", "HAPPY"] // 임시 기본값
    };

    console.log('📝 입력된 사용자 정의 스탬프:', customStamps.map(s => s.label));
    console.log('📤 실제 전송 데이터 (임시):', payload);

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
          <h2>오늘 당신의 감정은?</h2>
          <p className="subtitle">하루의 분위기를 가장 잘 표현하는 감정을 선택해 주세요.</p>

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
          <h3>당신의 감정을 기록해보세요</h3>

          <div className="write-controls">
            <h4>감정 스탬프 추가 (최소 1개 ~ 최대 5개, 각 6자 이내)</h4>
          </div>

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

            {/* 스탬프 입력 영역 */}
            <div className="stamp-input-area" style={{ marginTop: "20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={stampInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 6) {
                      setStampInput(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomStamp();
                    }
                  }}
                  placeholder="스탬프 입력 (최대 6자)"
                  maxLength={6}
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
                {stampInput.length}/6자 • {customStamps.length}/5개
              </div>
            </div>

            {/* 추가된 스탬프 목록 */}
            {customStamps.length > 0 && (
              <div className="button-select-grid" style={{ marginBottom: "20px" }}>
                {customStamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className="stamp-select-btn selected"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      paddingRight: "8px"
                    }}
                  >
                    <span>{stamp.label}</span>
                    <button
                      type="button"
                      onClick={() => removeStamp(stamp.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "0 4px",
                        opacity: 0.7
                      }}
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
          <h2 style={{ marginBottom: "20px" }}>✓ 등록이 완료되었습니다.</h2>

          <p style={{ opacity: 0.8, marginBottom: "32px" }}>
            소중한 감정을 기록해주셔서 감사합니다.
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
    </div>
  );
}