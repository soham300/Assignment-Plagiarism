/* ============================================================
   ASSIGNCHECK — DETAILED REPORT
   Dynamic JSON / SessionStorage Based Report Renderer
   ============================================================ */

"use strict";

/* ============================================================
   STORAGE CONFIG
============================================================ */

const REPORT_STORAGE_KEY = "reportData";

/* ============================================================
   DEFAULT EMPTY DATA
   No fake/hardcoded report values are used.
============================================================ */

const EMPTY_REPORT = {
  fileName: "",
  fileType: "",
  fileSize: 0,
  words: 0,
  pages: 0,
  analyzedAt: "",

  similarity: 0,
  matchingSections: 0,

  aiContent: 0,
  aiConfidence: 0,

  spellingMistakes: 0,

  sources: [],

  filters: {
    copiedContent: 0,
    quotation: 0,
    correctCitation: 0,
    bibliography: 0,
    commonTerminology: 0,
    assignmentTemplate: 0
  },

  findings: [],

  textAnalysis: []
};


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const report = loadReportData();

  if (!report) {
    showNoReportMessage();
    return;
  }

  renderReport(report);

});


/* ============================================================
   LOAD JSON FROM SESSION STORAGE
============================================================ */

function loadReportData() {

  try {

    const rawData = sessionStorage.getItem(REPORT_STORAGE_KEY);

    if (!rawData) {
      console.warn("No reportData found in sessionStorage.");
      return null;
    }

    const parsedData = JSON.parse(rawData);

    return normalizeReportData(parsedData);

  } catch (error) {

    console.error(
      "AssignCheck: Unable to load reportData",
      error
    );

    return null;
  }
}


/* ============================================================
   NORMALIZE DATA
   Allows different property names from backend.
============================================================ */

function normalizeReportData(data) {

  const report = {
    ...EMPTY_REPORT,
    ...data
  };


  /* ----------------------------------------------------------
     BASIC FILE DATA
  ---------------------------------------------------------- */

  report.fileName =
    data.fileName ||
    data.filename ||
    data.name ||
    "";

  report.fileType =
    data.fileType ||
    data.type ||
    getFileExtension(report.fileName);


  report.fileSize =
    Number(
      data.fileSize ||
      data.size ||
      0
    );


  report.words =
    Number(
      data.words ||
      data.wordCount ||
      data.totalWords ||
      0
    );


  report.pages =
    Number(
      data.pages ||
      data.pageCount ||
      0
    );


  report.analyzedAt =
    data.analyzedAt ||
    data.analysisDate ||
    data.date ||
    new Date().toISOString();


  /* ----------------------------------------------------------
     SIMILARITY
  ---------------------------------------------------------- */

  report.similarity = normalizePercentage(
    data.similarity ??
    data.overallSimilarity ??
    data.plagiarism ??
    0
  );


  report.matchingSections =
    Number(
      data.matchingSections ??
      data.matches ??
      data.matchCount ??
      0
    );


  /* ----------------------------------------------------------
     AI
  ---------------------------------------------------------- */

  report.aiContent = normalizePercentage(
    data.aiContent ??
    data.aiPercentage ??
    data.aiScore ??
    data.aiGenerated ??
    0
  );


  report.aiConfidence = normalizePercentage(
    data.aiConfidence ??
    data.confidence ??
    0
  );


  /* ----------------------------------------------------------
     SPELLING
  ---------------------------------------------------------- */

  report.spellingMistakes =
    Number(
      data.spellingMistakes ??
      data.spellingErrors ??
      data.spelling ??
      0
    );


  /* ----------------------------------------------------------
     SOURCES
  ---------------------------------------------------------- */

  report.sources =
    Array.isArray(data.sources)
      ? data.sources
      : [];


  /* ----------------------------------------------------------
     FILTERS
  ---------------------------------------------------------- */

  report.filters = normalizeFilters(
    data.filters || data.plagiarismFilters || {}
  );


  /* ----------------------------------------------------------
     FINDINGS
  ---------------------------------------------------------- */

  report.findings =
    Array.isArray(data.findings)
      ? data.findings
      : generateFindings(report);


  /* ----------------------------------------------------------
     TEXT ANALYSIS
  ---------------------------------------------------------- */

  report.textAnalysis =
    Array.isArray(data.textAnalysis)
      ? data.textAnalysis
      : [];


  return report;
}


