"use strict";

/* =========================================================
   ALL IMPORTS MUST BE AT TOP (ESM strict requirement)
========================================================= */

import API_BASE from "./config.js";
import { showToast } from "./toast.js";
import { openCertificateModal } from "./certificateModal.js";
import {
  addfiles,
  processEntry,
  filterDocumentText,
  createChunksLinear,
  buildthegrams,
  applyalgo,
  getthecommongrams,
  detectSpellingMistakes,
  detectSpellingMistakesAsync,
  extractCommonPhrases,
  highlightTextWithMatchesAndTypos,
  extractFileText,
} from "./CheckBackend.js";

/* =========================================================
   ASSIGNCHECK — CHECKASSIGN.JS
   UPDATED RESULT FLOW
========================================================= */


/* =========================================================
   LOGIN CHECK (NON-BLOCKING)
========================================================= */

const hasToken = localStorage.getItem("authToken");
const hasLoggedInFlag = localStorage.getItem("loggedIn") === "true";
const hasEmail = localStorage.getItem("userEmail");

if (!hasToken && !hasLoggedInFlag && !hasEmail) {
  setTimeout(() => {
    showToast("Tip: Log in to save your reports to your history profile.", "info");
  }, 1000);
}


/* =========================================================
   BACKEND IMPORTS — moved to top; kept comment for clarity
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentMode = "student";

let fileList = [];
let studentFiles = [];
let teacherRefFile = null;
let lastBatchEvaluation = null;

let rawTextMap = {};

let localChunks = [];

let isRunning = false;


/* =========================================================
   MAIN ELEMENTS
========================================================= */

const dropZoneLeft =
  document.getElementById("dropLeft");

const fileInputLeft =
  document.getElementById("fileInputLeft");

const dropZoneRight = document.getElementById("dropRight");
const fileInputRight = document.getElementById("fileInputRight");
const fileListLeft = document.getElementById("fileListLeft");
const fileListRight = document.getElementById("fileListRight");
const fileCountLeft = document.getElementById("fileCountLeft");
const fileCountRight = document.getElementById("fileCountRight");
const pairResultsWrap = document.getElementById("pairResultsWrap");
const batchResultsWrap = document.getElementById("batchResultsWrap");
const backToBatchBtn = document.getElementById("backToBatchBtn");
const batchNewAnalysisBtn = document.getElementById("batchNewAnalysisBtn");

const analyzeBtn = document.getElementById("analyzeBtn");
const viewUpload = document.getElementById("viewUpload");
const viewAnimation = document.getElementById("viewAnimation");
const viewResults = document.getElementById("viewResults");


/* =========================================================
   ANIMATION ELEMENTS
========================================================= */

const aEngine =
  document.getElementById("aEngine");

const aStage =
  document.getElementById("aStage");

const progFill =
  document.getElementById("progFill");

const progPct =
  document.getElementById("progPct");

const progMsg =
  document.getElementById("progMsg");

const aeStatus =
  document.getElementById("aeStatus");

const animStatusText =
  document.getElementById("animStatusText");

const animStatus =
  document.getElementById("animStatus");


/* =========================================================
   SAFETY CHECK
========================================================= */

if (!analyzeBtn) {
  console.error("Analyze button #analyzeBtn not found.");
}

if (!viewUpload) {
  console.error("Upload view #viewUpload not found.");
}

if (!viewAnimation) {
  console.error("Animation view #viewAnimation not found.");
}

if (!viewResults) {
  console.error("Result view #viewResults not found.");
}


/* =========================================================
   WAIT
========================================================= */

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}


/* =========================================================
   PROGRESS STEPS
========================================================= */

function setProgressStep(stepNumber) {

  const steps =
    document.querySelectorAll(".p-step");

  const connectors =
    document.querySelectorAll(".p-connector");


  for (let i = 0; i < steps.length; i++) {

    const step =
      Number(steps[i].dataset.step);

    if (step < stepNumber) {

      steps[i].className =
        "p-step done";

    } else if (step === stepNumber) {

      steps[i].className =
        "p-step active";

    } else {

      steps[i].className =
        "p-step";

    }
  }


  for (let i = 0; i < connectors.length; i++) {

    if (i + 1 < stepNumber) {

      connectors[i]
        .classList
        .add("filled");

    } else {

      connectors[i]
        .classList
        .remove("filled");

    }
  }
}


/* =========================================================
   SHOW VIEW
========================================================= */

function showView(view) {

  if (!viewUpload ||
      !viewAnimation ||
      !viewResults ||
      !view) {

    return;
  }


  viewUpload.classList.remove("active");

  viewAnimation.classList.remove("active");

  viewResults.classList.remove("active");


  view.classList.add("active");


  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}


/* =========================================================
   MODE SWITCH
========================================================= */

const modeCards = document.querySelectorAll(".mode-card");
const uploadLayout = document.getElementById("uploadLayout");
const filePanelSingle = document.getElementById("filePanelSingle");
const zoneRight = document.getElementById("zoneRight");

for (let i = 0; i < modeCards.length; i++) {
  modeCards[i].addEventListener("click", function () {
    const prevMode = currentMode;
    currentMode = this.dataset.mode;

    for (let j = 0; j < modeCards.length; j++) {
      modeCards[j].classList.remove("selected");
      modeCards[j].setAttribute("aria-checked", "false");
    }

    this.classList.add("selected");
    this.setAttribute("aria-checked", "true");

    if (currentMode === "reference") {
      // Switching TO reference mode: sync fileList → studentFiles so files don't vanish
      if (prevMode === "student" && fileList.length > 0 && studentFiles.length === 0) {
        studentFiles = [...fileList];
      }

      if (zoneRight) zoneRight.style.display = "flex";
      if (filePanelSingle) filePanelSingle.style.display = "none";
      if (uploadLayout) uploadLayout.className = "upload-layout dual";

      const labelLeft = document.getElementById("labelLeft");
      const chipLeft = document.getElementById("chipLeft");
      if (labelLeft) labelLeft.textContent = "Student Assignments";
      if (chipLeft) chipLeft.textContent = "S";

      showToast("Mode: Teacher vs Student", "info");
    } else {
      // Switching TO student mode: sync studentFiles → fileList so files don't vanish
      if (prevMode === "reference" && studentFiles.length > 0 && fileList.length === 0) {
        fileList = [...studentFiles];
      }

      if (zoneRight) zoneRight.style.display = "none";
      if (filePanelSingle) filePanelSingle.style.display = "flex";
      if (uploadLayout) uploadLayout.className = "upload-layout single";

      const labelLeft = document.getElementById("labelLeft");
      const chipLeft = document.getElementById("chipLeft");
      if (labelLeft) labelLeft.textContent = "Student Assignments";
      if (chipLeft) chipLeft.textContent = "S1";

      showToast("Mode: Student vs Student", "info");
    }

    renderFileList();
    checkButtonState();
  });
}

/* =========================================================
   RENDER FILE LISTS (STUDENT & TEACHER REFERENCE)
========================================================= */

function renderFileList() {
  if (currentMode === "reference") {
    // Left Zone: Student Assignments
    if (fileListLeft) {
      addfiles(null, studentFiles, fileListLeft);
      if (fileCountLeft) {
        fileCountLeft.textContent = studentFiles.length + (studentFiles.length === 1 ? " file" : " files");
      }
      const removeButtonsLeft = fileListLeft.querySelectorAll(".f-remove");
      removeButtonsLeft.forEach(btn => {
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          const index = Number(this.dataset.idx);
          if (index >= 0 && index < studentFiles.length) {
            studentFiles.splice(index, 1);
          }
          renderFileList();
          checkButtonState();
        });
      });
    }

    // Right Zone: Teacher Reference Key
    if (fileListRight) {
      addfiles(null, teacherRefFile ? [teacherRefFile] : [], fileListRight);
      if (fileCountRight) {
        fileCountRight.textContent = (teacherRefFile ? 1 : 0) + " file";
      }
      const removeButtonsRight = fileListRight.querySelectorAll(".f-remove");
      removeButtonsRight.forEach(btn => {
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          teacherRefFile = null;
          renderFileList();
          checkButtonState();
        });
      });
    }
  } else {
    // Student vs Student Single Panel
    const container = document.getElementById("fileListSingle");
    const badge = document.getElementById("fileCountBadgeSingle");
    const countText = document.getElementById("fileCountSingle");

    // Also update left zone file count & list so left card shows files
    if (fileCountLeft) {
      fileCountLeft.textContent = fileList.length + (fileList.length === 1 ? " file" : " files");
    }
    if (fileListLeft) {
      addfiles(null, fileList, fileListLeft);
      // Wire remove buttons in left zone list
      const removeButtonsLeftSingle = fileListLeft.querySelectorAll(".f-remove");
      removeButtonsLeftSingle.forEach(btn => {
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          const index = Number(this.dataset.idx);
          if (index >= 0 && index < fileList.length) {
            fileList.splice(index, 1);
          }
          renderFileList();
          checkButtonState();
        });
      });
    }

    if (container) {
      if (fileList.length === 0) {
        container.innerHTML = `<div class="empty-upload-hint" style="text-align:center;padding:36px 20px;color:var(--muted);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(79,70,229,0.08);color:var(--primary);display:grid;place-items:center;margin-bottom:4px;">
            <svg style="width:24px;height:24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <p style="font-weight:700;font-size:15px;color:var(--ink);margin:0;">No files uploaded yet</p>
          <p style="font-size:13px;color:var(--muted);margin:0;">Drag &amp; drop files here, or click to browse</p>
        </div>`;
        if (badge) badge.textContent = "0";
        if (countText) countText.textContent = "0 files selected";
        // Make empty hint clickable to open file picker
        const hint = container.querySelector(".empty-upload-hint");
        if (hint && fileInputLeft) {
          hint.addEventListener("click", function () { fileInputLeft.click(); });
        }
      } else {
        addfiles(null, fileList, container);
        if (badge) badge.textContent = fileList.length;
        if (countText) countText.textContent = fileList.length + (fileList.length === 1 ? " file selected" : " files selected");

        const removeButtons = container.querySelectorAll(".f-remove");
        removeButtons.forEach(btn => {
          btn.addEventListener("click", function (event) {
            event.stopPropagation();
            const index = Number(this.dataset.idx);
            if (index >= 0 && index < fileList.length) {
              fileList.splice(index, 1);
            }
            renderFileList();
            checkButtonState();
          });
        });
      }
    }
  }
}

/* =========================================================
   ANALYZE BUTTON STATE & STATUS GUIDANCE
========================================================= */

function checkButtonState() {
  if (!analyzeBtn) return;

  const summaryText = document.getElementById("summaryText");
  let ready = false;

  if (currentMode === "reference") {
    ready = studentFiles.length >= 1 && teacherRefFile !== null;
    if (summaryText) {
      if (studentFiles.length === 0 && !teacherRefFile) {
        summaryText.innerHTML = "Upload <b>student assignment(s)</b> on left and <b>teacher reference key</b> on right.";
      } else if (studentFiles.length === 0) {
        summaryText.innerHTML = "Upload at least one <b>student assignment</b> on the left.";
      } else if (!teacherRefFile) {
        summaryText.innerHTML = "Now upload the <b>Teacher Reference Answer</b> on the right.";
      } else if (studentFiles.length === 1) {
        summaryText.innerHTML = "Ready! Evaluating <b>1 student assignment</b> against <b>Teacher Reference</b>.";
      } else {
        summaryText.innerHTML = "Ready! Classroom Batch mode for <b>" + studentFiles.length + " student submissions</b> against <b>Teacher Reference</b>.";
      }
    }
  } else {
    ready = fileList.length >= 2;
    if (summaryText) {
      if (fileList.length < 2) {
        summaryText.innerHTML = "Upload <b>two or more student files</b> to compare them against each other.";
      } else {
        summaryText.innerHTML = "Ready to compare <b>" + fileList.length + " student files</b> against each other.";
      }
    }
  }

  analyzeBtn.disabled = !ready;
  analyzeBtn.setAttribute("aria-disabled", ready ? "false" : "true");
}

