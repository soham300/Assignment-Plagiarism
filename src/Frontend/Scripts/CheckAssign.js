import {
  addfiles,
  processEntry,
  createChunksLinear,
  buildthegrams,
  applyalgo,
} from "../../Backend/CheckBackend.js";

let currentMode = "student";
let fileList = [];
let rawTextMap = {};
let localChunks = [];
let isRunning = false;

/* =====================================================
   MAIN ELEMENTS
===================================================== */

const dropZoneLeft = document.getElementById("dropLeft");
const fileInputLeft = document.getElementById("fileInputLeft");
const analyzeBtn = document.getElementById("analyzeBtn");

const viewUpload = document.getElementById("viewUpload");
const viewAnimation = document.getElementById("viewAnimation");
const viewResults = document.getElementById("viewResults");

/* Animation */
const aEngine = document.getElementById("aEngine");
const aStage = document.getElementById("aStage");
const progFill = document.getElementById("progFill");
const progPct = document.getElementById("progPct");
const progMsg = document.getElementById("progMsg");
const aeStatus = document.getElementById("aeStatus");
const animStatusText = document.getElementById("animStatusText");
const animStatus = document.getElementById("animStatus");

/* =====================================================
   UTILITY
===================================================== */

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function escapeHTML(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTextToParagraphs(text) {
  if (!text) {
    return "<p>No content extracted.</p>";
  }

  const lines = String(text).split(/\n+/);
  let result = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.length > 0) {
      result += "<p>" + escapeHTML(line) + "</p>";
    }
  }

  return result || "<p>No content extracted.</p>";
}

/* =====================================================
   PROGRESS
===================================================== */

function setProgressStep(stepNumber) {
  const steps = document.querySelectorAll(".p-step");
  const connectors = document.querySelectorAll(".p-connector");

  for (let i = 0; i < steps.length; i++) {
    const step = Number(steps[i].dataset.step);

    if (step < stepNumber) {
      steps[i].className = "p-step done";
    } else if (step === stepNumber) {
      steps[i].className = "p-step active";
    } else {
      steps[i].className = "p-step";
    }
  }

  for (let i = 0; i < connectors.length; i++) {
    if (i + 1 < stepNumber) {
      connectors[i].classList.add("filled");
    } else {
      connectors[i].classList.remove("filled");
    }
  }
}

/* =====================================================
   VIEWS
===================================================== */

function showView(view) {
  if (viewUpload) viewUpload.classList.remove("active");
  if (viewAnimation) viewAnimation.classList.remove("active");
  if (viewResults) viewResults.classList.remove("active");

  if (view) {
    view.classList.add("active");
  }

  window.scrollTo(0, 0);
}

/* =====================================================
   MODE
===================================================== */

const modeCards = document.querySelectorAll(".mode-card");
const uploadLayout = document.getElementById("uploadLayout");
const filePanelSingle = document.getElementById("filePanelSingle");
const zoneRight = document.getElementById("zoneRight");

for (let i = 0; i < modeCards.length; i++) {
  modeCards[i].addEventListener("click", function () {
    currentMode = this.dataset.mode;

    for (let j = 0; j < modeCards.length; j++) {
      modeCards[j].classList.remove("selected");
      modeCards[j].setAttribute("aria-checked", "false");
    }

    this.classList.add("selected");
    this.setAttribute("aria-checked", "true");

    if (currentMode === "reference") {
      if (zoneRight) zoneRight.style.display = "flex";
      if (filePanelSingle) filePanelSingle.style.display = "none";

      if (uploadLayout) {
        uploadLayout.className = "upload-layout dual";
      }

      const labelLeft = document.getElementById("labelLeft");
      const chipLeft = document.getElementById("chipLeft");
      const summaryText = document.getElementById("summaryText");

      if (labelLeft) {
        labelLeft.textContent = "Student Assignment";
      }

      if (chipLeft) {
        chipLeft.textContent = "S";
      }

      if (summaryText) {
        summaryText.innerHTML =
          "Upload a <b>student file</b> and the <b>teacher reference</b> to compare.";
      }
    } else {
      if (zoneRight) zoneRight.style.display = "none";
      if (filePanelSingle) filePanelSingle.style.display = "flex";

      if (uploadLayout) {
        uploadLayout.className = "upload-layout single";
      }

      const labelLeft = document.getElementById("labelLeft");
      const chipLeft = document.getElementById("chipLeft");
      const summaryText = document.getElementById("summaryText");

      if (labelLeft) {
        labelLeft.textContent = "Student Assignments";
      }

      if (chipLeft) {
        chipLeft.textContent = "S1";
      }

      if (summaryText) {
        summaryText.innerHTML =
          "Upload <b>two or more student files</b> to compare them against each other.";
      }
    }

    renderFileList();
    checkButtonState();
  });
}

/* =====================================================
   FILE LIST
===================================================== */

