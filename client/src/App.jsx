import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import DataDeletion from './pages/DataDeletion'
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="loading-screen">Loading...</div>;
  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/"                        element={<Login />} />
          <Route path="/register"                element={<Register />} />
          <Route path="/forgot-password"         element={<ForgotPassword />} />
          <Route path="/reset-password/:token"   element={<ResetPassword />} />
          <Route path="/data-deletion" element={<DataDeletion />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          }/>
          <Route path="/project/:id" element={
            <PrivateRoute><ProjectDetails /></PrivateRoute>
          }/>

          {/* 404 — catches all unknown URLs */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;