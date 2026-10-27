// src/Backend/Routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const reportController = require("../Controllers/reportController");
const { authenticateToken, optionalToken } = require("../Middleware/auth");

// Reports endpoints
router.get("/reports", authenticateToken, reportController.getReports);
router.get("/reports/:id", authenticateToken, reportController.getReportById);
router.post("/reports", optionalToken, reportController.createReport);
router.delete("/reports/:id", authenticateToken, reportController.deleteReport);

module.exports = router;
