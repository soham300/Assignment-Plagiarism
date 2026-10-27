// src/Backend/Controllers/fileDataController.js
// Handles: getFileData, createFileData, updateFileData

const mongoose = require("mongoose");
const FileData = require("../Models/FileData");
const { formatDoc } = require("../Middleware/auth");

// GET /filedata
const getFileData = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "student") {
      query.email = req.user.email.toLowerCase();
    } else if (req.query.email) {
      query.email = req.query.email.toLowerCase().trim();
    }

    const data = await FileData.find(query).lean();
    res.json(data.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /filedata
const createFileData = async (req, res) => {
  try {
    const item = { ...req.body };
    item.customId = req.body.id || new mongoose.Types.ObjectId().toString();
    item.email = req.user.email.toLowerCase();

    const created = await FileData.create(item);
    res.status(201).json(formatDoc(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /filedata/:id
const updateFileData = async (req, res) => {
  try {
    const id = req.params.id;
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const existing = await FileData.findOne(filter);
    if (!existing) {
      return res.status(404).json({ error: "FileData not found" });
    }

    if (existing.email.toLowerCase() !== req.user.email.toLowerCase() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: You do not own this file data" });
    }

    const updated = await FileData.findOneAndUpdate(filter, req.body, { new: true });
    res.json(formatDoc(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getFileData,
  createFileData,
  updateFileData
};
