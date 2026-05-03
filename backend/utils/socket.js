const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const Project = require("../models/Project");
const User = require("../models/User");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PATCH", "DELETE"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("_id name email");
      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);

    try {
      const projects = await Project.find({
        $or: [{ admin: userId }, { members: userId }]
      }).select("_id");

      projects.forEach((project) => {
        socket.join(`project:${project._id.toString()}`);
      });
    } catch (error) {
      console.error("Socket project join error:", error);
    }

    socket.on("project:join", (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on("project:leave", (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

const emitToUser = (userId, event, payload) => {
  if (!userId) return;
  getIO().to(`user:${userId.toString()}`).emit(event, payload);
};

const emitToProject = (projectId, event, payload) => {
  if (!projectId) return;
  getIO().to(`project:${projectId.toString()}`).emit(event, payload);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToProject
};
