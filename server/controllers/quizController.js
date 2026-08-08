const Quiz = require("../models/Quiz");

const QuizAttempt = require("../models/QuizAttempt");

// Get all quizzes
const getQuizzes = async (req, res) => {
  try {
    const { category, difficulty, algorithm } = req.query;

    const filter = {};

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

    const quizzes = await Quiz.find(filter)
      .populate("algorithm", "name category")
      .select("-questions.correctAnswer")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: quizzes.length,
      quizzes,
    });
  } catch (error) {
    console.error("Get quizzes error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one quiz
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("algorithm", "name category")
      .select("-questions.correctAnswer");

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Get quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Create quiz
const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    console.error("Create quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update quiz
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    console.error("Update quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Delete quiz
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("Delete quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Submit quiz
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array",
      });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    let score = 0;

    const results = quiz.questions.map((question) => {
      const submittedAnswer = answers.find(
        (answer) =>
          answer.questionId === question._id.toString()
      );

      const selectedAnswer = submittedAnswer
        ? submittedAnswer.selectedAnswer
        : null;

      const isCorrect =
        selectedAnswer === question.correctAnswer;

      if (isCorrect) {
        score++;
      }

      return {
        questionId: question._id,
        question: question.question,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const totalQuestions = quiz.questions.length;

    const percentage =
      totalQuestions > 0
        ? Math.round((score / totalQuestions) * 100)
        : 0;

    // Save quiz attempt
    const attempt = await QuizAttempt.create({
      user: req.user.userId,
      quiz: quiz._id,
      score,
      totalQuestions,
      percentage,
      answers: results.map((result) => ({
        questionId: result.questionId,
        selectedAnswer: result.selectedAnswer,
        correctAnswer: result.correctAnswer,
        isCorrect: result.isCorrect,
      })),
    });

    res.status(200).json({
      message: "Quiz submitted successfully",

      result: {
        quizId: quiz._id,
        attemptId: attempt._id,
        score,
        totalQuestions,
        percentage,
        results,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getQuizzes,
  getQuizById,
  submitQuiz,

  createQuiz,
  updateQuiz,
  deleteQuiz,
};