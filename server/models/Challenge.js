const mongoose = require("mongoose");

const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
    },

    output: {
      type: String,
      required: true,
    },

    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    problemStatement: {
      type: String,
      required: true,
    },

    algorithm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Algorithm",
      default: null,
    },

    category: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    examples: {
      type: [exampleSchema],
      default: [],
    },

    constraints: {
      type: [String],
      default: [],
    },

    inputFormat: {
      type: String,
      default: "",
    },

    outputFormat: {
      type: String,
      default: "",
    },

    supportedLanguages: {
      type: [String],
      default: [
        "C",
        "C++",
        "Java",
        "Python",
        "JavaScript",
      ],
    },

    starterCode: {
      c: {
        type: String,
        default: "",
      },
      cpp: {
        type: String,
        default: "",
      },
      java: {
        type: String,
        default: "",
      },
      python: {
        type: String,
        default: "",
      },
      javascript: {
        type: String,
        default: "",
      },
    },

    solution: {
      c: {
        type: String,
        default: "",
      },
      cpp: {
        type: String,
        default: "",
      },
      java: {
        type: String,
        default: "",
      },
      python: {
        type: String,
        default: "",
      },
      javascript: {
        type: String,
        default: "",
      },
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

module.exports = mongoose.model("Challenge", challengeSchema);