/* =========================================================
   ADD INCOMING FILES
========================================================= */

const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "txt", "pptx", "ppt", "rtf", "md", "odt", "tex", "html", "htm", "json", "csv", "c", "cpp", "java", "py", "js"];

function handleIncomingFiles(files, isRightZone = false) {
  if (!files || files.length === 0) return;

  const validFiles = [];
  let invalidCount = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f || !f.name) continue;
    const ext = f.name.split(".").pop().toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      validFiles.push(f);
    } else {
      invalidCount++;
    }
  }

  if (validFiles.length === 0) {
    showToast("Please upload PDF, DOCX, TXT, or PPTX documents.", "warning");
    return;
  }

  if (invalidCount > 0) {
    showToast(`${invalidCount} unsupported file(s) skipped. Allowed: PDF, DOCX, TXT, PPTX.`, "warning");
  }

  if (currentMode === "reference") {
    if (isRightZone) {
      teacherRefFile = validFiles[0];
      showToast(`Teacher reference: ${teacherRefFile.name}`, "info");
    } else {
      for (let i = 0; i < validFiles.length; i++) {
        studentFiles.push(validFiles[i]);
      }
      showToast(`${validFiles.length} student assignment(s) added!`, "success");
    }
  } else {
    for (let i = 0; i < validFiles.length; i++) {
      fileList.push(validFiles[i]);
    }
    showToast(`${validFiles.length} file(s) added!`, "success");
  }

  renderFileList();
  checkButtonState();
}

/* =========================================================
   FILE PICKERS (LEFT & RIGHT)
========================================================= */

if (dropZoneLeft && fileInputLeft) {
  dropZoneLeft.addEventListener("click", function () {
    fileInputLeft.click();
  });

  dropZoneLeft.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputLeft.click();
    }
  });

  fileInputLeft.addEventListener("change", function () {
    if (fileInputLeft.files && fileInputLeft.files.length > 0) {
      handleIncomingFiles(fileInputLeft.files, false);
    }
    fileInputLeft.value = "";
  });
}

if (dropZoneRight && fileInputRight) {
  dropZoneRight.addEventListener("click", function () {
    fileInputRight.click();
  });

  dropZoneRight.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRight.click();
    }
  });

  fileInputRight.addEventListener("change", function () {
    if (fileInputRight.files && fileInputRight.files.length > 0) {
      handleIncomingFiles(fileInputRight.files, true);
    }
    fileInputRight.value = "";
  });
}

if (filePanelSingle && fileInputLeft) {
  filePanelSingle.addEventListener("click", function (e) {
    if (e.target.closest(".f-remove") || e.target.closest(".file-row")) return;
    if (currentMode === "student" && fileList.length === 0) {
      fileInputLeft.click();
    }
  });
}

/* =========================================================
   DRAG AND DROP HANDLERS (ROBUST SUPPORT & VISUAL CUES)
========================================================= */

// Prevent default drag & drop behaviors across window so browser doesn't open files in tab
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  window.addEventListener(eventName, function (e) {
    e.preventDefault();
  }, false);
  document.body.addEventListener(eventName, function (e) {
    e.preventDefault();
  }, false);
});

// Helper to reliably extract files (including folder drag & drop)
async function getFilesFromDataTransfer(dataTransfer) {
  const files = [];
  if (!dataTransfer) return files;

  // 1. Direct files from DataTransfer (instant, synchronous, standard across all browsers)
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file) files.push(file);
    }
  }

  // 2. Folder traversal via webkitGetAsEntry (if folders were dropped)
  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const dirEntries = [];
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.kind === "file" && item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            dirEntries.push(entry);
          }
        }
      }
    } catch (err) {
      console.warn("Directory detection warning:", err);
    }

    if (dirEntries.length > 0) {
      for (const dir of dirEntries) {
        await processEntry(dir, files);
      }
    } else if (files.length === 0) {
      // Fallback if dataTransfer.files was empty but items exist
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.kind === "file") {
          const file = item.getAsFile ? item.getAsFile() : null;
          if (file) files.push(file);
        }
      }
    }
  }

  return files;
}

// Attach robust drag and drop handling to an element
function setupDropTarget(element, onDropCallback, highlightTargets = []) {
  if (!element) return;
  const targets = Array.isArray(highlightTargets) ? highlightTargets.filter(Boolean) : [highlightTargets].filter(Boolean);
  if (targets.length === 0) targets.push(element);

  let dragCounter = 0;

  element.addEventListener("dragenter", function (e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    targets.forEach(t => t.classList.add("dragover"));
  });

  element.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    targets.forEach(t => {
      if (!t.classList.contains("dragover")) {
        t.classList.add("dragover");
      }
    });
  });

  element.addEventListener("dragleave", function (e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      targets.forEach(t => t.classList.remove("dragover"));
    }
  });

  element.addEventListener("drop", async function (e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    targets.forEach(t => t.classList.remove("dragover"));

    try {
      let droppedFiles = await getFilesFromDataTransfer(e.dataTransfer);
      if ((!droppedFiles || droppedFiles.length === 0) && e.dataTransfer && e.dataTransfer.files) {
        droppedFiles = Array.from(e.dataTransfer.files);
      }
      if (droppedFiles && droppedFiles.length > 0) {
        onDropCallback(droppedFiles, e);
      }
    } catch (err) {
      console.error("Drop processing error:", err);
      showToast("Error processing dropped files.", "error");
    }
  });
}

// 1. Left Drop Zone & Left Zone Card (Student Files)
const zoneLeftElem = document.getElementById("zoneLeft");
setupDropTarget(dropZoneLeft, (files) => handleIncomingFiles(files, false), [dropZoneLeft, zoneLeftElem]);
if (zoneLeftElem) {
  setupDropTarget(zoneLeftElem, (files) => handleIncomingFiles(files, false), [dropZoneLeft, zoneLeftElem]);
}

// 2. Right File Panel in Single Mode (Accepts dropped student files in Student vs Student mode)
if (filePanelSingle) {
  setupDropTarget(filePanelSingle, (files) => {
    if (currentMode === "student") {
      handleIncomingFiles(files, false);
    }
  }, [filePanelSingle]);
}

// 3. Right Drop Zone & Right Zone Card (Teacher Reference File)
const zoneRightElem = document.getElementById("zoneRight");
setupDropTarget(dropZoneRight, (files) => handleIncomingFiles(files, true), [dropZoneRight, zoneRightElem]);
if (zoneRightElem) {
  setupDropTarget(zoneRightElem, (files) => handleIncomingFiles(files, true), [dropZoneRight, zoneRightElem]);
}

// 4. Upload Layout container (Catch drops anywhere within the upload section)
if (uploadLayout) {
  setupDropTarget(uploadLayout, (files, e) => {
    if (currentMode === "student") {
      handleIncomingFiles(files, false);
    } else {
      // In reference mode, check if dropped closer to the right side
      if (zoneRightElem && e) {
        const rightRect = zoneRightElem.getBoundingClientRect();
        if (e.clientX >= rightRect.left) {
          handleIncomingFiles(files, true);
          return;
        }
      }
      handleIncomingFiles(files, false);
    }
  }, [dropZoneLeft, zoneLeftElem]);
}


/* =========================================================
   FILE TYPE
========================================================= */

function getFileType(filename) {

  const ext =
    filename
      .split(".")
      .pop()
      .toLowerCase();


  const types = {

    pdf: {
      label: "PDF",
      color: "--danger",
      icon: "pdf"
    },

    docx: {
      label: "DOCX",
      color: "--s1",
      icon: "docx"
    },

    doc: {
      label: "DOC",
      color: "--s1",
      icon: "docx"
    },

    pptx: {
      label: "PPTX",
      color: "--warn",
      icon: "pptx"
    },

    ppt: {
      label: "PPT",
      color: "--warn",
      icon: "pptx"
    },

    txt: {
      label: "TXT",
      color: "--good",
      icon: "txt"
    }
  };


  return (
    types[ext] ||
    {
      label: "FILE",
      color: "--muted",
      icon: "txt"
    }
  );
}


/* =========================================================
   ANIMATION DOCUMENTS
========================================================= */

function createAnimationDocs(files) {

  if (!aStage) {
    return;
  }


  const existingDocs =
    aStage.querySelectorAll(
      ".a-doc"
    );


  existingDocs.forEach(
    function (doc) {
      doc.remove();
    }
  );


  const connectionsSvg =
    aStage.querySelector(
      ".a-connections"
    );


  if (connectionsSvg) {
    connectionsSvg.innerHTML = "";
  }


  const numFiles =
    files.length;


  let positions = [];


  if (numFiles === 2) {

    positions = [

      {
        top: "35%",
        left: "10%"
      },

      {
        top: "35%",
        right: "10%"
      }

    ];

  } else if (numFiles === 3) {

    positions = [

      {
        top: "15%",
        left: "10%"
      },

      {
        top: "15%",
        right: "10%"
      },

      {
        top: "65%",
        left: "35%"
      }

    ];

  } else {

    positions = [

      {
        top: "10%",
        left: "8%"
      },

      {
        top: "60%",
        left: "8%"
      },

      {
        top: "10%",
        right: "8%"
      },

      {
        top: "60%",
        right: "8%"
      }

    ];
  }


  files.forEach(
    function (file, index) {

      if (
        index >=
        positions.length
      ) {
        return;
      }


      const pos =
        positions[index];


      const fileType =
        getFileType(
          file.name
        );


      const label =
        index === 0
          ? "Student A"
          : index === 1
            ? "Student B"
            : index === 2
              ? "Student C"
              : `File ${index + 1}`;


      const chip =
        index === 0
          ? "S1"
          : index === 1
            ? "S2"
            : index === 2
              ? "S3"
              : `F${index + 1}`;


      const displayName =
        file.name.length > 20
          ? file.name.substring(
              0,
              18
            ) + "..."
          : file.name;


      const doc =
        document.createElement(
          "div"
        );


      doc.className =
        "a-doc";


      doc.style.cssText =
        `${pos.top ? `top:${pos.top};` : ""}` +
        `${pos.left ? `left:${pos.left};` : ""}` +
        `${pos.right ? `right:${pos.right};` : ""}`;


      doc.innerHTML = `

        <div class="a-doc-head">

          <div
            class="a-avatar"
            style="background:var(${fileType.color})"
          >
            ${chip}
          </div>

          <div class="a-id">

            <span class="a-name">
              ${label}
            </span>

            <span class="a-fname">
              ${displayName}
            </span>

          </div>

        </div>

        <div class="a-lines">

          <div class="a-line">
            <i
              class="tag"
              style="background:var(${fileType.color})"
            >1</i>
          </div>

          <div class="a-line">
            <i
              class="tag"
              style="background:var(${fileType.color})"
            >2</i>
          </div>

          <div class="a-line">
            <i
              class="tag"
              style="background:var(${fileType.color})"
            >3</i>
          </div>

          <div class="a-line"></div>

          <div class="a-line"></div>

        </div>
      `;


      aStage.appendChild(doc);
    }
  );


  if (!connectionsSvg) {
    return;
  }


  const docs =
    aStage.querySelectorAll(
      ".a-doc"
    );


  const centerX = 50;
  const centerY = 50;


  docs.forEach(
    function (doc) {

      const rect =
        doc.getBoundingClientRect();


      const stageRect =
        aStage.getBoundingClientRect();


      if (
        !stageRect.width ||
        !stageRect.height
      ) {
        return;
      }


      const docLeft =
        (
          (rect.left - stageRect.left) /
          stageRect.width
        ) * 100;


      const docTop =
        (
          (rect.top - stageRect.top) /
          stageRect.height
        ) * 100;


      const docRight =
        docLeft +
        (
          rect.width /
          stageRect.width
        ) * 100;


      const docBottom =
        docTop +
        (
          rect.height /
          stageRect.height
        ) * 100;


      let startX;

      let startY;


      if (docLeft < 50) {
        startX = docRight;
      } else {
        startX = docLeft;
      }


      if (docTop < 50) {
        startY = docBottom;
      } else {
        startY = docTop;
      }


      const line =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );


      line.setAttribute(
        "x1",
        startX
      );

      line.setAttribute(
        "y1",
        startY
      );

      line.setAttribute(
        "x2",
        centerX
      );

      line.setAttribute(
        "y2",
        centerY
      );

      line.setAttribute(
        "stroke",
        "var(--primary)"
      );

      line.setAttribute(
        "stroke-width",
        "2"
      );

      line.setAttribute(
        "stroke-dasharray",
        "6 8"
      );


      line.style.opacity = "0";


      line.classList.add(
        "connection-line"
      );


      connectionsSvg.appendChild(
        line
      );
    }
  );
}


