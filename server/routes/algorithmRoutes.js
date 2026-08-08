const express = require("express");

const {
  getAlgorithms,
  getAlgorithmById,
  createAlgorithm,
  updateAlgorithm,
  deleteAlgorithm,
} = require("../controllers/algorithmController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public/read routes
router.get("/", getAlgorithms);
router.get("/:id", getAlgorithmById);

// Admin routes
router.post("/", protect, adminOnly, createAlgorithm);
router.put("/:id", protect, adminOnly, updateAlgorithm);
router.delete("/:id", protect, adminOnly, deleteAlgorithm);

module.exports = router;