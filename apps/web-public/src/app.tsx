import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import PostsList from "./PostsList"
import PostDetail from "./PostDetail"
import WritePost from "./WritePost"
import NotFound from "./NotFound"
import ThemeToggle from "./ThemeToggle"

function Layout() {
  return (
    <>
      <header className="app-header">
        <h1 className="site-title">WriteFlow</h1>
        <ThemeToggle />
      </header>
      <main>
        <AppRoutes />
      </main>
    </>
  )
}

function AppRoutes() {
  const location = useLocation()
  return (
    <Routes>
      <Route path="/" element={<PostsList key="home" />} />
      <Route path="/board/:boardName" element={<PostsList key={location.pathname} />} />
      <Route path="/tag/:tagName" element={<PostsList key={location.pathname} />} />
      <Route path="/post/:id" element={<PostDetail key={location.pathname} />} />
      <Route path="/write" element={<WritePost />} />
      <Route path="/edit/:id" element={<WritePost />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
