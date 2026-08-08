const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

bookmarkSchema.index(
  { user: 1, algorithm: 1 },
  { unique: true }
);

module.exports = mongoose.model("Bookmark", bookmarkSchema);