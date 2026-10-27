// src/Backend/Controllers/fileResultController.js
// Handles: getFileResult, createFileResult, updateFileResult

const mongoose = require("mongoose");
const FileResult = require("../Models/FileResult");
const { formatDoc } = require("../Middleware/auth");

// GET /fileresult
const getFileResult = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "student") {
      query.email = req.user.email.toLowerCase();
    } else if (req.query.email) {
      query.email = req.query.email.toLowerCase().trim();
    }

    const data = await FileResult.find(query).lean();
    res.json(data.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /fileresult
const createFileResult = async (req, res) => {
  try {
    const item = { ...req.body };
    item.customId = req.body.id || new mongoose.Types.ObjectId().toString();
    item.email = req.user.email.toLowerCase();

    const created = await FileResult.create(item);
    res.status(201).json(formatDoc(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /fileresult/:id
const updateFileResult = async (req, res) => {
  try {
    const id = req.params.id;
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const existing = await FileResult.findOne(filter);
    if (!existing) {
      return res.status(404).json({ error: "FileResult not found" });
    }

    if (existing.email.toLowerCase() !== req.user.email.toLowerCase() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: You do not own this file result" });
    }

    const updated = await FileResult.findOneAndUpdate(filter, req.body, { new: true });
    res.json(formatDoc(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getFileResult,
  createFileResult,
  updateFileResult
};
