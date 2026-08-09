const Algorithm = require("../models/Algorithm");
const Progress = require("../models/Progress");
const Bookmark = require("../models/Bookmark");

// Get all algorithms
const getAlgorithms = async (req, res) => {
  try {
    const { search, category, difficulty } = req.query;

    const filter = {
  isPublished: true,
};

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
   const algorithm = await Algorithm.findOne({
  _id: req.params.id,
  isPublished: true,
});

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

    // Remove related progress records
    await Progress.deleteMany({
      algorithm: req.params.id,
    });

    // Remove related bookmarks
    await Bookmark.deleteMany({
      algorithm: req.params.id,
    });

    res.status(200).json({
      message: "Algorithm and related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete algorithm error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const compareAlgorithms = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        message: "Algorithm IDs are required",
      });
    }

    const algorithmIds = ids.split(",");

    if (algorithmIds.length < 2) {
      return res.status(400).json({
        message: "At least 2 algorithms are required for comparison",
      });
    }

    if (algorithmIds.length > 5) {
      return res.status(400).json({
        message: "You can compare a maximum of 5 algorithms",
      });
    }

const algorithms = await Algorithm.find({
  _id: { $in: algorithmIds },
  isPublished: true,
}).select(
      "name category difficulty timeComplexity spaceComplexity applications advantages disadvantages"
    );

    if (algorithms.length !== algorithmIds.length) {
      return res.status(404).json({
        message: "One or more algorithms not found",
      });
    }

    res.status(200).json({
      count: algorithms.length,
      algorithms,
    });
  } catch (error) {
    console.error("Compare algorithms error:", error);

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
  compareAlgorithms,
};