const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    algorithm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Algorithm",
      required: true,
    },

    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
    },

    completed: {
      type: Boolean,
      default: false,
    },

    quizAttempts: {
      type: Number,
      default: 0,
    },

    bestQuizScore: {
      type: Number,
      default: 0,
    },

    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One progress record per user + algorithm
progressSchema.index(
  { user: 1, algorithm: 1 },
  { unique: true }
);

module.exports = mongoose.model("Progress", progressSchema);