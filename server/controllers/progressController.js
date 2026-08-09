
const Progress = require("../models/Progress");
const Algorithm = require("../models/Algorithm");

// ==========================================
// Get all progress for logged-in user
// ==========================================
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

// ==========================================
// Get progress for one algorithm
// ==========================================
const getAlgorithmProgress = async (req, res) => {
  try {
    const { algorithmId } = req.params;

    // Validate algorithm ID
    if (!algorithmId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid algorithm ID",
      });
    }

    const progress = await Progress.findOne({
      user: req.user.userId,
      algorithm: algorithmId,
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
    console.error(
      "Get algorithm progress error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Update algorithm progress
// ==========================================
const updateProgress = async (req, res) => {
  try {
    const { status, completed } = req.body;
    const { algorithmId } = req.params;

    // ------------------------------------------
    // Validate algorithm ID
    // ------------------------------------------
    if (!algorithmId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid algorithm ID",
      });
    }

    // ------------------------------------------
    // Check whether algorithm exists
    // ------------------------------------------
    const algorithm = await Algorithm.findById(
      algorithmId
    );

    if (!algorithm) {
      return res.status(404).json({
        message: "Algorithm not found",
      });
    }

    // ------------------------------------------
    // Validate status
    // ------------------------------------------
    const validStatuses = [
      "not-started",
      "in-progress",
      "completed",
    ];

    if (
      status !== undefined &&
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid status. Use not-started, in-progress, or completed.",
      });
    }

    // ------------------------------------------
    // Validate completed
    // ------------------------------------------
    if (
      completed !== undefined &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        message: "completed must be true or false",
      });
    }

    // ------------------------------------------
    // Determine final values
    // ------------------------------------------
    let finalStatus = status;
    let finalCompleted = completed;

    // If status is completed
    if (status === "completed") {
      finalStatus = "completed";
      finalCompleted = true;
    }

    // If completed is true
    else if (completed === true) {
      finalStatus = "completed";
      finalCompleted = true;
    }

    // If status is in-progress
    else if (status === "in-progress") {
      finalStatus = "in-progress";
      finalCompleted = false;
    }

    // If status is not-started
    else if (status === "not-started") {
      finalStatus = "not-started";
      finalCompleted = false;
    }

    // ------------------------------------------
    // If only completed=false is sent
    // ------------------------------------------
    else if (completed === false) {
      finalCompleted = false;

      // Don't automatically overwrite an existing
      // status unless needed.
      if (!status) {
        finalStatus = "in-progress";
      }
    }

    // ------------------------------------------
    // Default values for new progress record
    // ------------------------------------------
    if (!finalStatus) {
      finalStatus = "in-progress";
    }

    if (finalCompleted === undefined) {
      finalCompleted = false;
    }

    // ------------------------------------------
    // Update / Create progress
    // ------------------------------------------
    const progress =
      await Progress.findOneAndUpdate(
        {
          user: req.user.userId,
          algorithm: algorithmId,
        },
        {
          status: finalStatus,
          completed: finalCompleted,
          lastAccessed: new Date(),
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
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
    console.error(
      "Update progress error:",
      error
    );

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid progress data",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Get progress summary
// ==========================================
const getProgressSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const progressRecords =
      await Progress.find({
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
      (item) => item.status === "in-progress"
    ).length;

    const notStarted = progressRecords.filter(
      (item) => item.status === "not-started"
    ).length;

    const completionPercentage =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    // ------------------------------------------
    // Category-wise statistics
    // ------------------------------------------
    const categoryMap = {};

    progressRecords.forEach((item) => {
      if (!item.algorithm) {
        return;
      }

      const category =
        item.algorithm.category || "Other";

      if (!categoryMap[category]) {
        categoryMap[category] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
        };
      }

      categoryMap[category].total++;

      if (item.status === "completed") {
        categoryMap[category].completed++;
      } else if (
        item.status === "in-progress"
      ) {
        categoryMap[category].inProgress++;
      } else if (
        item.status === "not-started"
      ) {
        categoryMap[category].notStarted++;
      }
    });

    const categoryProgress = Object.entries(
      categoryMap
    ).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      inProgress: data.inProgress,
      notStarted: data.notStarted,
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
        notStarted,
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

// ==========================================
// Export controllers
// ==========================================
module.exports = {
  getMyProgress,
  getAlgorithmProgress,
  getProgressSummary,
  updateProgress,
};

