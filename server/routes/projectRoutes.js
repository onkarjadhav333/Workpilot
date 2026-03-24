const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProjectStatus
} = require('../controllers/projectController');

// POST   /api/projects/create    → Create a new project (admin only)
router.post('/create',     auth, createProject);

// GET    /api/projects/          → Get all projects for logged-in user
router.get('/',            auth, getProjects);

// PUT    /api/projects/:id/status → Update project status (admin only)
router.put('/:id/status',  auth, updateProjectStatus);

// GET    /api/projects/:id        → Get single project by ID
router.get('/:id',         auth, getProjectById);

module.exports = router;