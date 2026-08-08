const express = require("express");

const {
  getStudentDashboard,
} = require("../controllers/studentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  getStudentDashboard
);

module.exports = router;