/* =========================================================
   ANIMATION CONFIG
========================================================= */

const stageNames = [

  "Reading assignments...",

  "Extracting text...",

  "Creating linear chunks (100 words)...",

  "Generating 4-grams...",

  "Comparing sections (Jaccard similarity)...",

  "Detecting matching content...",

  "Generating final report..."

];


const progressValues = [
  10,
  25,
  42,
  58,
  74,
  90,
  100
];


const stageDelays = [
  800,
  900,
  800,
  900,
  1000,
  900,
  600
];


/* =========================================================
   UPDATE PROGRESS
========================================================= */

function updateProgress(
  percent,
  message
) {

  if (progFill) {
    progFill.style.width =
      percent + "%";
  }


  if (progPct) {
    progPct.textContent =
      percent + "%";
  }


  if (progMsg) {
    progMsg.textContent =
      message;
  }


  if (aeStatus) {
    aeStatus.textContent =
      message;
  }
}


/* =========================================================
   COUNT UP
========================================================= */

function countUp(
  element,
  targetNumber
) {

  if (!element) {
    return;
  }


  targetNumber =
    Number(targetNumber) || 0;


  targetNumber =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(targetNumber)
      )
    );


  let current = 0;


  const increment =
    Math.max(
      1,
      Math.ceil(
        targetNumber / 30
      )
    );


  const timer =
    setInterval(
      function () {

        current += increment;


        if (
          current >=
          targetNumber
        ) {

          current =
            targetNumber;

          clearInterval(timer);
        }


        element.textContent =
          current + "%";

      },
      25
    );
}


/* =========================================================
   HTML ESCAPE HELPER
========================================================= */

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   FAST PEER SIMILARITY — local only, no API calls
   Used for the O(n²) peer-collusion matrix in batch mode.
   Same n-gram Jaccard algorithm as compareTwoDocuments but
   synchronous and network-free so the matrix computes instantly.
========================================================= */

function fastPeerSimilarity(textA, textB, filterOptions = {}) {
  try {
    const fA = filterDocumentText(textA || "", {
      excludeReferences: filterOptions.excludeReferences,
      excludeQuotes: filterOptions.excludeQuotes
    });
    const fB = filterDocumentText(textB || "", {
      excludeReferences: filterOptions.excludeReferences,
      excludeQuotes: filterOptions.excludeQuotes
    });

    if (!fA.trim() || !fB.trim()) return 0;

    const normA = fA.trim().toLowerCase().replace(/\s+/g, " ");
    const normB = fB.trim().toLowerCase().replace(/\s+/g, " ");
    if (normA === normB) return 100;

    const gramSize = filterOptions.excludeSmallMatches ? 7 : 4;
    const chunksA = createChunksLinear(fA, 100);
    const chunksB = createChunksLinear(fB, 100);

    for (let i = 0; i < chunksA.length; i++) chunksA[i].grams = buildthegrams(chunksA[i], gramSize);
    for (let i = 0; i < chunksB.length; i++) chunksB[i].grams = buildthegrams(chunksB[i], gramSize);

    // Symmetric Jaccard over chunk gram sets
    const setA = new Set(chunksA.flatMap(c => c.grams || []));
    const setB = new Set(chunksB.flatMap(c => c.grams || []));
    let intersection = 0;
    for (const g of setA) { if (setB.has(g)) intersection++; }
    const union = setA.size + setB.size - intersection;
    if (union === 0) return 0;
    return Math.round((intersection / union) * 1000) / 10;
  } catch (e) {
    return 0;
  }
}

/* =========================================================
   COMPARE TWO DOCUMENTS HELPER
========================================================= */

