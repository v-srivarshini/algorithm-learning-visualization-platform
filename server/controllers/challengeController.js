const Challenge = require("../models/Challenge");
const ChallengeSubmission = require(
  "../models/ChallengeSubmission"
);

// Get all challenges
const getChallenges = async (req, res) => {
  try {
    const { category, difficulty, algorithm, search } = req.query;

    const filter = {
  isPublished: true,
};

    if (category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    if (difficulty) {
      filter.difficulty = {
        $regex: `^${difficulty}$`,
        $options: "i",
      };
    }

    if (algorithm) {
      filter.algorithm = algorithm;
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const challenges = await Challenge.find(filter)
      .populate("algorithm", "name category")
      .select("-solution")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: challenges.length,
      challenges,
    });
  } catch (error) {
    console.error("Get challenges error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one challenge
const getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate("algorithm", "name category")
      .select("-solution");

    if (!challenge) {
      return res.status(404).json({
        message: "Challenge not found",
      });
    }

    res.status(200).json(challenge);
  } catch (error) {
    console.error("Get challenge error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Create challenge
const createChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.create({
      ...req.body,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: "Challenge created successfully",
      challenge,
    });
  } catch (error) {
    console.error("Create challenge error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update challenge
const updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!challenge) {
      return res.status(404).json({
        message: "Challenge not found",
      });
    }

    res.status(200).json({
      message: "Challenge updated successfully",
      challenge,
    });
  } catch (error) {
    console.error("Update challenge error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Delete challenge
const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(
      req.params.id
    );

    if (!challenge) {
      return res.status(404).json({
        message: "Challenge not found",
      });
    }

    // Remove all submissions related to this challenge
    await ChallengeSubmission.deleteMany({
      challenge: req.params.id,
    });

    res.status(200).json({
      message:
        "Challenge and related submissions deleted successfully",
    });
  } catch (error) {
    console.error("Delete challenge error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


const submitChallenge = async (req, res) => {
  try {
    const { language, code } = req.body;

    const { id } = req.params;

    if (!language || !code) {
      return res.status(400).json({
        message: "Language and code are required",
      });
    }

const challenge = await Challenge.findOne({
  _id: id,
  isPublished: true,
});

    if (!challenge) {
      return res.status(404).json({
        message: "Challenge not found",
      });
    }

    const submission = await ChallengeSubmission.create({
      user: req.user.userId,
      challenge: id,
      language,
      code,
      status: "Pending",
    });

    res.status(201).json({
      message: "Challenge submitted successfully",
      submission: {
        id: submission._id,
        challenge: submission.challenge,
        language: submission.language,
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback,
        submittedAt: submission.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Submit challenge error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const submissions =
      await ChallengeSubmission.find({
        user: req.user.userId,
      })
        .populate(
          "challenge",
          "title category difficulty"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error(
      "Get submissions error:",
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
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
    submitChallenge,
    getMySubmissions,
    evaluateSubmission,
};