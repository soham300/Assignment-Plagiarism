// src/Backend/Routes/apiRoutes.js
const express = require("express");
const router = express.Router();
const apiController = require("../Controllers/apiController");
const { authenticateToken, optionalToken } = require("../Middleware/auth");

// Health check
router.get("/health", apiController.getHealth);

// Authoritative Plagiarism Check
router.post("/check-similarity", optionalToken, apiController.checkSimilarity);

// Dynamic Spell Check
router.post("/spellcheck", optionalToken, apiController.spellCheck);

// Unified user profile summary
router.get("/user-profile-summary", authenticateToken, apiController.getUserProfileSummary);

module.exports = router;