function renderFileList() {
  const container = document.getElementById("fileListSingle");
  const badge = document.getElementById("fileCountBadgeSingle");
  const countText = document.getElementById("fileCountSingle");

  if (!container) {
    return;
  }

  addfiles(null, fileList, container);

  if (badge) {
    badge.textContent = fileList.length;
  }

  if (countText) {
    countText.textContent =
      fileList.length + " files selected";
  }

  const removeButtons =
    container.querySelectorAll(".f-remove");

  for (let i = 0; i < removeButtons.length; i++) {
    removeButtons[i].addEventListener(
      "click",
      function (event) {
        event.stopPropagation();

        const index = Number(this.dataset.idx);

        if (
          !Number.isNaN(index) &&
          index >= 0 &&
          index < fileList.length
        ) {
          fileList.splice(index, 1);
        }

        renderFileList();
        checkButtonState();
      }
    );
  }
}

/* =====================================================
   ANALYZE BUTTON
===================================================== */

function checkButtonState() {
  const minimumFiles = 2;

  if (fileList.length >= minimumFiles && !isRunning) {
    analyzeBtn.disabled = false;
    analyzeBtn.setAttribute("aria-disabled", "false");
  } else {
    analyzeBtn.disabled = true;
    analyzeBtn.setAttribute("aria-disabled", "true");
  }
}

/* =====================================================
   ADD FILES
===================================================== */

function handleIncomingFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file) {
      fileList.push(file);
    }
  }

  renderFileList();
  checkButtonState();
}

/* =====================================================
   FILE PICKER
===================================================== */

if (dropZoneLeft && fileInputLeft) {
  dropZoneLeft.addEventListener("click", function () {
    fileInputLeft.click();
  });

  fileInputLeft.addEventListener("change", function () {
    if (fileInputLeft.files) {
      handleIncomingFiles(fileInputLeft.files);
    }

    fileInputLeft.value = "";
  });
}

/* =====================================================
   DRAG DROP
===================================================== */

if (dropZoneLeft) {
  const dragEvents = [
    "dragenter",
    "dragover",
    "dragleave",
    "drop",
  ];

  for (let i = 0; i < dragEvents.length; i++) {
    dropZoneLeft.addEventListener(
      dragEvents[i],
      function (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    );
  }

  dropZoneLeft.addEventListener(
    "drop",
    async function (event) {
      event.preventDefault();

      const items = event.dataTransfer.items;
      const files = [];

      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const entry =
            items[i].webkitGetAsEntry
              ? items[i].webkitGetAsEntry()
              : null;

          if (entry) {
            await processEntry(entry, files);
          } else {
            const file = items[i].getAsFile();

            if (file) {
              files.push(file);
            }
          }
        }
      } else if (event.dataTransfer.files) {
        for (
          let i = 0;
          i < event.dataTransfer.files.length;
          i++
        ) {
          files.push(event.dataTransfer.files[i]);
        }
      }

      handleIncomingFiles(files);
    }
  );
}

/* =====================================================
   ANIMATION
===================================================== */

const stageNames = [
  "Reading assignments...",
  "Extracting text...",
  "Creating linear chunks (100 words)...",
  "Generating 4-grams...",
  "Comparing sections (Jaccard similarity)...",
  "Detecting matching content...",
  "Running spelling detection...",
  "Running plagiarism filters...",
  "Checking AI-like content...",
  "Generating final report...",
];

const progressValues = [
  8,
  18,
  32,
  46,
  60,
  70,
  78,
  86,
  94,
  100,
];

const stageDelays = [
  600,
  700,
  700,
  700,
  900,
  700,
  700,
  800,
  900,
  600,
];

function updateProgress(percent, message) {
  if (progFill) {
    progFill.style.width = percent + "%";
  }

  if (progPct) {
    progPct.textContent = percent + "%";
  }

  if (progMsg) {
    progMsg.textContent = message;
  }

  if (aeStatus) {
    aeStatus.textContent = message;
  }
}

/* =====================================================
   SAVE FILE TO JSON SERVER
===================================================== */

