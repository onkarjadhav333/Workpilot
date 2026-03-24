import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';
import ProjectCard from '../components/ProjectCard';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchProjects();
    if (isAdmin) fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await API.post('/projects/create', formData);
      setProjects([res.data, ...projects]);
      setShowModal(false);
      setFormData({ name: '', description: '' });
      toast.success("Project created!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  // ─── Promote user role ─────────────────────────────────
  const handleRoleChange = async (userId, newRole, userName) => {
    try {
      await API.put(`/auth/users/${userId}/role`, { role: newRole });
      // Update local state so UI reflects change immediately
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`${userName} is now ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update role.");
    }
  };

  return (
    <div className="dashboard-layout">

      {/* ── Navbar ── */}
      <nav className="navbar">
        <h2>Task<span>Manager</span></h2>
        <div className="user-controls">
          <span>Welcome, <strong>{user?.name}</strong></span>
          <button onClick={logout} className="logout-btn">Log Out</button>
        </div>
      </nav>

      <div className="content-area">

        {/* ── Projects Section ── */}
        <div className="content-header">
          <div className="content-header-left">
            <h3>Projects</h3>
            <p>{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="header-actions">
            <button onClick={fetchProjects} className="refresh-btn" title="Refresh">🔄</button>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} className="create-btn">
                + New Project
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading projects...</div>
        ) : (
          <div className="project-grid">
            {projects.length > 0 ? (
              projects.map((proj) => <ProjectCard key={proj._id} project={proj} />)
            ) : (
              <div className="no-projects-container">
                {isAdmin ? (
                  <div className="empty-state">
                    <span className="empty-icon">🏗️</span>
                    <p>No projects yet</p>
                    <span>Create your first project to start assigning tasks to your team.</span>
                    <button onClick={() => setShowModal(true)} className="create-btn-inline">
                      + Create New Project
                    </button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📁</span>
                    <p>No projects assigned</p>
                    <span>You'll see projects here once an admin assigns you to one.</span>
                    <button onClick={fetchProjects} className="refresh-link-btn">
                      Check for updates
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Team Members Section (Admin only) ── */}
        {isAdmin && users.length > 0 && (
          <div className="team-section">
            <div className="team-header">
              <h3>Team Members</h3>
              <p>{users.length} member{users.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="team-table">
              <div className="team-table-head">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
              </div>
              {users.map((u) => (
                <div className="team-table-row" key={u._id}>
                  <span className="team-name">
                    <div className="team-avatar">{u.name.charAt(0).toUpperCase()}</div>
                    {u.name}
                  </span>
                  <span className="team-email">{u.email}</span>
                  <span className="team-role">
                    {/* Admin cannot change their own role */}
                    {u._id === user?.id ? (
                      <span className="role-badge admin">admin (you)</span>
                    ) : (
                      <select
                        className={`role-select ${u.role}`}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value, u.name)}
                      >
                        <option value="employee">employee</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Create Project Modal ── */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h3>New Project</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="submit-btn" disabled={creating} style={{ opacity: creating ? 0.7 : 1 }}>
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;