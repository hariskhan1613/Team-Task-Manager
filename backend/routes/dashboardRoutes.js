const express = require("express");
const {
  getAdminDashboard,
  getMemberDashboard
} = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/admin/:projectId", getAdminDashboard);
router.get("/member", getMemberDashboard);

module.exports = router;
