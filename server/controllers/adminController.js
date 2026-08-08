const User = require("../models/User");
const Algorithm = require("../models/Algorithm");
const Quiz = require("../models/Quiz");
const Challenge = require("../models/Challenge");
const Progress = require("../models/Progress");
const Bookmark = require("../models/Bookmark");
const QuizAttempt = require("../models/QuizAttempt");
const ChallengeSubmission = require("../models/ChallengeSubmission");

// Overall platform statistics
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAlgorithms,
      totalQuizzes,
      totalChallenges,
      totalProgressRecords,
      totalBookmarks,
    ] = await Promise.all([
      User.countDocuments(),
      Algorithm.countDocuments(),
      Quiz.countDocuments(),
      Challenge.countDocuments(),
      Progress.countDocuments(),
      Bookmark.countDocuments(),
    ]);

    const completedAlgorithms = await Progress.countDocuments({
      completed: true,
    });

    res.status(200).json({
      users: {
        total: totalUsers,
      },

      content: {
        algorithms: totalAlgorithms,
        quizzes: totalQuizzes,
        challenges: totalChallenges,
      },

      learning: {
        progressRecords: totalProgressRecords,
        completedAlgorithms,
        bookmarks: totalBookmarks,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getQuizPerformance = async (req, res) => {
  try {
    const totalAttempts =
      await QuizAttempt.countDocuments();

    const overallPerformance =
      await QuizAttempt.aggregate([
        {
          $group: {
            _id: null,
            averageScore: {
              $avg: "$percentage",
            },
            highestScore: {
              $max: "$percentage",
            },
            lowestScore: {
              $min: "$percentage",
            },
          },
        },
      ]);

    const quizPerformance =
      await QuizAttempt.aggregate([
        {
          $group: {
            _id: "$quiz",
            attempts: {
              $sum: 1,
            },
            averageScore: {
              $avg: "$percentage",
            },
            highestScore: {
              $max: "$percentage",
            },
            lowestScore: {
              $min: "$percentage",
            },
          },
        },
        {
          $lookup: {
            from: "quizzes",
            localField: "_id",
            foreignField: "_id",
            as: "quiz",
          },
        },
        {
          $unwind: {
            path: "$quiz",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            attempts: 1,
            averageScore: {
              $round: ["$averageScore", 2],
            },
            highestScore: 1,
            lowestScore: 1,
            quizTitle: "$quiz.title",
          },
        },
      ]);

    res.status(200).json({
      totalAttempts,
      overall:
        overallPerformance.length > 0
          ? {
              averageScore: Number(
                overallPerformance[0].averageScore.toFixed(2)
              ),
              highestScore:
                overallPerformance[0].highestScore,
              lowestScore:
                overallPerformance[0].lowestScore,
            }
          : {
              averageScore: 0,
              highestScore: 0,
              lowestScore: 0,
            },
      quizzes: quizPerformance,
    });
  } catch (error) {
    console.error(
      "Get quiz performance error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getChallengePerformance = async (req, res) => {
  try {
    const totalSubmissions =
      await ChallengeSubmission.countDocuments();

    const accepted =
      await ChallengeSubmission.countDocuments({
        status: "Accepted",
      });

    const rejected =
      await ChallengeSubmission.countDocuments({
        status: "Rejected",
      });

    const pending =
      await ChallengeSubmission.countDocuments({
        status: "Pending",
      });

    const scoreData =
      await ChallengeSubmission.aggregate([
        {
          $match: {
            status: "Accepted",
          },
        },
        {
          $group: {
            _id: null,
            averageScore: {
              $avg: "$score",
            },
            highestScore: {
              $max: "$score",
            },
          },
        },
      ]);

    const challengePerformance =
      await ChallengeSubmission.aggregate([
        {
          $group: {
            _id: "$challenge",

            submissions: {
              $sum: 1,
            },

            accepted: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "Accepted"] },
                  1,
                  0,
                ],
              },
            },

            rejected: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "Rejected"] },
                  1,
                  0,
                ],
              },
            },

            pending: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "Pending"] },
                  1,
                  0,
                ],
              },
            },

            averageScore: {
              $avg: "$score",
            },
          },
        },

        {
          $lookup: {
            from: "challenges",
            localField: "_id",
            foreignField: "_id",
            as: "challenge",
          },
        },

        {
          $unwind: {
            path: "$challenge",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,
            submissions: 1,
            accepted: 1,
            rejected: 1,
            pending: 1,

            averageScore: {
              $round: [
                { $ifNull: ["$averageScore", 0] },
                2,
              ],
            },

            challengeTitle: "$challenge.title",
          },
        },
      ]);

    res.status(200).json({
      overall: {
        totalSubmissions,
        accepted,
        rejected,
        pending,

        acceptanceRate:
          totalSubmissions > 0
            ? Number(
                (
                  (accepted / totalSubmissions) *
                  100
                ).toFixed(2)
              )
            : 0,

        averageScore:
          scoreData.length > 0
            ? Number(
                scoreData[0].averageScore.toFixed(2)
              )
            : 0,

        highestScore:
          scoreData.length > 0
            ? scoreData[0].highestScore
            : 0,
      },

      challenges: challengePerformance,
    });
  } catch (error) {
    console.error(
      "Get challenge performance error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


const evaluateSubmission = async (req, res) => {
  try {
    const { status, score, feedback } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Accepted or Rejected",
      });
    }

    if (
      score !== undefined &&
      (typeof score !== "number" || score < 0 || score > 100)
    ) {
      return res.status(400).json({
        message: "Score must be between 0 and 100",
      });
    }

    const submission =
      await ChallengeSubmission.findByIdAndUpdate(
        req.params.id,
        {
          status,
          score: score ?? 0,
          feedback: feedback || "",
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("challenge", "title category difficulty")
        .populate("user", "name email");

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    res.status(200).json({
      message: "Submission evaluated successfully",
      submission,
    });
  } catch (error) {
    console.error("Evaluate submission error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getStats,
  getUsers,
  getQuizPerformance,
  getChallengePerformance,
    evaluateSubmission,
};