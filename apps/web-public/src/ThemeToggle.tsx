// ThemeToggle.tsx
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // 로컬스토리지 저장된 테마 또는 시스템 모드 자동 인식
    const saved = localStorage.getItem("theme")
    if (saved) return saved
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    return systemDark ? "dark" : "light"
  })

  // 테마 변경 시 HTML에 적용 + 저장
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="theme-toggle"
      aria-label="Toggle dark mode"
    >
      {theme === "light" ? "🌙 다크모드" : "☀️ 라이트모드"}
    </button>
  )
}
