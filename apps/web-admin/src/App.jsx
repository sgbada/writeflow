import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PostList from './pages/PostList';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to admin dashboard */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/posts" element={
          <ProtectedRoute>
            <AdminLayout>
              <PostList />
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Add more admin routes here as needed */}
      </Routes>
    </Router>
  );
}

export default App;
