const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const algorithmRoutes = require("./routes/algorithmRoutes");
const quizRoutes = require("./routes/quizRoutes");
const progressRoutes = require("./routes/progressRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/algorithms", algorithmRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Algorithm Learning Platform API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});