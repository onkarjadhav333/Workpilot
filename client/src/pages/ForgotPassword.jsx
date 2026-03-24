import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import '../styles/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false); // show success state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true); // switch to success view
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Success state — email sent ───────────────────────
  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2>Check your email</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
            If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox.
          </p>
          <Link to="/" style={{ color: '#4f46e5', fontWeight: 600, fontSize: 14 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ─── Default state — enter email ──────────────────────
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Enter your email and we'll send you a reset link.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="auth-footer">
          Remembered it? <Link to="/">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;