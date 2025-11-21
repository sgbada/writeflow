import "./WritePost.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePostsStore } from "./store/posts";

// 🔹 임시 저장 키
const TEMP_KEY = "writeflow_temp_post";

export default function WritePost() {
  const navigate = useNavigate();
  const { addPost } = usePostsStore();

  // 두 단계 UI
  const [step, setStep] = useState<1 | 2 | 3>(1);


  // 글 정보
  const [emotionCategory, setEmotionCategory] = useState("");
  const [content, setContent] = useState("");
  const [stampInput, setStampInput] = useState("");
  const [emotionStamps, setEmotionStamps] = useState<EmotionStamp[]>([]);


  // 임시 저장 여부
  const [isSaved, setIsSaved] = useState(true);

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

  // ---------------------------------------------------
  // 🔥 1) 임시 저장된 내용 불러오기
  // ---------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem(TEMP_KEY);
    if (!saved) return;

    try {
      const temp = JSON.parse(saved);
      if (temp.content || temp.emotionCategory || temp.emotionStamps?.length) {
        setEmotionCategory(temp.emotionCategory || "");
        setContent(temp.content || "");
        setEmotionStamps(temp.emotionStamps || []);
        setStep(1);
      }
    } catch {}
  }, []);

  // ---------------------------------------------------
  // 🔥 2) 자동 임시 저장 (10초마다)
  // ---------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (!content && !emotionCategory && emotionStamps.length === 0) return;

      localStorage.setItem(
        TEMP_KEY,
        JSON.stringify({
          step,
          emotionCategory,
          content,
          emotionStamps,
        })
      );
      setIsSaved(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [step, emotionCategory, content, emotionStamps]);

  // ---------------------------------------------------
  // 🔥 3) beforeunload 경고
  // ---------------------------------------------------
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isSaved && (content || emotionStamps.length > 0)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isSaved, content, emotionStamps]);

  // ---------------------------------------------------
  // 🔥 스탬프 추가
  // ---------------------------------------------------
  const addStamp = () => {
    const clean = stampInput.trim();
    if (!clean) return;
    if ([...clean].length > 10) {
    alert("스탬프는 최대 10자까지 입력할 수 있습니다.");
    return;
  }
    if (emotionStamps.length >= 5) {
      alert("스탬프는 최대 5개까지 가능합니다.");
      return;
    }
    setEmotionStamps([
  ...emotionStamps,
  { id: crypto.randomUUID(), label: clean }
]);


    setStampInput("");
    setIsSaved(false);
  };

  // ---------------------------------------------------
  // 🔥 더미 LLM 요약
  // ---------------------------------------------------
  const fakeLLMSummary = (text: string) => {
    if (text.includes("슬프") || text.includes("힘들"))
      return "마음이 무거운 하루였네요.";
    if (text.includes("기쁨") || text.includes("좋아"))
      return "행복한 감정이 느껴져요.";
    return "당신의 감정이 잘 기록되었어요.";
  };

  // ---------------------------------------------------
  // 🔥 뒤로가기 버튼 (Step2 → Step1)
  // ---------------------------------------------------
  const goBackStep = () => {
    if (!isSaved && (content || emotionStamps.length > 0)) {
      const ok = window.confirm("임시 저장되지 않은 내용이 있습니다. 돌아갈까요?");
      if (!ok) return;
    }
    setStep(1);
  };

  // ---------------------------------------------------
  // 🔥 임시 저장 버튼
  // ---------------------------------------------------
  const saveTemp = () => {
    localStorage.setItem(
      TEMP_KEY,
      JSON.stringify({
        step,
        emotionCategory,
        content,
        emotionStamps,
      })
    );
    setIsSaved(true);
    alert("임시 저장되었습니다!");
  };

  // ---------------------------------------------------
  // 🔥 최종 제출
  // ---------------------------------------------------
  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    addPost({
      content,
      emotionCategory,
      emotionStamps,
      summaryByLLM: fakeLLMSummary(content),
    });

    // 제출 후 임시 저장 삭제
    localStorage.removeItem(TEMP_KEY);
setContent("");
  setEmotionStamps([]);
  setStampInput("");

  setIsSaved(true);

  setStep(3);
  localStorage.setItem("last_post_id", newPostId);

  };

  const chooseEmotion = (emotion: string) => {
    setEmotionCategory(emotion);
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
  <button data-emotion="sad" onClick={() => chooseEmotion("sad")}>😢 슬픔</button>
  <button data-emotion="anger" onClick={() => chooseEmotion("anger")}>😠 분노</button>
  <button data-emotion="fear" onClick={() => chooseEmotion("fear")}>😨 두려움</button>
  <button data-emotion="love" onClick={() => chooseEmotion("love")}>💕 사랑</button>
</div>

        </div>
        

        {/* STEP 2 - 글 작성 */}
        <div className={`step step2 ${step === 2 ? "active" : "hidden"}`}>
          <h3>당신의 감정을 기록해보세요</h3>

          {/* 뒤로가기 + 임시저장 */}
          <div className="write-controls">

           
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
          setIsSaved(false);
        }
        updateHeight(value);
      }}
      placeholder="지금 느끼는 감정을 자유롭게 남겨보세요… (최대 220자)"
    />
  </div>

  <div className="char-counter">
    {countGraphemes(content)}/{MAX_CHAR}
  </div>

  <label>감정 스탬프 (최대 5개)</label>

  <div className="stamp-row">
    <input
      value={stampInput}
      onChange={(e) => {
        const v = e.target.value;
        if ([...v].length <= 10) {
          setStampInput(v);
        }
      }}
      placeholder="예: 😢 위로받고 싶어 (최대 10자)"
    />
    <button type="button" onClick={addStamp}>추가</button>
  </div>

  <div className="stamp-list">
    {emotionStamps.map((stamp) => (
      <span key={stamp.id} className="stamp-item">
        {stamp.label}
      </span>
    ))}
  </div>

  <button type="submit" className="submit-btn">등록하기</button>
</form>


        </div>
        {step === 2 && (
  <div className="write-bottom-inside">
    <button className="back-btn" onClick={goBackStep}>←</button>

    <button className="save-btn" onClick={saveTemp}>💾 임시저장</button>
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
  const id = localStorage.getItem("last_post_id");
  if (id) navigate(`/post/${id}`);
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
