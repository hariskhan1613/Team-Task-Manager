const Project = require("../models/Project");

const getProjectId = (req) =>
  req.params.projectId || req.params.id || req.body.projectId;

const loadProject = async (req, res) => {
  const projectId = getProjectId(req);
  if (!projectId) {
    res.status(400).json({ message: "Project id is required." });
    return null;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({ message: "Project not found." });
    return null;
  }

  return project;
};

const getId = (value) => (value && value._id ? value._id : value);

const isProjectMember = (project, userId) => {
  const adminId = getId(project.admin);
  if (adminId && adminId.toString() === userId.toString()) {
    return true;
  }

  return project.members.some((member) => {
    const memberId = getId(member);
    return memberId && memberId.toString() === userId.toString();
  });
};

const requireProjectAdmin = async (req, res, next) => {
  const project = await loadProject(req, res);
  if (!project) return;

  if (project.admin.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ message: "Forbidden: admin access required for this project." });
  }

  req.project = project;
  next();
};

const requireProjectMember = async (req, res, next) => {
  const project = await loadProject(req, res);
  if (!project) return;

  if (!isProjectMember(project, req.user._id)) {
    return res
      .status(403)
      .json({ message: "Forbidden: project member access required." });
  }

  req.project = project;
  next();
};

module.exports = {
  requireProjectAdmin,
  requireProjectMember,
  isProjectMember
};