/* ============================================================
   NORMALIZE FILTERS
============================================================ */

function normalizeFilters(filters) {

  return {

    copiedContent:
      Number(
        filters.copiedContent ??
        filters.copied ??
        filters.copied_content ??
        0
      ),

    quotation:
      Number(
        filters.quotation ??
        filters.quotes ??
        0
      ),

    correctCitation:
      Number(
        filters.correctCitation ??
        filters.citation ??
        filters.correct_citation ??
        0
      ),

    bibliography:
      Number(
        filters.bibliography ??
        filters.references ??
        0
      ),

    commonTerminology:
      Number(
        filters.commonTerminology ??
        filters.commonTerms ??
        filters.common_terminology ??
        0
      ),

    assignmentTemplate:
      Number(
        filters.assignmentTemplate ??
        filters.template ??
        filters.assignment_template ??
        0
      )

  };
}


/* ============================================================
   MAIN RENDER FUNCTION
============================================================ */

function renderReport(report) {

  renderFileInfo(report);

  renderMainScore(report);

  renderSummary(report);

  renderMetrics(report);

  renderFilters(report);

  renderAI(report);

  renderSources(report);

  renderFindings(report);

  renderTextAnalysis(report);

  renderFooter(report);

}


/* ============================================================
   FILE INFORMATION
============================================================ */

function renderFileInfo(report) {

  const fileName =
    document.getElementById("reportFileName");

  if (fileName) {

    fileName.textContent =
      report.fileName || "Assignment";

  }


  const fileIcon =
    document.querySelector(".file-icon");

  if (fileIcon) {

    fileIcon.textContent =
      report.fileType
        ? report.fileType.toUpperCase()
        : "FILE";

  }


  const fileMeta =
    document.querySelector(".file-meta");

  if (fileMeta) {

    const parts = [];

    if (report.words > 0) {
      parts.push(
        `${formatNumber(report.words)} words`
      );
    }

    if (report.pages > 0) {
      parts.push(
        `${report.pages} pages`
      );
    }

    if (report.fileSize > 0) {
      parts.push(
        formatFileSize(report.fileSize)
      );
    }

    fileMeta.textContent =
      parts.length
        ? `Student Assignment · ${parts.join(" · ")}`
        : "Student Assignment";

  }


  const reportDate =
    document.querySelector(".report-date");

  if (reportDate) {

    reportDate.textContent =
      report.analyzedAt
        ? `Analyzed ${formatDate(report.analyzedAt)}`
        : "";

  }

}


/* ============================================================
   MAIN SCORE
============================================================ */

function renderMainScore(report) {

  const score =
    document.getElementById("overallSimilarity");

  if (score) {

    score.textContent =
      `${report.similarity}%`;

  }


  const ring =
    document.querySelector(".score-ring");

  if (ring) {

    const degree =
      (report.similarity / 100) * 360;

    ring.style.background = `
      conic-gradient(
        var(--primary) 0deg,
        var(--primary) ${degree}deg,
        #e5e7eb ${degree}deg,
        #e5e7eb 360deg
      )
    `;

  }


  const status =
    document.querySelector(".score-status");

  if (status) {

    status.textContent =
      getSimilarityStatus(report.similarity);

    updateSimilarityStatusClass(
      status,
      report.similarity
    );

  }

}


/* ============================================================
   SIMILARITY STATUS
============================================================ */

function getSimilarityStatus(value) {

  if (value <= 10) {
    return "Low Similarity";
  }

  if (value <= 25) {
    return "Moderate Similarity";
  }

  if (value <= 50) {
    return "High Similarity";
  }

  return "Very High Similarity";
}


