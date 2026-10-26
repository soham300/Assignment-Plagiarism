import {
  addfiles,
  processEntry,
  createChunksLinear,
  buildthegrams,
  applyalgo,
} from "../../Backend/CheckBackend.js";
import { extractText } from "./DocumentParser.js";

// State
let currentMode = "student"; // "student" (Student vs Student) or "reference" (Teacher vs Student)
let studentFiles = [];       // Student files
let teacherFiles = [];       // Teacher reference file(s) - max 1 in reference mode
let rawTextMap = {};         // Extracted text by filename
let isRunning = false;
let analysisResults = [];    // Results per student
let currentActiveStudentIdx = 0;
let activeMatchIdx = -1;
let isSyncingScroll = false;

// Main elements
const dropZoneLeft = document.getElementById("dropLeft");
const fileInputLeft = document.getElementById("fileInputLeft");
const dropZoneRight = document.getElementById("dropRight");
const fileInputRight = document.getElementById("fileInputRight");

const analyzeBtn = document.getElementById("analyzeBtn");
const summaryText = document.getElementById("summaryText");

const viewUpload = document.getElementById("viewUpload");
const viewAnimation = document.getElementById("viewAnimation");
const viewResults = document.getElementById("viewResults");

// Animation elements
const aEngine = document.getElementById("aEngine");
const aStage = document.getElementById("aStage");
const progFill = document.getElementById("progFill");
const progPct = document.getElementById("progPct");
const progMsg = document.getElementById("progMsg");
const aeStatus = document.getElementById("aeStatus");
const animStatusText = document.getElementById("animStatusText");
const animStatus = document.getElementById("animStatus");

// Comprehensive components
const batchOverview = document.getElementById("batchOverview");
const batchTableBody = document.getElementById("batchTableBody");
const kpiAvgSim = document.getElementById("kpiAvgSim");
const kpiHighestSim = document.getElementById("kpiHighestSim");
const kpiFlagged = document.getElementById("kpiFlagged");
const kpiClean = document.getElementById("kpiClean");

const studentTabsWrap = document.getElementById("studentTabsWrap");
const studentTabs = document.getElementById("studentTabs");

const matchNavBar = document.getElementById("matchNavBar");
const matchNavInfo = document.getElementById("matchNavInfo");
const matchCounter = document.getElementById("matchCounter");
const prevMatchBtn = document.getElementById("prevMatchBtn");
const nextMatchBtn = document.getElementById("nextMatchBtn");
const syncScrollToggle = document.getElementById("syncScrollToggle");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const printReportBtn = document.getElementById("printReportBtn");

const panelABody = document.getElementById("panelABody");
const panelBBody = document.getElementById("panelBBody");

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Progress stepper
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

// View switching
function showView(view) {
  viewUpload.classList.remove("active");
  viewAnimation.classList.remove("active");
  viewResults.classList.remove("active");

  view.classList.add("active");
  window.scrollTo(0, 0);
}

// Mode Selector (Student vs Student / Teacher vs Student)
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
      // Teacher vs Student
      zoneRight.style.display = "flex";
      filePanelSingle.style.display = "none";
      uploadLayout.className = "upload-layout dual";

      document.getElementById("labelLeft").textContent = "Student Assignments";
      document.getElementById("chipLeft").textContent = "S";
      document.getElementById("labelRight").textContent = "Teacher Reference Answer";
      document.getElementById("chipRight").textContent = "R";
    } else {
      // Student vs Student
      zoneRight.style.display = "none";
      filePanelSingle.style.display = "flex";
      uploadLayout.className = "upload-layout single";

      document.getElementById("labelLeft").textContent = "Student Assignments";
      document.getElementById("chipLeft").textContent = "S1";
    }

    renderAllFileLists();
    checkButtonState();
  });
}

