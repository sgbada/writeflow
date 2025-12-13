import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

// 🌞 기본 테마를 라이트모드로 설정
if (!localStorage.getItem('theme')) {
  localStorage.setItem('theme', 'light')
  document.documentElement.setAttribute('data-theme', 'light')
} else {
  const savedTheme = localStorage.getItem('theme')
  document.documentElement.setAttribute('data-theme', savedTheme || 'light')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
)