/* ============================================================
   STATUS COLOR
============================================================ */

function updateSimilarityStatusClass(
  element,
  similarity
) {

  element.style.background = "";
  element.style.color = "";

  if (similarity <= 10) {

    element.style.background =
      "var(--good-soft)";

    element.style.color =
      "#047857";

  } else if (similarity <= 25) {

    element.style.background =
      "var(--warn-soft)";

    element.style.color =
      "#92400e";

  } else {

    element.style.background =
      "var(--danger-soft)";

    element.style.color =
      "#b91c1c";

  }

}


/* ============================================================
   SUMMARY
============================================================ */

function renderSummary(report) {

  const summary =
    document.querySelector(".summary-text");

  if (!summary) return;


  const similarityText =
    `${report.similarity}% similarity`;

  const aiText =
    `${report.aiContent}% AI-content probability`;

  let sourceDescription = "";

  if (report.sources.length > 0) {

    sourceDescription =
      `Detected overlap includes ${report.sources.length} source${report.sources.length === 1 ? "" : "s"}.`;

  } else {

    sourceDescription =
      "No external sources were identified.";

  }


  summary.innerHTML = `
    This assignment contains
    <strong>${escapeHTML(similarityText)}</strong>
    based on the available similarity analysis.

    ${sourceDescription}

    <br><br>

    The AI detection system estimates
    <strong>${escapeHTML(aiText)}</strong>.
  `;

}


/* ============================================================
   METRICS
============================================================ */

function renderMetrics(report) {

  const cards =
    document.querySelectorAll(".metric-card");

  if (!cards.length) return;


  /* Similarity */

  const similarityCard =
    document.querySelector(".metric-card.similarity");

  if (similarityCard) {

    setMetricValue(
      similarityCard,
      `${report.similarity}%`
    );

    setMetricChange(
      similarityCard,
      `${report.matchingSections} matching sections`
    );

  }


  /* AI */

  const aiCard =
    document.querySelector(".metric-card.ai");

  if (aiCard) {

    setMetricValue(
      aiCard,
      `${report.aiContent}%`
    );

    setMetricChange(
      aiCard,
      getAIConfidenceText(report.aiConfidence)
    );

  }


  /* Spelling */

  const spellingCard =
    document.querySelector(".metric-card.spelling");

  if (spellingCard) {

    setMetricValue(
      spellingCard,
      report.spellingMistakes
    );

    setMetricChange(
      spellingCard,
      report.spellingMistakes > 0
        ? "Needs attention"
        : "No spelling issues"
    );

  }


  /* Sources */

  const sourceCard =
    document.querySelector(".metric-card.sources");

  if (sourceCard) {

    setMetricValue(
      sourceCard,
      report.sources.length
    );

    setMetricChange(
      sourceCard,
      `${getMajorSources(report.sources)} major sources`
    );

  }

}


/* ============================================================
   METRIC HELPERS
============================================================ */

function setMetricValue(
  card,
  value
) {

  const element =
    card.querySelector(".metric-value");

  if (element) {
    element.textContent = value;
  }

}


function setMetricChange(
  card,
  value
) {

  const element =
    card.querySelector(".metric-change");

  if (element) {
    element.textContent = value;
  }

}


/* ============================================================
   PLAGIARISM FILTERS
============================================================ */