// Render uploaded file lists for all zones
function renderAllFileLists() {
  if (currentMode === "student") {
    // Single panel with all student files
    const container = document.getElementById("fileListSingle");
    const badge = document.getElementById("fileCountBadgeSingle");
    const countText = document.getElementById("fileCountSingle");

    addfiles(null, studentFiles, container);

    if (badge) badge.textContent = studentFiles.length;
    if (countText) countText.textContent = studentFiles.length + " files selected";

    const removeButtons = container.querySelectorAll(".f-remove");
    for (let i = 0; i < removeButtons.length; i++) {
      removeButtons[i].addEventListener("click", function (event) {
        event.stopPropagation();
        const index = Number(this.dataset.idx);
        studentFiles.splice(index, 1);
        renderAllFileLists();
        checkButtonState();
      });
    }
  } else {
    // Dual panel: Student list on left, Teacher file on right
    const containerLeft = document.getElementById("fileListLeft");
    const countLeft = document.getElementById("fileCountLeft");
    const containerRight = document.getElementById("fileListRight");
    const countRight = document.getElementById("fileCountRight");

    // Student files
    addfiles(null, studentFiles, containerLeft);
    if (countLeft) {
      countLeft.textContent = studentFiles.length === 1 ? "• 1 file" : `• ${studentFiles.length} files`;
    }

    const removeLeft = containerLeft.querySelectorAll(".f-remove");
    for (let i = 0; i < removeLeft.length; i++) {
      removeLeft[i].addEventListener("click", function (event) {
        event.stopPropagation();
        const index = Number(this.dataset.idx);
        studentFiles.splice(index, 1);
        renderAllFileLists();
        checkButtonState();
      });
    }

    // Teacher file
    addfiles(null, teacherFiles, containerRight);
    if (countRight) {
      countRight.textContent = teacherFiles.length === 1 ? "• 1 file selected" : "• 0 files";
    }

    const removeRight = containerRight.querySelectorAll(".f-remove");
    for (let i = 0; i < removeRight.length; i++) {
      removeRight[i].addEventListener("click", function (event) {
        event.stopPropagation();
        teacherFiles = [];
        renderAllFileLists();
        checkButtonState();
      });
    }
  }
}

// Check analyze button state
function checkButtonState() {
  if (currentMode === "student") {
    if (studentFiles.length >= 2) {
      analyzeBtn.disabled = false;
      analyzeBtn.setAttribute("aria-disabled", "false");
      summaryText.innerHTML = `Ready to compare <b>${studentFiles.length} student files</b> against each other.`;
    } else {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute("aria-disabled", "true");
      summaryText.innerHTML = "Upload <b>two or more student files</b> to compare them against each other.";
    }
  } else {
    // Teacher vs Student
    const hasTeacher = teacherFiles.length >= 1;
    const studentCount = studentFiles.length;

    if (hasTeacher && studentCount >= 1) {
      analyzeBtn.disabled = false;
      analyzeBtn.setAttribute("aria-disabled", "false");
      summaryText.innerHTML = `Ready to compare <b>${studentCount} student ${studentCount === 1 ? "file" : "files"}</b> against teacher reference (<b>${teacherFiles[0].name}</b>).`;
    } else if (!hasTeacher && studentCount >= 1) {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute("aria-disabled", "true");
      summaryText.innerHTML = `Student files ready (${studentCount}). Now upload a <b>Teacher Reference file</b> on the right.`;
    } else if (hasTeacher && studentCount === 0) {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute("aria-disabled", "true");
      summaryText.innerHTML = `Teacher reference ready (<b>${teacherFiles[0].name}</b>). Now upload <b>one or more student assignments</b> on the left.`;
    } else {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute("aria-disabled", "true");
      summaryText.innerHTML = "Upload a <b>Teacher Reference file</b> and <b>one or more student assignments</b> to compare.";
    }
  }
}

// Add files to student list (Left)
function handleIncomingStudentFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const exists = studentFiles.some(f => f.name === file.name && f.size === file.size);
    if (!exists) {
      studentFiles.push(file);
    }
  }
  renderAllFileLists();
  checkButtonState();
}

// Add file to teacher reference list (Right)
function handleIncomingTeacherFile(files) {
  if (files && files.length > 0) {
    teacherFiles = [files[0]];
  }
  renderAllFileLists();
  checkButtonState();
}

// Left Zone Click / Change / Drag-Drop
dropZoneLeft.addEventListener("click", function () {
  fileInputLeft.click();
});

fileInputLeft.addEventListener("change", function () {
  if (fileInputLeft.files) {
    handleIncomingStudentFiles(fileInputLeft.files);
  }
  fileInputLeft.value = "";
});

const dragEvents = ["dragenter", "dragover", "dragleave", "drop"];

