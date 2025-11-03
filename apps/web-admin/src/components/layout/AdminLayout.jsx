import { Link, useLocation } from 'react-router-dom';
import Header from './Header';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  // Helper function to check if a link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      <Header />
      <div className="layout-body">
        <aside className="sidebar">
          <nav>
            <ul>
              <li className={isActiveLink('/admin') ? 'active' : ''}>
                <Link to="/admin">Dashboard</Link>
              </li>
              <li className={isActiveLink('/admin/posts') ? 'active' : ''}>
                <Link to="/admin/posts">Posts</Link>
              </li>
              <li>Media</li>
              <li>Settings</li>
            </ul>
          </nav>
        </aside>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
