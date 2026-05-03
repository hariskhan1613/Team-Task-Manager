const express = require("express");
const {
  getMyInvitations,
  respondToInvitation
} = require("../controllers/invitationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMyInvitations);
router.patch("/:id/respond", respondToInvitation);

module.exports = router;
