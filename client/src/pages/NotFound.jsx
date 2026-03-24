import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'DM Sans', sans-serif",
      textAlign: 'center',
      padding: 20
    }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🗺️</div>
      <h1 style={{
        fontSize: 32,
        fontWeight: 800,
        color: '#0f172a',
        marginBottom: 8,
        fontFamily: "'Sora', sans-serif"
      }}>
        Page Not Found
      </h1>
      <p style={{
        fontSize: 16,
        color: '#64748b',
        marginBottom: 32,
        maxWidth: 400,
        lineHeight: 1.6
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate(user ? '/dashboard' : '/')}
        style={{
          background: '#6366f1',
          color: 'white',
          border: 'none',
          padding: '12px 28px',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif"
        }}
      >
        {user ? 'Go to Dashboard' : 'Go to Login'}
      </button>
    </div>
  );
};

export default NotFound;