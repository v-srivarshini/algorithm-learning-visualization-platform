const express = require("express");

const {
  getStats,
  getUsers,
  getQuizPerformance,
    getChallengePerformance,
   

} = require("../controllers/adminController");
const { evaluateSubmission } = require("../controllers/challengeController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/stats",
  protect,
  adminOnly,
  getStats
);

router.get(
  "/users",
  protect,
  adminOnly,
  getUsers
);

router.get(
  "/quiz-performance",
  protect,
  adminOnly,
  getQuizPerformance
);

router.get(
  "/challenge-performance",
  protect,
  adminOnly,
  getChallengePerformance
);

router.patch(
  "/submissions/:id",
  protect,
  adminOnly,
  evaluateSubmission
);

module.exports = router;