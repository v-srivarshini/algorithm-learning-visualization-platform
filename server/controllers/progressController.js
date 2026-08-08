const Progress = require("../models/Progress");

// Get all progress for logged-in user
const getMyProgress = async (req, res) => {
  try {
    const progress = await Progress.find({
      user: req.user.userId,
    })
      .populate("algorithm", "name category difficulty")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      count: progress.length,
      progress,
    });
  } catch (error) {
    console.error("Get progress error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get progress for one algorithm
const getAlgorithmProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.userId,
      algorithm: req.params.algorithmId,
    }).populate(
      "algorithm",
      "name category difficulty"
    );

    if (!progress) {
      return res.status(404).json({
        message: "Progress not found",
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error("Get algorithm progress error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update algorithm progress
const updateProgress = async (req, res) => {
  try {
    const {
      status,
      completed,
    } = req.body;

    const progress = await Progress.findOneAndUpdate(
      {
        user: req.user.userId,
        algorithm: req.params.algorithmId,
      },
      {
        status,
        completed,
        lastAccessed: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate(
      "algorithm",
      "name category difficulty"
    );

    res.status(200).json({
      message: "Progress updated successfully",
      progress,
    });
  } catch (error) {
    console.error("Update progress error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getProgressSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const progressRecords = await Progress.find({
      user: userId,
    }).populate(
      "algorithm",
      "name category difficulty"
    );

    const total = progressRecords.length;

    const completed = progressRecords.filter(
      (item) => item.completed === true
    ).length;

    const inProgress = progressRecords.filter(
      (item) => item.completed === false
    ).length;

    const completionPercentage =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    // Category-wise statistics
    const categoryMap = {};

    progressRecords.forEach((item) => {
      if (!item.algorithm) return;

      const category =
        item.algorithm.category || "Other";

      if (!categoryMap[category]) {
        categoryMap[category] = {
          total: 0,
          completed: 0,
          inProgress: 0,
        };
      }

      categoryMap[category].total++;

      if (item.completed) {
        categoryMap[category].completed++;
      } else {
        categoryMap[category].inProgress++;
      }
    });

    const categoryProgress = Object.entries(
      categoryMap
    ).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      inProgress: data.inProgress,
      completionPercentage:
        data.total > 0
          ? Math.round(
              (data.completed / data.total) * 100
            )
          : 0,
    }));

    res.status(200).json({
      overall: {
        total,
        completed,
        inProgress,
        completionPercentage,
      },

      categoryProgress,
    });
  } catch (error) {
    console.error(
      "Get progress summary error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getMyProgress,
  getAlgorithmProgress,
  getProgressSummary,
  updateProgress,
};