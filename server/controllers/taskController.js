const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const sendEmail = require('../utils/sendEmail');
const { taskAssignedEmail } = require('../utils/emailTemplates');

// ─── Helper: Auto-add assignee to project members ─────────
const autoAddMember = async (projectId, assigneeId, ownerId) => {
  if (assigneeId && assigneeId.toString() !== ownerId.toString()) {
    await Project.findByIdAndUpdate(projectId, {
      $addToSet: { members: assigneeId }
    });
  }
};

// ─── Helper: Send task assignment email ───────────────────
const notifyAssignee = async (assigneeId, taskTitle, projectName, priority) => {
  try {
    const assignee = await User.findById(assigneeId).select('name email');
    if (!assignee) {
      console.log('notifyAssignee: assignee not found in DB');
      return;
    }

    console.log(`notifyAssignee: sending email to ${assignee.email}`);
    const { subject, html } = taskAssignedEmail(assignee.name, taskTitle, projectName, priority);
    await sendEmail({ to: assignee.email, subject, html });
    console.log(`notifyAssignee: email sent successfully to ${assignee.email} ✅`);

  } catch (err) {
    // ✅ Full error logged — won't break task creation
    console.error("Task notification email failed:", err.message);
    console.error("Error code:", err.code);
    console.error("Full error:", err);
  }
};

// ─── Create Task (Admin only) ──────────────────────────────
exports.createTask = async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ msg: "Access denied. Admins only." });

    const { title, description, status, priority, project, assignee, dueDate } = req.body;

    const projectExists = await Project.findById(project);
    if (!projectExists)
      return res.status(404).json({ msg: "Project not found" });

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority,
      project,
      assignee,
      dueDate,
      createdBy: req.user.id
    });

    await autoAddMember(project, assignee, projectExists.owner);
    if (assignee) await notifyAssignee(assignee, title, projectExists.name, priority);

    // Populate assignee name before returning
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name');

    res.status(201).json(populatedTask);
  } catch (err) {
    console.error("createTask:", err.message);
    res.status(500).json({ msg: "Could not create task" });
  }
};

// ─── Update Task ───────────────────────────────────────────
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignee, dueDate } = req.body;

    const allowedUpdates = {};
    if (title !== undefined)       allowedUpdates.title = title;
    if (description !== undefined) allowedUpdates.description = description;
    if (status !== undefined)      allowedUpdates.status = status;
    if (priority !== undefined)    allowedUpdates.priority = priority;
    if (assignee !== undefined)    allowedUpdates.assignee = assignee;
    if (dueDate !== undefined)     allowedUpdates.dueDate = dueDate;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { returnDocument: 'after' }
    ).populate('assignee', 'name');

    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (assignee && req.user.role === 'admin') {
      const projectData = await Project.findById(task.project);
      if (projectData) {
        await autoAddMember(task.project, assignee, projectData.owner);
        await notifyAssignee(assignee, task.title, projectData.name, task.priority);
      }
    }

    res.json(task);
  } catch (err) {
    console.error("updateTask:", err.message);
    res.status(500).json({ msg: "Could not update task" });
  }
};

// ─── Get All Tasks for a Project ──────────────────────────
exports.getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email')
      .sort({ createdAt: 1 });

    res.json(tasks);
  } catch (err) {
    console.error("getProjectTasks:", err.message);
    res.status(500).json({ msg: "Could not fetch tasks" });
  }
};

// ─── Delete Task (Admin only) ──────────────────────────────
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    const { project: projectId, assignee: userId } = task;
    await task.deleteOne();

    const remainingTasks = await Task.findOne({ project: projectId, assignee: userId });
    if (!remainingTasks) {
      await Project.findByIdAndUpdate(projectId, { $pull: { members: userId } });
    }

    res.json({ msg: "Task deleted and membership updated" });
  } catch (err) {
    console.error("deleteTask:", err.message);
    res.status(500).json({ msg: "Could not delete task" });
  }
};