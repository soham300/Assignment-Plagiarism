// history.js
// Functions used by history.html

import API_BASE from "./config.js";
import { showToast, showConfirm } from "./toast.js";
import {
  detectSpellingMistakes,
  extractCommonPhrases,
  highlightTextWithMatchesAndTypos
} from "./SpellChecker.js";

// =========================================
// LOAD ALL HISTORY RECORDS
// =========================================

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("authToken");
  const headers = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function loadHistory() {

  const userEmail = localStorage.getItem("userEmail");

  if (userEmail === null || userEmail === "") {
    showToast("Please log in to view your history.", "warning");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
    return;
  }

  const historyList = document.getElementById("historyList");

  // 1. Instant Cache Hydration (SWR: 0ms perceived load time!)
  let hasRenderedFromCache = false;
  try {
    const cachedRaw = localStorage.getItem("assigncheck_history_cache_" + userEmail);
    if (cachedRaw) {
      const cachedRecords = JSON.parse(cachedRaw);
      if (Array.isArray(cachedRecords) && cachedRecords.length > 0) {
        allRecords = cachedRecords;
        updateCounts(cachedRecords);
        renderCards(cachedRecords);
        hasRenderedFromCache = true;
      }
    }
  } catch (e) {
    console.warn("History cache read notice:", e);
  }

  // 2. If no cache yet, show sleek modern skeleton loader
  if (!hasRenderedFromCache && historyList !== null) {
    historyList.innerHTML = `
      <div class="history-skeleton-list">
        <div class="history-skeleton-card"></div>
        <div class="history-skeleton-card"></div>
        <div class="history-skeleton-card"></div>
      </div>
    `;
  }

  // 3. Background Revalidation (Fast fetch with 4s timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `${API_BASE}/reports?email=` + encodeURIComponent(userEmail),
      { headers: getAuthHeaders(), signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const records = await response.json();

      if (!Array.isArray(records) || records.length === 0) {
        if (!hasRenderedFromCache) {
          showEmptyState();
        }
        allRecords = [];
        updateCounts([]);
        try {
          localStorage.setItem("assigncheck_history_cache_" + userEmail, JSON.stringify([]));
        } catch (e) {}
        return;
      }

      // Sort by newest first
      records.sort((a, b) => new Date(b.date) - new Date(a.date));

      allRecords = records;
      updateCounts(records);
      renderCards(records);

      // Save to cache for next instant visit
      try {
        localStorage.setItem("assigncheck_history_cache_" + userEmail, JSON.stringify(records));
      } catch (e) {}
    } else if (!hasRenderedFromCache) {
      showEmptyState();
      updateCounts([]);
    }
  } catch (err) {
    console.warn("History network fetch notice:", err);
    if (!hasRenderedFromCache) {
      showEmptyState();
      updateCounts([]);
    }
  }
}




// =========================================
// RENDER HISTORY CARDS
// =========================================

