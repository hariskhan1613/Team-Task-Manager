const express = require("express");
const {
  createTask,
  getMyTasks,
  getProjectTasks,
  reassignTask,
  updateTaskStatus
} = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTask);
router.get("/my", getMyTasks);
router.get("/project/:projectId", getProjectTasks);
router.patch("/:taskId/status", updateTaskStatus);
router.patch("/:taskId/assign", reassignTask);

module.exports = router;
