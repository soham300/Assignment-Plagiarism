// config.js
// Central API configuration — change this ONE file for all environments.
// Uses the deployed Render backend by default, and localhost:3000 only when running directly on port 3000.

const API_BASE = (function () {
  // If a global override is set (useful for deployment), use it
  if (typeof window !== "undefined" && window.API_BASE_OVERRIDE) {
    return window.API_BASE_OVERRIDE;
  }
  // Local development only when served directly from port 3000
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
    window.location.port === "3000"
  ) {
    return "http://localhost:3000";
  }
  // Deployed Render API connected to MongoDB Atlas
  return "https://assignment-plagarism-2.onrender.com";
})();

export default API_BASE;
