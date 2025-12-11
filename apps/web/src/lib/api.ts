// ✅ 게이트웨이(80 포트)를 통해 모든 요청 전송
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
  const token = localStorage.getItem("token"); // ✅ 'token' 키로 저장된 JWT 토큰
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function apiGet(url: string) {
  const res = await fetch(BASE_URL + url, {
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
  });
  if (res.status === 403) {
    alert("로그인이 필요한 서비스입니다.");
    window.location.href = "/login";  // 필요에 따라 '/auth/login'
    return; // 아래 코드 실행 방지
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API GET 요청 실패: ${url}`, {
      status: res.status,
      statusText: res.statusText,
      error: errorText
    });
    throw new Error(errorText);
  }
  return res.json();
}

export async function apiPost(url: string, body?: any) {
  console.log('📤 API POST 요청:', `${BASE_URL}${url}`);
  console.log('📦 요청 데이터:', body);
  console.log('🔑 사용자 토큰:', localStorage.getItem("token"));

  const res = await fetch(BASE_URL + url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  console.log('📥 API 응답 상태:', res.status, res.statusText);

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API POST 요청 실패: ${url}`, {
      status: res.status,
      statusText: res.statusText,
      error: errorText
    });
    throw new Error(errorText || 'API 요청 실패');
  }
 // 🔥 body가 없는 204/200 대비
  const text = await res.text();
  if (!text) {
    console.log("⚠ 응답 body 없음(204 or empty) — JSON 파싱 생략");
    return { message: "OK" }; // 원하는 값으로 반환
  }

  try {
    const json = JSON.parse(text);
    console.log('✅ API 응답 JSON:', json);
    return json;
  } catch (e) {
    console.log("⚠ JSON 변환 불가 — raw text 반환");
    return { message: text };
  }
}

export async function apiDelete(url: string) {
  const res = await fetch(BASE_URL + url, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API DELETE 요청 실패: ${url}`, errorText);
    throw new Error(errorText);
  }
  return true;
}
