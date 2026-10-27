// detailedReport.js
// Logic for DetailedReport.html
// Renders similarity highlights, common phrases, and spelling mistakes

import API_BASE from "./config.js";
import { showToast } from "./toast.js";
import {
  detectSpellingMistakes,
  detectSpellingMistakesAsync,
  extractCommonPhrases,
  highlightTextWithMatchesAndTypos
} from "./SpellChecker.js";
import { openCertificateModal } from "./certificateModal.js";

// =========================================
// GLOBAL STATE
// =========================================
let currentReport = null;
let currentPhrases = [];
let currentTyposA = [];
let currentTyposB = [];
let allTypos = [];
let currentSections = [];
let activeSectionFilter = "all";

// =========================================
// INITIALIZE REPORT ON DOM LOAD
// =========================================
document.addEventListener("DOMContentLoaded", async function () {
  setupTabs();
  setupToggles();
  setupSearch();
  setupSectionsToolbar();
  setupDownloadClean();
  setupPdfExport();

  await loadAndRenderReport();
});

// =========================================
// TAB SWITCHING LOGIC
// =========================================
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].addEventListener("click", function () {
      const targetId = this.getAttribute("data-tab");

      // Deactivate all
      for (let j = 0; j < tabButtons.length; j++) {
        tabButtons[j].classList.remove("active");
      }
      for (let j = 0; j < tabPanes.length; j++) {
        tabPanes[j].classList.remove("active");
      }

      // Activate clicked
      this.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane !== null) {
        targetPane.classList.add("active");
      }
    });
  }
}

// =========================================
// TOGGLE HIGHLIGHTS LOGIC
// =========================================
function setupToggles() {
  const toggleMatches = document.getElementById("toggleMatches");
  const toggleDiffs = document.getElementById("toggleDiffs");
  const toggleTypos = document.getElementById("toggleTypos");

  function onToggleChange() {
    if (!currentReport) return;

    const showMatches = toggleMatches ? toggleMatches.checked : true;
    const showDiffs = toggleDiffs ? toggleDiffs.checked : true;
    const showTypos = toggleTypos ? toggleTypos.checked : true;

    renderDocumentTexts(showMatches, showTypos, showDiffs);
  }

  if (toggleMatches !== null) {
    toggleMatches.addEventListener("change", onToggleChange);
  }

  if (toggleDiffs !== null) {
    toggleDiffs.addEventListener("change", onToggleChange);
  }

  if (toggleTypos !== null) {
    toggleTypos.addEventListener("change", onToggleChange);
  }
}

// =========================================
// ALL SECTIONS TOOLBAR & FILTER LOGIC
// =========================================
function setupSectionsToolbar() {
  const filterPills = document.querySelectorAll(".sections-filter-group .filter-pill");
  const searchInput = document.getElementById("sectionsSearch");

  filterPills.forEach(pill => {
    pill.addEventListener("click", function () {
      filterPills.forEach(p => p.classList.remove("active"));
      this.classList.add("active");
      activeSectionFilter = this.getAttribute("data-filter") || "all";
      filterAndRenderSections();
    });
  });

  if (searchInput !== null) {
    searchInput.addEventListener("input", function () {
      filterAndRenderSections();
    });
  }
}

