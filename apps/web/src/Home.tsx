import { Link } from "react-router-dom";
import "./WritePost.css";
import "./PostList.css";
import "./Home.css"; // ← 추가

export default function Home() {
  const isLogin = !!localStorage.getItem("token");

  return (
    <div className="writepage-bg theme-default">
      <div className="write-wrapper home-wrapper">

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

        {isLogin && (
          <>
            <h2>😊 다시 찾아와줘서 고마워요</h2>
            <p className="home-sub">오늘의 감정은 어떤 색인가요?</p>

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
