const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const { emitToProject, emitToUser } = require("../utils/socket");

const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      receiver: req.user._id,
      status: "pending"
    })
      .populate("projectId", "name")
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    return res.json(invitations);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load invitations." });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["accepted", "rejected"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action must be accepted or rejected." });
    }

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    if (invitation.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Cannot respond to this invitation." });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ message: "Invitation already handled." });
    }

    if (action === "accepted") {
      await Project.findByIdAndUpdate(invitation.projectId, {
        $addToSet: { members: req.user._id }
      });
      invitation.status = "accepted";
      await invitation.save();
      emitToUser(req.user._id, "invitations:update", {
        projectId: invitation.projectId
      });
      emitToProject(invitation.projectId, "project:update", {
        projectId: invitation.projectId
      });
      emitToUser(req.user._id, "projects:update", {
        projectId: invitation.projectId
      });
      return res.json({ message: "Invitation accepted. You joined the project." });
    }

    invitation.status = "rejected";
    await invitation.save();
    await Invitation.findByIdAndDelete(id);
    emitToUser(req.user._id, "invitations:update", {
      projectId: invitation.projectId
    });
    return res.json({ message: "Invitation rejected and removed." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process invitation." });
  }
};

module.exports = {
  getMyInvitations,
  respondToInvitation
};