function renderCards(records) {

  const historyList = document.getElementById("historyList");

  if (historyList === null) {
    return;
  }

  if (records.length === 0) {
    showEmptyState();
    return;
  }

  historyList.innerHTML = "";

  for (let i = 0; i < records.length; i++) {

    const record = records[i];

    let type = record.type;
    if (type === undefined || type === null) {
      type = "student";
    }

    let typeLabel = "Student vs Student";
    if (type === "reference") {
      typeLabel = "Teacher Reference";
    }

    let iconClass = "student";
    if (type === "reference") {
      iconClass = "reference";
    }

    let dateText = "Unknown date";
    if (record.date) {
      const d = new Date(record.date);
      dateText = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }

    let filesText = "Unknown files";
    if (Array.isArray(record.files)) {
      filesText = record.files.join(" vs ");
    } else if (record.files) {
      filesText = record.files;
    }

    let displayFiles = filesText;
    if (filesText.length > 60) {
      displayFiles = filesText.slice(0, 60) + "...";
    }

    let similarity = record.similarity;
    let badgeHtml = "";

    if (similarity === undefined || similarity === null || similarity === "") {
      badgeHtml = "<span class='score-badge good'>N/A</span>";
    } else {
      const score = parseFloat(similarity);
      if (score >= 70) {
        badgeHtml = "<span class='score-badge poor'>" + score.toFixed(1) + "% High</span>";
      } else if (score >= 40) {
        badgeHtml = "<span class='score-badge' style='background:#fff7ed;color:#c2410c;'>" + score.toFixed(1) + "% Medium</span>";
      } else {
        badgeHtml = "<span class='score-badge good'>" + score.toFixed(1) + "% Low</span>";
      }
    }

    const recId = record.id || record._id || record.customId || "";

    const card = document.createElement("div");
    card.className = "history-card";
    card.setAttribute("data-type", type);
    card.setAttribute("data-id", recId);

    card.innerHTML =
      "<div class='card-icon " + iconClass + "'>" +
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><polyline points='10 9 9 9 8 9'/>" +
      "</svg>" +
      "</div>" +
      "<div class='card-info'>" +
      "<div class='card-title'>" +
      "<h3 title='" + filesText + "' class='history-title-link' style='cursor:pointer;transition:color 0.2s;'>" + displayFiles + "</h3>" +
      badgeHtml +
      "</div>" +
      "<div class='card-meta'>" +
      "<span>" + dateText + "</span>" +
      "<span class='dot'></span>" +
      "<span>" + typeLabel + "</span>" +
      "</div>" +
      "</div>" +
      "<div class='card-actions'>" +
      "<button class='action-btn view-report-btn' title='View Detailed Report' onclick='viewReport(\"" + recId + "\")'>" +
      "<svg class='ic' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/>" +
      "</svg>" +
      "</button>" +
      "<button class='action-btn delete delete-report-btn' title='Delete Record' onclick='deleteRecord(\"" + recId + "\")'>" +
      "<svg class='ic' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" +
      "<polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/><path d='M10 11v6'/><path d='M14 11v6'/>" +
      "</svg>" +
      "</button>" +
      "</div>";

    // Direct event listeners for 100% reliable click handling
    const titleLink = card.querySelector(".history-title-link");
    if (titleLink) {
      titleLink.addEventListener("click", () => viewReport(recId));
    }

    const viewBtn = card.querySelector(".view-report-btn");
    if (viewBtn) {
      viewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        viewReport(recId);
      });
    }

    const delBtn = card.querySelector(".delete-report-btn");
    if (delBtn) {
      delBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteRecord(recId);
      });
    }

    historyList.appendChild(card);

  }

}




// =========================================
// SHOW EMPTY STATE
// =========================================

function showEmptyState() {

  const historyList = document.getElementById("historyList");

  if (historyList === null) {
    return;
  }

  historyList.innerHTML =
    "<div style='text-align:center;padding:80px 0;color:#8b90ad;'>" +
    "<p style='font-family:Manrope,sans-serif;font-size:18px;font-weight:700;color:#2d3160;margin-bottom:10px;'>No analyses yet</p>" +
    "<p style='font-family:Manrope,sans-serif;font-size:15px;margin-bottom:24px;'>Run your first assignment comparison to see history here.</p>" +
    "<a href='CheckAssign.html' style='display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:14px;font-family:Manrope,sans-serif;font-weight:700;font-size:15px;text-decoration:none;'>+ New Analysis</a>" +
    "</div>";

}




// =========================================
// UPDATE FILTER COUNTS
// =========================================

function updateCounts(records) {

  let countAll = records.length;

  let countStudent = 0;
  let countReference = 0;

  for (let i = 0; i < records.length; i++) {
    if (records[i].type === "reference") {
      countReference = countReference + 1;
    } else {
      countStudent = countStudent + 1;
    }
  }

  const allCountEl = document.getElementById("countAll");
  if (allCountEl !== null) {
    allCountEl.textContent = countAll;
  }

}




