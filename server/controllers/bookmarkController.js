const Bookmark = require("../models/Bookmark");
const Algorithm = require("../models/Algorithm");

// Get my bookmarks
const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      user: req.user.userId,
    })
      .populate(
        "algorithm",
        "name category difficulty description"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: bookmarks.length,
      bookmarks,
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Add bookmark
const addBookmark = async (req, res) => {
  try {
    const { algorithmId } = req.params;

    const algorithm = await Algorithm.findById(algorithmId);

    if (!algorithm) {
      return res.status(404).json({
        message: "Algorithm not found",
      });
    }

    const existingBookmark = await Bookmark.findOne({
      user: req.user.userId,
      algorithm: algorithmId,
    });

    if (existingBookmark) {
      return res.status(400).json({
        message: "Algorithm already bookmarked",
      });
    }

    const bookmark = await Bookmark.create({
      user: req.user.userId,
      algorithm: algorithmId,
    });

    const populatedBookmark = await bookmark.populate(
      "algorithm",
      "name category difficulty description"
    );

    res.status(201).json({
      message: "Algorithm bookmarked successfully",
      bookmark: populatedBookmark,
    });
  } catch (error) {
    console.error("Add bookmark error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Remove bookmark
const removeBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user.userId,
      algorithm: req.params.algorithmId,
    });

    if (!bookmark) {
      return res.status(404).json({
        message: "Bookmark not found",
      });
    }

    res.status(200).json({
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Remove bookmark error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
};