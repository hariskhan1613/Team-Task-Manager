const Project = require("../models/Project");
const Task = require("../models/Task");
const { isProjectMember } = require("../middleware/roleMiddleware");
const { emitToProject, emitToUser } = require("../utils/socket");

const isAssignableToProject = (project, userId) =>
  project.admin.toString() === userId.toString() ||
  project.members.some((id) => id.toString() === userId.toString());

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, dueDate, priority } =
      req.body;

    if (!title || !projectId || !assignedTo) {
      return res
        .status(400)
        .json({ message: "title, projectId, and assignedTo are required." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only project admin can assign tasks." });
    }

    if (!isAssignableToProject(project, assignedTo)) {
      return res
        .status(400)
        .json({ message: "Assigned user is not part of this project." });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo,
      status,
      dueDate,
      priority
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("projectId", "name");

    emitToProject(projectId, "project:update", { projectId });
    emitToUser(assignedTo, "dashboard:update", { projectId });

    return res.status(201).json(populatedTask);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create task." });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: "You cannot access this project." });
    }

    const tasks = await Task.find({ projectId })
      .populate("assignedTo", "name email")
      .sort({ dueDate: 1, createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load project tasks." });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("projectId", "name admin members")
      .sort({ dueDate: 1, createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load your tasks." });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!["Todo", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const isAdmin = project.admin.toString() === req.user._id.toString();
    const isAssignedUser = task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignedUser) {
      return res
        .status(403)
        .json({ message: "Only assigned member or admin can update this task." });
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("projectId", "name");

    emitToProject(project._id, "project:update", { projectId: project._id });
    emitToUser(task.assignedTo, "dashboard:update", { projectId: project._id });

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task status." });
  }
};

const reassignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignedTo } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can reassign tasks." });
    }

    if (!assignedTo || !isAssignableToProject(project, assignedTo)) {
      return res
        .status(400)
        .json({ message: "New assignee must be part of the project team." });
    }

    const previousAssignee = task.assignedTo;
    task.assignedTo = assignedTo;
    await task.save();

    const updatedTask = await Task.findById(task._id).populate(
      "assignedTo",
      "name email"
    );
    emitToProject(project._id, "project:update", { projectId: project._id });
    emitToUser(previousAssignee, "dashboard:update", { projectId: project._id });
    emitToUser(assignedTo, "dashboard:update", { projectId: project._id });
    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: "Failed to reassign task." });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getMyTasks,
  updateTaskStatus,
  reassignTask
};
