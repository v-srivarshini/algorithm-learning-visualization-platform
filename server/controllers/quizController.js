const Quiz = require("../models/Quiz");

const QuizAttempt = require("../models/QuizAttempt");

const validateQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "Quiz must contain at least one question";
  }

  for (const question of questions) {
    if (
      !question.question ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      !question.correctAnswer
    ) {
      return "Each question must have a question, at least 2 options, and a correct answer";
    }

    if (!question.options.includes(question.correctAnswer)) {
      return `Correct answer must be one of the options for question: ${question.question}`;
    }
  }

  return null;
};

// Get all quizzes
const getQuizzes = async (req, res) => {
  try {
    const { category, difficulty, algorithm } = req.query;

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
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      isPublished: true,
    })
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
    const validationError = validateQuestions(req.body.questions);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

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
    if (req.body.questions) {
      const validationError = validateQuestions(
        req.body.questions
      );

      if (validationError) {
        return res.status(400).json({
          message: validationError,
        });
      }
    }

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

    // Remove all attempts related to this quiz
    await QuizAttempt.deleteMany({
      quiz: req.params.id,
    });

    res.status(200).json({
      message: "Quiz and related attempts deleted successfully",
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

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      isPublished: true,
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }
const questionIds = quiz.questions.map(
  (question) => question._id.toString()
);

const submittedQuestionIds = new Set();

for (const answer of answers) {
  if (!answer.questionId) {
    return res.status(400).json({
      message: "Question ID is required",
    });
  }

  if (!questionIds.includes(answer.questionId)) {
    return res.status(400).json({
      message: "Invalid question ID submitted",
    });
  }

  if (submittedQuestionIds.has(answer.questionId)) {
    return res.status(400).json({
      message: "Duplicate question answer submitted",
    });
  }

  submittedQuestionIds.add(answer.questionId);

  if (
    answer.selectedAnswer !== undefined &&
    answer.selectedAnswer !== null &&
    typeof answer.selectedAnswer !== "string"
  ) {
    return res.status(400).json({
      message: "Selected answer must be a string",
    });
  }
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

if (
  selectedAnswer !== null &&
  !question.options.includes(selectedAnswer)
) {
  return res.status(400).json({
    message: `Invalid answer submitted for question: ${question.question}`,
  });
}

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