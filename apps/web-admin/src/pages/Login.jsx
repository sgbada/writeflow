import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate(); // Add this for navigation

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with actual API call
    console.log('Login attempt:', { email, password });

    // Mock login for now
    login({ email, role: 'admin' });

    // Add navigation to dashboard after login
    navigate('/admin');
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>WriteFlow Admin Login</h2>

        <div className="form-group">
          <label htmlFor="email">Email Address:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" className="login-button">Login</button>

        <div className="demo-note">
          <p><strong>Demo Note:</strong> This is a test version. Enter any email and password to login.</p>
        </div>
      </form>
    </div>
  );
};

export default Login;
