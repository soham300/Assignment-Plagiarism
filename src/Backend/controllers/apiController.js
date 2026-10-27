// src/Backend/Controllers/apiController.js
// Handles: health check, plagiarism check, spell check, and profile summary

const mongoose = require("mongoose");
const User = require("../Models/User");
const Report = require("../Models/Report");
const FileData = require("../Models/FileData");
const FileResult = require("../Models/FileResult");
const { compareDocuments } = require("../Services/plagiarismEngine");
const { detectSpellingMistakes } = require("../Services/spellCheckService");
const { formatDoc } = require("../Middleware/auth");

// GET /api/health
const getHealth = (req, res) => {
  res.json({
    status: "ok",
    database: "mongodb",
    connectionState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
};

// POST /api/check-similarity
const checkSimilarity = async (req, res) => {
  try {
    const { textA, textB, options } = req.body;
    if (typeof textA !== "string" || typeof textB !== "string") {
      return res.status(400).json({ error: "Both textA and textB strings are required" });
    }

    const result = await compareDocuments(textA, textB, options || {});
    res.json({
      success: true,
      result: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/spellcheck
const spellCheck = async (req, res) => {
  try {
    const { text, docLabel } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ error: "Text string is required" });
    }

    const mistakes = await detectSpellingMistakes(text, docLabel || "Document");
    res.json({
      success: true,
      mistakes: mistakes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/user-profile-summary
const getUserProfileSummary = async (req, res) => {
  try {
    const email = (req.query.email && req.user.role !== "student")
      ? req.query.email.toLowerCase().trim()
      : req.user.email.toLowerCase();

    const [user, fileData, reports, fileResult] = await Promise.all([
      User.findOne({ email }).select("-password -resetToken -resetTokenExpiry").lean(),
      FileData.findOne({ email }).lean(),
      Report.find({ email }).sort({ date: -1 }).lean(),
      FileResult.findOne({ email }).lean()
    ]);

    res.json({
      success: true,
      user: formatDoc(user),
      fileData: formatDoc(fileData),
      reports: (reports || []).map(formatDoc),
      fileResult: formatDoc(fileResult)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHealth,
  checkSimilarity,
  spellCheck,
  getUserProfileSummary
};