function renderFilters(report) {

  const filterList =
    document.querySelector(".filter-list");

  if (!filterList) return;


  const filters = [

    {
      name: "Copied Content",
      count: report.filters.copiedContent,
      type:
        report.filters.copiedContent > 0
          ? "danger"
          : "good",
      badge:
        report.filters.copiedContent > 0
          ? "Found"
          : "Clear"
    },

    {
      name: "Quotation",
      count: report.filters.quotation,
      type: "good",
      badge: "Valid"
    },

    {
      name: "Correct Citation",
      count: report.filters.correctCitation,
      type: "good",
      badge: "Valid"
    },

    {
      name: "Bibliography",
      count: report.filters.bibliography,
      type: "good",
      badge: "Valid"
    },

    {
      name: "Common Terminology",
      count: report.filters.commonTerminology,
      type:
        report.filters.commonTerminology > 0
          ? "warning"
          : "good",
      badge:
        report.filters.commonTerminology > 0
          ? "Review"
          : "Clear"
    },

    {
      name: "Assignment Template",
      count: report.filters.assignmentTemplate,
      type: "good",
      badge: "Valid"
    }

  ];


  filterList.innerHTML =
    filters
      .map(createFilterHTML)
      .join("");

}


/* ============================================================
   FILTER HTML
============================================================ */

function createFilterHTML(filter) {

  return `
    <div class="filter-item">

      <span
        class="filter-status ${filter.type}">
      </span>

      <span class="filter-name">
        ${escapeHTML(filter.name)}
      </span>

      <span class="filter-count">
        ${escapeHTML(filter.count)}
      </span>

      <span
        class="filter-badge badge-${filter.type}">
        ${escapeHTML(filter.badge)}
      </span>

    </div>
  `;

}


/* ============================================================
   AI DETECTION
============================================================ */

function renderAI(report) {

  const aiScore =
    document.querySelector(".ai-score");

  if (aiScore) {

    aiScore.textContent =
      `${report.aiContent}%`;

  }


  const aiDescription =
    document.querySelector(".ai-description");

  if (aiDescription) {

    aiDescription.innerHTML = `
      Estimated AI-generated content
      <br>
      <strong>
        ${escapeHTML(
          getAIConfidenceText(
            report.aiConfidence
          )
        )}
      </strong>
    `;

  }


  const confidenceFill =
    document.querySelector(".confidence-fill");

  if (confidenceFill) {

    confidenceFill.style.width =
      `${report.aiConfidence}%`;

  }


  const confidenceHead =
    document.querySelector(".confidence-head");

  if (confidenceHead) {

    const spans =
      confidenceHead.querySelectorAll("span");

    if (spans.length >= 2) {

      spans[1].textContent =
        `${report.aiConfidence}%`;

    }

  }

}


/* ============================================================
   AI CONFIDENCE
============================================================ */

function getAIConfidenceText(confidence) {

  if (confidence >= 75) {
    return "High confidence";
  }

  if (confidence >= 50) {
    return "Medium confidence";
  }

  if (confidence > 0) {
    return "Low confidence";
  }

  return "Confidence unavailable";
}


/* ============================================================
   SOURCES
============================================================ */

function renderSources(report) {

  const sourceList =
    document.querySelector(".source-list");

  if (!sourceList) return;


  if (!report.sources.length) {

    sourceList.innerHTML = `
      <div class="source-item">
        <div class="source-info">
          <div class="source-name">
            No sources detected
          </div>
          <div class="source-url">
            No external source matches are available.
          </div>
        </div>
      </div>
    `;

    return;
  }


  sourceList.innerHTML =
    report.sources
      .map((source, index) =>
        createSourceHTML(
          source,
          index
        )
      )
      .join("");

}


/* ============================================================
   SOURCE HTML
============================================================ */

function createSourceHTML(
  source,
  index
) {

  const name =
    source.name ||
    source.title ||
    source.source ||
    "Unknown Source";


  const url =
    source.url ||
    source.link ||
    source.website ||
    "Source URL unavailable";


  const percentage =
    normalizePercentage(
      source.percentage ??
      source.percent ??
      source.similarity ??
      0
    );


  return `
    <div class="source-item">

      <div class="source-number">
        ${String(index + 1).padStart(2, "0")}
      </div>

      <div class="source-info">

        <div class="source-name">
          ${escapeHTML(name)}
        </div>

        <div class="source-url">
          ${escapeHTML(url)}
        </div>

      </div>

      <div class="source-percent">
        ${percentage}%
      </div>

    </div>
  `;

}


