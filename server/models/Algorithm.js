const mongoose = require("mongoose");

const algorithmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    timeComplexity: {
      best: {
        type: String,
      },
      average: {
        type: String,
      },
      worst: {
        type: String,
      },
    },

    spaceComplexity: {
      type: String,
    },

    applications: [
      {
        type: String,
      },
    ],

    advantages: [
      {
        type: String,
      },
    ],

    disadvantages: [
      {
        type: String,
      },
    ],

    implementations: {
      python: {
        type: String,
      },
      java: {
        type: String,
      },
      cpp: {
        type: String,
      },
      javascript: {
        type: String,
      },
      c: {
        type: String,
      },
    },

    visualizationType: {
      type: String,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Algorithm", algorithmSchema);