async function saveFileToUser(file, chunks) {
  const loggedIn = localStorage.getItem("loggedIn");

  if (!loggedIn) {
    return;
  }

  const email = localStorage.getItem("userEmail");

  if (!email) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/filedata?email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      throw new Error(
        "Unable to find user from JSON Server."
      );
    }

    const users = await response.json();

    if (!Array.isArray(users) || users.length === 0) {
      return;
    }

    const user = users[0];

    if (!Array.isArray(user.filedetails)) {
      user.filedetails = [];
    }

    const fileData = {
      filename: file.name,
      filesize: file.size,
      filetype: file.type,
      chunks: chunks,
      uploadedAt: new Date().toISOString(),
    };

    user.filedetails.push(fileData);

    const updateResponse = await fetch(
      `http://localhost:3000/filedata/${user.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(
        "Failed to update user file data."
      );
    }

    console.log(
      "File added successfully:",
      file.name
    );
  } catch (error) {
    console.error(
      "JSON Server error:",
      error
    );
  }
}

/* =====================================================
   NORMALIZATION
===================================================== */

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  return normalized.split(/\s+/);
}

function countWords(text) {
  const words = tokenize(text);
  return words.length;
}

/* =====================================================
   SENTENCES
===================================================== */

function getSentences(text) {
  if (!text) {
    return [];
  }

  return String(text)
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(function (sentence) {
      return sentence.trim();
    })
    .filter(function (sentence) {
      return sentence.length > 0;
    });
}

/* =====================================================
   SPELLING DETECTION
===================================================== */

/*
  Browser-only spelling detection cannot be equivalent
  to Grammarly/LanguageTool.

  This function detects common obvious spelling mistakes
  using a lightweight dictionary + typo patterns.
*/

const COMMON_MISSPELLINGS = {
  recieve: "receive",
  seperate: "separate",
  definately: "definitely",
  occured: "occurred",
  accomodate: "accommodate",
  adress: "address",
  becuase: "because",
  begining: "beginning",
  beleive: "believe",
  calender: "calendar",
  comming: "coming",
  comparision: "comparison",
  consistant: "consistent",
  existance: "existence",
  goverment: "government",
  independant: "independent",
  knowlege: "knowledge",
  neccessary: "necessary",
  occured: "occurred",
  recieve: "receive",
  refered: "referred",
  sucess: "success",
  succesful: "successful",
  tommorow: "tomorrow",
  untill: "until",
  wierd: "weird",
  wich: "which",
  woud: "would",
  youve: "you've",
  althought: "although",
  enviroment: "environment",
  responsibile: "responsible",
  adressing: "addressing",
  acheive: "achieve",
  aggresive: "aggressive",
  arguement: "argument",
  concious: "conscious",
  embarass: "embarrass",
  experiance: "experience",
  finaly: "finally",
  grammer: "grammar",
  happend: "happened",
  immediatly: "immediately",
  maintan: "maintain",
  occassion: "occasion",
  persue: "pursue",
  priviledge: "privilege",
  pronounciation: "pronunciation",
  publically: "publicly",
  quesion: "question",
  recomend: "recommend",
  relevent: "relevant",
  restarant: "restaurant",
  similiar: "similar",
  speach: "speech",
  succesfully: "successfully",
  thier: "their",
  truely: "truly",
  usefull: "useful",
  writting: "writing",
};

function detectSpellingMistakes(text) {
  const results = [];
  const words = String(text || "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];

  const seen = new Set();

  for (let i = 0; i < words.length; i++) {
    const original = words[i];
    const lower = original.toLowerCase();

    if (
      COMMON_MISSPELLINGS[lower] &&
      !seen.has(lower)
    ) {
      results.push({
        word: original,
        suggestion: COMMON_MISSPELLINGS[lower],
        index: i,
        type: "Common spelling error",
      });

      seen.add(lower);
    }
  }

  return results;
}

/* =====================================================
   QUOTATION DETECTION
===================================================== */

function detectQuotations(text) {
  const results = [];
  const source = String(text || "");

  const patterns = [
    /"([^"]{20,500})"/g,
    /“([^”]{20,500})”/g,
    /'([^']{20,500})'/g,
  ];

  for (let p = 0; p < patterns.length; p++) {
    const regex = patterns[p];
    let match;

    while ((match = regex.exec(source)) !== null) {
      const quote = match[1].trim();

      if (quote.length >= 20) {
        results.push({
          text: quote,
          position: match.index,
          length: quote.length,
        });
      }
    }
  }

  return removeDuplicateObjects(
    results,
    "text"
  ).slice(0, 100);
}

/* =====================================================
   CITATION DETECTION
===================================================== */

function detectCitations(text) {
  const results = [];
  const source = String(text || "");

  const patterns = [
    /\([A-Z][A-Za-z-]+(?:\s+et al\.)?,?\s*\d{4}[a-z]?\)/g,
    /\([A-Z][A-Za-z-]+,\s*\d{4}\)/g,
    /\[[0-9]{1,3}\]/g,
    /\([A-Z][A-Za-z-]+\s+\d{4}\)/g,
  ];

  for (let p = 0; p < patterns.length; p++) {
    const regex = patterns[p];
    let match;

    while ((match = regex.exec(source)) !== null) {
      results.push({
        text: match[0],
        position: match.index,
        type: "Citation pattern",
      });
    }
  }

  return removeDuplicateObjects(
    results,
    "position"
  ).slice(0, 100);
}

/* =====================================================
   BIBLIOGRAPHY DETECTION
===================================================== */

function detectBibliography(text) {
  const source = String(text || "");

  const lines = source
    .split(/\n+/)
    .map(function (line) {
      return line.trim();
    })
    .filter(Boolean);

  const results = [];

  const bibliographyHeading =
    /^(references|bibliography|works cited|sources|reference list)$/i;

  let inBibliography = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (bibliographyHeading.test(line)) {
      inBibliography = true;

      results.push({
        text: line,
        type: "Bibliography heading",
      });

      continue;
    }

    if (inBibliography) {
      if (
        /https?:\/\/|www\.|doi\.org|^\[\d+\]|^\d+\./i.test(
          line
        )
      ) {
        results.push({
          text: line,
          type: "Bibliography/reference entry",
        });
      }
    }
  }

  return results.slice(0, 100);
}

/* =====================================================
   URL / WEBSITE DETECTION
===================================================== */

function detectWebsites(text) {
  const source = String(text || "");

  const matches =
    source.match(
      /(?:https?:\/\/|www\.)[^\s<>"')]+/gi
    ) || [];

  const cleaned = [];

  for (let i = 0; i < matches.length; i++) {
    let url = matches[i]
      .replace(/[.,;:!?]+$/g, "");

    if (!cleaned.includes(url)) {
      cleaned.push(url);
    }
  }

  return cleaned.slice(0, 100);
}

function getWebsiteDomain(url) {
  try {
    let value = url;

    if (!/^https?:\/\//i.test(value)) {
      value = "https://" + value;
    }

    return new URL(value).hostname.replace(
      /^www\./i,
      ""
    );
  } catch (error) {
    return url;
  }
}

/* =====================================================
   COMMON TERMINOLOGY
===================================================== */

const COMMON_TERMS = [
  "introduction",
  "conclusion",
  "abstract",
  "methodology",
  "literature review",
  "results",
  "discussion",
  "objective",
  "objectives",
  "research",
  "analysis",
  "data",
  "education",
  "technology",
  "information",
  "development",
  "society",
  "environment",
  "communication",
  "important",
  "significant",
  "therefore",
  "however",
  "moreover",
  "in conclusion",
];

function detectCommonTerminology(text) {
  const source = normalizeText(text);
  const results = [];

  for (let i = 0; i < COMMON_TERMS.length; i++) {
    const term = COMMON_TERMS[i];
    const escaped = term.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex =
      new RegExp(
        "\\b" + escaped + "\\b",
        "gi"
      );

    const matches = source.match(regex);

    if (matches && matches.length > 0) {
      results.push({
        term: term,
        count: matches.length,
        classification: "Common academic terminology",
      });
    }
  }

  return results;
}

/* =====================================================
   ASSIGNMENT TEMPLATE DETECTION
===================================================== */

const TEMPLATE_PATTERNS = [
  "name:",
  "student name:",
  "roll no:",
  "roll number:",
  "registration number:",
  "class:",
  "section:",
  "semester:",
  "course:",
  "subject:",
  "teacher:",
  "submitted to:",
  "submitted by:",
  "date:",
  "department:",
  "college:",
  "university:",
  "assignment title:",
];

function detectAssignmentTemplate(text) {
  const source = normalizeText(text);
  const results = [];

  for (let i = 0; i < TEMPLATE_PATTERNS.length; i++) {
    const term = TEMPLATE_PATTERNS[i];

    if (source.includes(term)) {
      results.push({
        text: term,
        type: "Assignment template field",
      });
    }
  }

  return results;
}

/* =====================================================
   CROSS DOCUMENT COPIED CONTENT
===================================================== */

function buildWordNGrams(text, size) {
  const words = tokenize(text);
  const result = [];

  if (words.length < size) {
    return result;
  }

  for (let i = 0; i <= words.length - size; i++) {
    result.push(
      words.slice(i, i + size).join(" ")
    );
  }

  return result;
}

function detectCopiedContent(textA, textB) {
  const gramsA = buildWordNGrams(textA, 8);
  const gramsB = buildWordNGrams(textB, 8);

  const setB = new Set(gramsB);
  const matches = [];
  const seen = new Set();

  for (let i = 0; i < gramsA.length; i++) {
    const gram = gramsA[i];

    if (
      setB.has(gram) &&
      !seen.has(gram)
    ) {
      matches.push(gram);
      seen.add(gram);
    }
  }

  return matches.slice(0, 100);
}

/* =====================================================
   AI-LIKE CONTENT DETECTION
===================================================== */

/*
  This is NOT a real AI detector.

  It calculates a heuristic score based on:
  - repetitive sentence structure
  - unusually uniform sentence lengths
  - transition-heavy wording
  - low lexical variation
  - generic academic phrases
  - excessive formal transitions

  For production-grade AI detection, connect this to
  a dedicated AI detection service/backend.
*/

const AI_PHRASES = [
  "it is important to note",
  "in conclusion",
  "furthermore",
  "moreover",
  "in addition",
  "it can be concluded",
  "this highlights the importance",
  "plays a crucial role",
  "has a significant impact",
  "in today's world",
  "in the modern world",
  "it is worth noting",
  "overall,",
  "therefore,",
  "consequently",
];

function calculateLexicalDiversity(words) {
  if (!words.length) {
    return 0;
  }

  const unique = new Set(words);

  return unique.size / words.length;
}

function calculateSentenceUniformity(sentences) {
  if (sentences.length < 3) {
    return 0;
  }

  const lengths = sentences.map(function (sentence) {
    return tokenize(sentence).length;
  });

  const average =
    lengths.reduce(
      function (sum, value) {
        return sum + value;
      },
      0
    ) / lengths.length;

  if (average === 0) {
    return 0;
  }

  const variance =
    lengths.reduce(
      function (sum, value) {
        return (
          sum +
          Math.pow(value - average, 2)
        );
      },
      0
    ) / lengths.length;

  const standardDeviation =
    Math.sqrt(variance);

  const coefficient =
    standardDeviation / average;

  return Math.max(
    0,
    Math.min(
      1,
      1 - coefficient
    )
  );
}

function detectAIContent(text) {
  const source = String(text || "");
  const words = tokenize(source);
  const sentences = getSentences(source);

  if (words.length < 40) {
    return {
      score: 0,
      level: "Insufficient text",
      indicators: [
        "Not enough text for a meaningful heuristic AI-content analysis.",
      ],
      suspiciousSections: [],
      note:
        "This result is only a heuristic and is not proof of AI generation.",
    };
  }

  let score = 0;
  const indicators = [];
  const suspiciousSections = [];

  /* Lexical diversity */
  const diversity =
    calculateLexicalDiversity(words);

  if (diversity < 0.42) {
    score += 20;

    indicators.push(
      "Low lexical diversity detected."
    );
  }

  /* Sentence uniformity */
  const uniformity =
    calculateSentenceUniformity(sentences);

  if (uniformity > 0.72) {
    score += 20;

    indicators.push(
      "Sentence lengths are unusually uniform."
    );
  }

  /* AI phrase frequency */
  const normalized = normalizeText(source);

  let aiPhraseCount = 0;

  for (let i = 0; i < AI_PHRASES.length; i++) {
    if (
      normalized.includes(
        AI_PHRASES[i]
      )
    ) {
      aiPhraseCount++;
    }
  }

  if (aiPhraseCount >= 2) {
    score += Math.min(
      25,
      aiPhraseCount * 5
    );

    indicators.push(
      "Multiple generic academic transition patterns detected."
    );
  }

  /* Repeated sentence beginnings */
  const beginnings = {};

  for (
    let i = 0;
    i < sentences.length;
    i++
  ) {
    const wordsInSentence =
      tokenize(sentences[i]);

    if (wordsInSentence.length >= 3) {
      const beginning =
        wordsInSentence
          .slice(0, 2)
          .join(" ");

      beginnings[beginning] =
        (beginnings[beginning] || 0) + 1;
    }
  }

  const repeatedBeginnings =
    Object.keys(beginnings).filter(
      function (key) {
        return beginnings[key] >= 3;
      }
    );

  if (repeatedBeginnings.length > 0) {
    score += 15;

    indicators.push(
      "Repeated sentence-opening patterns detected."
    );
  }

  /* Generic sentence structures */
  let genericSentenceCount = 0;

  for (
    let i = 0;
    i < sentences.length;
    i++
  ) {
    const sentence =
      normalizeText(
        sentences[i]
      );

    let found = false;

    for (
      let j = 0;
      j < AI_PHRASES.length;
      j++
    ) {
      if (
        sentence.includes(
          AI_PHRASES[j]
        )
      ) {
        found = true;
        break;
      }
    }

    if (found) {
      genericSentenceCount++;

      if (
        suspiciousSections.length < 30
      ) {
        suspiciousSections.push({
          text: sentences[i],
          reason:
            "Contains a generic academic/AI-like phrase.",
        });
      }
    }
  }

  if (
    genericSentenceCount >= 3
  ) {
    score += 15;
  }

  score = Math.min(
    100,
    Math.max(
      0,
      Math.round(score)
    )
  );

  let level = "Low";

  if (score >= 70) {
    level = "High";
  } else if (score >= 40) {
    level = "Moderate";
  }

  if (indicators.length === 0) {
    indicators.push(
      "No strong AI-like linguistic indicators were detected."
    );
  }

  return {
    score: score,
    level: level,
    indicators: indicators,
    suspiciousSections: suspiciousSections,
    note:
      "AI score is heuristic-based and should not be treated as definitive proof.",
  };
}

/* =====================================================
   DETECTION ENGINE
===================================================== */

function analyzeDetectionFeatures(
  textA,
  textB
) {
  const spellingA =
    detectSpellingMistakes(textA);

  const spellingB =
    detectSpellingMistakes(textB);

  const copiedContent =
    detectCopiedContent(
      textA,
      textB
    );

  const quotationA =
    detectQuotations(textA);

  const quotationB =
    detectQuotations(textB);

  const citationA =
    detectCitations(textA);

  const citationB =
    detectCitations(textB);

  const bibliographyA =
    detectBibliography(textA);

  const bibliographyB =
    detectBibliography(textB);

  const terminologyA =
    detectCommonTerminology(textA);

  const terminologyB =
    detectCommonTerminology(textB);

  const templateA =
    detectAssignmentTemplate(textA);

  const templateB =
    detectAssignmentTemplate(textB);

  const websitesA =
    detectWebsites(textA);

  const websitesB =
    detectWebsites(textB);

  const aiA =
    detectAIContent(textA);

  const aiB =
    detectAIContent(textB);

  const combinedAI =
    Math.round(
      (
        aiA.score +
        aiB.score
      ) / 2
    );

  let combinedLevel = "Low";

  if (combinedAI >= 70) {
    combinedLevel = "High";
  } else if (combinedAI >= 40) {
    combinedLevel = "Moderate";
  }

  return {
    spelling: {
      total:
        spellingA.length +
        spellingB.length,

      files: [
        {
          fileIndex: 0,
          mistakes: spellingA,
        },
        {
          fileIndex: 1,
          mistakes: spellingB,
        },
      ],
    },

    plagiarism: {
      copiedContent: copiedContent,

      quotations: [
        ...quotationA.map(function (item) {
          return {
            ...item,
            fileIndex: 0,
          };
        }),
        ...quotationB.map(function (item) {
          return {
            ...item,
            fileIndex: 1,
          };
        }),
      ],

      correctCitations: [
        ...citationA.map(function (item) {
          return {
            ...item,
            fileIndex: 0,
          };
        }),
        ...citationB.map(function (item) {
          return {
            ...item,
            fileIndex: 1,
          };
        }),
      ],

      bibliography: [
        ...bibliographyA.map(function (item) {
          return {
            ...item,
            fileIndex: 0,
          };
        }),
        ...bibliographyB.map(function (item) {
          return {
            ...item,
            fileIndex: 1,
          };
        }),
      ],

      commonTerminology: {
        fileA: terminologyA,
        fileB: terminologyB,
      },

      assignmentTemplate: [
        ...templateA.map(function (item) {
          return {
            ...item,
            fileIndex: 0,
          };
        }),
        ...templateB.map(function (item) {
          return {
            ...item,
            fileIndex: 1,
          };
        }),
      ],

      websites: {
        fileA: websitesA.map(function (url) {
          return {
            url: url,
            domain: getWebsiteDomain(url),
          };
        }),

        fileB: websitesB.map(function (url) {
          return {
            url: url,
            domain: getWebsiteDomain(url),
          };
        }),
      },
    },

    aiContent: {
      score: combinedAI,
      level: combinedLevel,

      files: [
        {
          fileIndex: 0,
          score: aiA.score,
          level: aiA.level,
          indicators: aiA.indicators,
          suspiciousSections:
            aiA.suspiciousSections,
        },
        {
          fileIndex: 1,
          score: aiB.score,
          level: aiB.level,
          indicators: aiB.indicators,
          suspiciousSections:
            aiB.suspiciousSections,
        },
      ],

      indicators: [
        ...aiA.indicators,
        ...aiB.indicators,
      ],

      suspiciousSections: [
        ...aiA.suspiciousSections.map(
          function (item) {
            return {
              ...item,
              fileIndex: 0,
            };
          }
        ),

        ...aiB.suspiciousSections.map(
          function (item) {
            return {
              ...item,
              fileIndex: 1,
            };
          }
        ),
      ],

      note:
        "AI-content score is a heuristic indicator, not definitive proof of AI generation.",
    },
  };
}

/* =====================================================
   DUPLICATE HELPER
===================================================== */

function removeDuplicateObjects(
  array,
  key
) {
  const seen = new Set();
  const result = [];

  for (let i = 0; i < array.length; i++) {
    const value = array[i][key];

    if (!seen.has(value)) {
      seen.add(value);
      result.push(array[i]);
    }
  }

  return result;
}

/* =====================================================
   ANALYZE
===================================================== */

if (analyzeBtn) {
  analyzeBtn.addEventListener(
    "click",
    async function () {
      if (
        isRunning ||
        fileList.length < 2
      ) {
        return;
      }

      isRunning = true;
      analyzeBtn.disabled = true;

      setProgressStep(2);
      showView(viewAnimation);

      const animTitle =
        document.getElementById("animTitle");

      if (animTitle) {
        animTitle.textContent =
          "Analyzing " +
          fileList.length +
          " assignments...";
      }

      if (aStage) {
        aStage.classList.add(
          "p-comparing",
          "p-scanning"
        );
      }

      if (aEngine) {
        aEngine.classList.add("active");
      }

      updateProgress(
        progressValues[0],
        stageNames[0]
      );

      await wait(stageDelays[0]);

      /* =================================================
         RESET
      ================================================= */

      localChunks = [];
      rawTextMap = {};

      /*
        Existing backend compares first two files.
      */

      const filesToCompare = [
        fileList[0],
        fileList[1],
      ];

      /* =================================================
         READ FILES
      ================================================= */

      for (
        let i = 0;
        i < filesToCompare.length;
        i++
      ) {
        const file =
          filesToCompare[i];

        let content = "";

        try {
          content =
            await file.text();
        } catch (error) {
          console.error(
            "Unable to read file:",
            file.name,
            error
          );

          content = "";
        }

        rawTextMap[file.name] =
          content;

        /* 100-word chunks */

        const chunks =
          createChunksLinear(
            content,
            100
          );

        /* 4-grams */

        for (
          let j = 0;
          j < chunks.length;
          j++
        ) {
          chunks[j].grams =
            buildthegrams(
              chunks[j],
              4
            );
        }

        localChunks[i] =
          chunks;

        /* JSON Server */

        await saveFileToUser(
          file,
          chunks
        );
      }

      /* =================================================
         BASIC ANIMATION
      ================================================= */

      const stageElements =
        aEngine
          ? aEngine.querySelectorAll(
              ".ae-stage"
            )
          : [];

      for (
        let i = 0;
        i < stageElements.length;
        i++
      ) {
        const progressIndex =
          Math.min(
            i + 1,
            progressValues.length - 1
          );

        const stageIndex =
          Math.min(
            i + 1,
            stageNames.length - 1
          );

        updateProgress(
          progressValues[
            progressIndex
          ],
          stageNames[stageIndex]
        );

        stageElements[i].classList.add(
          "active"
        );

        await wait(
          stageDelays[
            progressIndex
          ] || 700
        );

        stageElements[i].classList.remove(
          "active"
        );

        stageElements[i].classList.add(
          "done"
        );
      }

      /* =================================================
         SIMILARITY
      ================================================= */

      let realScore = 0;

      try {
        realScore =
          await applyalgo(
            filesToCompare,
            localChunks
          );
      } catch (error) {
        console.error(
          "Similarity algorithm failed:",
          error
        );

        realScore = 0;
      }

      /* =================================================
         EXTRA DETECTION
      ================================================= */

      updateProgress(
        78,
        "Running spelling detection..."
      );

      await wait(400);

      updateProgress(
        86,
        "Running plagiarism filters..."
      );

      await wait(400);

      updateProgress(
        94,
        "Checking AI-like content..."
      );

      const textA =
        rawTextMap[
          filesToCompare[0].name
        ] || "";

      const textB =
        rawTextMap[
          filesToCompare[1].name
        ] || "";

      const detectionData =
        analyzeDetectionFeatures(
          textA,
          textB
        );

      await wait(500);

      updateProgress(
        100,
        "Generating final report..."
      );

      /* =================================================
         FINISH
      ================================================= */

      if (aStage) {
        aStage.classList.remove(
          "p-scanning"
        );
      }

      if (aEngine) {
        aEngine.classList.remove(
          "active"
        );

        aEngine.classList.add(
          "done"
        );
      }

      if (animStatusText) {
        animStatusText.textContent =
          "Complete";
      }

      if (animStatus) {
        animStatus.classList.add(
          "done"
        );
      }

      await wait(700);

      /* =================================================
         DISPLAY
      ================================================= */

      displayResults(
        filesToCompare,
        realScore,
        detectionData
      );

      setProgressStep(3);
      showView(viewResults);

      isRunning = false;

      checkButtonState();
    }
  );
}

/* =====================================================
   COUNT UP
===================================================== */

function countUp(
  element,
  targetNumber
) {
  if (!element) {
    return;
  }

  let current = 0;

  const target =
    Number(targetNumber) || 0;

  const increment =
    Math.max(
      1,
      Math.ceil(
        target / 30
      )
    );

  const timer =
    setInterval(function () {
      current += increment;

      if (
        current >= target
      ) {
        current = target;

        clearInterval(timer);
      }

      element.textContent =
        current + "%";
    }, 25);
}

/* =====================================================
   ALL GRAMS
===================================================== */

function getAllGrams(chunks) {
  const grams = [];

  if (!Array.isArray(chunks)) {
    return grams;
  }

  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {
    const chunk = chunks[i];

    if (
      chunk &&
      Array.isArray(chunk.grams)
    ) {
      for (
        let j = 0;
        j < chunk.grams.length;
        j++
      ) {
        grams.push(
          chunk.grams[j]
        );
      }
    }
  }

  return grams;
}

/* =====================================================
   MATCHING DATA
===================================================== */

function calculateMatchingData() {
  const gramsA =
    getAllGrams(
      localChunks[0]
    );

  const gramsB =
    getAllGrams(
      localChunks[1]
    );

  const setA =
    new Set(gramsA);

  const setB =
    new Set(gramsB);

  let matching = 0;

  setA.forEach(function (gram) {
    if (setB.has(gram)) {
      matching++;
    }
  });

  const totalUnique =
    new Set(
      gramsA.concat(gramsB)
    ).size;

  const different =
    Math.max(
      0,
      totalUnique - matching
    );

  return {
    matching: matching,
    different: different,
    total: totalUnique,
  };
}

/* =====================================================
   DISPLAY RESULTS
===================================================== */

function displayResults(
  files,
  score,
  detectionData
) {
  const roundedScore =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          Number(score).toFixed(2)
        )
      )
    );

  const scoreElement =
    document.getElementById(
      "resSimilarity"
    );

  countUp(
    scoreElement,
    roundedScore
  );

  const fileA =
    files[0];

  const fileB =
    files[1];

  /* File names */

  const pairLeft =
    document.getElementById(
      "pairLeft"
    );

  if (pairLeft) {
    pairLeft.textContent =
      fileA.name;
  }

  const pairRight =
    document.getElementById(
      "pairRight"
    );

  if (pairRight) {
    pairRight.textContent =
      fileB.name;
  }

  const pairSub =
    document.getElementById(
      "pairSub"
    );

  if (pairSub) {
    pairSub.textContent =
      "Comparison between " +
      fileA.name +
      " and " +
      fileB.name;
  }

  const panelAName =
    document.getElementById(
      "panelAName"
    );

  if (panelAName) {
    panelAName.textContent =
      fileA.name;
  }

  const panelBName =
    document.getElementById(
      "panelBName"
    );

  if (panelBName) {
    panelBName.textContent =
      fileB.name;
  }

  /* Text */

  const textA =
    rawTextMap[fileA.name] ||
    "";

  const textB =
    rawTextMap[fileB.name] ||
    "";

  const panelABody =
    document.getElementById(
      "panelABody"
    );

  if (panelABody) {
    panelABody.innerHTML =
      formatTextToParagraphs(
        textA
      );
  }

  const panelBBody =
    document.getElementById(
      "panelBBody"
    );

  if (panelBBody) {
    panelBBody.innerHTML =
      formatTextToParagraphs(
        textB
      );
  }

  /* Matching */

  const matchingData =
    calculateMatchingData();

  const mFiles =
    document.getElementById(
      "mFiles"
    );

  if (mFiles) {
    mFiles.textContent =
      files.length;
  }

  const mMatching =
    document.getElementById(
      "mMatching"
    );

  if (mMatching) {
    mMatching.textContent =
      matchingData.matching;
  }

  const mDifferent =
    document.getElementById(
      "mDifferent"
    );

  if (mDifferent) {
    mDifferent.textContent =
      matchingData.different;
  }

  const mPhrases =
    document.getElementById(
      "mPhrases"
    );

  if (mPhrases) {
    mPhrases.textContent =
      matchingData.matching;
  }

  /* Chunks */

  const firstChunkCount =
    localChunks[0]
      ? localChunks[0].length
      : 0;

  const secondChunkCount =
    localChunks[1]
      ? localChunks[1].length
      : 0;

  const diffList =
    document.getElementById(
      "diffList"
    );

  if (diffList) {
    diffList.innerHTML =
      "<li>File 1 has <b>" +
      firstChunkCount +
      " chunks</b> (100 words per chunk).</li>" +

      "<li>File 2 has <b>" +
      secondChunkCount +
      " chunks</b> (100 words per chunk).</li>" +

      "<li>Unique matching 4-grams detected: <b>" +
      matchingData.matching +
      "</b>.</li>" +

      "<li>Unique different 4-grams detected: <b>" +
      matchingData.different +
      "</b>.</li>" +

      "<li>Calculated Jaccard similarity: <b>" +
      roundedScore +
      "%</b>.</li>" +

      "<li>Spelling issues detected: <b>" +
      detectionData.spelling.total +
      "</b>.</li>" +

      "<li>Copied-content phrases detected: <b>" +
      detectionData.plagiarism.copiedContent.length +
      "</b>.</li>" +

      "<li>AI-like heuristic score: <b>" +
      detectionData.aiContent.score +
      "%</b>.</li>";
  }

  const matchList =
    document.getElementById(
      "matchList"
    );

  if (matchList) {
    matchList.innerHTML =
      "<li>Processed using overlapping 4-gram windows.</li>" +

      "<li>" +
      (
        matchingData.matching > 0
          ? matchingData.matching +
            " matching 4-grams detected."
          : "No matching 4-grams detected."
      ) +
      "</li>" +

      "<li>Similarity score: <b>" +
      roundedScore +
      "%</b>.</li>" +

      "<li>Spelling mistakes: <b>" +
      detectionData.spelling.total +
      "</b>.</li>" +

      "<li>Copied-content matches: <b>" +
      detectionData.plagiarism.copiedContent.length +
      "</b>.</li>" +

      "<li>AI-like content score: <b>" +
      detectionData.aiContent.score +
      "%</b>.</li>";
  }

  /* =================================================
     SAVE REPORT
  ================================================= */

  const reportData = {
    score: roundedScore,

    mode: currentMode,

    files: files.map(
      function (file) {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
        };
      }
    ),

    text: {
      [fileA.name]: textA,
      [fileB.name]: textB,
    },

    chunks: localChunks,

    matching: {
      count:
        matchingData.matching,

      different:
        matchingData.different,

      total:
        matchingData.total,
    },

    detections:
      detectionData,

    generatedAt:
      new Date().toISOString(),
  };

  sessionStorage.setItem(
    "assignCheckReport",
    JSON.stringify(
      reportData
    )
  );
}

/* =====================================================
   NEW ANALYSIS
===================================================== */

const newAnalysisBtn =
  document.getElementById(
    "newAnalysisBtn"
  );

if (newAnalysisBtn) {
  newAnalysisBtn.addEventListener(
    "click",
    function () {
      isRunning = false;

      fileList.length = 0;
      localChunks = [];
      rawTextMap = {};

      sessionStorage.removeItem(
        "assignCheckReport"
      );

      if (aEngine) {
        const stages =
          aEngine.querySelectorAll(
            ".ae-stage"
          );

        for (
          let i = 0;
          i < stages.length;
          i++
        ) {
          stages[i].className =
            "ae-stage";
        }

        aEngine.className =
          "a-engine";
      }

      if (aStage) {
        aStage.className =
          "anim-stage";
      }

      if (animStatus) {
        animStatus.className =
          "anim-status";
      }

      if (animStatusText) {
        animStatusText.textContent =
          "Running";
      }

      renderFileList();
      checkButtonState();

      setProgressStep(1);
      showView(viewUpload);
    }
  );
}

/* =====================================================
   VIEW REPORT
===================================================== */

const viewReportBtn =
  document.getElementById(
    "viewReportBtn"
  );

if (viewReportBtn) {
  viewReportBtn.addEventListener(
    "click",
    function () {
      const report =
        sessionStorage.getItem(
          "assignCheckReport"
        );

      if (!report) {
        alert(
          "No report data available."
        );

        return;
      }

      window.location.href =
        "DetailedReport.html";
    }
  );
}

/* =====================================================
   INITIAL SETUP
===================================================== */

setProgressStep(1);
checkButtonState();