/* ============================================================
   DETAILED FINDINGS
============================================================ */

function renderFindings(report) {

  const findingsCard =
    document.querySelector(".findings-card");

  if (!findingsCard) return;


  const existingFindings =
    findingsCard.querySelectorAll(".finding");


  existingFindings.forEach(
    finding => finding.remove()
  );


  const title =
    findingsCard.querySelector(".section-title");


  const findings =
    report.findings.length
      ? report.findings
      : generateFindings(report);


  findings.forEach(finding => {

    const element =
      document.createElement("div");

    element.className =
      `finding ${getFindingType(finding.type)}`;


    element.innerHTML = `

      <div class="finding-icon">
        ${getFindingIcon(finding.type)}
      </div>

      <div class="finding-content">

        <div class="finding-title">
          ${escapeHTML(
            finding.title || "Finding"
          )}
        </div>

        <div class="finding-description">
          ${escapeHTML(
            finding.description || ""
          )}
        </div>

      </div>

    `;


    if (title) {

      title.insertAdjacentElement(
        "afterend",
        element
      );

    } else {

      findingsCard.appendChild(element);

    }

  });

}


/* ============================================================
   AUTO FINDINGS
============================================================ */

function generateFindings(report) {

  const findings = [];


  if (report.filters.copiedContent > 0) {

    findings.push({

      type: "copy",

      title:
        "Copied content detected",

      description:
        `${report.filters.copiedContent} sections contain strong textual similarity with external or reference content.`

    });

  }


  if (report.aiContent > 0) {

    findings.push({

      type: "ai",

      title:
        "AI-like writing patterns detected",

      description:
        `The analysis estimates ${report.aiContent}% AI-content probability with ${getAIConfidenceText(report.aiConfidence).toLowerCase()}.`

    });

  }


  if (report.spellingMistakes > 0) {

    findings.push({

      type: "spelling",

      title:
        "Spelling mistakes found",

      description:
        `${report.spellingMistakes} spelling issue${report.spellingMistakes === 1 ? "" : "s"} were detected across the submitted assignment.`

    });

  }


  if (!findings.length) {

    findings.push({

      type: "copy",

      title:
        "No major findings",

      description:
        "No significant issues were reported by the available analysis data."

    });

  }


  return findings;

}


/* ============================================================
   FINDING HELPERS
============================================================ */

function getFindingType(type) {

  if (
    type === "copy" ||
    type === "plagiarism" ||
    type === "copied"
  ) {
    return "copy";
  }

  if (
    type === "ai" ||
    type === "ai-content"
  ) {
    return "ai";
  }

  if (
    type === "spelling" ||
    type === "grammar"
  ) {
    return "spelling";
  }

  return "copy";

}


function getFindingIcon(type) {

  const normalized =
    getFindingType(type);

  if (normalized === "copy") {
    return "C";
  }

  if (normalized === "ai") {
    return "AI";
  }

  if (normalized === "spelling") {
    return "A";
  }

  return "!";

}


/* ============================================================
   TEXT ANALYSIS
============================================================ */

function renderTextAnalysis(report) {

  const preview =
    document.querySelector(".document-preview");

  if (!preview) return;


  if (
    !Array.isArray(report.textAnalysis) ||
    !report.textAnalysis.length
  ) {

    preview.innerHTML = `
      <div style="
        color: var(--muted);
        text-align: center;
        padding: 20px;
      ">
        No text-level analysis is available.
      </div>
    `;

    return;

  }


  preview.innerHTML =
    report.textAnalysis
      .map(renderTextSegment)
      .join("");

}


/* ============================================================
   TEXT SEGMENT
============================================================ */

function renderTextSegment(segment) {

  if (typeof segment === "string") {

    return escapeHTML(segment);

  }


  const text =
    segment.text ||
    segment.content ||
    "";


  const type =
    segment.type ||
    segment.category ||
    "";


  if (!type) {

    return escapeHTML(text);

  }


  return `
    <span class="highlight ${escapeHTML(type)}">
      ${escapeHTML(text)}
    </span>
  `;

}


