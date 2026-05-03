const Project = require("../models/Project");
const Task = require("../models/Task");

const getAdminDashboard = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can view this dashboard." });
    }

    const now = new Date();
    const [totalTasks, overdueTasks, statusStats, perUserStats] = await Promise.all([
      Task.countDocuments({ projectId }),
      Task.countDocuments({
        projectId,
        dueDate: { $lt: now },
        status: { $ne: "Done" }
      }),
      Task.aggregate([
        { $match: { projectId: project._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { projectId: project._id } },
        {
          $group: {
            _id: "$assignedTo",
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            userId: "$user._id",
            name: "$user.name",
            email: "$user.email",
            total: 1,
            done: 1
          }
        }
      ])
    ]);

    const doneTasks = statusStats.find((item) => item._id === "Done")?.count || 0;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return res.json({
      totalTasks,
      overdueTasks,
      completionRate,
      statusStats,
      tasksPerUser: perUserStats
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load admin dashboard." });
  }
};

const getMemberDashboard = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("projectId", "name")
      .sort({ dueDate: 1, createdAt: -1 });

    const now = new Date();
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((task) => task.status === "Todo").length;
    const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length;
    const doneTasks = tasks.filter((task) => task.status === "Done").length;
    const dueTasks = tasks.filter(
      (task) => task.dueDate && task.dueDate >= now && task.status !== "Done"
    );
    const overdueTasks = tasks.filter(
      (task) => task.dueDate && task.dueDate < now && task.status !== "Done"
    ).length;

    return res.json({
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      dueTasks: dueTasks.slice(0, 6),
      overdueTasks
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load member dashboard." });
  }
};

module.exports = {
  getAdminDashboard,
  getMemberDashboard
};