// =========================================
// FILTER HISTORY
// =========================================

function filterHistory(filter, button) {

  const filterButtons = document.querySelectorAll(".filter-btn");

  for (let i = 0; i < filterButtons.length; i++) {
    filterButtons[i].classList.remove("active");
  }

  if (button !== null) {
    button.classList.add("active");
  }

  if (filter === "all") {
    renderCards(allRecords);
    return;
  }

  const filtered = [];

  for (let i = 0; i < allRecords.length; i++) {
    let type = allRecords[i].type;
    if (type === undefined || type === null) {
      type = "student";
    }
    if (type === filter) {
      filtered.push(allRecords[i]);
    }
  }

  renderCards(filtered);

}




// =========================================
// DELETE A RECORD
// =========================================

async function deleteRecord(id) {

  const confirmed = await showConfirm("Delete this analysis record? This cannot be undone.", {
    title: "Delete Record",
    confirmText: "Delete",
    isDanger: true
  });

  if (!confirmed) {
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/reports/` + encodeURIComponent(id), {
      method: "DELETE",
      headers
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || "Failed to delete record.", "error");
      return;
    }
    showToast("Analysis record deleted.", "success");
  } catch (err) {
    console.error("Delete request error:", err);
    showToast("Failed to delete record.", "error");
    return;
  }

  const newRecords = [];

  for (let i = 0; i < allRecords.length; i++) {
    const r = allRecords[i];
    if (r.id !== id && r._id !== id && r.customId !== id && String(r.id) !== String(id) && String(r._id) !== String(id)) {
      newRecords.push(r);
    }
  }

  allRecords = newRecords;

  const userEmail = localStorage.getItem("userEmail") || "";
  try {
    localStorage.setItem("assigncheck_history_cache_" + userEmail, JSON.stringify(allRecords));
  } catch (e) {}

  updateCounts(allRecords);

  renderCards(allRecords);

}




// =========================================
// CLEAR ALL HISTORY
// =========================================

async function clearAllHistory() {

  if (allRecords.length === 0) {
    showToast("There is no history to clear.", "info");
    return;
  }

  const confirmed = await showConfirm("Delete all " + allRecords.length + " records? This cannot be undone.", {
    title: "Clear All History",
    confirmText: "Delete All",
    isDanger: true
  });

  if (!confirmed) {
    return;
  }

  const token = localStorage.getItem("authToken");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (let i = 0; i < allRecords.length; i++) {
    await fetch(`${API_BASE}/reports/` + allRecords[i].id, {
      method: "DELETE",
      headers
    });
  }

  allRecords = [];

  const userEmail = localStorage.getItem("userEmail") || "";
  try {
    localStorage.setItem("assigncheck_history_cache_" + userEmail, JSON.stringify([]));
  } catch (e) {}

  updateCounts([]);

  showEmptyState();

  showToast("All history records cleared.", "success");

}




// =========================================
// VIEW REPORT MODAL
// =========================================

async function viewReport(id) {

  let record = null;

  for (let i = 0; i < allRecords.length; i++) {
    const r = allRecords[i];
    if (
      r.id === id ||
      r._id === id ||
      r.customId === id ||
      String(r.id) === String(id) ||
      String(r._id) === String(id)
    ) {
      record = r;
      break;
    }
  }

  // Fallback: If not in current memory array, fetch directly from MongoDB API
  if (!record && id) {
    try {
      const res = await fetch(`${API_BASE}/reports/` + encodeURIComponent(id), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        record = await res.json();
      }
    } catch (e) {
      console.warn("Could not fetch report by ID:", e);
    }
  }

  if (record === null) {
    showToast("Report not found.", "error");
    return;
  }

  // Pre-save to sessionStorage so DetailedReport.html has it immediately
  try {
    sessionStorage.setItem("reportData", JSON.stringify(record));
  } catch (e) {}

  const reportModal = document.getElementById("reportModal");

  if (reportModal !== null) {
    reportModal.classList.add("active");
  }

  const aStage = document.getElementById("aStage");
  if (aStage !== null) {
    aStage.style.display = "";
  }

  const resultsContainer = document.getElementById("resultsContainer");
  if (resultsContainer !== null) {
    resultsContainer.classList.remove("active");
  }

  const aEngine = document.getElementById("aEngine");
  if (aEngine !== null) {
    aEngine.classList.add("active");
    aEngine.classList.remove("done");
  }

  const aeStatus = document.getElementById("aeStatus");
  if (aeStatus !== null) {
    aeStatus.textContent = "Processing...";
  }

  const aeStages = document.querySelectorAll(".ae-stage");
  for (let i = 0; i < aeStages.length; i++) {
    aeStages[i].classList.remove("active", "done");
  }

  // Run through animation stages then show results
  runStageAnimation(record);

}




// =========================================
// STAGE ANIMATION FOR VIEW REPORT
// =========================================

async function runStageAnimation(record) {

  const stageNames = [
    "Text Extraction",
    "Text Processing",
    "N-Gram Analysis",
    "Similarity Comparison",
    "Match Detection",
    "Report Generation"
  ];

  const aeStages = document.querySelectorAll(".ae-stage");
  const aeStatus = document.getElementById("aeStatus");

  for (let i = 0; i < aeStages.length; i++) {

    await sleep(70);

    if (i > 0) {
      aeStages[i - 1].classList.remove("active");
      aeStages[i - 1].classList.add("done");
    }

    aeStages[i].classList.add("active");

    if (aeStatus !== null) {
      aeStatus.textContent = stageNames[i] + "...";
    }

  }

  await sleep(100);

  for (let i = 0; i < aeStages.length; i++) {
    aeStages[i].classList.remove("active");
    aeStages[i].classList.add("done");
  }

  const aEngine = document.getElementById("aEngine");
  if (aEngine !== null) {
    aEngine.classList.remove("active");
    aEngine.classList.add("done");
  }

  if (aeStatus !== null) {
    aeStatus.textContent = "Analysis complete";
  }

  await sleep(60);

  const aStage = document.getElementById("aStage");
  if (aStage !== null) {
    aStage.style.display = "none";
  }

  // Fill in the results
  fillReportData(record);

}




// =========================================
// FILL REPORT DATA INTO MODAL
// =========================================

function fillReportData(record) {

  let files = [];
  if (Array.isArray(record.files)) {
    files = record.files;
  } else if (record.files) {
    files = [record.files, "File B"];
  } else {
    files = ["File A", "File B"];
  }

  let similarity = "—";
  if (record.similarity !== undefined && record.similarity !== null) {
    similarity = parseFloat(record.similarity).toFixed(1) + "%";
  }

  const resSimilarity = document.getElementById("resSimilarity");
  if (resSimilarity !== null) {
    resSimilarity.textContent = similarity;
  }

  const mFiles = document.getElementById("mFiles");
  if (mFiles !== null) {
    mFiles.textContent = files.length;
  }

  const mMatching = document.getElementById("mMatching");
  if (mMatching !== null) {
    let matchSec = record.matchingSections;
    if ((matchSec === undefined || matchSec === null || matchSec === 0) && Number(record.similarity) > 0) {
      if (Array.isArray(record.filefirstmatches) && record.filefirstmatches.length > 0) {
        matchSec = record.filefirstmatches.length;
      } else if (Array.isArray(record.commonPhrases) && record.commonPhrases.length > 0) {
        matchSec = record.commonPhrases.length;
      } else {
        matchSec = 1;
      }
    }
    mMatching.textContent = matchSec !== undefined && matchSec !== null ? matchSec : "—";
  }

  const mDifferent = document.getElementById("mDifferent");
  if (mDifferent !== null) {
    let diffSec = record.differentSections;
    if (Number(record.similarity) === 100) {
      diffSec = 0;
    }
    mDifferent.textContent = diffSec !== undefined && diffSec !== null ? diffSec : "—";
  }

  const mPhrases = document.getElementById("mPhrases");
  if (mPhrases !== null) {
    let phraseCount = record.matchingPhrases;
    if ((phraseCount === undefined || phraseCount === null) && Array.isArray(record.commonPhrases)) {
      phraseCount = record.commonPhrases.length;
    }
    mPhrases.textContent = phraseCount !== undefined && phraseCount !== null ? phraseCount : "—";
  }

  const pairSub = document.getElementById("pairSub");
  if (pairSub !== null) {
    pairSub.textContent = (files[0] || "File A") + " vs " + (files[1] || "File B");
  }

  const panelAName = document.getElementById("panelAName");
  if (panelAName !== null) {
    panelAName.textContent = files[0] || "File A";
  }

  const panelBName = document.getElementById("panelBName");
  if (panelBName !== null) {
    panelBName.textContent = files[1] || "File B";
  }

  let extA = "TXT";
  if (files[0]) {
    const parts = files[0].split(".");
    if (parts.length > 1) {
      extA = parts[parts.length - 1].toUpperCase();
    }
  }

  let extB = "TXT";
  if (files[1]) {
    const parts = files[1].split(".");
    if (parts.length > 1) {
      extB = parts[parts.length - 1].toUpperCase();
    }
  }

  const panelAFmt = document.getElementById("panelAFmt");
  if (panelAFmt !== null) {
    panelAFmt.textContent = extA;
  }

  const panelBFmt = document.getElementById("panelBFmt");
  if (panelBFmt !== null) {
    panelBFmt.textContent = extB;
  }

  const openFullReportBtn = document.getElementById("openFullReportBtn");
  const recId = record.customId || record.id || record._id || "";
  if (openFullReportBtn !== null) {
    openFullReportBtn.href = "DetailedReport.html?id=" + encodeURIComponent(recId);
    openFullReportBtn.onclick = function() {
      try {
        sessionStorage.setItem("reportData", JSON.stringify(record));
        sessionStorage.setItem("lastAnalysisResult", JSON.stringify(record));
      } catch (e) {}
    };
  }

  // Save in sessionStorage so DetailedReport.html can display it immediately
  try {
    sessionStorage.setItem("reportData", JSON.stringify(record));
    sessionStorage.setItem("lastAnalysisResult", JSON.stringify(record));
  } catch (e) {}

  const matchesA = Array.isArray(record.filefirstmatches) ? record.filefirstmatches : [];
  const matchesB = Array.isArray(record.filesecondmatches) ? record.filesecondmatches : [];

  const typosA = (Array.isArray(record.spellingMistakesA) && record.spellingMistakesA.length > 0)
    ? record.spellingMistakesA
    : detectSpellingMistakes(record.textA || "", files[0] || "File A");
  const typosB = (Array.isArray(record.spellingMistakesB) && record.spellingMistakesB.length > 0)
    ? record.spellingMistakesB
    : detectSpellingMistakes(record.textB || "", files[1] || "File B");
  const allTypos = (Array.isArray(record.allSpellingMistakes) && record.allSpellingMistakes.length > 0)
    ? record.allSpellingMistakes
    : typosA.concat(typosB);

  const panelABody = document.getElementById("panelABody");
  if (panelABody !== null) {
    if (record.textA) {
      panelABody.innerHTML = highlightTextWithMatchesAndTypos(record.textA, matchesA, typosA, { otherText: record.textB });
    } else {
      panelABody.innerHTML = "<p style='color:#8b90ad;font-style:italic;'>No text content saved for this file.</p>";
    }
  }

  const panelBBody = document.getElementById("panelBBody");
  if (panelBBody !== null) {
    if (record.textB) {
      panelBBody.innerHTML = highlightTextWithMatchesAndTypos(record.textB, matchesB, typosB, { otherText: record.textA });
    } else {
      panelBBody.innerHTML = "<p style='color:#8b90ad;font-style:italic;'>No text content saved for this file.</p>";
    }
  }

  // Common phrases section in modal
  const commonPhrases = (Array.isArray(record.commonPhrases) && record.commonPhrases.length > 0)
    ? record.commonPhrases
    : extractCommonPhrases(matchesA, record.textA, record.textB);
  const modalCommonPhrases = document.getElementById("modalCommonPhrases");
  if (modalCommonPhrases !== null) {
    if (commonPhrases.length === 0) {
      modalCommonPhrases.innerHTML = "<p style='font-size:13px;color:#8b90ad;font-style:italic;'>No common phrases found.</p>";
    } else {
      let phHtml = "";
      for (let p = 0; p < commonPhrases.length; p++) {
        phHtml += "<div style='background:#f8fafc;border-left:3px solid #eab308;padding:8px 12px;border-radius:6px;font-size:13px;'>";
        phHtml += "<b style='color:#1e293b;'>\"" + commonPhrases[p].phrase + "\"</b>";
        phHtml += "<div style='font-size:11px;color:#64748b;margin-top:2px;'>" + commonPhrases[p].wordCount + " words • Matched passage</div>";
        phHtml += "</div>";
      }
      modalCommonPhrases.innerHTML = phHtml;
    }
  }

  // Spelling mistakes section in modal
  const modalSpellingMistakes = document.getElementById("modalSpellingMistakes");
  if (modalSpellingMistakes !== null) {
    if (allTypos.length === 0) {
      modalSpellingMistakes.innerHTML = "<p style='font-size:13px;color:#10b981;font-weight:700;'>✓ No common spelling mistakes found.</p>";
    } else {
      let tyHtml = "";
      for (let t = 0; t < allTypos.length; t++) {
        tyHtml += "<div style='background:#fef2f2;border-left:3px solid #ef4444;padding:8px 12px;border-radius:6px;font-size:13px;'>";
        tyHtml += "<span style='background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:700;'>" + allTypos[t].word + "</span>";
        tyHtml += " → <span style='background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:700;'>✓ " + allTypos[t].suggestion + "</span>";
        tyHtml += "<div style='font-size:11px;color:#64748b;margin-top:4px;'>" + (allTypos[t].context || "") + "</div>";
        tyHtml += "</div>";
      }
      modalSpellingMistakes.innerHTML = tyHtml;
    }
  }

  const resultsContainer = document.getElementById("resultsContainer");
  if (resultsContainer !== null) {
    resultsContainer.classList.add("active");
  }

}




// =========================================
// CLOSE REPORT MODAL
// =========================================

function closeReportModal() {

  const reportModal = document.getElementById("reportModal");

  if (reportModal !== null) {
    reportModal.classList.remove("active");
  }

}




// =========================================
// CLOSE MODAL ON ESCAPE KEY
// =========================================

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeReportModal();
  }
});




// =========================================
// CLOSE MODAL ON BACKDROP CLICK
// =========================================

const reportModalEl = document.getElementById("reportModal");

if (reportModalEl !== null) {
  reportModalEl.addEventListener("click", function (event) {
    if (event.target === reportModalEl) {
      closeReportModal();
    }
  });
}




// =========================================
// SLEEP HELPER
// =========================================

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}




// =========================================
// GLOBAL STATE
// =========================================

let allRecords = [];




// =========================================
// EXPOSE GLOBALLY FOR INLINE HTML HANDLERS
// =========================================
window.viewReport = viewReport;
window.deleteRecord = deleteRecord;
window.filterHistory = filterHistory;
window.clearAllHistory = clearAllHistory;
window.closeReportModal = closeReportModal;

// =========================================
// START: LOAD HISTORY ON PAGE LOAD
// =========================================

loadHistory();