function filterAndRenderSections() {
  const searchInput = document.getElementById("sectionsSearch");
  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();

  const filtered = currentSections.filter(sec => {
    if (activeSectionFilter !== "all" && sec.type !== activeSectionFilter) {
      return false;
    }
    if (query && !sec.text.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  renderSectionsGrid(filtered);
}

// =========================================
// SEARCH COMMON PHRASES
// =========================================
function setupSearch() {
  const searchInput = document.getElementById("phrasesSearch");

  if (searchInput !== null) {
    searchInput.addEventListener("input", function () {
      const query = this.value.trim().toLowerCase();
      filterPhrases(query);
    });
  }
}

function filterPhrases(query) {
  const phrasesGrid = document.getElementById("phrasesGrid");
  if (!phrasesGrid) return;

  if (!query) {
    renderPhrasesList(currentPhrases);
    return;
  }

  const filtered = [];
  for (let i = 0; i < currentPhrases.length; i++) {
    if (currentPhrases[i].phrase.toLowerCase().includes(query)) {
      filtered.push(currentPhrases[i]);
    }
  }

  renderPhrasesList(filtered);
}

// =========================================
// LOAD REPORT DATA (FROM URL, SESSION, OR DB)
// =========================================
function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("authToken");
  const headers = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function loadAndRenderReport() {
  let report = null;

  // 1. Try URL query param ?id=...
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get("id");

  if (reportId && reportId !== "undefined" && reportId !== "null") {
    try {
      const response = await fetch(`${API_BASE}/reports/` + encodeURIComponent(reportId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        report = await response.json();
      }
    } catch (e) {
      console.warn("Could not fetch report by ID:", e);
    }
  }

  const loggedInEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();

  // 2. Try sessionStorage "reportData"
  if (!report) {
    try {
      const stored = sessionStorage.getItem("reportData");
      if (stored) {
        const parsed = JSON.parse(stored);
        const reportEmail = (parsed.email || parsed.userEmail || "").toLowerCase().trim();
        if (!loggedInEmail || !reportEmail || reportEmail === loggedInEmail) {
          report = parsed;
        }
      }
    } catch (e) {
      console.warn("Session reportData error:", e);
    }
  }

  // 3. Try sessionStorage "lastAnalysisResult"
  if (!report) {
    try {
      const lastRes = sessionStorage.getItem("lastAnalysisResult");
      if (lastRes) {
        const parsed = JSON.parse(lastRes);
        const reportEmail = (parsed.email || parsed.userEmail || "").toLowerCase().trim();
        if (!loggedInEmail || !reportEmail || reportEmail === loggedInEmail) {
          report = parsed;
        }
      }
    } catch (e) {
      console.warn("Session lastAnalysisResult error:", e);
    }
  }

  // 4. Try loading from database fileresult fallback
  if (!report) {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      try {
        const response = await fetch(`${API_BASE}/fileresult?email=` + encodeURIComponent(userEmail), {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const list = await response.json();
          if (list && list.length > 0 && Array.isArray(list[0].filesprocesed) && list[0].filesprocesed.length > 0) {
            const arr = list[0].filesprocesed;
            report = arr[arr.length - 1];
          }
        }
      } catch (e) {
        console.warn("Database fallback error:", e);
      }
    }
  }

  // 5. Try fetching latest report from /reports (if user logged in or public)
  if (!report) {
    try {
      const response = await fetch(`${API_BASE}/reports`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const list = await response.json();
        if (Array.isArray(list) && list.length > 0) {
          report = list[0]; // latest report in database (sorted desc by date)
        }
      }
    } catch (e) {
      console.warn("Reports API fallback error:", e);
    }
  }

  // If still no report, show dynamic empty state
  if (!report) {
    renderEmptyReportState();
    return;
  }

  currentReport = report;
  await renderReportDetails(report);
}

// =========================================
// MAIN RENDER FUNCTION
// =========================================
async function renderReportDetails(report) {
  // Extract filenames
  let fileAName = "Document 1.txt";
  let fileBName = "Document 2.txt";

  if (Array.isArray(report.filenames) && report.filenames.length >= 2) {
    fileAName = report.filenames[0];
    fileBName = report.filenames[1];
  } else if (Array.isArray(report.files) && report.files.length >= 2) {
    fileAName = report.files[0];
    fileBName = report.files[1];
  }

  const textA = report.textA || "";
  const textB = report.textB || "";

  // Similarity score
  let similarity = 0;
  if (report.roundedscore !== undefined) {
    similarity = parseFloat(report.roundedscore);
  } else if (report.similarity !== undefined) {
    similarity = parseFloat(report.similarity);
  }
  similarity = Math.round(similarity * 10) / 10;

  // Extract matches
  const matchesA = Array.isArray(report.filefirstmatches)
    ? report.filefirstmatches
    : Array.isArray(report.matchesA)
      ? report.matchesA
      : [];

  // Detect spelling mistakes dynamically via authoritative server dictionary & client rules
  let dynamicTyposA = [];
  let dynamicTyposB = [];
  try {
    [dynamicTyposA, dynamicTyposB] = await Promise.all([
      detectSpellingMistakesAsync(textA, fileAName),
      detectSpellingMistakesAsync(textB, fileBName)
    ]);
  } catch (e) {
    dynamicTyposA = detectSpellingMistakes(textA, fileAName, { peerText: textB });
    dynamicTyposB = detectSpellingMistakes(textB, fileBName, { peerText: textA });
  }

  currentTyposA = (Array.isArray(report.spellingMistakesA) && report.spellingMistakesA.length > dynamicTyposA.length)
    ? report.spellingMistakesA
    : dynamicTyposA;
  currentTyposB = (Array.isArray(report.spellingMistakesB) && report.spellingMistakesB.length > dynamicTyposB.length)
    ? report.spellingMistakesB
    : dynamicTyposB;
  allTypos = currentTyposA.concat(currentTyposB);

  // Extract common phrases (use stored phrases if present, otherwise extract from matches / texts)
  currentPhrases = (Array.isArray(report.commonPhrases) && report.commonPhrases.length > 0)
    ? report.commonPhrases
    : extractCommonPhrases(matchesA, textA, textB);

  // Extract ALL sections (both matching and different / unique sections)
  currentSections = extractDocumentSections(textA, textB, matchesA);
  const matchingSectionsCount = (report.matchingSections !== undefined && report.matchingSections !== null)
    ? report.matchingSections
    : currentSections.filter(s => s.type === "matching").length;
  const differentSectionsCount = (report.differentSections !== undefined && report.differentSections !== null)
    ? report.differentSections
    : currentSections.filter(s => s.type === "different").length;
  const totalPhrasesCount = (report.matchingPhrases !== undefined && report.matchingPhrases !== null)
    ? report.matchingPhrases
    : currentPhrases.length;
  const totalTyposCount = (report.spellingMistakes !== undefined && report.spellingMistakes !== null)
    ? report.spellingMistakes
    : allTypos.length;

  // Total words
  const wordsA = textA ? textA.trim().split(/\s+/).length : 0;
  const wordsB = textB ? textB.trim().split(/\s+/).length : 0;
  const totalWords = wordsA + wordsB;

  // 1. Update Header Information
  const isReferenceMode = report.mode === "reference" || report.type === "reference";
  const reportModeChip = document.getElementById("reportModeChip");
  if (reportModeChip) {
    reportModeChip.textContent = isReferenceMode ? "Teacher vs Student Evaluation" : "Similarity Analysis";
  }

  const subDocA = document.getElementById("subDocA");
  const subDocB = document.getElementById("subDocB");
  if (subDocA) subDocA.textContent = isReferenceMode ? `Student: ${fileAName}` : fileAName;
  if (subDocB) subDocB.textContent = isReferenceMode ? `Teacher Ref: ${fileBName}` : fileBName;

  const docAName = document.getElementById("docAName");
  const docBName = document.getElementById("docBName");
  if (docAName) docAName.textContent = isReferenceMode ? `Student: ${fileAName}` : fileAName;
  if (docBName) docBName.textContent = isReferenceMode ? `Teacher Ref: ${fileBName}` : fileBName;

  const docAMeta = document.getElementById("docAMeta");
  const docBMeta = document.getElementById("docBMeta");
  if (docAMeta) docAMeta.textContent = wordsA.toLocaleString() + " words";
  if (docBMeta) docBMeta.textContent = wordsB.toLocaleString() + " words";

  const reportDate = document.getElementById("reportDate");
  if (reportDate) {
    const d = report.date ? new Date(report.date) : new Date();
    reportDate.textContent = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  const reportIdSpan = document.getElementById("reportIdSpan");
  if (reportIdSpan) {
    reportIdSpan.textContent = "ID: #" + (report.customId || report.id || report._id || ("REP-" + Math.floor(1000 + Math.random() * 9000)));
  }

  // 1b. Update Filter Badges
  const filterBadges = document.getElementById("filterBadges");
  if (filterBadges) {
    const filters = report.filters || {};
    const active = [];
    if (filters.excludeReferences) active.push("Excluded References");
    if (filters.excludeQuotes) active.push("Excluded Quotes");
    if (filters.excludeSmallMatches) active.push("Excluded Small Matches (≥7-grams)");

    if (active.length > 0) {
      filterBadges.textContent = "Filters: " + active.join(" • ");
      filterBadges.style.display = "inline-flex";
    } else {
      filterBadges.style.display = "none";
    }
  }

  // 2. Update Score Circle & Risk Badge
  const overallSimilarity = document.getElementById("overallSimilarity");
  if (overallSimilarity) {
    overallSimilarity.textContent = similarity + "%";
  }

  const scoreCircle = document.getElementById("scoreCircle");
  if (scoreCircle) {
    let color = "#10b981"; // good
    if (similarity >= 50) {
      color = "#ef4444"; // danger
    } else if (similarity >= 20) {
      color = "#f59e0b"; // warn
    }
    scoreCircle.style.background = `conic-gradient(${color} ${similarity}%, #e2e8f0 ${similarity}%)`;
  }

  const scoreRiskBadge = document.getElementById("scoreRiskBadge");
  if (scoreRiskBadge) {
    if (similarity >= 50) {
      scoreRiskBadge.className = "score-badge high";
      scoreRiskBadge.textContent = "High Similarity";
    } else if (similarity >= 20) {
      scoreRiskBadge.className = "score-badge medium";
      scoreRiskBadge.textContent = "Medium Similarity";
    } else {
      scoreRiskBadge.className = "score-badge low";
      scoreRiskBadge.textContent = "Low Similarity";
    }
  }

  // 3. Update Stat Cards
  const cardSimVal = document.getElementById("cardSimVal");
  if (cardSimVal) cardSimVal.textContent = similarity + "%";

  const cardMatchingVal = document.getElementById("cardMatchingVal");
  if (cardMatchingVal) cardMatchingVal.textContent = matchingSectionsCount;

  const cardDifferentVal = document.getElementById("cardDifferentVal");
  if (cardDifferentVal) cardDifferentVal.textContent = differentSectionsCount;

  const cardPhrasesVal = document.getElementById("cardPhrasesVal");
  if (cardPhrasesVal) cardPhrasesVal.textContent = totalPhrasesCount;

  const cardTyposVal = document.getElementById("cardTyposVal");
  if (cardTyposVal) cardTyposVal.textContent = totalTyposCount;

  const cardWordsVal = document.getElementById("cardWordsVal");
  if (cardWordsVal) cardWordsVal.textContent = totalWords.toLocaleString();

  // 4. Update Tab Badges
  const tabSectionsCount = document.getElementById("tabSectionsCount");
  if (tabSectionsCount) tabSectionsCount.textContent = currentSections.length;

  const countFilterAll = document.getElementById("countFilterAll");
  if (countFilterAll) countFilterAll.textContent = currentSections.length;

  const countFilterMatching = document.getElementById("countFilterMatching");
  if (countFilterMatching) countFilterMatching.textContent = matchingSectionsCount;

  const countFilterDifferent = document.getElementById("countFilterDifferent");
  if (countFilterDifferent) countFilterDifferent.textContent = differentSectionsCount;

  const tabPhrasesCount = document.getElementById("tabPhrasesCount");
  if (tabPhrasesCount) tabPhrasesCount.textContent = totalPhrasesCount;

  const tabTyposCount = document.getElementById("tabTyposCount");
  if (tabTyposCount) tabTyposCount.textContent = totalTyposCount;

  // 5. Render Documents with Highlights
  const toggleMatches = document.getElementById("toggleMatches");
  const toggleDiffs = document.getElementById("toggleDiffs");
  const toggleTypos = document.getElementById("toggleTypos");
  const showMatches = toggleMatches ? toggleMatches.checked : true;
  const showDiffs = toggleDiffs ? toggleDiffs.checked : true;
  const showTypos = toggleTypos ? toggleTypos.checked : true;
  renderDocumentTexts(showMatches, showTypos, showDiffs);

  // 6. Render All Sections Grid
  renderSectionsGrid(currentSections);

  // 7. Render Common Phrases List
  renderPhrasesList(currentPhrases);

  // 8. Render Spelling Mistakes
  renderTyposList(allTypos);

  // 9. Render Summary Details
  renderSummaryDetails(similarity, currentPhrases.length, allTypos.length);
}

// =========================================
// RENDER DOCUMENT TEXT WITH HIGHLIGHTS
// =========================================
function renderDocumentTexts(showMatches = true, showTypos = true, showDiffs = true) {
  if (!currentReport) return;

  const textA = currentReport.textA || "";
  const textB = currentReport.textB || "";

  const matchesA = Array.isArray(currentReport.filefirstmatches)
    ? currentReport.filefirstmatches
    : Array.isArray(currentReport.matchesA)
      ? currentReport.matchesA
      : [];

  const matchesB = Array.isArray(currentReport.filesecondmatches)
    ? currentReport.filesecondmatches
    : Array.isArray(currentReport.matchesB)
      ? currentReport.matchesB
      : [];

  const docABody = document.getElementById("docABody");
  const docBBody = document.getElementById("docBBody");

  if (docABody) {
    docABody.innerHTML = highlightTextWithMatchesAndTypos(textA, matchesA, currentTyposA, {
      showMatches: showMatches,
      showDiffs: showDiffs,
      showTypos: showTypos,
      otherText: textB
    });
  }

  if (docBBody) {
    docBBody.innerHTML = highlightTextWithMatchesAndTypos(textB, matchesB, currentTyposB, {
      showMatches: showMatches,
      showDiffs: showDiffs,
      showTypos: showTypos,
      otherText: textA
    });
  }
}

// =========================================
// EXTRACT & CATEGORIZE ALL SECTIONS
// =========================================
function extractDocumentSections(textA, textB, matchesA = []) {
  const sections = [];
  if (!textA && !textB) return sections;

  function norm(str) {
    return (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  const normB = norm(textB);
  const wordsB = normB.split(" ").filter(Boolean);
  const shinglesB = new Set();
  for (let i = 0; i <= wordsB.length - 3; i++) {
    shinglesB.add(wordsB.slice(i, i + 3).join(" "));
  }

  function getBlocks(rawText) {
    if (!rawText) return [];
    let blocks = rawText.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    if (blocks.length <= 1 && rawText.length > 150) {
      blocks = rawText.split(/\n+/).map(s => s.trim()).filter(Boolean);
    }
    if (blocks.length <= 1 && rawText.length > 150) {
      const sentences = rawText.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
      if (sentences && sentences.length > 1) {
        const chunks = [];
        for (let i = 0; i < sentences.length; i += 2) {
          chunks.push(sentences.slice(i, i + 2).join(" ").trim());
        }
        return chunks;
      }
    }
    return blocks.length > 0 ? blocks : [rawText.trim()];
  }

  const blocksA = getBlocks(textA);
  const blocksB = getBlocks(textB);

  // 1. Analyze blocks from Document A
  blocksA.forEach((blk, idx) => {
    const normBlk = norm(blk);
    const wordsBlk = normBlk.split(" ").filter(Boolean);

    let matchingShingles = 0;
    let totalShingles = 0;
    for (let i = 0; i <= wordsBlk.length - 3; i++) {
      totalShingles++;
      const sh = wordsBlk.slice(i, i + 3).join(" ");
      if (shinglesB.has(sh)) {
        matchingShingles++;
      }
    }

    const overlapRatio = totalShingles > 0 ? matchingShingles / totalShingles : 0;
    const isMatching = overlapRatio >= 0.25 || (normB.includes(normBlk) && normBlk.length > 15);

    sections.push({
      id: `sec-a-${idx + 1}`,
      doc: "Doc A",
      index: idx + 1,
      type: isMatching ? "matching" : "different",
      title: isMatching ? `Matching Section (Doc A #${idx + 1})` : `Different / Unique Section (Doc A #${idx + 1})`,
      badge: isMatching ? "Matching" : "Different / Unique",
      text: blk,
      wordCount: wordsBlk.length,
      overlap: Math.round(overlapRatio * 100)
    });
  });

  // 2. Analyze blocks from Document B that have NO overlap with Document A
  const normA = norm(textA);
  const wordsA = normA.split(" ").filter(Boolean);
  const shinglesA = new Set();
  for (let i = 0; i <= wordsA.length - 3; i++) {
    shinglesA.add(wordsA.slice(i, i + 3).join(" "));
  }

  blocksB.forEach((blk, idx) => {
    const normBlk = norm(blk);
    const wordsBlk = normBlk.split(" ").filter(Boolean);

    let matchingShingles = 0;
    let totalShingles = 0;
    for (let i = 0; i <= wordsBlk.length - 3; i++) {
      totalShingles++;
      const sh = wordsBlk.slice(i, i + 3).join(" ");
      if (shinglesA.has(sh)) {
        matchingShingles++;
      }
    }

    const overlapRatio = totalShingles > 0 ? matchingShingles / totalShingles : 0;
    if (overlapRatio < 0.25 && !normA.includes(normBlk)) {
      sections.push({
        id: `sec-b-${idx + 1}`,
        doc: "Doc B",
        index: idx + 1,
        type: "different",
        title: `Different / Unique Section (Doc B #${idx + 1})`,
        badge: "Different / Unique",
        text: blk,
        wordCount: wordsBlk.length,
        overlap: 0
      });
    }
  });

  return sections;
}

// =========================================
// RENDER ALL SECTIONS GRID
// =========================================
function renderSectionsGrid(sectionsList) {
  const container = document.getElementById("sectionsGrid");
  if (!container) return;

  if (!sectionsList || sectionsList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No sections found</h3>
        <p>No matching or unique sections found under this filter.</p>
      </div>
    `;
    return;
  }

  let html = "";
  sectionsList.forEach(sec => {
    const isMatch = sec.type === "matching";
    html += `
      <div class="section-card ${isMatch ? 'matching' : 'different'}">
        <div class="section-header-row">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="section-badge ${isMatch ? 'matching' : 'different'}">${escapeHtml(sec.badge)}</span>
            <span style="font-weight:700;font-size:14px;color:var(--ink);">${escapeHtml(sec.title)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="section-meta-info">
              <span>${sec.doc}</span> • <span>${sec.wordCount} words</span>
              ${isMatch ? ` • <span style="color:#ca8a04;font-weight:700;">${sec.overlap}% similarity</span>` : ` • <span style="color:#0284c7;font-weight:700;">100% Unique</span>`}
            </div>
            <button type="button" class="btn btn-outline" style="padding:4px 10px;font-size:11px;" onclick="locateSection('${escapeHtml(sec.text.slice(0, 40))}')">
              View in Document →
            </button>
          </div>
        </div>
        <div class="section-content-text">${escapeHtml(sec.text)}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Make locateSection globally available
window.locateSection = function (sectionSnippet) {
  const tabBtn = document.querySelector(".tab-btn[data-tab='tab-highlight']");
  if (tabBtn) tabBtn.click();

  setTimeout(function () {
    const marks = document.querySelectorAll("mark.highlight-match, mark.highlight-diff, .doc-body p");
    const needle = (sectionSnippet || "").toLowerCase().trim();
    for (let i = 0; i < marks.length; i++) {
      if (marks[i].textContent.toLowerCase().includes(needle)) {
        marks[i].scrollIntoView({ behavior: "smooth", block: "center" });
        marks[i].style.outline = "3px solid #38bdf8";
        setTimeout(() => { marks[i].style.outline = ""; }, 2500);
        break;
      }
    }
  }, 100);
};

// =========================================
// RENDER COMMON PHRASES LIST
// =========================================
function renderPhrasesList(phrases) {
  const phrasesGrid = document.getElementById("phrasesGrid");
  if (!phrasesGrid) return;

  if (!phrases || phrases.length === 0) {
    phrasesGrid.innerHTML = `
      <div class="empty-state">
        <h3>No common phrases detected</h3>
        <p>No multi-word duplicate phrases found between these documents.</p>
      </div>
    `;
    return;
  }

  let html = "";
  for (let i = 0; i < phrases.length; i++) {
    const item = phrases[i];
    html += `
      <div class="phrase-item">
        <div class="phrase-content">
          <div class="phrase-text">"${escapeHtml(item.phrase)}"</div>
          <div class="phrase-meta">
            <span>📏 ${item.wordCount} words</span>
            <span>•</span>
            <span>🔁 Found ${item.count} time${item.count > 1 ? "s" : ""}</span>
          </div>
        </div>
        <button class="btn btn-outline" style="padding:6px 12px;font-size:12px;" onclick="locatePhrase('${escapeHtml(item.phrase)}')">
          Find in Text →
        </button>
      </div>
    `;
  }

  phrasesGrid.innerHTML = html;
}

// Make locatePhrase globally available
window.locatePhrase = function (phraseText) {
  // Switch to Highlight tab
  const tabBtn = document.querySelector(".tab-btn[data-tab='tab-highlight']");
  if (tabBtn) tabBtn.click();

  // Scroll to first mark or occurrence
  setTimeout(function () {
    const marks = document.querySelectorAll("mark.highlight-match");
    for (let i = 0; i < marks.length; i++) {
      if (marks[i].textContent.toLowerCase().includes(phraseText.toLowerCase())) {
        marks[i].scrollIntoView({ behavior: "smooth", block: "center" });
        marks[i].style.outline = "3px solid #f59e0b";
        setTimeout(() => { marks[i].style.outline = ""; }, 2000);
        break;
      }
    }
  }, 100);
};

// =========================================
// RENDER SPELLING MISTAKES LIST
// =========================================
function renderTyposList(typos) {
  const tbody = document.getElementById("typosTableBody");
  const bannerDesc = document.getElementById("typosBannerDesc");

  if (bannerDesc) {
    bannerDesc.textContent = typos.length === 0
      ? "Great news! No common academic or English spelling mistakes detected."
      : `Found ${typos.length} common spelling mistake${typos.length > 1 ? "s" : ""} across the analyzed documents.`;
  }

  if (!tbody) return;

  if (!typos || typos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:40px;color:#10b981;font-weight:700;">
          ✓ No spelling mistakes or common typos found in either document!
        </td>
      </tr>
    `;
    return;
  }

  let html = "";
  for (let i = 0; i < typos.length; i++) {
    const t = typos[i];
    html += `
      <tr>
        <td>
          <span class="typo-tag-wrong">${escapeHtml(t.word)}</span>
        </td>
        <td>
          <span class="typo-tag-right">✓ ${escapeHtml(t.suggestion)}</span>
        </td>
        <td>
          <span class="typo-doc-badge">${escapeHtml(t.docLabel || "Document")}</span>
        </td>
        <td>
          <div class="typo-context">${escapeHtml(t.context || "—")}</div>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

// =========================================
// RENDER SUMMARY DETAILS
// =========================================
function renderSummaryDetails(similarity, phraseCount, typoCount) {
  const summaryRiskDetail = document.getElementById("summaryRiskDetail");
  if (summaryRiskDetail) {
    if (similarity >= 50) {
      summaryRiskDetail.textContent = `High similarity score (${similarity}%). Substantial duplicate content detected across sections.`;
    } else if (similarity >= 20) {
      summaryRiskDetail.textContent = `Moderate similarity score (${similarity}%). Noticeable shared terminology and phrasing present.`;
    } else {
      summaryRiskDetail.textContent = `Low similarity score (${similarity}%). Content appears largely original with typical reference matches.`;
    }
  }

  const summaryTypoDetail = document.getElementById("summaryTypoDetail");
  if (summaryTypoDetail) {
    summaryTypoDetail.textContent = typoCount === 0
      ? "Writing mechanics are clean with 0 identified spelling errors."
      : `${typoCount} spelling mistakes detected. We recommend correcting these typos before final submission.`;
  }
}

// =========================================
// DOWNLOAD CORRECTED DOCUMENT
// =========================================
function setupDownloadClean() {
  const btnA = document.getElementById("downloadCleanBtnA");
  const btnB = document.getElementById("downloadCleanBtnB");

  if (btnA) {
    btnA.addEventListener("click", function () {
      if (!currentReport) return;
      const textA = currentReport.textA || "";
      const filenames = currentReport.filenames || currentReport.files || ["Document_A.txt"];
      downloadCorrectedDocument(textA, currentTyposA, filenames[0]);
    });
  }

  if (btnB) {
    btnB.addEventListener("click", function () {
      if (!currentReport) return;
      const textB = currentReport.textB || "";
      const filenames = currentReport.filenames || currentReport.files || ["", "Document_B.txt"];
      downloadCorrectedDocument(textB, currentTyposB, filenames[1] || "Document_B.txt");
    });
  }
}

function downloadCorrectedDocument(text, typos, filename) {
  if (!text) {
    showToast("No document text to export.", "warning");
    return;
  }

  let cleanText = text;
  // Sort typos descending by index to avoid index shifting
  const sorted = [...(typos || [])].sort(function (a, b) {
    return b.startIndex - a.startIndex;
  });

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    cleanText = cleanText.substring(0, t.startIndex) + t.suggestion + cleanText.substring(t.endIndex);
  }

  const blob = new Blob([cleanText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = url;
  downloadAnchor.download = "Corrected_" + (filename || "assignment.txt");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}

// =========================================
// HTML ESCAPE
// =========================================
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================================
// PDF EXPORT & PRINT SETUP
// =========================================
function setupPdfExport() {
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const printReportBtn = document.getElementById("printReportBtn");
  const summaryDownloadPdfBtn = document.getElementById("summaryDownloadPdfBtn");
  const summaryPrintBtn = document.getElementById("summaryPrintBtn");
  const btnOpenCertificate = document.getElementById("btnOpenCertificate");
  const summaryCertificateBtn = document.getElementById("summaryCertificateBtn");

  if (downloadPdfBtn) downloadPdfBtn.addEventListener("click", generatePdfReport);
  if (summaryDownloadPdfBtn) summaryDownloadPdfBtn.addEventListener("click", generatePdfReport);
  if (printReportBtn) printReportBtn.addEventListener("click", () => window.print());
  if (summaryPrintBtn) summaryPrintBtn.addEventListener("click", () => window.print());

  if (btnOpenCertificate) {
    btnOpenCertificate.addEventListener("click", () => {
      openCertificateModal(currentReport);
    });
  }
  if (summaryCertificateBtn) {
    summaryCertificateBtn.addEventListener("click", () => {
      openCertificateModal(currentReport);
    });
  }
}

async function generatePdfReport() {
  if (!currentReport) {
    showToast("No report data available to export.", "warning");
    return;
  }

  showToast("Generating official PDF report... Please wait.", "info", 4000);

  let fileAName = "Document_A";
  let fileBName = "Document_B";
  if (Array.isArray(currentReport.filenames) && currentReport.filenames.length >= 2) {
    fileAName = currentReport.filenames[0];
    fileBName = currentReport.filenames[1];
  } else if (Array.isArray(currentReport.files) && currentReport.files.length >= 2) {
    fileAName = currentReport.files[0];
    fileBName = currentReport.files[1];
  }

  let similarity = 0;
  if (currentReport.roundedscore !== undefined) {
    similarity = parseFloat(currentReport.roundedscore);
  } else if (currentReport.similarity !== undefined) {
    similarity = parseFloat(currentReport.similarity);
  }

  const isReferenceMode = currentReport.mode === "reference" || currentReport.type === "reference";
  const reportId = currentReport.id || currentReport.customId || currentReport._id || ("REP-" + Date.now().toString(36).toUpperCase());
  const reportDate = currentReport.date ? new Date(currentReport.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleString();
  const userEmail = localStorage.getItem("userEmail") || currentReport.email || "Verified Student";

  const wordsA = (currentReport.textA || "").trim().split(/\s+/).filter(Boolean).length;
  const wordsB = (currentReport.textB || "").trim().split(/\s+/).filter(Boolean).length;
  const typosCount = (currentTyposA ? currentTyposA.length : 0) + (currentTyposB ? currentTyposB.length : 0);
  const commonGramsCount = currentPhrases ? currentPhrases.length : 0;

  let riskColor = "#10b981";
  let riskBg = "#ecfdf5";
  let riskText = "Low Risk of Plagiarism";
  if (similarity >= 50) {
    riskColor = "#e11d48";
    riskBg = "#fff1f2";
    riskText = "High Risk of Plagiarism";
  } else if (similarity >= 20) {
    riskColor = "#f59e0b";
    riskBg = "#fffbeb";
    riskText = "Moderate Risk of Plagiarism";
  }

  const filters = currentReport.filters || {};
  const activeFilters = [];
  if (filters.excludeReferences) activeFilters.push("Excluded References");
  if (filters.excludeQuotes) activeFilters.push("Excluded Quotes");
  if (filters.excludeSmallMatches) activeFilters.push("Excluded Small Matches");
  const filtersText = activeFilters.length > 0 ? activeFilters.join(" • ") : "Standard (No Exclusions)";

  let phrasesHtml = "";
  if (currentPhrases && currentPhrases.length > 0) {
    const topPhrases = currentPhrases.slice(0, 8);
    phrasesHtml = topPhrases
      .map(
        (p, idx) => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;">
          <span style="color:#4f46e5;font-weight:700;">#${idx + 1}</span>
          <span style="color:#1e293b;flex:1;font-style:italic;">"${escapeHtml(p.phrase)}"</span>
          <span style="color:#64748b;font-size:11px;">${p.wordCount || 4} words</span>
        </div>`
      )
      .join("");
  } else {
    phrasesHtml = `<p style="color:#64748b;font-size:12px;margin:0;">No long matching phrases detected.</p>`;
  }

  const container = document.createElement("div");
  container.id = "assigncheck-pdf-export";
  // html2canvas REQUIRES the element to be on-screen (left:0, top:0) to render correctly.
  // We hide it from user using a full-screen overlay placed in front, not by moving element off-screen.
  container.style.cssText = `
    width: 760px;
    padding: 36px 40px;
    background: #ffffff;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
    line-height: 1.5;
    box-sizing: border-box;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 999997;
    pointer-events: none;
  `;

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:2px solid #4f46e5;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:10px;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">A</div>
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:800;color:#1e1b4b;letter-spacing:-0.5px;">AssignCheck</h2>
          <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Academic Similarity & Integrity Certificate</p>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;font-weight:700;color:#4f46e5;">ID: ${escapeHtml(reportId)}</div>
        <div style="font-size:11px;color:#64748b;">${escapeHtml(reportDate)}</div>
      </div>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <div>
        <div style="font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px;">Evaluated For:</div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(userEmail)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:6px;">
          Mode: <b style="color:#4f46e5;">${isReferenceMode ? "Teacher vs Student Evaluation" : "Student vs Student"}</b>
          • Comparing: <b style="color:#1e293b;">${escapeHtml(fileAName)}</b> vs <b style="color:#1e293b;">${escapeHtml(fileBName)}</b>
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:4px;">
          Filters: <span style="color:#4f46e5;font-weight:600;">${escapeHtml(filtersText)}</span>
        </div>
      </div>
      <div style="text-align:center;padding:12px 20px;border-radius:12px;background:${riskBg};border:1px solid ${riskColor}33;">
        <div style="font-size:32px;font-weight:900;color:${riskColor};line-height:1;">${similarity.toFixed(1)}%</div>
        <div style="font-size:11px;font-weight:700;color:${riskColor};text-transform:uppercase;margin-top:4px;">${escapeHtml(riskText)}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;margin-bottom:24px;">
      <div style="background:#f1f5f9;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:11px;color:#64748b;font-weight:600;">Doc A Words</div>
        <div style="font-size:18px;font-weight:800;color:#1e293b;margin-top:2px;">${wordsA}</div>
      </div>
      <div style="background:#f1f5f9;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:11px;color:#64748b;font-weight:600;">Doc B Words</div>
        <div style="font-size:18px;font-weight:800;color:#1e293b;margin-top:2px;">${wordsB}</div>
      </div>
      <div style="background:#f1f5f9;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:11px;color:#64748b;font-weight:600;">Common Phrases</div>
        <div style="font-size:18px;font-weight:800;color:#4f46e5;margin-top:2px;">${commonGramsCount}</div>
      </div>
      <div style="background:#f1f5f9;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:11px;color:#64748b;font-weight:600;">Typos Flagged</div>
        <div style="font-size:18px;font-weight:800;color:#f59e0b;margin-top:2px;">${typosCount}</div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="font-size:14px;font-weight:800;color:#1e1b4b;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.5px;">
        Key Matching Phrases & Common Sequences
      </h3>
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;background:#ffffff;">
        ${phrasesHtml}
      </div>
    </div>

    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <h4 style="margin:0 0 4px 0;font-size:12px;font-weight:800;color:#6b21a8;text-transform:uppercase;">Detection Methodology</h4>
      <p style="margin:0;font-size:11.5px;color:#581c87;line-height:1.5;">
        Analysis performed using multi-stage linear chunking (100-word blocks), sliding window ${filters.excludeSmallMatches ? "7-gram" : "4-gram"} tokenization, and Jaccard intersection coefficients. Preprocessing filter rules applied: ${escapeHtml(filtersText)}.
      </p>
    </div>

    <div style="border-top:1px dashed #cbd5e1;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="font-size:11px;font-weight:700;color:#475569;">OFFICIAL DIGITAL VERIFICATION</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">Generated via AssignCheck Evaluation Core v2.0 • Secured by MongoDB Atlas</div>
      </div>
      <div style="text-align:center;border:2px solid #4f46e5;color:#4f46e5;padding:6px 14px;border-radius:8px;font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">
        VERIFIED CERTIFICATE
      </div>
    </div>
  `;

  // Cleanup helper — always removes both overlay and container from DOM
  function removePdfContainer() {
    try {
      if (overlay && document.body.contains(overlay)) document.body.removeChild(overlay);
      if (document.body.contains(container)) document.body.removeChild(container);
    } catch (_) {}
  }

  // Full-screen overlay to hide the capture container from the user
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(15,23,42,0.92);
    z-index: 999998;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 16px; font-family: sans-serif; font-weight: 600;
    letter-spacing: 0.5px;
  `;
  overlay.innerHTML = '<div style="text-align:center"><div style="font-size:28px;margin-bottom:12px;">📄</div>Generating PDF Report...<br><small style="opacity:0.6;font-size:12px;">Please wait</small></div>';

  document.body.appendChild(overlay);
  document.body.appendChild(container);

  // Wait 2 frames so browser fully paints the container before html2canvas captures it
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  if (typeof window.html2pdf === "function") {
    const opt = {
      margin: 10,
      filename: `AssignCheck_Report_${fileAName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, allowTaint: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    try {
      await window.html2pdf().set(opt).from(container).save();
      showToast("Official PDF Report downloaded successfully!", "success");
    } catch (e) {
      console.error("html2pdf failed:", e);
      showToast("PDF generator failed. Opening print dialog.", "warning");
      window.print();
    } finally {
      removePdfContainer();
    }
  } else {
    // Fallback: print
    removePdfContainer();
    window.print();
  }
}

// =========================================
// EMPTY STATE (WHEN NO REPORT FOUND)
// =========================================
function renderEmptyReportState() {
  const container = document.querySelector(".rep-container");
  if (!container) return;

  container.innerHTML = `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:60px 24px;text-align:center;max-width:640px;margin:40px auto;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
      <div style="font-size:48px;margin-bottom:16px;">📄</div>
      <h2 style="font-family:'Space Grotesk',sans-serif;font-size:24px;color:#0f172a;margin-bottom:10px;">No Report Selected</h2>
      <p style="color:#64748b;font-size:15px;margin-bottom:28px;line-height:1.6;">
        No active analysis was found in your current session. You can run a new assignment check, view your history, or preview a demo report.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button id="loadSampleReportBtn" class="btn btn-primary" style="padding:12px 24px;font-size:15px;">
          ✨ Load Demo Report
        </button>
        <a href="CheckAssign.html" class="btn btn-outline" style="padding:12px 24px;font-size:15px;">
          + Run New Analysis
        </a>
        <a href="history.html" class="btn btn-outline" style="padding:12px 24px;font-size:15px;">
          View History
        </a>
      </div>
    </div>
  `;

  const loadSampleBtn = document.getElementById("loadSampleReportBtn");
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", async function () {
      const sampleReport = {
        id: "REP-DEMO-SAMPLE",
        filenames: ["Assignment_Student_Alpha.txt", "Assignment_Student_Beta.txt"],
        type: "student",
        similarity: 42.5,
        date: new Date().toISOString(),
        textA: "Neural networks are computational models used in machine learning applications for classification and regression tasks. In this assigment, we implement deep neural architectures to analyze high dimensional data. The algorithm has the best average-case time complexity. An unexpected error occured during execution because the enviroment was not properly configured. Write your answers clearly and avoid plagarism in any academic submission. Students must recieve guidance from faculty before submitting final reports.",
        textB: "Deep neural networks are computational models used in machine learning applications for classification and pattern recognition. In this assigment, we build multilayer models to analyze high dimensional data. The algorithm has the best average-case time complexity. Furthermore, an unexpected error occured during program execution. Write your answers clearly and avoid plagarism in any academic submission. Every student should recieve proper feedback from teachers.",
        filefirstmatches: [
          "computational models used in machine learning applications for classification",
          "In this assigment, we",
          "to analyze high dimensional data",
          "The algorithm has the best average-case time complexity.",
          "an unexpected error occured during",
          "Write your answers clearly and avoid plagarism in any academic submission."
        ],
        filesecondmatches: [
          "computational models used in machine learning applications for classification",
          "In this assigment, we",
          "to analyze high dimensional data",
          "The algorithm has the best average-case time complexity.",
          "an unexpected error occured during",
          "Write your answers clearly and avoid plagarism in any academic submission."
        ]
      };
      currentReport = sampleReport;
      await renderReportDetails(sampleReport);
      showToast("Demo report loaded successfully!", "success");
    });
  }
}