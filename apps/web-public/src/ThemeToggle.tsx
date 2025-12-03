import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react" // 💡 lucide-react 아이콘 사용 (Vite 기본 지원)
import "./ThemeToggle.css"

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme")
    if (saved) return saved
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    return systemDark ? "dark" : "light"
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="theme-toggle-icon"
      aria-label="Toggle dark mode"
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}