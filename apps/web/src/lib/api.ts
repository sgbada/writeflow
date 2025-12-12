// ✅ Core API URL (게시글 등)
const CORE_API_URL = import.meta.env.VITE_CORE_API_URL || 'https://writeflow-core.onrender.com';

// ✅ URL 정규화 (마지막 슬래시 제거)
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

function authHeaders() {
  const token = localStorage.getItem("token");
  console.log('🔑 현재 토큰 상태:', token ? `존재 (${token.substring(0, 20)}...)` : '없음');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function logRequest(method: string, url: string, body?: any) {
  console.group(`📤 ${method} ${url}`);
  console.log('🌐 Full URL:', normalizeUrl(CORE_API_URL) + url);
  console.log('🔑 Token:', localStorage.getItem("token") ? '✅ 존재' : '❌ 없음');
  console.log('📦 Body:', body);
  console.log('🏷️ Origin:', window.location.origin);
  console.groupEnd();
}

export async function apiGet(url: string) {
  logRequest('GET', url);
  
  try {
    const res = await fetch(normalizeUrl(CORE_API_URL) + url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      credentials: "include",
    });

    console.log(`📥 GET 응답:`, {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries())
    });

    if (res.status === 401 || res.status === 403) {
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
      throw new Error(errorText || `HTTP ${res.status}`);
    }
    
    return res.json();
  } catch (error: any) {
    console.error('❌ API GET 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('서버에 연결할 수 없습니다. CORS 설정을 확인해주세요.');
    }
    throw error;
  }
}

export async function apiPost(url: string, body?: any) {
  logRequest('POST', url, body);
  
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  console.log('📋 전송 헤더:', headers);

  try {
    const res = await fetch(normalizeUrl(CORE_API_URL) + url, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    console.log(`📥 POST 응답:`, {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      type: res.type,
      headers: Object.fromEntries(res.headers.entries())
    });

    if (res.type === 'opaque' || res.type === 'opaqueredirect') {
      console.error('🚨 CORS 에러 감지! opaque response');
      throw new Error('CORS 에러: 서버가 응답을 차단했습니다.');
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
      throw new Error(errorText || `HTTP ${res.status}`);
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
  } catch (error: any) {
    console.error('❌ API POST 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('서버에 연결할 수 없습니다. CORS 설정을 확인해주세요.');
    }
    throw error;
  }
}

export async function apiDelete(url: string) {
  logRequest('DELETE', url);
  
  try {
    const res = await fetch(normalizeUrl(CORE_API_URL) + url, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(errorText || `HTTP ${res.status}`);
    }
    return true;
  } catch (error: any) {
    console.error('❌ API DELETE 에러:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('서버에 연결할 수 없습니다. CORS 설정을 확인해주세요.');
    }
    throw error;
  }
}

export async function diagnoseCORS() {
  console.group('🔍 CORS 진단');
  
  console.log('1️⃣ 현재 Origin:', window.location.origin);
  console.log('2️⃣ Core API URL:', normalizeUrl(CORE_API_URL));
  console.log('3️⃣ Token 존재:', !!localStorage.getItem('token'));
  
  // 기본 연결 테스트
  try {
    console.log('4️⃣ 기본 GET 테스트...');
    const healthRes = await fetch(normalizeUrl(CORE_API_URL) + '/health', {
      method: 'GET',
    });
    console.log('✅ 헬스체크 성공:', healthRes.status);
  } catch (e) {
    console.error('❌ 헬스체크 실패:', e);
  }
  
  // Preflight 테스트
  try {
    console.log('5️⃣ Preflight 테스트...');
    const res = await fetch(normalizeUrl(CORE_API_URL) + '/posts', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    
    console.log('✅ Preflight 응답:', {
      status: res.status,
      allowOrigin: res.headers.get('Access-Control-Allow-Origin'),
      allowMethods: res.headers.get('Access-Control-Allow-Methods'),
      allowHeaders: res.headers.get('Access-Control-Allow-Headers'),
      allowCredentials: res.headers.get('Access-Control-Allow-Credentials')
    });
  } catch (e) {
    console.error('❌ Preflight 실패:', e);
  }
  
  console.groupEnd();
}

if (import.meta.env.DEV) {
  (window as any).diagnoseCORS = diagnoseCORS;
  console.log('💡 CORS 진단: window.diagnoseCORS() 실행');
}

// 🔍 개발/디버깅용
console.log('🌐 Core API 설정:', {
  CORE_API_URL: normalizeUrl(CORE_API_URL),
  environment: import.meta.env.MODE
});