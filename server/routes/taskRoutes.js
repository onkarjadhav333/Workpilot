const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createTask, getProjectTasks, updateTask, deleteTask } = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');

// ─── Validation Rules ─────────────────────────────────────

// CREATE — title is required
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be under 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium or high'),
];

// UPDATE — all fields optional (drag & drop only sends status)
const updateTaskValidation = [
  body('title')
    .optional()                    // ← title NOT required on update
    .trim()
    .isLength({ max: 100 }).withMessage('Title must be under 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium or high'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress or done'),
];

// ─── Validation Helper ────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }
  return null;
};

// ─── Routes ───────────────────────────────────────────────

// POST /tasks — create task
router.post('/', auth, createTaskValidation, (req, res, next) => {
  const error = validate(req, res);
  if (error) return;
  next();
}, createTask);

// GET /tasks/:projectId — get all tasks for a project
router.get('/:projectId', auth, getProjectTasks);

// PUT /tasks/:id — update task (drag & drop OR full edit)
router.put('/:id', auth, updateTaskValidation, (req, res, next) => {
  const error = validate(req, res);
  if (error) return;
  next();
}, updateTask);

// DELETE /tasks/:id — delete task
router.delete('/:id', auth, deleteTask);

module.exports = router;