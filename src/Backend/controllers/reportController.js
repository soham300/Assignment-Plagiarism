// src/Backend/Controllers/reportController.js
// Handles: getReports, getReportById, createReport, deleteReport

const mongoose = require("mongoose");
const Report = require("../Models/Report");
const { compareDocuments } = require("../Services/plagiarismEngine");
const { formatDoc } = require("../Middleware/auth");

// GET /reports
const getReports = async (req, res) => {
  try {
    const query = {};
    const userRole = req.user.role || "student";

    if (userRole === "student") {
      query.email = req.user.email.toLowerCase();
    } else if (req.query.email) {
      query.email = req.query.email.toLowerCase().trim();
    }

    const reports = await Report.find(query).sort({ date: -1 }).lean();
    res.json(reports.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /reports/:id
const getReportById = async (req, res) => {
  try {
    const id = req.params.id;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await Report.findById(id);
    }
    if (!report) {
      report = await Report.findOne({ customId: id });
    }
    if (!report) return res.status(404).json({ error: "Report not found" });

    const isOwner =
      report.email && report.email.toLowerCase() === req.user.email.toLowerCase();
    const isTeacher =
      req.user.role === "teacher" || req.user.role === "admin";

    if (!isOwner && !isTeacher) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not have permission to view this report" });
    }

    res.json(formatDoc(report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /reports  — Server authoritatively recomputes similarity score
const createReport = async (req, res) => {
  try {
    const reportData = { ...req.body };
    reportData.customId =
      req.body.id || new mongoose.Types.ObjectId().toString();

    if (req.user && req.user.email) {
      reportData.email = req.user.email.toLowerCase();
    } else if (reportData.email) {
      reportData.email = reportData.email.toLowerCase().trim();
    } else {
      return res.status(400).json({ error: "Email is required to save report" });
    }

    // Authoritative server-side score validation (prevents client spoofing)
    if (
      typeof reportData.textA === "string" &&
      typeof reportData.textB === "string"
    ) {
      const serverAnalysis = await compareDocuments(
        reportData.textA,
        reportData.textB,
        reportData.filters || {}
      );
      reportData.similarity         = serverAnalysis.similarity;
      reportData.coverageA          = serverAnalysis.coverageA;
      reportData.coverageB          = serverAnalysis.coverageB;
      reportData.symmetric          = true;
      reportData.matchingSections   = serverAnalysis.matchingSections;
      reportData.differentSections  = serverAnalysis.differentSections;
      reportData.matchingPhrases    = serverAnalysis.matchingPhrases;
      reportData.spellingMistakes   = serverAnalysis.spellingMistakes;
      reportData.filefirstmatches   = serverAnalysis.filefirstmatches;
      reportData.filesecondmatches  = serverAnalysis.filesecondmatches;
      reportData.commonPhrases      = serverAnalysis.commonPhrases;
      reportData.spellingMistakesA  = serverAnalysis.spellingMistakesA;
      reportData.spellingMistakesB  = serverAnalysis.spellingMistakesB;
      reportData.disclaimer         = serverAnalysis.disclaimer;
    }

    const created = await Report.create(reportData);
    res.status(201).json(formatDoc(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /reports/:id
const deleteReport = async (req, res) => {
  try {
    const id = req.params.id;
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { customId: id }] }
      : { customId: id };

    const report = await Report.findOne(filter);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const isOwner =
      report.email && report.email.toLowerCase() === req.user.email.toLowerCase();
    const isTeacher =
      req.user.role === "teacher" || req.user.role === "admin";

    if (!isOwner && !isTeacher) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You do not own this report" });
    }

    await Report.findOneAndDelete(filter);
    res.json({ message: "Report deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getReports, getReportById, createReport, deleteReport };
