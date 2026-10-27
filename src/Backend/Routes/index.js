// src/Backend/Routes/index.js
// Master router mounting all MVC routes

const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const reportRoutes = require("./reportRoutes");
const fileDataRoutes = require("./fileDataRoutes");
const fileResultRoutes = require("./fileResultRoutes");
const apiRoutes = require("./apiRoutes");

function registerRoutes(app) {
  // Mount modular route handlers
  app.use(authRoutes);
  app.use(userRoutes);
  app.use(reportRoutes);
  app.use(fileDataRoutes);
  app.use(fileResultRoutes);
  app.use("/api", apiRoutes);
}

module.exports = registerRoutes;
