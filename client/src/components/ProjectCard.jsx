import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const date = new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="project-card" onClick={() => navigate(`/project/${project._id}`)}>
      <div className="card-header">
        <h4>{project.name}</h4>
        <span className={`status-badge ${project.status}`}>{project.status}</span>
      </div>

      <p className="project-desc">
        {project.description || "No description provided."}
      </p>

      <div className="card-footer">
        <div className="card-meta">
          <span className="member-count">👥 {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
          <span className="card-date">📅 {date}</span>
        </div>
        <button className="view-btn" onClick={(e) => { e.stopPropagation(); navigate(`/project/${project._id}`); }}>
          View →
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;