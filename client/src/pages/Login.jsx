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

  React.useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true')  toast.success("Email verified! You can now log in.");
    if (verified === 'false') toast.error("Invalid or expired verification link.");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.msg || "Invalid credentials.";
      if (msg === "Invalid Credentials") {
        toast.error("Wrong email or password. If you signed up with Google, GitHub or Facebook — use those buttons below.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

 
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Workpilot Login</h2>
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
            <button type="button" onClick={() => window.location.href = `${backendUrl}/auth/google`} className="social-btn">Google</button>
            <button type="button" onClick={() => window.location.href = `${backendUrl}/auth/github`} className="social-btn">GitHub</button>
            <button type="button" onClick={() => window.location.href = `${backendUrl}/auth/facebook`} className="social-btn">Facebook</button>
          </div>
          <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;