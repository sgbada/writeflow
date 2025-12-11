import { Link } from "react-router-dom";
import "./WritePost.css";
import "./PostList.css";
import "./Home.css";

function getGreetingMessage() {
  const hour = new Date().getHours();

  const morning = [
    "🌅 좋은 아침이에요! 오늘도 가볍게 시작해볼까요?",
    "☀️ 상쾌한 아침이네요! 오늘의 감정은 어떤가요?",
    "🌞 아침 햇살처럼 따뜻한 하루가 되길 바라요.",
    "🍞 아침 식사는 챙기셨나요? 작은 에너지도 하루를 바꾸어요.",
    "🥐 여유로운 아침이에요. 마음도 천천히 펼쳐보세요.",
    "🌤 맑은 아침 공기처럼 오늘도 가벼운 하루가 되길!",
    "🕊 아침엔 마음도 새로 시작할 기회가 생기죠. 오늘의 기분은 어떤가요?",
    "✨ 반짝이는 아침이에요. 오늘의 당신을 응원할게요."
  ];

  const afternoon = [
    "🌤 오늘 하루의 중간, 당신의 감정을 들려주세요.",
    "🍽 점심은 맛있게 드셨나요? 잠깐 쉬어가도 괜찮아요.",
    "😌 오후의 여유 속에서 마음을 기록해보는 건 어떨까요?",
    "🌿 살짝 피곤해지는 시간대죠. 마음도 가볍게 내려놓아보세요.",
    "🧋 시원한 음료 한 잔처럼 마음도 잠시 쉬어가요.",
    "☁️ 흐린 오후라도, 감정은 언제나 표현해도 괜찮아요.",
    "📚 일이나 공부로 바쁠 수도 있죠. 잠깐, 나를 들여다보는 시간도 필요해요.",
    "🍪 달달한 간식처럼 작은 위로가 필요한 순간일지도 몰라요."
  ];

  const evening = [
    "🌇 평온한 저녁이네요. 오늘은 어떤 감정을 느꼈나요?",
    "🍵 하루 마무리, 마음을 기록해보는 건 어떨까요?",
    "✨ 저녁 바람처럼 부드러운 순간이길 바라요.",
    "🌙 오늘 하루도 정말 수고했어요.",
    "🥘 저녁 식사 맛있게 하셨나요? 마음도 천천히 놓아주세요.",
    "🧡 따뜻한 조명 아래에서 오늘 하루를 차분히 돌아보는 시간도 좋죠.",
    "🔥 하루 종일 고생한 마음, 잠시 쉬어가도 괜찮아요.",
    "📖 조용한 저녁은 감정을 기록하기 딱 좋은 시간이죠."
  ];

  const night = [
    "🌙 늦은 밤이네요. 고생 많았어요.",
    "✨ 밤이 깊었어요. 지금 마음을 조용히 남겨볼까요?",
    "🌌 오늘 하루의 감정을 가볍게 비워보는 건 어떨까요?",
    "💤 잠들기 전, 마음 한 조각을 정리해보는 것도 좋을 거예요.",
    "🛌 이제는 쉬어도 괜찮아요. 당신은 충분히 잘했어요.",
    "💫 조용한 밤, 당신의 감정에 더 귀 기울여보세요.",
    "🌙 내일의 나에게 전하고 싶은 말을 남겨봐도 좋겠네요."
  ];

  let messages;

  if (hour >= 5 && hour < 11) messages = morning;
  else if (hour >= 11 && hour < 17) messages = afternoon;
  else if (hour >= 17 && hour < 21) messages = evening;
  else messages = night;

  return messages[Math.floor(Math.random() * messages.length)];
}


export default function Home() {
  const isLogin = !!localStorage.getItem("token");

  return (
    <div className="writepage-bg theme-default">
      <div className="write-wrapper home-wrapper">

        {/* 로그아웃 상태 */}
        {!isLogin && (
          <>
            <h2>👋 WriteFlow에 오신 걸 환영합니다</h2>
            <p className="home-sub">마음 한 조각을 남겨보지 않을래요?</p>

            <div className="home-btn-box">
              <Link to="/login" className="home-btn login">로그인</Link>
              <Link to="/signup" className="home-btn signup">회원가입</Link>
            </div>
          </>
        )}

        {/* 로그인 상태 */}
        {isLogin && (
          <>
            <h2>{getGreetingMessage()}</h2>
            <p className="home-sub">오늘의 감정을 기록해볼까요?</p>

            <div className="home-action-box">
              <Link to="/read" className="action-card">📖 글 읽기</Link>
              <Link to="/write" className="action-card">✍️ 글 쓰기</Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
