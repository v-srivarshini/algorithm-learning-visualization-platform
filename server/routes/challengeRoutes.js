const express = require("express");

const {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  submitChallenge,
  getMySubmissions,
} = require("../controllers/challengeController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

// Read
router.get("/", getChallenges);
router.get(
  "/my-submissions",
  protect,
  getMySubmissions
);
router.get("/:id", getChallengeById);
router.post(
  "/:id/submit",
  protect,
  submitChallenge
);

// Admin management
router.post("/", protect, adminOnly, createChallenge);
router.put("/:id", protect, adminOnly, updateChallenge);
router.delete("/:id", protect, adminOnly, deleteChallenge);

module.exports = router;