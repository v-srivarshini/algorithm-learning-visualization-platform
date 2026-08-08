const express = require("express");

const {
  getMyProgress,
  getAlgorithmProgress,
  updateProgress,
  getProgressSummary,
} = require("../controllers/progressController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyProgress);
router.get(
  "/summary",
  protect,
  getProgressSummary
);
router.get(
  "/:algorithmId",
  protect,
  getAlgorithmProgress
);

router.put(
  "/:algorithmId",
  protect,
  updateProgress
);



module.exports = router;