async function compareTwoDocuments(fileA, fileB, textA, textB, filterOptions) {
  const filteredA = filterDocumentText(textA, {
    excludeReferences: filterOptions.excludeReferences,
    excludeQuotes: filterOptions.excludeQuotes
  });
  const filteredB = filterDocumentText(textB, {
    excludeReferences: filterOptions.excludeReferences,
    excludeQuotes: filterOptions.excludeQuotes
  });

  const chunksA = createChunksLinear(filteredA, 100);
  const chunksB = createChunksLinear(filteredB, 100);

  const gramSize = filterOptions.excludeSmallMatches ? 7 : 4;
  for (let j = 0; j < chunksA.length; j++) {
    chunksA[j].grams = buildthegrams(chunksA[j], gramSize);
  }
  for (let j = 0; j < chunksB.length; j++) {
    chunksB[j].grams = buildthegrams(chunksB[j], gramSize);
  }

  // Fast path for identical text / same files
  let score = 0;
  const normA = (filteredA || "").trim().toLowerCase().replace(/\s+/g, " ");
  const normB = (filteredB || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (normA.length > 0 && normA === normB) {
    score = 100;
  } else {
    const rawScore = await applyalgo([chunksA, chunksB]);
    score = Math.round((Number(rawScore) || 0) * 10) / 10;
  }
  const commonGrams = Array.from(getthecommongrams ? getthecommongrams() : []);

  // Compute matching sections
  let matchesA = [];
  let matchesB = [];
  let diffs = [];

  if (normA.length > 0 && normA === normB) {
    matchesA = chunksA.map((c) => c.text);
    matchesB = chunksB.map((c) => c.text);
    diffs = [];
  } else {
    for (let j = 0; j < chunksA.length; j++) {
      const chunkA = chunksA[j];
      let isMatched = false;
      const setA = new Set(chunkA.grams || []);
      const threshold = gramSize >= 7 ? 1 : (setA.size <= 1 ? 1 : 2);
      for (let k = 0; k < chunksB.length; k++) {
        const chunkB = chunksB[k];
        const setB = new Set(chunkB.grams || []);
        let inter = 0;
        for (const g of setA) {
          if (setB.has(g)) inter++;
        }
        if (inter >= threshold) {
          isMatched = true;
          break;
        }
      }
      if (isMatched) {
        matchesA.push(chunkA.text);
      } else {
        diffs.push(chunkA.text);
      }
    }

    for (let k = 0; k < chunksB.length; k++) {
      const chunkB = chunksB[k];
      let isMatched = false;
      const setB = new Set(chunkB.grams || []);
      const threshold = gramSize >= 7 ? 1 : (setB.size <= 1 ? 1 : 2);
      for (let j = 0; j < chunksA.length; j++) {
        const chunkA = chunksA[j];
        const setA = new Set(chunkA.grams || []);
        let inter = 0;
        for (const g of setB) {
          if (setA.has(g)) inter++;
        }
        if (inter >= threshold) {
          isMatched = true;
          break;
        }
      }
      if (isMatched) {
        matchesB.push(chunkB.text);
      } else {
        diffs.push(chunkB.text);
      }
    }
  }

  let commonPhrases = extractCommonPhrases(matchesA, filteredA, filteredB);
  let typosA = [];
  let typosB = [];
  try {
    [typosA, typosB] = await Promise.all([
      detectSpellingMistakesAsync(filteredA, fileA.name),
      detectSpellingMistakesAsync(filteredB, fileB.name)
    ]);
  } catch (e) {
    typosA = detectSpellingMistakes(filteredA, fileA.name, { peerText: filteredB });
    typosB = detectSpellingMistakes(filteredB, fileB.name, { peerText: filteredA });
  }

  const matchSecCount = matchesA.length > 0 ? matchesA.length : (score > 0 ? Math.max(1, commonPhrases.length) : 0);
  const diffSecCount = diffs.length > 0 ? diffs.length : Math.max(0, chunksA.length - matchSecCount);
  /* -------------------------------------------------------
     BACKEND API CALL — /api/check-similarity
     Uses the authoritative server-side plagiarism engine with a 3.5s timeout.
     If backend takes >3.5s or is unreachable, fast local results are kept.
  ------------------------------------------------------- */
  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    const similarityRes = await fetch(API_BASE + '/api/check-similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller ? controller.signal : undefined,
      body: JSON.stringify({
        textA: filteredA,
        textB: filteredB,
        options: {
          excludeReferences: filterOptions.excludeReferences,
          excludeQuotes: filterOptions.excludeQuotes,
          excludeSmallMatches: filterOptions.excludeSmallMatches
        }
      })
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (similarityRes.ok) {
      const apiData = await similarityRes.json();
      if (apiData && apiData.result) {
        const r = apiData.result;
        if (typeof r.similarity === 'number')          score    = r.similarity;
        if (Array.isArray(r.filefirstmatches))         matchesA = r.filefirstmatches;
        if (Array.isArray(r.filesecondmatches))        matchesB = r.filesecondmatches;
        if (Array.isArray(r.spellingMistakesA))        typosA   = r.spellingMistakesA;
        if (Array.isArray(r.spellingMistakesB))        typosB   = r.spellingMistakesB;
        if (Array.isArray(r.commonPhrases))            commonPhrases = r.commonPhrases;
      }
    }
  } catch (apiErr) {
    console.warn('Backend /api/check-similarity fallback to fast local computation:', apiErr.message);
  }

  /* -------------------------------------------------------
     BACKEND API CALL — /api/spellcheck (only if not already populated)
  ------------------------------------------------------- */
  if (typosA.length === 0 && filteredA.trim().length > 0) {
    try {
      const cA = typeof AbortController !== "undefined" ? new AbortController() : null;
      const tA = cA ? setTimeout(() => cA.abort(), 2000) : null;
      const spellResA = await fetch(API_BASE + '/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: cA ? cA.signal : undefined,
        body: JSON.stringify({ text: filteredA, docLabel: fileA.name })
      });
      if (tA) clearTimeout(tA);
      if (spellResA.ok) {
        const spellDataA = await spellResA.json();
        if (spellDataA && Array.isArray(spellDataA.mistakes)) typosA = spellDataA.mistakes;
      }
    } catch (e) { /* ignore fallback */ }
  }
  if (typosB.length === 0 && filteredB.trim().length > 0) {
    try {
      const cB = typeof AbortController !== "undefined" ? new AbortController() : null;
      const tB = cB ? setTimeout(() => cB.abort(), 2000) : null;
      const spellResB = await fetch(API_BASE + '/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: cB ? cB.signal : undefined,
        body: JSON.stringify({ text: filteredB, docLabel: fileB.name })
      });
      if (tB) clearTimeout(tB);
      if (spellResB.ok) {
        const spellDataB = await spellResB.json();
        if (spellDataB && Array.isArray(spellDataB.mistakes)) typosB = spellDataB.mistakes;
      }
    } catch (e) { /* ignore fallback */ }
  }

  // Recompute counts with final (possibly backend-updated) values
  const finalMatchSecCount = matchesA.length > 0 ? matchesA.length : (score > 0 ? Math.max(1, commonPhrases.length) : 0);
  const finalDiffSecCount  = diffs.length  > 0 ? diffs.length  : Math.max(0, chunksA.length - finalMatchSecCount);

  const reportObj = {
    id: "REP-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900),
    email: (localStorage.getItem("userEmail") || "").toLowerCase().trim(),
    filenames: [fileA.name, fileB.name],
    files: [fileA.name, fileB.name],
    similarity: score,
    roundedscore: score,
    matchingSections: finalMatchSecCount,
    differentSections: finalDiffSecCount,
    matchingPhrases: commonPhrases.length,
    commonPhrases: commonPhrases,
    similarwords: commonGrams.length > 0 ? commonGrams.length : matchSecCount,
    chunkCountA: chunksA.length,
    chunkCountB: chunksB.length,
    spellingMistakesA: typosA,
    spellingMistakesB: typosB,
    textA: filteredA,
    textB: filteredB,
    rawTextA: textA,
    rawTextB: textB,
    filefirstmatches: matchesA,
    filesecondmatches: matchesB,
    matchesA: matchesA,
    matchesB: matchesB,
    diffs: diffs,
    filters: filterOptions,
    mode: currentMode,
    date: new Date().toISOString()
  };

  // Background save to reports DB and filedata (uploaded files storage)
  try {
    const email = localStorage.getItem("userEmail");
    const token = localStorage.getItem("authToken");
    const reportHeaders = { "Content-Type": "application/json" };
    if (token) reportHeaders["Authorization"] = `Bearer ${token}`;

    // Save file metadata to /filedata so profile shows uploaded files + last upload date
    if (email && token) {
      const filesMeta = [fileA, fileB].map(f => ({
        filename: f.name,
        filesize: f.size || 0,
        uploadedAt: new Date().toISOString()
      }));

      // Fetch existing filedata record then upsert
      fetch(`${API_BASE}/filedata`, { headers: reportHeaders })
        .then(r => r.ok ? r.json() : [])
        .then(existing => {
          const records = Array.isArray(existing) ? existing : [];
          if (records.length > 0) {
            // Update existing record by appending new files
            const record = records[0];
            const current = Array.isArray(record.filedetails) ? record.filedetails : [];
            return fetch(`${API_BASE}/filedata/${record.id}`, {
              method: "PUT",
              headers: reportHeaders,
              body: JSON.stringify({ filedetails: [...current, ...filesMeta] })
            });
          } else {
            // Create new filedata record
            return fetch(`${API_BASE}/filedata`, {
              method: "POST",
              headers: reportHeaders,
              body: JSON.stringify({ email, filedetails: filesMeta })
            });
          }
        })
        .catch(e => console.warn("Filedata save notice:", e));
    }

    if (email) {
      fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: reportHeaders,
        body: JSON.stringify({
          id: reportObj.id,          // send client ID so server saves it as customId
          email: email,
          files: [fileA.name, fileB.name],
          filenames: [fileA.name, fileB.name],
          type: currentMode,
          similarity: score,
          matchingSections: finalMatchSecCount,
          differentSections: finalDiffSecCount,
          matchingPhrases: commonPhrases.length,
          commonPhrases: commonPhrases,
          spellingMistakesA: typosA,
          spellingMistakesB: typosB,
          spellingMistakes: typosA.length + typosB.length,
          date: new Date().toISOString(),
          textA: filteredA,
          textB: filteredB,
          filefirstmatches: matchesA,
          filesecondmatches: matchesB,
          filters: filterOptions
        })
      }).then(function(res) {
        if (res.ok) {
          return res.json();
        }
      }).then(function(savedReport) {
        // Update sessionStorage and localStorage cache with server-confirmed report
        if (savedReport) {
          const mergedReport = Object.assign({}, reportObj, savedReport);
          try {
            sessionStorage.setItem("reportData", JSON.stringify(mergedReport));
            sessionStorage.setItem("lastAnalysisResult", JSON.stringify(mergedReport));
            const cacheKey = "assigncheck_history_cache_" + email;
            const existingCache = JSON.parse(localStorage.getItem(cacheKey) || "[]");
            // Remove any old copy if ID matches, then unshift
            const filteredCache = existingCache.filter(r => (r.id !== mergedReport.id && r._id !== mergedReport.id));
            filteredCache.unshift(mergedReport);
            localStorage.setItem(cacheKey, JSON.stringify(filteredCache));
            localStorage.removeItem("assigncheck_profile_cache_" + email);
          } catch (e) {}
        }
      }).catch(e => console.warn("Background report save error:", e));
    }
  } catch (repErr) {
    console.warn("Could not post to /reports:", repErr);
  }

  return {
    fileA,
    fileB,
    similarity: score,
    report: reportObj
  };
}

/* =========================================================
   CLASSROOM BATCH RESULTS RENDERING
========================================================= */

