const express = require("express");

const {
  getBookmarks,
  addBookmark,
  removeBookmark,
} = require("../controllers/bookmarkController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getBookmarks);

router.post(
  "/:algorithmId",
  protect,
  addBookmark
);

router.delete(
  "/:algorithmId",
  protect,
  removeBookmark
);

module.exports = router;