/* ============================================================
   FOOTER
============================================================ */

function renderFooter(report) {

  const footer =
    document.querySelector(".report-footer");

  if (!footer) return;


  const spans =
    footer.querySelectorAll("span");

  if (spans.length >= 2) {

    spans[0].textContent =
      "AssignCheck · Detailed Analysis Report";


    spans[1].textContent =
      `Report ID: ${generateReportID(report)}`;

  }

}


/* ============================================================
   REPORT ID
============================================================ */

function generateReportID(report) {

  if (report.reportId) {

    return report.reportId;

  }


  const date =
    new Date(
      report.analyzedAt || Date.now()
    );


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `AC-${year}-${month}${day}`;

}


/* ============================================================
   MAJOR SOURCES
============================================================ */

function getMajorSources(sources) {

  return sources.filter(source => {

    const percentage =
      Number(
        source.percentage ??
        source.percent ??
        source.similarity ??
        0
      );

    return percentage >= 5;

  }).length;

}


/* ============================================================
   FILE EXTENSION
============================================================ */

function getFileExtension(fileName) {

  if (!fileName) {
    return "";
  }

  const parts =
    fileName.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts
    .pop()
    .toUpperCase();

}


/* ============================================================
   PERCENTAGE NORMALIZER
============================================================ */

function normalizePercentage(value) {

  const number =
    Number(value);

  if (
    Number.isNaN(number) ||
    !Number.isFinite(number)
  ) {

    return 0;

  }

  return Math.min(
    100,
    Math.max(
      0,
      Number(number.toFixed(1))
    )
  );

}


/* ============================================================
   NUMBER FORMAT
============================================================ */

function formatNumber(value) {

  const number =
    Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString();

}


/* ============================================================
   FILE SIZE
============================================================ */

function formatFileSize(bytes) {

  const size =
    Number(bytes);

  if (!size || size <= 0) {
    return "";
  }


  const units =
    ["B", "KB", "MB", "GB"];


  const index =
    Math.floor(
      Math.log(size) /
      Math.log(1024)
    );


  const safeIndex =
    Math.min(
      index,
      units.length - 1
    );


  const converted =
    size /
    Math.pow(
      1024,
      safeIndex
    );


  return `${converted.toFixed(1)} ${units[safeIndex]}`;

}


/* ============================================================
   DATE FORMAT
============================================================ */

function formatDate(dateValue) {

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


/* ============================================================
   ESCAPE HTML
   Prevents backend/user text from injecting HTML.
============================================================ */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ============================================================
   NO REPORT DATA
============================================================ */

function showNoReportMessage() {

  const page =
    document.querySelector(".page");

  if (!page) return;


  const message =
    document.createElement("div");

  message.style.cssText = `
    background: white;
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 40px;
    text-align: center;
    box-shadow: var(--shadow-sm);
    margin-top: 30px;
  `;


  message.innerHTML = `

    <div style="
      font-size: 32px;
      margin-bottom: 12px;
    ">
      📄
    </div>

    <h2 style="
      margin-bottom: 8px;
    ">
      No Report Data Found
    </h2>

    <p style="
      color: var(--muted);
      margin-bottom: 20px;
    ">
      Please run an assignment analysis first.
      The detailed report will be generated from
      the analysis results.
    </p>

    <button
      class="btn btn-primary"
      onclick="history.back()"
    >
      ← Back to Analysis
    </button>

  `;


  page.innerHTML = "";

  page.appendChild(message);

}


/* ============================================================
   OPTIONAL DEBUG HELPERS
============================================================ */

window.AssignCheckReport = {

  getData() {

    return loadReportData();

  },


  clear() {

    sessionStorage.removeItem(
      REPORT_STORAGE_KEY
    );

    location.reload();

  },


  reload() {

    location.reload();

  }

};