function renderBatchClassroomUI(batchData) {
  if (!batchResultsWrap || !pairResultsWrap) return;

  const kpiSub = document.getElementById("kpiSubmissions");
  const kpiAvg = document.getElementById("kpiAvgMatch");
  const kpiHigh = document.getElementById("kpiHighMatch");
  const kpiPeer = document.getElementById("kpiPeerCollusion");
  const batchTitle = document.getElementById("batchTitle");
  const batchSubtitle = document.getElementById("batchSubtitle");
  const batchTableBody = document.getElementById("batchTableBody");
  const matrixContainer = document.getElementById("batchMatrixContainer");

  if (kpiSub) kpiSub.textContent = batchData.kpis.total;
  if (kpiAvg) kpiAvg.textContent = batchData.kpis.avgMatch + "%";
  if (kpiHigh) kpiHigh.textContent = batchData.kpis.highestMatch + "%";
  if (kpiPeer) kpiPeer.textContent = batchData.kpis.peerCollusions;

  if (batchTitle) {
    batchTitle.textContent = currentMode === "reference"
      ? "Teacher Reference vs " + batchData.kpis.total + " Student Submissions"
      : "Batch Classroom Cross-Comparison (" + batchData.kpis.total + " Submissions)";
  }
  if (batchSubtitle) {
    batchSubtitle.textContent = currentMode === "reference"
      ? 'Evaluated against reference solution: "' + batchData.teacherFile.name + '"'
      : "Mutual peer-to-peer evaluation across classroom submissions";
  }

  // Populate Table
  if (batchTableBody) {
    batchTableBody.innerHTML = "";
    batchData.studentComparisons.forEach((item, index) => {
      const tr = document.createElement("tr");

      let rankClass = "rank-badge";
      if (index === 0) rankClass += " top-1";
      else if (index === 1) rankClass += " top-2";
      else if (index === 2) rankClass += " top-3";

      const sim = item.similarity;
      let riskPill = '<span class="risk-pill low">🟢 Low Risk</span>';
      let barFillClass = "score-bar-fill low";
      if (sim >= 50) {
        riskPill = '<span class="risk-pill high">🔴 High Risk</span>';
        barFillClass = "score-bar-fill high";
      } else if (sim >= 20) {
        riskPill = '<span class="risk-pill medium">🟡 Moderate</span>';
        barFillClass = "score-bar-fill medium";
      }

      let peerHtml = '<span class="peer-none">Clean (No peer match)</span>';
      if (item.maxPeerMatch && item.maxPeerMatch.similarity >= 40) {
        peerHtml = '<span class="peer-alert">⚠️ ' + item.maxPeerMatch.similarity.toFixed(1) + '% with ' + escapeHtml(item.maxPeerMatch.peerName) + '</span>';
      }

      const fileExt = (item.studentFile.name.split('.').pop() || "txt").toUpperCase();
      const fileSize = item.studentFile.size ? (item.studentFile.size / 1024).toFixed(1) + " KB" : "";

      tr.innerHTML = `
        <td><span class="${rankClass}">#${index + 1}</span></td>
        <td>
          <div class="student-file-cell">
            <span class="s-icon">📄</span>
            <div>
              <div class="s-name">${escapeHtml(item.studentFile.name)}</div>
              <div class="s-meta">${fileExt} • ${fileSize}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="score-bar-wrap">
            <div class="score-bar-bg">
              <div class="${barFillClass}" style="width: ${Math.min(100, sim)}%"></div>
            </div>
            <span class="score-val">${sim.toFixed(1)}%</span>
          </div>
        </td>
        <td>${riskPill}</td>
        <td>${peerHtml}</td>
        <td>
          <button type="button" class="btn-inspect" data-idx="${index}">
            🔍 Inspect Pair
          </button>
        </td>
      `;

      const inspectBtn = tr.querySelector(".btn-inspect");
      if (inspectBtn) {
        inspectBtn.addEventListener("click", () => {
          inspectStudentPair(item);
        });
      }

      batchTableBody.appendChild(tr);
    });
  }

  // Populate Matrix
  if (matrixContainer) {
    const studentNames = batchData.studentFiles.map(f => f.name);
    let tableHtml = '<table class="matrix-table"><thead><tr><th>Submission</th>';
    if (currentMode === "reference") {
      tableHtml += '<th style="background:#e0e7ff;color:#3730a3;font-weight:800;">Teacher Ref Key</th>';
    }
    studentNames.forEach(name => {
      tableHtml += '<th>' + escapeHtml(name) + '</th>';
    });
    tableHtml += '</tr></thead><tbody>';

    for (let i = 0; i < studentNames.length; i++) {
      tableHtml += '<tr><th>' + escapeHtml(studentNames[i]) + '</th>';
      if (currentMode === "reference") {
        const toRef = batchData.matrix[i][0];
        const refClass = toRef >= 50 ? "high" : (toRef >= 20 ? "medium" : "low");
        tableHtml += '<td><span class="matrix-cell ' + refClass + '">' + toRef.toFixed(1) + '%</span></td>';
      }

      for (let j = 0; j < studentNames.length; j++) {
        const val = batchData.matrix[i][currentMode === "reference" ? j + 1 : j];
        if (i === j) {
          tableHtml += '<td><span class="matrix-cell self">—</span></td>';
        } else {
          const cellClass = val >= 50 ? "high" : (val >= 20 ? "medium" : "low");
          tableHtml += '<td><span class="matrix-cell ' + cellClass + '">' + (val ? val.toFixed(1) : 0) + '%</span></td>';
        }
      }
      tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table>';
    matrixContainer.innerHTML = tableHtml;
  }

  pairResultsWrap.style.display = "none";
  batchResultsWrap.style.display = "flex";
  setProgressStep(3);
  showView(viewResults);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function inspectStudentPair(item) {
  if (!item || !item.report) return;

  sessionStorage.setItem("reportData", JSON.stringify(item.report));
  sessionStorage.setItem("lastAnalysisResult", JSON.stringify(item.report));

  renderUI(item.report);

  if (backToBatchBtn) {
    backToBatchBtn.style.display = "inline-flex";
  }

  if (batchResultsWrap) batchResultsWrap.style.display = "none";
  if (pairResultsWrap) pairResultsWrap.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (backToBatchBtn) {
  backToBatchBtn.addEventListener("click", function () {
    if (pairResultsWrap) pairResultsWrap.style.display = "none";
    if (batchResultsWrap) batchResultsWrap.style.display = "flex";
    backToBatchBtn.style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (batchNewAnalysisBtn) {
  batchNewAnalysisBtn.addEventListener("click", function () {
    if (newAnalysisBtn) newAnalysisBtn.click();
  });
}

/* =========================================================
   ANALYZE BUTTON EXECUTION
========================================================= */

if (analyzeBtn) {
  analyzeBtn.addEventListener("click", async function () {
    if (isRunning) return;

    if (currentMode === "reference") {
      if (studentFiles.length < 1 || !teacherRefFile) {
        showToast("Please upload at least 1 student file and the teacher reference key.", "warning");
        return;
      }
    } else {
      if (fileList.length < 2) {
        showToast("Please upload at least two student files to compare.", "warning");
        return;
      }
    }

    try {
      isRunning = true;
      analyzeBtn.disabled = true;

      setProgressStep(2);
      showView(viewAnimation);

      const animFiles = currentMode === "reference"
        ? [teacherRefFile, ...studentFiles]
        : fileList;

      const animTitle = document.getElementById("animTitle");
      if (animTitle) {
        animTitle.textContent = currentMode === "reference"
          ? (studentFiles.length === 1 ? "Evaluating Student vs Teacher Reference..." : "Running Classroom Batch Analysis (" + studentFiles.length + " students)...")
          : "Comparing " + fileList.length + " assignments...";
      }

      createAnimationDocs(animFiles);

      if (aStage) aStage.classList.add("p-comparing", "p-scanning");
      if (aEngine) aEngine.classList.add("active");
      if (animStatus) animStatus.className = "anim-status";
      if (animStatusText) animStatusText.textContent = "Running";

      updateProgress(15, "Reading and extracting document texts...");
      await wait(400);

      const excludeRef = document.getElementById("filterExcludeReferences")?.checked ?? true;
      const excludeQuotes = document.getElementById("filterExcludeQuotes")?.checked ?? true;
      const excludeSmall = document.getElementById("filterExcludeSmallMatches")?.checked ?? false;
      const filterOpts = {
        excludeReferences: excludeRef,
        excludeQuotes: excludeQuotes,
        excludeSmallMatches: excludeSmall
      };

      /* ---------------------------------------------------
         TEACHER VS STUDENT MODE
      --------------------------------------------------- */
      if (currentMode === "reference") {
        updateProgress(30, "Extracting Teacher Reference text...");
        const teacherText = await extractFileText(teacherRefFile);
        rawTextMap[teacherRefFile.name] = teacherText;

        const studentTexts = [];
        for (let i = 0; i < studentFiles.length; i++) {
          updateProgress(30 + Math.round((30 * (i + 1)) / studentFiles.length), "Extracting student assignment " + (i + 1) + "/" + studentFiles.length + "...");
          const sText = await extractFileText(studentFiles[i]);
          studentTexts.push(sText);
          rawTextMap[studentFiles[i].name] = sText;
        }

        // Case A: 1 Student File vs 1 Teacher Reference
        if (studentFiles.length === 1) {
          updateProgress(80, "Calculating similarity against Teacher Reference...");
          await wait(500);

          const comp = await compareTwoDocuments(studentFiles[0], teacherRefFile, studentTexts[0], teacherText, filterOpts);
          comp.report.mode = "reference";

          sessionStorage.setItem("showsthedisplayornot", "true");
          sessionStorage.setItem("lastAnalysisResult", JSON.stringify(comp.report));
          sessionStorage.setItem("reportData", JSON.stringify(comp.report));

          renderUI(comp.report);

          if (batchResultsWrap) batchResultsWrap.style.display = "none";
          if (pairResultsWrap) pairResultsWrap.style.display = "block";
          if (backToBatchBtn) backToBatchBtn.style.display = "none";

          setProgressStep(3);
          showView(viewResults);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Case B: MULTIPLE Students vs Teacher Reference (Classroom Batch Mode!)
          updateProgress(60, "Evaluating all students against Teacher Reference...");
          const studentComparisons = [];

          // Process student-vs-teacher in parallel batches of 3 to avoid overloading server
          const BATCH_SIZE = 3;
          for (let b = 0; b < studentFiles.length; b += BATCH_SIZE) {
            const batchSlice = studentFiles.slice(b, b + BATCH_SIZE);
            const batchTexts = studentTexts.slice(b, b + BATCH_SIZE);
            const batchPct = 60 + Math.round((30 * Math.min(b + BATCH_SIZE, studentFiles.length)) / studentFiles.length);
            updateProgress(batchPct, `Evaluating students ${b + 1}–${Math.min(b + BATCH_SIZE, studentFiles.length)} of ${studentFiles.length}...`);

            const batchResults = await Promise.all(
              batchSlice.map((sf, idx) => compareTwoDocuments(sf, teacherRefFile, batchTexts[idx], teacherText, filterOpts))
            );
            batchResults.forEach((comp, idx) => {
              studentComparisons.push({
                studentFile: batchSlice[idx],
                similarity: comp.similarity,
                report: comp.report,
                studentText: batchTexts[idx]
              });
            });
          }

          updateProgress(93, "Cross-checking peer collusion among students...");
          const matrix = [];
          for (let i = 0; i < studentFiles.length; i++) {
            matrix[i] = [];
            matrix[i][0] = studentComparisons[i].similarity;

            for (let j = 0; j < studentFiles.length; j++) {
              if (i === j) {
                matrix[i][j + 1] = 100;
              } else if (j < i) {
                matrix[i][j + 1] = matrix[j][i + 1];
              } else {
                // Fast local-only similarity for peer matrix (no API calls = instant)
                matrix[i][j + 1] = fastPeerSimilarity(
                  studentComparisons[i].studentText,
                  studentComparisons[j].studentText,
                  filterOpts
                );
              }
            }
          }

          for (let i = 0; i < studentFiles.length; i++) {
            let maxPeer = { similarity: 0, peerName: "" };
            for (let j = 0; j < studentFiles.length; j++) {
              if (i !== j) {
                const peerSim = matrix[i][j + 1];
                if (peerSim > maxPeer.similarity) {
                  maxPeer = { similarity: peerSim, peerName: studentFiles[j].name };
                }
              }
            }
            studentComparisons[i].maxPeerMatch = maxPeer;
          }

          const sortedStudents = [...studentComparisons].sort((a, b) => b.similarity - a.similarity);
          const total = studentFiles.length;
          const avgMatch = (sortedStudents.reduce((acc, s) => acc + s.similarity, 0) / total).toFixed(1);
          const highestMatch = sortedStudents[0].similarity.toFixed(1);
          const peerCollusions = sortedStudents.filter(s => s.maxPeerMatch && s.maxPeerMatch.similarity >= 50).length;

          const batchData = {
            teacherFile: teacherRefFile,
            studentComparisons: sortedStudents,
            matrix: matrix,
            studentFiles: studentFiles,
            kpis: {
              total,
              avgMatch,
              highestMatch,
              peerCollusions
            },
            filters: filterOpts
          };

          lastBatchEvaluation = batchData;

          updateProgress(100, "Classroom assessment complete!");
          await wait(500);

          renderBatchClassroomUI(batchData);
        }
      } else {
        /* ---------------------------------------------------
           STUDENT VS STUDENT MODE
        --------------------------------------------------- */
        const fileTexts = [];
        for (let i = 0; i < fileList.length; i++) {
          updateProgress(20 + Math.round((40 * (i + 1)) / fileList.length), "Extracting file " + (i + 1) + "/" + fileList.length + "...");
          const txt = await extractFileText(fileList[i]);
          fileTexts.push(txt);
          rawTextMap[fileList[i].name] = txt;
        }

        if (fileList.length === 2) {
          updateProgress(80, "Comparing student assignments...");
          await wait(300);

          const comp = await compareTwoDocuments(fileList[0], fileList[1], fileTexts[0], fileTexts[1], filterOpts);
          comp.report.mode = "student";

          updateProgress(95, "Finalizing report & highlights...");
          await wait(200);

          sessionStorage.setItem("showsthedisplayornot", "true");
          sessionStorage.setItem("lastAnalysisResult", JSON.stringify(comp.report));
          sessionStorage.setItem("reportData", JSON.stringify(comp.report));

          renderUI(comp.report);

          updateProgress(100, "Comparison complete!");
          await wait(300);

          if (batchResultsWrap) batchResultsWrap.style.display = "none";
          if (pairResultsWrap) pairResultsWrap.style.display = "block";
          if (backToBatchBtn) backToBatchBtn.style.display = "none";

          setProgressStep(3);
          showView(viewResults);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Batch Mode for Student vs Student (>2 files)
          updateProgress(75, "Generating multi-file student matrix...");
          const studentComparisons = [];
          const matrix = [];

          for (let i = 0; i < fileList.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < fileList.length; j++) {
              if (i === j) {
                matrix[i][j] = 100;
              } else if (j < i) {
                matrix[i][j] = matrix[j][i];
              } else {
                const comp = await compareTwoDocuments(fileList[i], fileList[j], fileTexts[i], fileTexts[j], filterOpts);
                matrix[i][j] = comp.similarity;
              }
            }
          }

          for (let i = 0; i < fileList.length; i++) {
            let maxMatch = { similarity: 0, peerName: "" };
            let compReport = null;
            for (let j = 0; j < fileList.length; j++) {
              if (i !== j) {
                const sim = matrix[i][j];
                if (sim > maxMatch.similarity) {
                  maxMatch = { similarity: sim, peerName: fileList[j].name };
                  compReport = await compareTwoDocuments(fileList[i], fileList[j], fileTexts[i], fileTexts[j], filterOpts);
                }
              }
            }
            studentComparisons.push({
              studentFile: fileList[i],
              similarity: maxMatch.similarity,
              report: compReport ? compReport.report : null,
              maxPeerMatch: maxMatch
            });
          }

          const sorted = [...studentComparisons].sort((a, b) => b.similarity - a.similarity);
          const total = fileList.length;
          const avgMatch = (sorted.reduce((acc, s) => acc + s.similarity, 0) / total).toFixed(1);
          const highestMatch = sorted[0].similarity.toFixed(1);
          const peerCollusions = sorted.filter(s => s.similarity >= 50).length;

          const batchData = {
            teacherFile: { name: "Classroom Peer Matrix" },
            studentComparisons: sorted,
            matrix: matrix,
            studentFiles: fileList,
            kpis: {
              total,
              avgMatch,
              highestMatch,
              peerCollusions
            },
            filters: filterOpts
          };

          lastBatchEvaluation = batchData;

          updateProgress(100, "Multi-student comparison complete!");
          await wait(500);

          renderBatchClassroomUI(batchData);
        }
      }

    } catch (error) {
      console.error("ANALYSIS FAILED:", error);
      showToast("Analysis encountered an error: " + error.message, "error");
      showView(viewUpload);
      setProgressStep(1);
    } finally {
      isRunning = false;
      checkButtonState();
    }
  });
}

/* =========================================================
   DISPLAY RESULTS
   IMPORTANT FIX
========================================================= */

async function displayResults(
  files,
  score
) {

  console.log(
    "displayResults() started"
  );


  if (
    !files ||
    files.length < 2
  ) {

    throw new Error(
      "Two files are required for result."
    );
  }


  const fileA =
    files[0];

  const fileB =
    files[1];


  const email =
    localStorage.getItem(
      "userEmail"
    );


  /* ---------------------------------------------
     GET TEXT
  --------------------------------------------- */

  const textA =
    rawTextMap[fileA.name] ||
    "";


  const textB =
    rawTextMap[fileB.name] ||
    "";


  /* ---------------------------------------------
     SCORE
  --------------------------------------------- */

  const numericScore =
    Number(score) || 0;


  const roundedScore =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(numericScore)
      )
    );


  /* ---------------------------------------------
     COMMON GRAMS
  --------------------------------------------- */

  let commonGramsSet =
    new Set();


  try {

    commonGramsSet =
      getthecommongrams();

  } catch (error) {

    console.warn(
      "Could not get common grams:",
      error
    );

    commonGramsSet =
      new Set();
  }


  if (!commonGramsSet) {

    commonGramsSet =
      new Set();
  }


  /* ---------------------------------------------
     RECONSTRUCT MATCHES
  --------------------------------------------- */

  const reconstructed =
    reconstructMatchesFromGrams(
      textA,
      textB,
      commonGramsSet
    );


  const matchesA =
    reconstructed.matchesA || [];


  const matchesB =
    reconstructed.matchesB || [];


  /* ---------------------------------------------
     CHUNK COUNTS
  --------------------------------------------- */

  const chunkCountA =
    localChunks[0]
      ? localChunks[0].length
      : 0;


  const chunkCountB =
    localChunks[1]
      ? localChunks[1].length
      : 0;


  /* ---------------------------------------------
     RESULT OBJECT
  --------------------------------------------- */

  const result = {

    email: (email || localStorage.getItem("userEmail") || "").toLowerCase().trim(),

    filenames: [
      fileA.name,
      fileB.name
    ],

    filefirstmatches:
      matchesA,

    filesecondmatches:
      matchesB,

    similarwords:
      commonGramsSet instanceof Set
        ? commonGramsSet.size
        : Array.isArray(commonGramsSet)
          ? commonGramsSet.length
          : 0,

    matchingSections:
      matchesA.length > 0 ? matchesA.length : (roundedScore > 0 ? 1 : 0),

    differentSections:
      Math.max(0, (chunkCountA + chunkCountB) - (matchesA.length + matchesB.length)),

    matchesA:
      matchesA,

    matchesB:
      matchesB,

    roundedscore:
      roundedScore,

    textA:
      textA,

    textB:
      textB,

    chunkCountA:
      chunkCountA,

    chunkCountB:
      chunkCountB,

    commonPhrases:
      extractCommonPhrases(matchesA, textA, textB),

    matchingPhrases:
      Array.isArray(extractCommonPhrases(matchesA, textA, textB)) ? extractCommonPhrases(matchesA, textA, textB).length : 0,

    spellingMistakesA:
      detectSpellingMistakes(textA, fileA.name, { peerText: textB }),

    spellingMistakesB:
      detectSpellingMistakes(textB, fileB.name, { peerText: textA }),

    date:
      new Date().toISOString(),

    filters: {
      excludeReferences: document.getElementById("filterExcludeReferences")?.checked ?? true,
      excludeQuotes: document.getElementById("filterExcludeQuotes")?.checked ?? true,
      excludeSmallMatches: document.getElementById("filterExcludeSmallMatches")?.checked ?? false
    }
  };


  console.log(
    "FINAL RESULT:",
    result
  );


  /* ---------------------------------------------
     SAVE LOCAL SESSION FIRST
     
     Even if JSON server fails,
     result will still display.
  --------------------------------------------- */

  try {

    sessionStorage.setItem(
      "showsthedisplayornot",
      "true"
    );


    sessionStorage.setItem(
      "lastAnalysisResult",
      JSON.stringify(result)
    );

    sessionStorage.setItem(
      "reportData",
      JSON.stringify(result)
    );

  } catch (error) {

    console.warn(
      "Session storage failed:",
      error
    );
  }


  /* ---------------------------------------------
     RENDER RESULT IMMEDIATELY
     
     IMPORTANT:
     Result should NOT wait for database.
  --------------------------------------------- */

  try {

    renderUI(result);

    console.log(
      "Result UI rendered successfully."
    );

  } catch (error) {

    console.error(
      "Result UI render failed:",
      error
    );
  }


  /* ---------------------------------------------
     SAVE RESULT TO JSON SERVER
     
     Database failure will NOT send user
     back to upload page.
  --------------------------------------------- */

  if (email) {

    try {

      const _authToken = localStorage.getItem("authToken");
      const _authHdr = _authToken ? { "Authorization": `Bearer ${_authToken}` } : {};

      const response =
        await fetch(
          `${API_BASE}/fileresult?email=${encodeURIComponent(email)}`,
          { headers: _authHdr }
        );


      if (!response.ok) {

        throw new Error(
          "fileresult GET failed: " +
          response.status
        );
      }


      const data =
        await response.json();


      if (
        data &&
        data.length > 0
      ) {

        const reportUser =
          data[0];


        if (
          !Array.isArray(
            reportUser.filesprocesed
          )
        ) {

          reportUser.filesprocesed = [];
        }


        reportUser.filesprocesed.push(
          result
        );


        const saveResponse =
          await fetch(
            `${API_BASE}/fileresult/${reportUser.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ..._authHdr
              },
              body:
                JSON.stringify(
                  reportUser
                )
            }
          );


        if (!saveResponse.ok) {

          throw new Error(
            "fileresult PUT failed: " +
            saveResponse.status
          );
        }


        console.log(
          "Result saved to database successfully."
        );

      } else {

        const newReportUser = {

          email:
            email,

          filesprocesed: [
            result
          ]

        };


        const createResponse =
          await fetch(
            `${API_BASE}/fileresult`,
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                ..._authHdr
              },

              body:
                JSON.stringify(
                  newReportUser
                )
            }
          );


        if (!createResponse.ok) {

          throw new Error(
            "fileresult POST failed: " +
            createResponse.status
          );
        }


        console.log(
          "Result record created and saved to database successfully."
        );
      }

      // Also save report record to /reports for history and detailed report
      try {
        const dynamicDiffSections = Math.max(0, ((chunkCountA || 0) + (chunkCountB || 0)) - (Array.isArray(result.commonPhrases) ? result.commonPhrases.length : 0));

        const reportEntry = {
          email: email,
          files: [fileA.name, fileB.name],
          type: currentMode,
          similarity: roundedScore,
          matchingSections: Array.isArray(result.commonPhrases) ? result.commonPhrases.length : 0,
          differentSections: dynamicDiffSections,
          matchingPhrases: Array.isArray(result.commonPhrases) ? result.commonPhrases.length : 0,
          commonPhrases: result.commonPhrases || [],
          spellingMistakesA: result.spellingMistakesA || [],
          spellingMistakesB: result.spellingMistakesB || [],
          spellingMistakes: ((result.spellingMistakesA || []).length + (result.spellingMistakesB || []).length),
          date: new Date().toISOString(),
          textA: textA,
          textB: textB,
          filefirstmatches: matchesA,
          filesecondmatches: matchesB
        };

        const res2 = await fetch(`${API_BASE}/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ..._authHdr },
          body: JSON.stringify(reportEntry)
        });
        if (res2.ok) {
          const saved2 = await res2.json();
          try {
            const cacheKey = "assigncheck_history_cache_" + email;
            const existingCache = JSON.parse(localStorage.getItem(cacheKey) || "[]");
            const filteredCache = existingCache.filter(r => (r.id !== saved2.id && r._id !== saved2.id));
            filteredCache.unshift(saved2);
            localStorage.setItem(cacheKey, JSON.stringify(filteredCache));
            localStorage.removeItem("assigncheck_profile_cache_" + email);
          } catch (e) {}
        }
      } catch (repErr) {
        console.warn("Could not save to /reports:", repErr);
      }

    } catch (error) {

      /*
         VERY IMPORTANT:

         Database error should NOT throw
         and should NOT trigger the main
         analysis catch block.
      */

      console.error(
        "Failed to save result to database:",
        error
      );
    }
  }


  /* ---------------------------------------------
     RETURN RESULT
  --------------------------------------------- */

  return result;
}


/* =========================================================
   RENDER UI
========================================================= */

function renderUI(result) {

  if (!result) {

    console.error(
      "renderUI(): result missing."
    );

    return;
  }


  const roundedScore =
    Number(
      result.roundedscore
    ) || 0;


  /* ---------------------------------------------
     SCORE
  --------------------------------------------- */

  const scoreElement =
    document.getElementById(
      "resSimilarity"
    );


  if (scoreElement) {

    scoreElement.textContent =
      "0%";


    countUp(
      scoreElement,
      roundedScore
    );
  }


  /* ---------------------------------------------
     FILENAMES
  --------------------------------------------- */

  const filenames =
    Array.isArray(
      result.filenames
    )
      ? result.filenames
      : [];


  const fileAName =
    filenames[0] || "File 1";


  const fileBName =
    filenames[1] || "File 2";


  const pairLeft =
    document.getElementById(
      "pairLeft"
    );


  const pairRight =
    document.getElementById(
      "pairRight"
    );


  const panelAName =
    document.getElementById(
      "panelAName"
    );


  const panelBName =
    document.getElementById(
      "panelBName"
    );


  if (pairLeft) {

    pairLeft.textContent =
      fileAName;
  }


  if (pairRight) {

    pairRight.textContent =
      fileBName;
  }


  if (panelAName) {

    panelAName.textContent =
      fileAName;
  }


  if (panelBName) {

    panelBName.textContent =
      fileBName;
  }


  /* ---------------------------------------------
     FILE TYPE
  --------------------------------------------- */

  const typeA =
    getFileType(
      fileAName
    );


  const typeB =
    getFileType(
      fileBName
    );


  const panelAFmt =
    document.getElementById(
      "panelAFmt"
    );


  const panelBFmt =
    document.getElementById(
      "panelBFmt"
    );


  if (panelAFmt) {

    panelAFmt.textContent =
      typeA.label;
  }


  if (panelBFmt) {

    panelBFmt.textContent =
      typeB.label;
  }


  /* ---------------------------------------------
     TEXT
  --------------------------------------------- */

  const textA =
    result.textA ||
    "No content extracted.";


  const textB =
    result.textB ||
    "No content extracted.";


  const matchesA =
    Array.isArray(
      result.filefirstmatches
    )
      ? result.filefirstmatches
      : [];


  const matchesB =
    Array.isArray(
      result.filesecondmatches
    )
      ? result.filesecondmatches
      : [];


  const panelABody =
    document.getElementById(
      "panelABody"
    );


  const panelBBody =
    document.getElementById(
      "panelBBody"
    );


  const dynamicTyposA = detectSpellingMistakes(textA, fileAName, { peerText: textB });
  const dynamicTyposB = detectSpellingMistakes(textB, fileBName, { peerText: textA });

  const typosA =
    (Array.isArray(result.spellingMistakesA) && result.spellingMistakesA.length > dynamicTyposA.length)
      ? result.spellingMistakesA
      : dynamicTyposA;

  const typosB =
    (Array.isArray(result.spellingMistakesB) && result.spellingMistakesB.length > dynamicTyposB.length)
      ? result.spellingMistakesB
      : dynamicTyposB;

  function renderPanels(tA, tB) {
    if (panelABody) {
      panelABody.innerHTML =
        highlightTextWithMatchesAndTypos(
          textA,
          matchesA,
          tA,
          {
            showMatches: true,
            showTypos: true,
            otherText: textB
          }
        );
    }

    if (panelBBody) {
      panelBBody.innerHTML =
        highlightTextWithMatchesAndTypos(
          textB,
          matchesB,
          tB,
          {
            showMatches: true,
            showTypos: true,
            otherText: textA
          }
        );
    }
  }

  // Render immediately with local typos
  renderPanels(typosA, typosB);

  // Fire-and-forget: upgrade with server dictionary results asynchronously
  Promise.all([
    detectSpellingMistakesAsync(textA, fileAName),
    detectSpellingMistakesAsync(textB, fileBName)
  ]).then(function([asyncTyposA, asyncTyposB]) {
    const finalA = asyncTyposA.length >= typosA.length ? asyncTyposA : typosA;
    const finalB = asyncTyposB.length >= typosB.length ? asyncTyposB : typosB;
    // Only re-render if the server returned more/different typos
    if (finalA.length !== typosA.length || finalB.length !== typosB.length) {
      renderPanels(finalA, finalB);
    }
  }).catch(function() {
    // Silently ignore — local render already done above
  });


  /* ---------------------------------------------
     STATS
  --------------------------------------------- */

  const mFiles =
    document.getElementById(
      "mFiles"
    );


  const mMatching =
    document.getElementById(
      "mMatching"
    );


  const mDifferent =
    document.getElementById(
      "mDifferent"
    );


  const mPhrases =
    document.getElementById(
      "mPhrases"
    );


  if (mFiles) {
    mFiles.textContent =
      filenames.length;
  }

  const commonPhrases =
    Array.isArray(result.commonPhrases)
      ? result.commonPhrases
      : [];

  const commonPhrasesCount =
    commonPhrases.length;

  const wordsCountA =
    (result.textA || "").trim().split(/\s+/).filter(Boolean).length;

  const wordsCountB =
    (result.textB || "").trim().split(/\s+/).filter(Boolean).length;

  const chunksCountA =
    result.chunkCountA !== undefined && result.chunkCountA !== null
      ? result.chunkCountA
      : Math.max(1, Math.ceil(wordsCountA / 100));

  const chunksCountB =
    result.chunkCountB !== undefined && result.chunkCountB !== null
      ? result.chunkCountB
      : Math.max(1, Math.ceil(wordsCountB / 100));

  const typosCountA =
    Array.isArray(result.spellingMistakesA)
      ? result.spellingMistakesA.length
      : 0;

  const typosCountB =
    Array.isArray(result.spellingMistakesB)
      ? result.spellingMistakesB.length
      : 0;

  // Compute matching sections accurately
  let matchingSectionsCount = 0;
  if (result.matchingSections !== undefined && result.matchingSections !== null && !isNaN(Number(result.matchingSections))) {
    matchingSectionsCount = Number(result.matchingSections);
  } else if (Array.isArray(result.filefirstmatches) && result.filefirstmatches.length > 0) {
    matchingSectionsCount = result.filefirstmatches.length;
  } else if (Array.isArray(result.matchesA) && result.matchesA.length > 0) {
    matchingSectionsCount = result.matchesA.length;
  } else if (result.similarwords) {
    matchingSectionsCount = result.similarwords;
  } else if (roundedScore > 0) {
    matchingSectionsCount = commonPhrasesCount > 0 ? commonPhrasesCount : 1;
  }

  // If score is 100%, guarantee matching sections matches total chunks
  if (roundedScore === 100 && matchingSectionsCount === 0) {
    matchingSectionsCount = Math.max(1, chunksCountA);
  }

  if (mMatching) {
    mMatching.textContent = matchingSectionsCount;
  }

  // Compute different sections accurately
  let diffSections = 0;
  if (result.differentSections !== undefined && result.differentSections !== null && !isNaN(Number(result.differentSections))) {
    diffSections = Number(result.differentSections);
  } else if (Array.isArray(result.diffs)) {
    diffSections = result.diffs.length;
  } else if (roundedScore === 100) {
    diffSections = 0;
  } else {
    diffSections = Math.max(0, chunksCountA - matchingSectionsCount);
  }

  if (mDifferent) {
    mDifferent.textContent = diffSections;
  }

  if (mPhrases) {
    const phraseCount =
      result.matchingPhrases !== undefined && result.matchingPhrases !== null && !isNaN(Number(result.matchingPhrases))
        ? Number(result.matchingPhrases)
        : commonPhrasesCount;
    mPhrases.textContent = phraseCount;
  }

  /* ---------------------------------------------
     DIFFERENCE LIST
  --------------------------------------------- */

  const diffList =
    document.getElementById(
      "diffList"
    );

  if (diffList) {
    diffList.innerHTML =
      "<li><b>" + fileAName + ":</b> " + wordsCountA + " words across " + chunksCountA + " analysis chunks (" + typosCountA + " typos).</li>" +
      "<li><b>" + fileBName + ":</b> " + wordsCountB + " words across " + chunksCountB + " analysis chunks (" + typosCountB + " typos).</li>" +
      "<li>Identified <b>" + diffSections + " non-overlapping sections</b> between the compared files.</li>";
  }

  /* ---------------------------------------------
     MATCH LIST
  --------------------------------------------- */

  const matchList =
    document.getElementById(
      "matchList"
    );

  if (matchList) {
    let topPhraseItem = "No identical multi-word phrases detected.";

    if (commonPhrasesCount > 0 && commonPhrases[0] && commonPhrases[0].phrase) {
      const phraseText = commonPhrases[0].phrase;
      const displayPhrase = phraseText.length > 55 ? phraseText.substring(0, 55) + "..." : phraseText;
      topPhraseItem = "Top match: <i>\"" + displayPhrase + "\"</i> (" + (commonPhrases[0].wordCount || 4) + " words)";
    }

    const nGramCount =
      result.similarwords !== undefined && result.similarwords !== null
        ? result.similarwords
        : (matchingSectionsCount > 0 ? matchingSectionsCount : commonPhrasesCount);

    matchList.innerHTML =
      "<li>Identified <b>" + commonPhrasesCount + " common multi-word phrases</b> shared between files.</li>" +
      "<li>Detected <b>" + nGramCount + " matching section/token segments</b> across documents.</li>" +

      "<li>" + topPhraseItem + "</li>";
  }


  /* ---------------------------------------------
     FORCE RESULT VIEW
  --------------------------------------------- */

  if (viewResults) {

    viewResults.classList.add(
      "active"
    );
  }
}


/* =========================================================
   LOAD LAST SESSION
========================================================= */

async function loadLastSession() {

  /*
     IMPORTANT:
     Only restore last session when the user
     has just finished an analysis in this tab
     (flag set by the analysis code).

     On a fresh visit (e.g. clicking "Check Assignment"
     from navbar), skip restore and show the upload form.
  */

  const justAnalysed =
    sessionStorage.getItem(
      "showsthedisplayornot"
    );


  if (!justAnalysed) {

    console.log(
      "Fresh page visit — showing upload form."
    );

    return;
  }


  const email =
    localStorage.getItem(
      "userEmail"
    );


  if (!email) {
    return;
  }


  /*
     First check sessionStorage.
     This prevents unnecessary database
     loading immediately after analysis.
  */

  try {

    const saved =
      sessionStorage.getItem(
        "lastAnalysisResult"
      );


    if (saved) {

      const lastResult =
        JSON.parse(saved);


      if (
        lastResult &&
        lastResult.filenames
      ) {

        setProgressStep(3);

        renderUI(
          lastResult
        );

        showView(
          viewResults
        );


        console.log(
          "Loaded result from sessionStorage."
        );


        /*
           Return here.
           Otherwise DB result could overwrite
           the current fresh result.
        */

        return;
      }
    }

  } catch (error) {

    console.warn(
      "Session result could not be loaded:",
      error
    );
  }


  /* ---------------------------------------------
     DATABASE FALLBACK
  --------------------------------------------- */

  try {

    const response =
      await fetch(
        `${API_BASE}/fileresult?email=${encodeURIComponent(email)}`
      );


    if (!response.ok) {

      throw new Error(
        "Could not fetch fileresult: " +
        response.status
      );
    }


    const resp =
      await response.json();


    if (
      resp &&
      resp.length > 0 &&
      Array.isArray(
        resp[0].filesprocesed
      ) &&
      resp[0].filesprocesed.length > 0
    ) {

      const person =
        resp[0];


      const lastResult =
        person.filesprocesed[
          person.filesprocesed.length - 1
        ];


      if (lastResult) {

        setProgressStep(3);

        renderUI(
          lastResult
        );

        showView(
          viewResults
        );


        console.log(
          "Loaded last session from database."
        );
      }
    }

  } catch (error) {

    console.error(
      "Failed to load last session:",
      error
    );
  }
}


/* =========================================================
   NEW ANALYSIS
========================================================= */

const newAnalysisBtn =
  document.getElementById(
    "newAnalysisBtn"
  );

const viewReportBtn =
  document.getElementById(
    "viewReportBtn"
  );

if (viewReportBtn) {
  viewReportBtn.addEventListener(
    "click",
    function () {
      // Pass the report ID in the URL so DetailedReport.html can fetch it directly from the API
      let reportId = null;
      try {
        const stored = sessionStorage.getItem("reportData");
        if (stored) {
          const parsed = JSON.parse(stored);
          reportId = parsed.id || parsed.customId || parsed._id || null;
        }
      } catch (e) {}
      if (reportId) {
        window.location.href = "DetailedReport.html?id=" + encodeURIComponent(reportId);
      } else {
        window.location.href = "DetailedReport.html";
      }
    }
  );
}

const btnCertificate = document.getElementById("btnCertificate");
if (btnCertificate) {
  btnCertificate.addEventListener("click", function () {
    let reportData = null;
    try {
      const stored = sessionStorage.getItem("reportData") || sessionStorage.getItem("lastAnalysisResult");
      if (stored) {
        reportData = JSON.parse(stored);
      }
    } catch (e) {}
    if (reportData) {
      openCertificateModal(reportData);
    } else {
      showToast("No active analysis result to certify.", "warning");
    }
  });
}

// Profile dropdown & logout listeners
const profileBtn = document.getElementById("profileButton");
const profileMenu = document.getElementById("profileMenu");
if (profileBtn && profileMenu) {
  profileBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    profileMenu.classList.toggle("show");
  });
  document.addEventListener("click", function () {
    profileMenu.classList.remove("show");
  });
}

