const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { isProjectMember } = require("../middleware/roleMiddleware");
const { emitToProject, emitToUser } = require("../utils/socket");

const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Project name is required." });
    }

    const project = await Project.create({
      name,
      admin: req.user._id,
      members: []
    });

    emitToUser(req.user._id, "projects:update", { projectId: project._id });

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create project." });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ admin: req.user._id }, { members: req.user._id }]
    })
      .populate("admin", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    const withRole = projects.map((project) => ({
      ...project.toObject(),
      role:
        project.admin._id.toString() === req.user._id.toString()
          ? "Admin"
          : "Member"
    }));

    return res.json(withRole);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load projects." });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("admin", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: "You cannot access this project." });
    }

    return res.json({
      ...project.toObject(),
      role:
        project.admin._id.toString() === req.user._id.toString()
          ? "Admin"
          : "Member"
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load project." });
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("admin", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: "You cannot access this project." });
    }

    const members = [
      { ...project.admin.toObject(), role: "Admin" },
      ...project.members.map((member) => ({ ...member.toObject(), role: "Member" }))
    ];

    return res.json(members);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load team members." });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const project = req.project;

    if (!email) {
      return res.status(400).json({ message: "User email is required." });
    }

    const receiver = await User.findOne({ email: email.toLowerCase() });
    if (!receiver) {
      return res.status(404).json({ message: "User with this email was not found." });
    }

    const receiverId = receiver._id.toString();
    if (
      receiverId === project.admin.toString() ||
      project.members.some((id) => id.toString() === receiverId)
    ) {
      return res
        .status(400)
        .json({ message: "User is already part of this project." });
    }

    const existingPending = await Invitation.findOne({
      projectId: project._id,
      receiver: receiver._id,
      status: "pending"
    });

    if (existingPending) {
      return res
        .status(400)
        .json({ message: "A pending invitation already exists for this user." });
    }

    const invitation = await Invitation.create({
      projectId: project._id,
      sender: req.user._id,
      receiver: receiver._id,
      status: "pending"
    });

    emitToUser(receiver._id, "invitations:update", { projectId: project._id });

    return res.status(201).json(invitation);
  } catch (error) {
    return res.status(500).json({ message: "Failed to send invitation." });
  }
};

const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const project = req.project;

    if (project.admin.toString() === memberId) {
      return res.status(400).json({ message: "Project admin cannot be removed." });
    }

    project.members = project.members.filter((id) => id.toString() !== memberId);
    await project.save();

    emitToProject(project._id, "project:update", { projectId: project._id });
    emitToUser(memberId, "projects:update", { projectId: project._id });

    return res.json({ message: "Member removed from project." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove member." });
  }
};

const getProjectProgress = async (req, res) => {
  try {
    const project = req.project;

    const [tasksByMember, totals] = await Promise.all([
      Task.aggregate([
        { $match: { projectId: project._id } },
        {
          $group: {
            _id: "$assignedTo",
            total: { $sum: 1 },
            todo: { $sum: { $cond: [{ $eq: ["$status", "Todo"] }, 1, 0] } },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] }
            },
            done: { $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] } }
          }
        }
      ]),
      Task.countDocuments({ projectId: project._id })
    ]);

    const users = await User.find({ _id: { $in: [project.admin, ...project.members] } });
    const mapped = users.map((user) => {
      const stats = tasksByMember.find(
        (item) => item._id.toString() === user._id.toString()
      ) || { total: 0, todo: 0, inProgress: 0, done: 0 };
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user._id.toString() === project.admin.toString() ? "Admin" : "Member",
        ...stats
      };
    });

    return res.json({ totalTasks: totals, members: mapped });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load progress data." });
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  getProjectMembers,
  inviteUser,
  removeMember,
  getProjectProgress
};
