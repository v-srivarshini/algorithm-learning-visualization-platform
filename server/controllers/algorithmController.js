const Algorithm = require("../models/Algorithm");

// Get all algorithms
const getAlgorithms = async (req, res) => {
  try {
    const { search, category, difficulty } = req.query;

    const filter = {};

    // Search by name or description
    if (search) {
      filter.$or = [
        {
          name: {
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

    // Filter by category
    if (category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    // Filter by difficulty
    if (difficulty) {
      filter.difficulty = {
        $regex: `^${difficulty}$`,
        $options: "i",
      };
    }

    const algorithms = await Algorithm.find(filter).sort({
      name: 1,
    });

    res.status(200).json({
      count: algorithms.length,
      algorithms,
    });
  } catch (error) {
    console.error("Get algorithms error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// Get single algorithm
const getAlgorithmById = async (req, res) => {
  try {
    const algorithm = await Algorithm.findById(req.params.id);

    if (!algorithm) {
      return res.status(404).json({
        message: "Algorithm not found",
      });
    }

    res.status(200).json(algorithm);
  } catch (error) {
    console.error("Get algorithm error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// Create algorithm
const createAlgorithm = async (req, res) => {
  try {
    const algorithm = await Algorithm.create({
      ...req.body,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: "Algorithm created successfully",
      algorithm,
    });
  } catch (error) {
    console.error("Create algorithm error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update algorithm
const updateAlgorithm = async (req, res) => {
  try {
    const algorithm = await Algorithm.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!algorithm) {
      return res.status(404).json({
        message: "Algorithm not found",
      });
    }

    res.status(200).json({
      message: "Algorithm updated successfully",
      algorithm,
    });
  } catch (error) {
    console.error("Update algorithm error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Delete algorithm
const deleteAlgorithm = async (req, res) => {
  try {
    const algorithm = await Algorithm.findByIdAndDelete(req.params.id);

    if (!algorithm) {
      return res.status(404).json({
        message: "Algorithm not found",
      });
    }

    res.status(200).json({
      message: "Algorithm deleted successfully",
    });
  } catch (error) {
    console.error("Delete algorithm error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getAlgorithms,
  getAlgorithmById,
  createAlgorithm,
  updateAlgorithm,
  deleteAlgorithm,
};