const logoutBtn = document.getElementById("logoutButton");
const mobileLogoutBtn = document.getElementById("mobileLogoutButton");
function handleLogout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  sessionStorage.clear();
  window.location.href = "index.html";
}
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);

if (newAnalysisBtn) {

  newAnalysisBtn.addEventListener(
    "click",
    function () {

      isRunning = false;


      fileList = [];
      studentFiles = [];
      teacherRefFile = null;
      lastBatchEvaluation = null;
      if (pairResultsWrap) pairResultsWrap.style.display = "block";
      if (batchResultsWrap) batchResultsWrap.style.display = "none";
      if (backToBatchBtn) backToBatchBtn.style.display = "none";
      if (fileListLeft) fileListLeft.innerHTML = "";
      if (fileListRight) fileListRight.innerHTML = "";
      if (fileCountLeft) fileCountLeft.textContent = "0 files";
      if (fileCountRight) fileCountRight.textContent = "0 files";

      localChunks = [];
      rawTextMap = {};


      /*
         Clear current saved session
         so old result does not come back.
      */

      sessionStorage.removeItem(
        "lastAnalysisResult"
      );


      sessionStorage.removeItem(
        "showsthedisplayornot"
      );


      /* -----------------------------------------
         RESET ANIMATION
      ----------------------------------------- */

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


        const docs =
          aStage.querySelectorAll(
            ".a-doc"
          );


        docs.forEach(
          function (doc) {
            doc.remove();
          }
        );


        const lines =
          aStage.querySelectorAll(
            ".connection-line"
          );


        lines.forEach(
          function (line) {
            line.remove();
          }
        );
      }


      if (animStatus) {

        animStatus.className =
          "anim-status";
      }


      if (animStatusText) {

        animStatusText.textContent =
          "Running";
      }


      /* -----------------------------------------
         RESET PROGRESS
      ----------------------------------------- */

      updateProgress(
        0,
        "Ready to analyze..."
      );


      renderFileList();

      checkButtonState();


      setProgressStep(1);

      showView(
        viewUpload
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  );
}


/* =========================================================
   FORMAT TEXT TO PARAGRAPHS
========================================================= */

function formatTextToParagraphs(text) {

  if (!text) {
    return "";
  }


  const lines =
    String(text).split(
      /\n+/
    );


  let result = "";


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    if (
      lines[i].trim().length > 0
    ) {

      result +=
        "<p>" +
        lines[i] +
        "</p>";
    }
  }


  return result;
}


