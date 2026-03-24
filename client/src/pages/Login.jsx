import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ Show verification result if redirected from email link
  React.useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true')  toast.success("Email verified! You can now log in.");
    if (verified === 'false') toast.error("Invalid or expired verification link.");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate('/dashboard');
    } catch (err) {
      // Show the actual error message from backend if available
      const msg = err.response?.data?.msg || "Invalid credentials. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Task Manager Login</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Work Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="submit-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="divider-text">OR</p>
          <div className="social-grid">
            <button type="button" onClick={() => window.location.href = "http://localhost:4000/auth/google"} className="social-btn">Google</button>
            <button type="button" onClick={() => window.location.href = "http://localhost:4000/auth/github"} className="social-btn">GitHub</button>
            <button type="button" onClick={() => window.location.href = "http://localhost:4000/auth/facebook"} className="social-btn">Facebook</button>
          </div>
          <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;