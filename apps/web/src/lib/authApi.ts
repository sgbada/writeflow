// ✅ 명확한 환경변수 분리
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'https://writeflow-auth.onrender.com';
const CORE_API_URL = import.meta.env.VITE_CORE_API_URL || 'https://writeflow-core.onrender.com/api';

export interface SignupRequest {
  email: string
  username: string
  password: string
  nickname: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  email: string
  createdAt: string
}

class AuthApi {
  async signup(data: SignupRequest): Promise<{ message: string }> {
    console.log('🔐 회원가입 요청:', {
      data,
      url: `${AUTH_API_URL}/signup`
    })

    try {
      const response = await fetch(`${AUTH_API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('📥 회원가입 응답:', response.status, response.statusText)

      const responseText = await response.text()
      console.log('📄 응답 본문:', responseText)

      if (!response.ok) {
        let errorMessage = '회원가입에 실패했습니다'
        try {
          const errorJson = JSON.parse(responseText)
          errorMessage = errorJson.message || errorJson.error || responseText
        } catch {
          errorMessage = responseText || '서버 오류가 발생했습니다'
        }
        throw new Error(errorMessage)
      }

      try {
        return JSON.parse(responseText)
      } catch {
        return { message: '회원가입 성공' }
      }
    } catch (error: any) {
      console.error('❌ 회원가입 에러:', error)
      throw error
    }
  }

  async login(data: LoginRequest): Promise<TokenResponse> {
    console.log('🔐 로그인 요청:', {
      username: data.username,
      url: `${AUTH_API_URL}/login`
    })

    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('📥 로그인 응답:', response.status, response.statusText)

      const responseText = await response.text()
      console.log('📄 응답 본문:', responseText)

      if (!response.ok) {
        let errorMessage = '로그인에 실패했습니다'
        try {
          const errorJson = JSON.parse(responseText)
          errorMessage = errorJson.message || errorJson.error || responseText
        } catch {
          errorMessage = responseText || '서버 오류가 발생했습니다'
        }
        throw new Error(errorMessage)
      }

      return JSON.parse(responseText)
    } catch (error: any) {
      console.error('❌ 로그인 에러:', error)
      throw error
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await fetch(`${AUTH_API_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('토큰 갱신에 실패했습니다')
      }

      return response.json()
    } catch (error: any) {
      console.error('❌ 토큰 갱신 에러:', error)
      throw error
    }
  }

  async getCurrentUser(): Promise<UserInfo> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('로그인이 필요합니다');
    }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      return {
        id: payload.userId || payload.id || 0,
        username: payload.username || '',
        nickname: payload.username || '',
        email: '',
        createdAt: payload.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ JWT 디코딩 에러:', error);
      throw new Error('사용자 정보를 가져올 수 없습니다');
    }
  }

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token')
    if (!token) return false

    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const payload = JSON.parse(jsonPayload)
      const expiry = payload.exp * 1000
      return Date.now() < expiry
    } catch {
      return false
    }
  }
}

export const authApi = new AuthApi()

// 🔍 개발/디버깅용
if (typeof window !== 'undefined') {
  console.log('🌐 API 설정:', {
    AUTH_API_URL,
    CORE_API_URL,
    environment: import.meta.env.MODE
  });
}