/* =========================================================
   RECONSTRUCT MATCHES
========================================================= */

export function reconstructMatchesFromGrams(
  textA,
  textB,
  commonGramsSet,
  gramSize = 4
) {

  if (!textA || !textB) {

    return {
      matchesA: [],
      matchesB: []
    };
  }


  const wordsA =
    textA
      .trim()
      .split(/\s+/);


  const wordsB =
    textB
      .trim()
      .split(/\s+/);


  const cleanA =
    wordsA.map(
      function (w) {

        return w
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          );
      }
    );


  const cleanB =
    wordsB.map(
      function (w) {

        return w
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          );
      }
    );

  // Adapt gram size for short texts so single-word matches are found
  const effectiveGramSize = Math.max(1, Math.min(gramSize, Math.min(cleanA.length, cleanB.length)));

  /* ---------------------------------------------
     NORMALIZE COMMON GRAMS
  --------------------------------------------- */

  const normalizedGrams =
    new Set();


  if (
    commonGramsSet instanceof Set
  ) {

    commonGramsSet.forEach(
      function (item) {

        const str =
          Array.isArray(item)
            ? item
                .join(" ")
                .trim()
                .toLowerCase()
            : String(item)
                .trim()
                .toLowerCase();


        normalizedGrams.add(
          str
        );
      }
    );

  } else if (
    Array.isArray(
      commonGramsSet
    )
  ) {

    commonGramsSet.forEach(
      function (item) {

        const str =
          Array.isArray(item)
            ? item
                .join(" ")
                .trim()
                .toLowerCase()
            : String(item)
                .trim()
                .toLowerCase();


        normalizedGrams.add(
          str
        );
      }
    );
  }

  // For very short texts with no common grams, build grams from scratch
  // using token-level matching so "hello" in both docs is detected
  if (normalizedGrams.size === 0 && cleanA.length > 0 && cleanB.length > 0) {
    const setBClean = new Set(cleanB.filter(Boolean));
    cleanA.forEach(w => { if (w && setBClean.has(w)) normalizedGrams.add(w); });
  }

  /* ---------------------------------------------
     INDEX FILE B
  --------------------------------------------- */

  const mapB =
    new Map();


  for (
    let j = 0;
    j <= cleanB.length - effectiveGramSize;
    j++
  ) {

    const gramB =
      cleanB
        .slice(
          j,
          j + effectiveGramSize
        )
        .join(" ");


    if (
      !gramB ||
      gramB.includes("  ")
    ) {
      continue;
    }


    if (
      !mapB.has(gramB)
    ) {

      mapB.set(
        gramB,
        []
      );
    }


    mapB
      .get(gramB)
      .push(j);
  }


  const visitedA =
    new Array(
      wordsA.length
    ).fill(false);


  const visitedB =
    new Array(
      wordsB.length
    ).fill(false);


  const matchesA = [];

  const matchesB = [];


  /* ---------------------------------------------
     SCAN FILE A
  --------------------------------------------- */

  for (
    let i = 0;
    i <= cleanA.length - effectiveGramSize;
    i++
  ) {

    if (
      visitedA[i]
    ) {
      continue;
    }


    const currentGram =
      cleanA
        .slice(
          i,
          i + effectiveGramSize
        )
        .join(" ");


    if (
      normalizedGrams.has(
        currentGram
      ) &&
      mapB.has(
        currentGram
      )
    ) {

      const matchIndicesB =
        mapB.get(
          currentGram
        );


      let bestK = 0;

      let bestBIndex = -1;


      for (
        const j of matchIndicesB
      ) {

        let k = 0;


        while (

          i + k <
            cleanA.length &&

          j + k <
            cleanB.length &&

          cleanA[i + k] !== "" &&

          cleanA[i + k] ===
            cleanB[j + k]

        ) {

          k++;
        }


        if (
          k > bestK
        ) {

          bestK = k;

          bestBIndex = j;
        }
      }


      if (
        bestK >= effectiveGramSize
      ) {

        let isBVisited =
          false;


        for (
          let v = bestBIndex;
          v < bestBIndex + bestK;
          v++
        ) {

          if (
            visitedB[v]
          ) {

            isBVisited =
              true;

            break;
          }
        }


        if (
          !isBVisited
        ) {

          for (
            let v = i;
            v < i + bestK;
            v++
          ) {

            visitedA[v] =
              true;
          }


          for (
            let v = bestBIndex;
            v < bestBIndex + bestK;
            v++
          ) {

            visitedB[v] =
              true;
          }


          matchesA.push({

            phrase:
              wordsA
                .slice(
                  i,
                  i + bestK
                )
                .join(" "),

            startIndex:
              i,

            endIndex:
              i + bestK,

            length:
              bestK

          });


          matchesB.push({

            phrase:
              wordsB
                .slice(
                  bestBIndex,
                  bestBIndex + bestK
                )
                .join(" "),

            startIndex:
              bestBIndex,

            endIndex:
              bestBIndex + bestK,

            length:
              bestK

          });
        }


        i +=
          bestK - 1;
      }
    }
  }


  return {
    matchesA,
    matchesB
  };
}



