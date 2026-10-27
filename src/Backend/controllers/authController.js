// src/Backend/Controllers/authController.js
// Handles: register, login, verifyToken, changePassword, forgotPassword, resetPassword

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../Models/User");
const { JWT_SECRET, hashPassword, comparePassword, formatDoc } = require("../Middleware/auth");

// POST /users  — Register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const cleanEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: cleanEmail }))
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await hashPassword(password);
    const assignedRole = role === "teacher" ? "teacher" : "student";

    const newUser = await User.create({
      customId: req.body.id || new mongoose.Types.ObjectId().toString(),
      name: name || "User",
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
    });

    const userObj = formatDoc(newUser);
    const token = jwt.sign(
      { id: userObj.id, email: userObj.email, name: userObj.name, role: userObj.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ ...userObj, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await comparePassword(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const userObj = formatDoc(user);
    const token = jwt.sign(
      { id: userObj.id, email: userObj.email, name: userObj.name, role: userObj.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /auth/verify
const verifyToken = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user: formatDoc(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Current password and new password are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await comparePassword(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: "Incorrect current password" });

    user.password = await hashPassword(newPassword);
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ error: "No account found with this email" });

    const resetToken = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    res.json({
      success: true,
      message: "Reset token generated. Valid for 15 minutes.",
      resetToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, currentPassword, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ error: "Email and new password are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "Password must contain at least 6 characters" });

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ error: "No account found with this email" });

    let isAuthorized = false;

    if (resetToken) {
      if (
        user.resetToken &&
        user.resetToken === resetToken &&
        user.resetTokenExpiry &&
        new Date(user.resetTokenExpiry) > new Date()
      ) {
        isAuthorized = true;
      } else {
        return res.status(403).json({ error: "Invalid or expired reset token" });
      }
    } else if (currentPassword) {
      const match = await comparePassword(currentPassword, user.password);
      if (match) {
        isAuthorized = true;
      } else {
        return res.status(401).json({ error: "Incorrect current password" });
      }
    } else {
      return res.status(400).json({
        error: "Password reset requires a valid resetToken or currentPassword.",
      });
    }

    if (isAuthorized) {
      user.password = await hashPassword(newPassword);
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      return res.json({ success: true, message: "Password updated successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
