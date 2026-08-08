const User = require("../models/User");
const Progress = require("../models/Progress");
const Bookmark = require("../models/Bookmark");
const QuizAttempt = require("../models/QuizAttempt");

const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      user,
      progress,
      bookmarks,
      recentAttempts,
    ] = await Promise.all([
      User.findById(userId).select("-password"),

      Progress.find({ user: userId })
        .populate(
          "algorithm",
          "name category difficulty"
        )
        .sort({ updatedAt: -1 }),

      Bookmark.find({ user: userId })
        .populate(
          "algorithm",
          "name category difficulty"
        )
        .sort({ createdAt: -1 }),

      QuizAttempt.find({ user: userId })
        .populate(
          "quiz",
          "title"
        )
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Progress summary
    const totalProgress = progress.length;

    const completed = progress.filter(
      (item) => item.completed
    ).length;

    const inProgress = progress.filter(
      (item) => !item.completed
    ).length;

    const completionPercentage =
      totalProgress > 0
        ? Math.round(
            (completed / totalProgress) * 100
          )
        : 0;

    // Quiz summary
    const totalQuizAttempts =
      recentAttempts.length;

    const averageQuizScore =
      totalQuizAttempts > 0
        ? Math.round(
            recentAttempts.reduce(
              (sum, attempt) =>
                sum + attempt.percentage,
              0
            ) / totalQuizAttempts
          )
        : 0;

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },

      progress: {
        total: totalProgress,
        completed,
        inProgress,
        completionPercentage,
        recent: progress.slice(0, 5),
      },

      bookmarks: {
        count: bookmarks.length,
        recent: bookmarks.slice(0, 5),
      },

      quizzes: {
        totalAttempts: totalQuizAttempts,
        averageScore: averageQuizScore,
        recentAttempts,
      },
    });
  } catch (error) {
    console.error(
      "Get student dashboard error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getStudentDashboard,
};