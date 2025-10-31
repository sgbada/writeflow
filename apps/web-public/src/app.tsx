import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import PostsList from './pages/PostsList'
import PostDetail from './pages/PostDetail'
import WritePost from './pages/WritePost'
import NotFound from './pages/NotFound'

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
      <AppRoutes />
    </BrowserRouter>
  )
}