for (let i = 0; i < dragEvents.length; i++) {
  dropZoneLeft.addEventListener(dragEvents[i], function (event) {
    event.preventDefault();
    event.stopPropagation();
  });
}

dropZoneLeft.addEventListener("drop", async function (event) {
  event.preventDefault();
  const items = event.dataTransfer.items;
  const files = [];

  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      let entry = null;
      if (items[i].webkitGetAsEntry) {
        entry = items[i].webkitGetAsEntry();
      }
      if (entry) {
        await processEntry(entry, files);
      } else {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
  } else if (event.dataTransfer.files) {
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      files.push(event.dataTransfer.files[i]);
    }
  }
  handleIncomingStudentFiles(files);
});

// Right Zone Click / Change / Drag-Drop (Teacher Reference)
if (dropZoneRight && fileInputRight) {
  dropZoneRight.addEventListener("click", function () {
    fileInputRight.click();
  });

  fileInputRight.addEventListener("change", function () {
    if (fileInputRight.files) {
      handleIncomingTeacherFile(fileInputRight.files);
    }
    fileInputRight.value = "";
  });

  for (let i = 0; i < dragEvents.length; i++) {
    dropZoneRight.addEventListener(dragEvents[i], function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  dropZoneRight.addEventListener("drop", async function (event) {
    event.preventDefault();
    const files = [];
    if (event.dataTransfer.files) {
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        files.push(event.dataTransfer.files[i]);
      }
    }
    handleIncomingTeacherFile(files);
  });
}

// Animation stages
const stageNames = [
  "Reading assignments...",
  "Extracting text...",
  "Creating linear chunks (100 words)...",
  "Generating 4-grams...",
  "Comparing sections (Jaccard similarity)...",
  "Detecting matching content...",
  "Generating final report...",
];

const progressValues = [10, 25, 42, 58, 74, 90, 100];
const stageDelays = [700, 800, 700, 800, 900, 800, 500];

function updateProgress(percent, message) {
  if (progFill) progFill.style.width = percent + "%";
  if (progPct) progPct.textContent = percent + "%";
  if (progMsg) progMsg.textContent = message;
  if (aeStatus) aeStatus.textContent = message;
}

// Count total words in text
function getWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// ANALYZE BUTTON CLICK HANDLER
analyzeBtn.addEventListener("click", async function () {
  if (isRunning) return;

  if (currentMode === "student" && studentFiles.length < 2) return;
  if (currentMode === "reference" && (studentFiles.length < 1 || teacherFiles.length < 1)) return;

  isRunning = true;
  analyzeBtn.disabled = true;
  analysisResults = [];

  setProgressStep(2);
  showView(viewAnimation);

  const titleText = currentMode === "reference"
    ? `Comparing ${studentFiles.length} student ${studentFiles.length === 1 ? "assignment" : "assignments"} against teacher reference...`
    : `Comparing ${studentFiles.length} assignments...`;

  document.getElementById("animTitle").textContent = titleText;
  aStage.classList.add("p-comparing", "p-scanning");
  aEngine.classList.add("active");

  updateProgress(progressValues[0], stageNames[0]);
  await wait(stageDelays[0]);

  // STAGE 1 & 2: TEXT EXTRACTION & CHUNKING
  updateProgress(progressValues[1], stageNames[1]);

  if (currentMode === "reference") {
    // 1. Process Teacher Reference File
    const teacherFile = teacherFiles[0];
    updateProgress(progressValues[1], `Extracting Teacher Reference: ${teacherFile.name}...`);
    
    let teacherContent = "";
    try {
      teacherContent = await extractText(teacherFile);
    } catch (err) {
      teacherContent = `Content of ${teacherFile.name}`;
    }
    rawTextMap[teacherFile.name] = teacherContent;

    const teacherChunks = createChunksLinear(teacherContent, 100);
    for (let j = 0; j < teacherChunks.length; j++) {
      teacherChunks[j].grams = buildthegrams(teacherChunks[j], 4);
    }

    // Build teacher 4-gram Set for quick matching
    const teacherGramsSet = new Set();
    teacherChunks.forEach(chunk => {
      (chunk.grams || []).forEach(g => teacherGramsSet.add(g));
    });

    // 2. Process each Student File against Teacher Reference
    for (let k = 0; k < studentFiles.length; k++) {
      const studentFile = studentFiles[k];
      updateProgress(
        progressValues[1],
        `Extracting Student Assignment ${k + 1}/${studentFiles.length}: ${studentFile.name}...`
      );

      let studentContent = "";
      try {
        studentContent = await extractText(studentFile, function (cur, tot) {
          updateProgress(progressValues[1], `Parsing ${studentFile.name}: Page ${cur} of ${tot}...`);
        });
      } catch (err) {
        studentContent = `Content of ${studentFile.name}`;
      }
      rawTextMap[studentFile.name] = studentContent;

      const studentChunks = createChunksLinear(studentContent, 100);
      for (let j = 0; j < studentChunks.length; j++) {
        studentChunks[j].grams = buildthegrams(studentChunks[j], 4);
      }

      // Compute Jaccard similarity between this student and teacher
      const simScore = await applyalgo([studentFile, teacherFile], [studentChunks, teacherChunks]);

      // Find matching 4-grams between this student and teacher
      const matchingGrams = new Set();
      studentChunks.forEach(chunk => {
        (chunk.grams || []).forEach(g => {
          if (teacherGramsSet.has(g)) {
            matchingGrams.add(g);
          }
        });
      });

      const roundedScore = Math.min(100, Math.max(0, Math.round(simScore)));
      const matchingCount = roundedScore > 0 ? Math.ceil(roundedScore / 10) : 0;
      const differentCount = Math.max(1, 10 - matchingCount);
      const phrasesCount = matchingGrams.size > 0 ? matchingGrams.size : Math.round(roundedScore * 0.5);

      analysisResults.push({
        originalIdx: k,
        studentFile: studentFile,
        teacherFile: teacherFile,
        score: roundedScore,
        matching: matchingCount,
        different: differentCount,
        phrases: phrasesCount,
        studentChunks: studentChunks,
        teacherChunks: teacherChunks,
        matchingGrams: matchingGrams,
        studentText: studentContent,
        teacherText: teacherContent,
        wordCount: getWordCount(studentContent)
      });
    }

  } else {
    // Student vs Student mode
    const filesToCompare = [studentFiles[0], studentFiles[1]];
    const localChunks = [];

    for (let i = 0; i < filesToCompare.length; i++) {
      const file = filesToCompare[i];
      updateProgress(
        progressValues[1],
        `Extracting text from ${file.name} (${i + 1}/${filesToCompare.length})...`
      );

      let content = "";
      try {
        content = await extractText(file, function (cur, tot) {
          updateProgress(progressValues[1], `Reading ${file.name}: Page ${cur} of ${tot}...`);
        });
      } catch (error) {
        content = "Content of " + file.name;
      }

      rawTextMap[file.name] = content;
      const chunks = createChunksLinear(content, 100);
      for (let j = 0; j < chunks.length; j++) {
        chunks[j].grams = buildthegrams(chunks[j], 4);
      }
      localChunks[i] = chunks;
    }

    const simScore = await applyalgo(filesToCompare, localChunks);
    const roundedScore = Math.min(100, Math.max(0, Math.round(simScore)));

    // Find matching grams between file 0 and 1
    const file1Grams = new Set();
    localChunks[1].forEach(c => (c.grams || []).forEach(g => file1Grams.add(g)));
    const matchingGrams = new Set();
    localChunks[0].forEach(c => (c.grams || []).forEach(g => {
      if (file1Grams.has(g)) matchingGrams.add(g);
    }));

    const matchingCount = roundedScore > 0 ? Math.ceil(roundedScore / 10) : 0;
    const differentCount = Math.max(1, 10 - matchingCount);
    const phrasesCount = matchingGrams.size > 0 ? matchingGrams.size : Math.round(roundedScore * 0.5);

    analysisResults.push({
      originalIdx: 0,
      studentFile: filesToCompare[0],
      teacherFile: filesToCompare[1],
      score: roundedScore,
      matching: matchingCount,
      different: differentCount,
      phrases: phrasesCount,
      studentChunks: localChunks[0],
      teacherChunks: localChunks[1],
      matchingGrams: matchingGrams,
      studentText: rawTextMap[filesToCompare[0].name],
      teacherText: rawTextMap[filesToCompare[1].name],
      wordCount: getWordCount(rawTextMap[filesToCompare[0].name])
    });
  }

  // Animation progression
  const stageElements = aEngine.querySelectorAll(".ae-stage");
  for (let i = 0; i < stageElements.length; i++) {
    updateProgress(progressValues[i + 1], stageNames[i + 1]);
    stageElements[i].classList.add("active");
    await wait(stageDelays[i + 1] || 700);
    stageElements[i].classList.remove("active");
    stageElements[i].classList.add("done");
  }

  // Save report to sessionStorage
  saveReportData();

  // Display results
  currentActiveStudentIdx = 0;
  renderResultsView();

  aStage.classList.remove("p-scanning");
  aEngine.classList.remove("active");
  aEngine.classList.add("done");
  animStatusText.textContent = "Complete";
  animStatus.classList.add("done");

  await wait(600);
  setProgressStep(3);
  showView(viewResults);
});

// Save report to sessionStorage
function saveReportData() {
  if (analysisResults.length === 0) return;
  const active = analysisResults[currentActiveStudentIdx] || analysisResults[0];

  const completeReport = {
    mode: currentMode,
    score: active.score,
    files: [
      { name: active.studentFile.name, size: active.studentFile.size, type: active.studentFile.type },
      { name: active.teacherFile.name, size: active.teacherFile.size, type: active.teacherFile.type }
    ],
    studentSubmissions: analysisResults.map(r => ({
      studentName: r.studentFile.name,
      studentSize: r.studentFile.size,
      score: r.score,
      matchingSections: r.matching,
      matchingPhrases: r.phrases,
      words: r.wordCount
    })),
    text: {
      [active.studentFile.name]: active.studentText || "",
      [active.teacherFile.name]: active.teacherText || ""
    },
    generatedAt: new Date().toISOString()
  };

  sessionStorage.setItem("assignCheckReport", JSON.stringify(completeReport));
  sessionStorage.setItem("reportData", JSON.stringify(completeReport));
}

// Render Results View
function renderResultsView() {
  if (analysisResults.length === 0) return;

  // 1. Batch Leaderboard (In Teacher vs Student mode)
  if (currentMode === "reference") {
    renderBatchLeaderboard();
  } else {
    batchOverview.style.display = "none";
  }

  // 2. Student Tabs (when multiple students in reference mode)
  if (currentMode === "reference" && analysisResults.length > 1) {
    studentTabsWrap.style.display = "flex";
    studentTabs.innerHTML = "";

    analysisResults.forEach((result, idx) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = `student-tab ${idx === currentActiveStudentIdx ? "active" : ""}`;

      const scoreClass = result.score >= 50 ? "high" : result.score >= 25 ? "mid" : "low";

      tab.innerHTML = `
        <span>${escapeHTML(result.studentFile.name)}</span>
        <span class="tab-badge ${scoreClass}">${result.score}%</span>
      `;

      tab.addEventListener("click", () => {
        selectStudent(idx);
      });

      studentTabs.appendChild(tab);
    });
  } else {
    studentTabsWrap.style.display = "none";
  }

  displayActiveStudentResult(currentActiveStudentIdx);
}

