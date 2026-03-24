import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'; 
import toast from 'react-hot-toast';
import API from '../api/axios';
import '../styles/ProjectDetails.css';

const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = currentUser?.role === 'admin';

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, taskId: null, taskTitle: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assignee: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          API.get(`/projects/${id}`),
          API.get(`/tasks/${id}`)
        ]);
        setProject(projRes.data);
        setTasks(taskRes.data);
        if (isAdmin) {
          const userRes = await API.get(`/auth/users`);
          setUsers(userRes.data);
        }
      } catch (err) {
        toast.error("Project access error.");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();
  }, [id, navigate, isAdmin]);

  // ─── Handle project status change ─────────────────────────
  const handleStatusChange = async (newStatus) => {
    const previousStatus = project.status;
    // Optimistic update
    setProject({ ...project, status: newStatus });
    try {
      await API.put(`/projects/${id}/status`, { status: newStatus });
      toast.success(`Project marked as "${newStatus}"`);
    } catch (err) {
      // Rollback on failure
      setProject({ ...project, status: previousStatus });
      toast.error("Failed to update project status.");
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await API.put(`/tasks/${draggableId}`, { status: newStatus, project: id });
    } catch (err) {
      setTasks(originalTasks);
      toast.error("Drag sync failed.");
    }
  };

  // Opens the confirm modal instead of window.confirm
  const handleDeleteClick = (taskId, taskTitle) => {
    setConfirmDelete({ show: true, taskId, taskTitle });
  };

  const handleDeleteTask = async () => {
    try {
      await API.delete(`/tasks/${confirmDelete.taskId}`);
      setTasks(tasks.filter(t => t._id !== confirmDelete.taskId));
      setConfirmDelete({ show: false, taskId: null, taskTitle: '' });
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await API.put(`/tasks/${currentTaskId}`, { ...newTask, project: id });
        setTasks(tasks.map(t => t._id === currentTaskId ? res.data : t));
        toast.success("Task updated");
      } else {
        const res = await API.post('/tasks', { ...newTask, project: id, status: 'todo' });
        setTasks([...tasks, res.data]);
        toast.success("Task created");
      }
      setShowTaskModal(false);
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length
  };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="project-details-container">
      <header className="project-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <div className="header-info">
          <div className="title-row">
            <h1>{project?.name}</h1>

            {/* ✅ Admin sees a dropdown to change status, others see a plain badge */}
            {isAdmin ? (
              <select
                className={`status-badge ${project?.status}`}
                value={project?.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="archived">archived</option>
              </select>
            ) : (
              <span className={`status-badge ${project?.status}`}>{project?.status}</span>
            )}
          </div>
          <p className="project-desc-text">{project?.description}</p>

          <div className="project-stats-bar">
            <div className="stat-item"><span className="stat-label">Total:</span><span className="stat-value">{stats.total}</span></div>
            <div className="stat-item"><span className="stat-label">In Progress:</span><span className="stat-value yellow">{stats.inProgress}</span></div>
            <div className="stat-item"><span className="stat-label">Done:</span><span className="stat-value green">{stats.done}</span></div>
            <div className="progress-container">
              <div className="progress-text">{progress}% Complete</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {['todo', 'in-progress', 'done'].map((status) => (
            <StrictModeDroppable droppableId={status} key={status}>
              {(provided) => (
                <div className="kanban-column" {...provided.droppableProps} ref={provided.innerRef}>
                  <div className="column-header">
                    <h3>{status.replace('-', ' ')}</h3>
                    <span className="count">{tasks.filter(t => t.status === status).length}</span>
                  </div>
                  <div className="task-list">
                    {tasks.filter(t => t.status === status).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            className={`task-card priority-${task.priority} ${snapshot.isDragging ? 'dragging' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div className="task-card-header">
                              <h4>{task.title}</h4>
                              {isAdmin && (
                                <div className="card-actions">
                                  <button className="icon-btn edit-btn" onClick={() => {
                                    setNewTask({ title: task.title, description: task.description, priority: task.priority, assignee: task.assignee?._id || task.assignee });
                                    setCurrentTaskId(task._id); setIsEditing(true); setShowTaskModal(true);
                                  }}>✏️</button>
                                  <button className="icon-btn delete-btn" onClick={() => handleDeleteClick(task._id, task.title)}>✕</button>
                                </div>
                              )}
                            </div>
                            <p className="task-desc">{task.description}</p>
                            <div className="task-footer">
                              <div className="footer-top">
                                <span className="assignee">👤 {task.assignee?.name || 'Unassigned'}</span>
                                <span className={`priority-tag ${task.priority}`}>{task.priority}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {status === 'todo' && isAdmin && (
                      <button className="add-inline-btn" onClick={() => { setIsEditing(false); setNewTask({ title: '', description: '', priority: 'medium', assignee: '' }); setShowTaskModal(true); }}>
                        + Add a card
                      </button>
                    )}
                  </div>
                </div>
              )}
            </StrictModeDroppable>
          ))}
        </div>
      </DragDropContext>

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? "Edit Task" : "New Task"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>TITLE</label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>DESCRIPTION</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>PRIORITY</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ASSIGNEE</label>
                  <select required value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}>
                    <option value="">Select Employee</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTaskModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
              </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Delete Confirm Modal ── */}
      {confirmDelete.show && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="confirm-icon">🗑️</div>
            <h2>Delete Task?</h2>
            <p>Are you sure you want to delete <strong>"{confirmDelete.taskTitle}"</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setConfirmDelete({ show: false, taskId: null, taskTitle: '' })}
              >
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={handleDeleteTask}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;