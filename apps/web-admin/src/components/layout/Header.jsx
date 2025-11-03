import { useAuthStore } from '../../stores/authStore';

const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1>WriteFlow Admin</h1>
      </div>
      <div className="header-right">
        <span>Welcome, {user?.email || 'Admin'}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
