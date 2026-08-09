const User = require("../models/User");
const Algorithm = require("../models/Algorithm");
const Quiz = require("../models/Quiz");
const Challenge = require("../models/Challenge");
const Progress = require("../models/Progress");
const Bookmark = require("../models/Bookmark");
const QuizAttempt = require("../models/QuizAttempt");
const ChallengeSubmission = require("../models/ChallengeSubmission");

// =====================================================
// GET OVERALL PLATFORM STATISTICS
// =====================================================

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAlgorithms,
      totalQuizzes,
      totalChallenges,
      totalProgressRecords,
      totalBookmarks,
      completedAlgorithms,
    ] = await Promise.all([
      User.countDocuments(),
      Algorithm.countDocuments({ isPublished: true }),
      Quiz.countDocuments({ isPublished: true }),
      Challenge.countDocuments({ isPublished: true }),
      Progress.countDocuments(),
      Bookmark.countDocuments(),
      Progress.countDocuments({ completed: true }),
    ]);

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


// =====================================================
// GET ALL USERS
// =====================================================

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


// =====================================================
// GET QUIZ PERFORMANCE
// =====================================================

const getQuizPerformance = async (req, res) => {
  try {
    const totalAttempts = await QuizAttempt.countDocuments();

    // Overall quiz performance
    const overallPerformance = await QuizAttempt.aggregate([
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

    // Performance for each quiz
    const quizPerformance = await QuizAttempt.aggregate([
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
          preserveNullAndEmptyArrays: false,
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

      {
        $sort: {
          attempts: -1,
        },
      },
    ]);

    let overall = {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
    };

    if (overallPerformance.length > 0) {
      overall = {
        averageScore: Number(
          (overallPerformance[0].averageScore || 0).toFixed(2)
        ),

        highestScore:
          overallPerformance[0].highestScore || 0,

        lowestScore:
          overallPerformance[0].lowestScore || 0,
      };
    }

    res.status(200).json({
      totalAttempts,

      overall,

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


// =====================================================
// GET CHALLENGE PERFORMANCE
// =====================================================

const getChallengePerformance = async (req, res) => {
  try {
    const [
      totalSubmissions,
      accepted,
      rejected,
      pending,
    ] = await Promise.all([
      ChallengeSubmission.countDocuments(),

      ChallengeSubmission.countDocuments({
        status: "Accepted",
      }),

      ChallengeSubmission.countDocuments({
        status: "Rejected",
      }),

      ChallengeSubmission.countDocuments({
        status: "Pending",
      }),
    ]);

    // Score statistics for accepted submissions
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

    // Performance for each challenge
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
                  {
                    $eq: ["$status", "Accepted"],
                  },
                  1,
                  0,
                ],
              },
            },

            rejected: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "Rejected"],
                  },
                  1,
                  0,
                ],
              },
            },

            pending: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "Pending"],
                  },
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
            preserveNullAndEmptyArrays: false,
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
                {
                  $ifNull: [
                    "$averageScore",
                    0,
                  ],
                },
                2,
              ],
            },

            challengeTitle:
              "$challenge.title",
          },
        },

        {
          $sort: {
            submissions: -1,
          },
        },
      ]);

    const acceptanceRate =
      totalSubmissions > 0
        ? Number(
            (
              (accepted / totalSubmissions) *
              100
            ).toFixed(2)
          )
        : 0;

    const averageScore =
      scoreData.length > 0
        ? Number(
            (
              scoreData[0].averageScore || 0
            ).toFixed(2)
          )
        : 0;

    const highestScore =
      scoreData.length > 0
        ? scoreData[0].highestScore || 0
        : 0;

    res.status(200).json({
      overall: {
        totalSubmissions,

        accepted,

        rejected,

        pending,

        acceptanceRate,

        averageScore,

        highestScore,
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


// =====================================================
// EVALUATE CHALLENGE SUBMISSION
// =====================================================

const evaluateSubmission = async (req, res) => {
  try {
    const {
      status,
      score,
      feedback,
    } = req.body;

    // Validate status
    if (
      !["Accepted", "Rejected"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be Accepted or Rejected",
      });
    }

    // Validate score
    if (
      score !== undefined &&
      (
        typeof score !== "number" ||
        score < 0 ||
        score > 100
      )
    ) {
      return res.status(400).json({
        message:
          "Score must be a number between 0 and 100",
      });
    }

    // Find submission first
    const existingSubmission =
      await ChallengeSubmission.findById(
        req.params.id
      );

    if (!existingSubmission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    // Don't allow already evaluated submissions
    if (
      existingSubmission.status !== "Pending"
    ) {
      return res.status(400).json({
        message:
          "This submission has already been evaluated",
      });
    }

    // Update submission
    const submission =
      await ChallengeSubmission.findByIdAndUpdate(
        req.params.id,

        {
          status,

          score:
            score !== undefined
              ? score
              : 0,

          feedback:
            typeof feedback === "string"
              ? feedback.trim()
              : "",
        },

        {
          new: true,

          runValidators: true,
        }
      )
        .populate(
          "challenge",
          "title category difficulty"
        )
        .populate(
          "user",
          "name email"
        );

    res.status(200).json({
      message:
        "Submission evaluated successfully",

      submission: {
        id: submission._id,

        challenge:
          submission.challenge,

        user: submission.user,

        language:
          submission.language,

        status:
          submission.status,

        score:
          submission.score,

        feedback:
          submission.feedback,

        submittedAt:
          submission.createdAt,

        evaluatedAt:
          submission.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Evaluate submission error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getStats,
  getUsers,
  getQuizPerformance,
  getChallengePerformance,
  evaluateSubmission,
};