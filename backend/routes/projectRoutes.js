const express = require("express");
const {
  createProject,
  getMyProjects,
  getProjectById,
  getProjectMembers,
  getProjectProgress,
  inviteUser,
  removeMember
} = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  requireProjectAdmin,
  requireProjectMember
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createProject);
router.get("/my", getMyProjects);
router.get("/:id", getProjectById);
router.get("/:id/members", getProjectMembers);
router.get("/:id/progress", requireProjectAdmin, getProjectProgress);
router.post("/:id/invite", requireProjectAdmin, inviteUser);
router.delete("/:id/members/:memberId", requireProjectAdmin, removeMember);
router.get("/:projectId/member-access", requireProjectMember, (req, res) =>
  res.json({ ok: true })
);

module.exports = router;