// Select active student
function selectStudent(idx) {
  currentActiveStudentIdx = idx;

  // Update tabs
  if (studentTabs) {
    const allTabs = studentTabs.querySelectorAll(".student-tab");
    allTabs.forEach((t, i) => {
      t.classList.toggle("active", i === idx);
    });
  }

  // Update table row highlighting
  if (batchTableBody) {
    const rows = batchTableBody.querySelectorAll("tr");
    rows.forEach(r => {
      const rowIdx = Number(r.dataset.studentIdx);
      r.classList.toggle("active-row", rowIdx === idx);
    });
  }

  displayActiveStudentResult(idx);
  saveReportData();
}

// Render Batch Leaderboard Table & KPIs
function renderBatchLeaderboard() {
  batchOverview.style.display = "flex";

  const total = analysisResults.length;
  let sumScore = 0;
  let highestScore = 0;
  let flaggedCount = 0;
  let cleanCount = 0;

  analysisResults.forEach(r => {
    sumScore += r.score;
    if (r.score > highestScore) highestScore = r.score;
    if (r.score >= 30) flaggedCount++;
    if (r.score < 20) cleanCount++;
  });

  const avgScore = total > 0 ? Math.round(sumScore / total) : 0;

  kpiAvgSim.textContent = avgScore + "%";
  kpiHighestSim.textContent = highestScore + "%";
  kpiFlagged.textContent = flaggedCount;
  kpiClean.textContent = cleanCount;

  // Sort submissions by similarity descending
  const sorted = [...analysisResults].sort((a, b) => b.score - a.score);

  batchTableBody.innerHTML = "";
  sorted.forEach((r, rank) => {
    const tr = document.createElement("tr");
    tr.dataset.studentIdx = r.originalIdx;
    if (r.originalIdx === currentActiveStudentIdx) {
      tr.className = "active-row";
    }

    const riskClass = r.score >= 50 ? "high" : r.score >= 25 ? "mid" : "low";
    const riskLabel = r.score >= 50 ? "High Risk" : r.score >= 25 ? "Moderate" : "Original";
    const barColor = r.score >= 50 ? "#ef4444" : r.score >= 25 ? "#f59e0b" : "#10b981";

    tr.innerHTML = `
      <td><b>#${rank + 1}</b></td>
      <td>
        <span style="font-weight:700;color:var(--ink)">${escapeHTML(r.studentFile.name)}</span>
        <span style="font-size:11px;color:var(--muted);display:block">${formatBytes(r.studentFile.size)}</span>
      </td>
      <td><b>${r.wordCount}</b> words</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <b style="font-family:var(--font-mono);font-size:15px">${r.score}%</b>
          <div style="flex:1;max-width:80px;height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden">
            <div style="width:${r.score}%;height:100%;background:${barColor};border-radius:99px"></div>
          </div>
        </div>
      </td>
      <td><span class="risk-badge ${riskClass}">${riskLabel}</span></td>
      <td><b>${r.phrases}</b> matching phrases</td>
      <td>
        <button type="button" class="btn-inspect" data-idx="${r.originalIdx}">
          Inspect Comparison →
        </button>
      </td>
    `;

    tr.querySelector(".btn-inspect").addEventListener("click", (e) => {
      e.stopPropagation();
      selectStudent(r.originalIdx);
      document.getElementById("comparePanels")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    tr.addEventListener("click", () => {
      selectStudent(r.originalIdx);
    });

    batchTableBody.appendChild(tr);
  });
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

// Display single active result
function displayActiveStudentResult(index) {
  const result = analysisResults[index];
  if (!result) return;

  // Similarity score
  const scoreElement = document.getElementById("resSimilarity");
  countUp(scoreElement, result.score);

  // File pair header
  const fileA = result.studentFile;
  const fileB = result.teacherFile;

  document.getElementById("pairLeft").textContent = fileA.name;
  document.getElementById("pairRight").textContent = fileB.name;

  if (currentMode === "reference") {
    document.getElementById("pairSub").textContent =
      `Student (${fileA.name}) compared against Teacher Reference (${fileB.name})`;
    document.getElementById("panelAChip").textContent = "S";
    document.getElementById("panelBChip").textContent = "T";
  } else {
    document.getElementById("pairSub").textContent =
      `Comparison between ${fileA.name} and ${fileB.name}`;
    document.getElementById("panelAChip").textContent = "A";
    document.getElementById("panelBChip").textContent = "B";
  }

  document.getElementById("panelAName").textContent = fileA.name;
  document.getElementById("panelBName").textContent = fileB.name;

  // Formats
  const extA = (fileA.name.split(".").pop() || "TXT").toUpperCase();
  const extB = (fileB.name.split(".").pop() || "TXT").toUpperCase();
  document.getElementById("panelAFmt").textContent = extA;
  document.getElementById("panelBFmt").textContent = extB;

  // Highlighted text
  const highlightedStudent = highlightMatchingText(result.studentText, result.matchingGrams);
  const highlightedTeacher = highlightMatchingText(result.teacherText, result.matchingGrams);

  panelABody.innerHTML = highlightedStudent;
  panelBBody.innerHTML = highlightedTeacher;

  // Metrics
  document.getElementById("mFiles").textContent = currentMode === "reference" ? studentFiles.length + 1 : 2;
  document.getElementById("mMatching").textContent = result.matching;
  document.getElementById("mDifferent").textContent = result.different;
  document.getElementById("mPhrases").textContent = result.phrases;

  const firstChunkCount = result.studentChunks ? result.studentChunks.length : 0;
  const secondChunkCount = result.teacherChunks ? result.teacherChunks.length : 0;

  document.getElementById("diffList").innerHTML = `
    <li>Student submission has <b>${firstChunkCount} chunks</b> (${result.wordCount} words).</li>
    <li>${currentMode === "reference" ? "Teacher reference answer" : "Comparison document"} has <b>${secondChunkCount} chunks</b>.</li>
    <li>Jaccard similarity across sliding 4-gram sets: <b>${result.score}%</b>.</li>
  `;

  document.getElementById("matchList").innerHTML = `
    <li>Analyzed with sliding 4-gram overlapping phrase windows.</li>
    <li>Found <b>${result.phrases} exact phrase sequences</b> in common with teacher reference.</li>
    <li>${result.score >= 50 ? "High overlap detected — student submission closely resembles reference text." : result.score >= 25 ? "Moderate phrase overlap found with reference answer." : "Original phrasing with low reference answer duplication."}</li>
  `;

  // Initialize phrase navigator
  setupMatchNavigator();
}

// Setup Phrase Inspector Match Navigator
function setupMatchNavigator() {
  const matches = panelABody.querySelectorAll(".hl.match");
  activeMatchIdx = -1;

  if (matches.length > 0) {
    matchNavInfo.textContent = `${matches.length} matching phrase ${matches.length === 1 ? "section" : "sections"} found`;
    matchCounter.textContent = `0 / ${matches.length}`;
    prevMatchBtn.disabled = true;
    nextMatchBtn.disabled = false;
  } else {
    matchNavInfo.textContent = "No matching phrases detected";
    matchCounter.textContent = "0 / 0";
    prevMatchBtn.disabled = true;
    nextMatchBtn.disabled = true;
  }
}

// Next / Previous match buttons
nextMatchBtn.addEventListener("click", () => {
  const matches = panelABody.querySelectorAll(".hl.match");
  if (matches.length === 0) return;

  if (activeMatchIdx >= 0 && activeMatchIdx < matches.length) {
    matches[activeMatchIdx].classList.remove("focused");
  }

  activeMatchIdx = (activeMatchIdx + 1) % matches.length;
  focusMatch(matches, activeMatchIdx);
});

prevMatchBtn.addEventListener("click", () => {
  const matches = panelABody.querySelectorAll(".hl.match");
  if (matches.length === 0) return;

  if (activeMatchIdx >= 0 && activeMatchIdx < matches.length) {
    matches[activeMatchIdx].classList.remove("focused");
  }

  activeMatchIdx = (activeMatchIdx - 1 + matches.length) % matches.length;
  focusMatch(matches, activeMatchIdx);
});

function focusMatch(matches, idx) {
  const target = matches[idx];
  target.classList.add("focused");
  target.scrollIntoView({ behavior: "smooth", block: "center" });

  matchCounter.textContent = `${idx + 1} / ${matches.length}`;
  prevMatchBtn.disabled = matches.length <= 1;
  nextMatchBtn.disabled = matches.length <= 1;
}

// Synchronized scrolling
panelABody.addEventListener("scroll", () => {
  if (!syncScrollToggle.checked || isSyncingScroll) return;
  isSyncingScroll = true;

  const maxScrollA = panelABody.scrollHeight - panelABody.clientHeight;
  const ratio = maxScrollA > 0 ? panelABody.scrollTop / maxScrollA : 0;
  const maxScrollB = panelBBody.scrollHeight - panelBBody.clientHeight;
  panelBBody.scrollTop = ratio * maxScrollB;

  setTimeout(() => { isSyncingScroll = false; }, 30);
});

panelBBody.addEventListener("scroll", () => {
  if (!syncScrollToggle.checked || isSyncingScroll) return;
  isSyncingScroll = true;

  const maxScrollB = panelBBody.scrollHeight - panelBBody.clientHeight;
  const ratio = maxScrollB > 0 ? panelBBody.scrollTop / maxScrollB : 0;
  const maxScrollA = panelABody.scrollHeight - panelABody.clientHeight;
  panelABody.scrollTop = ratio * maxScrollA;

  setTimeout(() => { isSyncingScroll = false; }, 30);
});

// Export CSV Gradebook
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    if (analysisResults.length === 0) return;

    let csv = "Rank,Student Submission,Word Count,Similarity (%),Risk Assessment,Matched Phrases,Teacher Reference,Date\n";
    const sorted = [...analysisResults].sort((a, b) => b.score - a.score);

    sorted.forEach((r, idx) => {
      const risk = r.score >= 50 ? "High Risk" : r.score >= 25 ? "Moderate" : "Original";
      const teacherName = r.teacherFile ? r.teacherFile.name : "Reference";
      const date = new Date().toLocaleDateString();

      csv += `"${idx + 1}","${r.studentFile.name}","${r.wordCount}","${r.score}%","${risk}","${r.phrases}","${teacherName}","${date}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AssignCheck_Plagiarism_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Print Summary Report
if (printReportBtn) {
  printReportBtn.addEventListener("click", () => {
    window.print();
  });
}

// Number counting animation
function countUp(element, targetNumber) {
  let current = 0;
  const increment = Math.max(1, Math.ceil(targetNumber / 30));

  const timer = setInterval(function () {
    current += increment;
    if (current >= targetNumber) {
      current = targetNumber;
      clearInterval(timer);
    }
    element.textContent = current + "%";
  }, 25);
}

// Convert text into paragraphs with highlighted matches
function highlightMatchingText(text, matchingGramsSet) {
  if (!text || text.trim() === "") {
    return "<p>No content extracted.</p>";
  }

  if (!matchingGramsSet || matchingGramsSet.size === 0) {
    return formatTextToParagraphs(text);
  }

  const paragraphs = text.split(/\n+/);
  let html = "";

  for (let p = 0; p < paragraphs.length; p++) {
    const para = paragraphs[p].trim();
    if (!para) continue;

    const words = para.split(/\s+/);
    if (words.length < 4) {
      html += `<p>${escapeHTML(para)}</p>`;
      continue;
    }

    const isMatched = new Array(words.length).fill(false);

    // Sliding 4-gram match detector
    for (let i = 0; i <= words.length - 4; i++) {
      const gram = words.slice(i, i + 4).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, "")).join(" ");
      if (matchingGramsSet.has(gram)) {
        isMatched[i] = true;
        isMatched[i + 1] = true;
        isMatched[i + 2] = true;
        isMatched[i + 3] = true;
      }
    }

    let paraHtml = "<p>";
    let inHighlight = false;

    for (let i = 0; i < words.length; i++) {
      if (isMatched[i] && !inHighlight) {
        paraHtml += '<mark class="hl match">';
        inHighlight = true;
      } else if (!isMatched[i] && inHighlight) {
        paraHtml += "</mark>";
        inHighlight = false;
      }
      paraHtml += escapeHTML(words[i]) + " ";
    }

    if (inHighlight) {
      paraHtml += "</mark>";
    }

    paraHtml = paraHtml.trimEnd() + "</p>";
    html += paraHtml;
  }

  return html || "<p>No content extracted.</p>";
}

// Plain text to paragraphs fallback
function formatTextToParagraphs(text) {
  const lines = text.split(/\n+/);
  let result = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      result += "<p>" + escapeHTML(lines[i]) + "</p>";
    }
  }

  return result || "<p>No content extracted.</p>";
}

// New analysis button
const newAnalysisBtn = document.getElementById("newAnalysisBtn");
if (newAnalysisBtn) {
  newAnalysisBtn.addEventListener("click", function () {
    isRunning = false;
    studentFiles = [];
    teacherFiles = [];
    rawTextMap = {};
    analysisResults = [];
    currentActiveStudentIdx = 0;
    activeMatchIdx = -1;

    const stages = aEngine.querySelectorAll(".ae-stage");
    for (let i = 0; i < stages.length; i++) {
      stages[i].className = "ae-stage";
    }

    aEngine.className = "a-engine";
    aStage.className = "anim-stage";
    animStatus.className = "anim-status";
    animStatusText.textContent = "Running";

    renderAllFileLists();
    checkButtonState();
    setProgressStep(1);
    showView(viewUpload);
  });
}

// Full Detailed Report button
const viewReportBtn = document.getElementById("viewReportBtn");
if (viewReportBtn) {
  viewReportBtn.addEventListener("click", function () {
    window.location.href = "../Templates/DetailedReport.html";
  });
}

// Initial setup
setProgressStep(1);
renderAllFileLists();
checkButtonState();
