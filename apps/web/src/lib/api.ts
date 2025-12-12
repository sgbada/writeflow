const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  console.log('🔑 현재 토큰 상태:', token ? `존재 (${token.substring(0, 20)}...)` : '없음');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 🔍 요청 전 상태 로깅
function logRequest(method: string, url: string, body?: any) {
  console.group(`📤 ${method} ${url}`);
  console.log('🌐 Full URL:', BASE_URL + url);
  console.log('🔑 Token:', localStorage.getItem("token") ? '✅ 존재' : '❌ 없음');
  console.log('📦 Body:', body);
  console.log('🏷️ Origin:', window.location.origin);
  console.groupEnd();
}

export async function apiGet(url: string) {
  logRequest('GET', url);
  
  const res = await fetch(BASE_URL + url, {
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
  });

  console.log(`📥 GET 응답:`, {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries())
  });

  if (res.status === 403) {
    alert("로그인이 필요한 서비스입니다.");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API GET 실패:`, {
      url,
      status: res.status,
      error: errorText
    });
    throw new Error(errorText);
  }
  return res.json();
}

export async function apiPost(url: string, body?: any) {
  logRequest('POST', url, body);
  
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  console.log('📋 전송 헤더:', headers);

  const res = await fetch(BASE_URL + url, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  console.log(`📥 POST 응답:`, {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries())
  });

  // CORS 에러 감지
  if (res.type === 'opaque' || res.type === 'opaqueredirect') {
    console.error('🚨 CORS 에러 감지! opaque response');
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API POST 실패:`, {
      url,
      status: res.status,
      error: errorText,
      corsHeaders: {
        'Access-Control-Allow-Origin': res.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': res.headers.get('Access-Control-Allow-Credentials')
      }
    });
    throw new Error(errorText || 'API 요청 실패');
  }

  const text = await res.text();
  if (!text) {
    console.log("⚠ 응답 body 없음 (204/empty)");
    return { message: "OK" };
  }

  try {
    const json = JSON.parse(text);
    console.log('✅ 응답 성공:', json);
    return json;
  } catch (e) {
    console.warn("⚠ JSON 파싱 실패, raw text 반환");
    return { message: text };
  }
}

export async function apiDelete(url: string) {
  logRequest('DELETE', url);
  
  const res = await fetch(BASE_URL + url, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
  });

  console.log(`📥 DELETE 응답:`, {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries())
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API DELETE 실패:`, errorText);
    throw new Error(errorText);
  }
  return true;
}

// 🔍 CORS 문제 진단 헬퍼
export async function diagnoseCORS() {
  console.group('🔍 CORS 진단');
  
  console.log('1️⃣ 현재 Origin:', window.location.origin);
  console.log('2️⃣ API Base URL:', BASE_URL);
  console.log('3️⃣ Token 존재:', !!localStorage.getItem('token'));
  
  try {
    // OPTIONS 요청 테스트
    const res = await fetch(BASE_URL + '/posts', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    
    console.log('4️⃣ Preflight 응답:', {
      status: res.status,
      allowOrigin: res.headers.get('Access-Control-Allow-Origin'),
      allowMethods: res.headers.get('Access-Control-Allow-Methods'),
      allowHeaders: res.headers.get('Access-Control-Allow-Headers'),
      allowCredentials: res.headers.get('Access-Control-Allow-Credentials')
    });
  } catch (e) {
    console.error('5️⃣ Preflight 실패:', e);
  }
  
  console.groupEnd();
}

// 개발 환경에서 자동 진단
if (import.meta.env.DEV) {
  (window as any).diagnoseCORS = diagnoseCORS;
  console.log('💡 CORS 진단: window.diagnoseCORS() 실행');
}