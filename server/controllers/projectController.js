const Project = require("../models/Project");

// ─── Helper ───────────────────────────────────────────────
const VALID_STATUSES = ['active', 'completed', 'archived'];

// ─── Create Project (Admin only) ──────────────────────────
exports.createProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ msg: "Access denied. Admins only." });

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user.id,
      members: [],
      status: 'active'
    });

    res.status(201).json(project);
  } catch (err) {
    console.error("createProject:", err.message);
    res.status(500).json({ msg: "Could not create project" });
  }
};

// ─── Get All Projects for logged-in user ──────────────────
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error("getProjects:", err.message);
    res.status(500).json({ msg: "Could not fetch projects" });
  }
};

// ─── Update Project Status (Admin only) ───────────────────
exports.updateProjectStatus = async (req, res) => {
  try {
    // ✅ FIX 1: Added role check
    if (req.user.role !== 'admin')
      return res.status(403).json({ msg: "Access denied. Admins only." });

    const { status } = req.body;

    // ✅ FIX 2: Validate status
    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ msg: `Status must be one of: ${VALID_STATUSES.join(', ')}` });

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    );

    if (!project)
      return res.status(404).json({ msg: "Project not found" });

    res.json(project);
  } catch (err) {
    console.error("updateProjectStatus:", err.message);
    res.status(500).json({ msg: "Could not update status" });
  }
};

// ─── Get Single Project by ID ─────────────────────────────
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ msg: "Project not found" });

    const isAdmin  = req.user.role === 'admin';
    const isOwner  = project.owner.toString() === req.user.id;
    // ✅ FIX 3: .some() + toString() for safe ObjectId comparison
    const isMember = project.members.some(m => m.toString() === req.user.id);

    if (!isAdmin && !isOwner && !isMember)
      return res.status(403).json({ msg: "Not authorized to view this project" });

    res.json(project);
  } catch (err) {
    console.error("getProjectById:", err.message);
    res.status(500).json({ msg: "Could not fetch project" });
  }
};