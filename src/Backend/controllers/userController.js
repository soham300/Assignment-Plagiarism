// src/Backend/Controllers/userController.js
// Handles: getUsers, getUserById, updateUser

const mongoose = require("mongoose");
const User = require("../Models/User");
const { hashPassword, formatDoc } = require("../Middleware/auth");

// GET /users
const getUsers = async (req, res) => {
  try {
    const query = {};
    const userRole = req.user.role || "student";

    if (userRole === "student") {
      query.email = req.user.email.toLowerCase();
    } else if (req.query.email) {
      query.email = req.query.email.toLowerCase().trim();
    }

    const users = await User.find(query)
      .select("-password -resetToken -resetTokenExpiry")
      .lean();
    res.json(users.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /users/:id
const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).select("-password -resetToken -resetTokenExpiry");
    }
    if (!user) {
      user = await User.findOne({ customId: id }).select("-password -resetToken -resetTokenExpiry");
    }
    if (!user) return res.status(404).json({ error: "User not found" });

    if (
      req.user.role === "student" &&
      user.email.toLowerCase() !== req.user.email.toLowerCase()
    ) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to view other users" });
    }

    res.json(formatDoc(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /users/:id
const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const targetUser = await User.findOne(filter);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (
      targetUser.email.toLowerCase() !== req.user.email.toLowerCase() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Unauthorized: You can only update your own profile" });
    }

    const update = { ...req.body };
    delete update._id;
    delete update.customId;
    delete update.resetToken;
    delete update.resetTokenExpiry;

    if (update.password && !update.password.startsWith("$2")) {
      update.password = await hashPassword(update.password);
    }

    const updated = await User.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
    });
    res.json(formatDoc(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, getUserById, updateUser };