/* =========================================================
   HIGHLIGHT MATCHES
========================================================= */

function highlightMatchesInText(
  text,
  matchedPhrases
) {

  if (
    !text
  ) {

    return "";
  }


  if (
    !matchedPhrases ||
    matchedPhrases.length === 0
  ) {

    return formatTextToParagraphs(
      text
    );
  }


  /* ---------------------------------------------
     FIND WORD POSITIONS
  --------------------------------------------- */

  const words = [];

  const regex =
    /\S+/g;


  let match;


  while (
    (match = regex.exec(text)) !== null
  ) {

    words.push({

      start:
        match.index,

      end:
        match.index +
        match[0].length

    });
  }


  /* ---------------------------------------------
     CREATE CHARACTER INTERVALS
  --------------------------------------------- */

  const highlightIntervals =
    [];


  for (
    const phraseInfo
    of matchedPhrases
  ) {

    if (!phraseInfo) {
      continue;
    }


    const startWordIdx =
      Number(
        phraseInfo.startIndex
      );


    const endWordIdx =
      Number(
        phraseInfo.endIndex
      );


    if (

      startWordIdx >= 0 &&

      endWordIdx <=
        words.length &&

      startWordIdx <
        endWordIdx

    ) {

      const charStart =
        words[
          startWordIdx
        ].start;


      const charEnd =
        words[
          endWordIdx - 1
        ].end;


      highlightIntervals.push({

        start:
          charStart,

        end:
          charEnd

      });
    }
  }


  /* ---------------------------------------------
     MERGE OVERLAPPING INTERVALS
  --------------------------------------------- */

  highlightIntervals.sort(
    function (a, b) {

      return a.start -
        b.start;
    }
  );


  const mergedIntervals =
    [];


  for (
    const interval
    of highlightIntervals
  ) {

    if (
      mergedIntervals.length === 0
    ) {

      mergedIntervals.push({
        ...interval
      });

    } else {

      const last =
        mergedIntervals[
          mergedIntervals.length - 1
        ];


      if (
        interval.start <=
        last.end
      ) {

        last.end =
          Math.max(
            last.end,
            interval.end
          );

      } else {

        mergedIntervals.push({
          ...interval
        });
      }
    }
  }


  /* ---------------------------------------------
     REBUILD HTML
  --------------------------------------------- */

  let result = "";

  let currentIndex = 0;


  for (
    const interval
    of mergedIntervals
  ) {

    result +=
      escapeHTML(
        text.substring(
          currentIndex,
          interval.start
        )
      );


    result +=
      `<mark class="highlight-match">` +
      escapeHTML(
        text.substring(
          interval.start,
          interval.end
        )
      ) +
      `</mark>`;


    currentIndex =
      interval.end;
  }


  result +=
    escapeHTML(
      text.substring(
        currentIndex
      )
    );


  /*
     Don't escape the <mark> tag.
     Format paragraphs after creating
     highlighted content.
  */

  const paragraphs =
    result.split(
      /\n+/
    );


  let html = "";


  for (
    let i = 0;
    i < paragraphs.length;
    i++
  ) {

    if (
      paragraphs[i].trim()
    ) {

      html +=
        "<p>" +
        paragraphs[i] +
        "</p>";
    }
  }


  return html;
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* =========================================================
   INITIAL SETUP
========================================================= */

setProgressStep(1);

renderFileList();
checkButtonState();


/*
   IMPORTANT:

   loadLastSession() is called LAST,
   after all functions have been created.
*/

loadLastSession();


/* =========================================================
   DEBUG
========================================================= */

console.log(
  "CheckAssign.js loaded successfully."
);