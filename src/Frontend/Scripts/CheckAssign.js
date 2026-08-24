let currentuser = localStorage.getItem("loggedIn");
if (currentuser == null) {
  window.location.href = "../Templates/index.html";
  alert("login first");
}

import {
  addfiles,
  processEntry,
  createChunksLinear,
  buildthegrams,
  applyalgo,
  getthecommongrams,
  renderUI,
  createAnimationDocs,
  countUp,
  highlightMatchesInText,
  getFileType,
  formatTextToParagraphs
} from "../../Backend/CheckBackend.js";

let currentMode = "student";
let fileList = [];
let rawTextMap = {};
let localChunks = [];
let isRunning = false;

// Main elements
const dropZoneLeft = document.getElementById("dropLeft");
const fileInputLeft = document.getElementById("fileInputLeft");
const analyzeBtn = document.getElementById("analyzeBtn");

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

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// Change progress bar
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

// Show the required page section
function showView(view) {
  viewUpload.classList.remove("active");
  viewAnimation.classList.remove("active");
  viewResults.classList.remove("active");

  view.classList.add("active");

  window.scrollTo(0, 0);
}

// Student vs Student / Teacher vs Student
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
      zoneRight.style.display = "flex";
      filePanelSingle.style.display = "none";
      uploadLayout.className = "upload-layout dual";

      document.getElementById("labelLeft").textContent = "Student Assignment";
      document.getElementById("chipLeft").textContent = "S";

      document.getElementById("summaryText").innerHTML =
        "Upload a <b>student file</b> and the <b>teacher reference</b> to compare.";
    } else {
      zoneRight.style.display = "none";
      filePanelSingle.style.display = "flex";
      uploadLayout.className = "upload-layout single";

      document.getElementById("labelLeft").textContent = "Student Assignments";
      document.getElementById("chipLeft").textContent = "S1";

      document.getElementById("summaryText").innerHTML =
        "Upload <b>two or more student files</b> to compare them against each other.";
    }

    renderFileList();
    checkButtonState();
  });
}

// Display selected files
function renderFileList() {
  const container = document.getElementById("fileListSingle");
  const badge = document.getElementById("fileCountBadgeSingle");
  const countText = document.getElementById("fileCountSingle");

  addfiles(null, fileList, container);

  if (badge) {
    badge.textContent = fileList.length;
  }

  if (countText) {
    countText.textContent = fileList.length + " files selected";
  }

  const removeButtons = container.querySelectorAll(".f-remove");

  for (let i = 0; i < removeButtons.length; i++) {
    removeButtons[i].addEventListener("click", function (event) {
      event.stopPropagation();
      const index = Number(this.dataset.idx);
      fileList.splice(index, 1);
      renderFileList();
      checkButtonState();
    });
  }
}

// Enable Analyze button
function checkButtonState() {
  if (fileList.length >= 2) {
    analyzeBtn.disabled = false;
    analyzeBtn.setAttribute("aria-disabled", "false");
  } else {
    analyzeBtn.disabled = true;
    analyzeBtn.setAttribute("aria-disabled", "true");
  }
}

// Add files to the list
function handleIncomingFiles(files) {
  for (let i = 0; i < files.length; i++) {
    fileList.push(files[i]);
  }
  renderFileList();
  checkButtonState();
}

// Open file picker
dropZoneLeft.addEventListener("click", function () {
  fileInputLeft.click();
});

fileInputLeft.addEventListener("change", function () {
  if (fileInputLeft.files) {
    handleIncomingFiles(fileInputLeft.files);
  }
  fileInputLeft.value = "";
});

// Drag and drop
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
      const entry = items[i].webkitGetAsEntry
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
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      files.push(event.dataTransfer.files[i]);
    }
  }

  handleIncomingFiles(files);
});




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
const stageDelays = [800, 900, 800, 900, 1000, 900, 600];

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

// Analyze button
analyzeBtn.addEventListener("click", async function () {
  if (isRunning || fileList.length < 2) {
    return;
  }

  isRunning = true;
  analyzeBtn.disabled = true;

  setProgressStep(2);
  showView(viewAnimation);

  document.getElementById("animTitle").textContent =
    "Comparing " + fileList.length + " assignments...";

  // Create document cards for animation with actual file names
  createAnimationDocs(fileList);

  aStage.classList.add("p-comparing", "p-scanning");
  aEngine.classList.add("active");

  updateProgress(progressValues[0], stageNames[0]);
  await wait(stageDelays[0]);

  // Process files (use first 2 for comparison, or all if in reference mode)
  // we are calculating the local chunks of each file 
  localChunks = [];
  // const filesToProcess = [fileList[fileList.length - 2], fileList[fileList.length - 1]];
  const filesToProcess = [fileList[0], fileList[1]];



  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    let content = "";

    try {
      content = await file.text();
    } catch (error) {
      content = "Content of " + file.name;
    }

    rawTextMap[file.name] = content;

    // Create 100-word chunks (my function)
    const chunks = createChunksLinear(content, 100);

    // Create 4-grams
    for (let j = 0; j < chunks.length; j++) {
      chunks[j].grams = buildthegrams(chunks[j], 4);
    }

    localChunks[i] = chunks;

    // Save data to JSON Server
    let ans = localStorage.getItem("loggedIn");
    if (ans) {
      let getemail = localStorage.getItem("userEmail");
      const xyz = {
        filename: file.name,
        filesize: file.size,
        chunks: chunks,
        results: []
      };

      console.log(xyz);

      const response = await fetch(
        `http://localhost:3000/filedata?email=${encodeURIComponent(getemail)}`
      );
      const users = await response.json();


      if (users.length === 0) {
        console.log("User not found"); // storing the chunks in the database
        continue;
      }

      const user = users[0];
      user.filedetails.push(xyz);

      await fetch("http://localhost:3000/filedata/" + user.id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
      });







      console.log("File added successfully");
    }


  }

  // Run animation stages
  const stageElements = aEngine.querySelectorAll(".ae-stage");
  const lines = aStage.querySelectorAll('.connection-line');
  const docs = aStage.querySelectorAll('.a-doc');

  for (let i = 0; i < stageElements.length; i++) {
    updateProgress(progressValues[i + 1], stageNames[i + 1]);
    stageElements[i].classList.add("active");

    // Show connections during comparison phase (stage 4 onwards)
    if (i >= 3) {
      lines.forEach((line, idx) => {
        // Stagger the connection appearance
        if (idx <= i - 3) {
          line.style.opacity = '0.6';
          line.style.animation = 'dashflow 1.4s linear infinite';
        }
      });

      // Highlight document lines progressively
      docs.forEach((doc, docIdx) => {
        const lines_in_doc = doc.querySelectorAll('.a-line');
        const lineIndex = i - 3;
        if (lines_in_doc[lineIndex] && lineIndex < lines_in_doc.length) {
          setTimeout(() => {
            lines_in_doc[lineIndex].classList.add('found', `hl-${(docIdx % 2) + 1}`);
          }, docIdx * 200);
        }
      });
    }

    await wait(stageDelays[i + 1] || 700);
    stageElements[i].classList.remove("active");
    stageElements[i].classList.add("done");
  }

  // Run actual similarity algorithm
  const realScore = await applyalgo(filesToProcess, localChunks);

  aStage.classList.remove("p-scanning");
  aEngine.classList.remove("active");
  aEngine.classList.add("done");

  animStatusText.textContent = "Complete";
  animStatus.classList.add("done");

  await wait(700);
  displayResults(filesToProcess, realScore);

  setProgressStep(3);
  showView(viewResults);
});

// Count similarity percentage

// Display results// Display results

let showsthedisplayornot=true;

async function displayResults(files, score) {
  sessionStorage.setItem("showsthedisplayornot",true);
  const fileA = files[0];
  const fileB = files[1];
  const getemail = localStorage.getItem("userEmail");

  // 1. Get the text FIRST so it can be used for matching
  const textA = rawTextMap[fileA.name] || "No content extracted.";
  const textB = rawTextMap[fileB.name] || "No content extracted.";

  // 2. Calculate score and update the animated counter
  const roundedScore = Math.min(100, Math.max(0, Math.round(score)));
  const scoreElement = document.getElementById("resSimilarity");
  countUp(scoreElement, roundedScore);

  // 3. Get matches for BOTH files (Now textA and textB are safely defined)
  let commonGramsSet = getthecommongrams();
  const { matchesA, matchesB } = reconstructMatchesFromGrams(textA, textB, commonGramsSet);

  // 4. Prepare the complete result object to save to the database
  const firstChunkCount = localChunks[0] ? localChunks[0].length : 0;
  const secondChunkCount = localChunks[1] ? localChunks[1].length : 0;

  const result = {
    filenames: [fileA.name, fileB.name],
    filefirstmatches: matchesA,
    filesecondmatches: matchesB,
    similarwords: commonGramsSet.size,
    roundedscore: roundedScore,
    textA: textA,       // CRITICAL: Save text to DB so it survives page refresh
    textB: textB,       // CRITICAL: Save text to DB so it survives page refresh
    chunkCountA: firstChunkCount,
    chunkCountB: secondChunkCount
  };

  // 5. Save to Database
  if (getemail) {
    try {
      const data = await fetch(`http://localhost:3000/fileresult?email=${encodeURIComponent(getemail)}`);
      const resp = await data.json();

      if (resp && resp.length > 0) {
        const rep = resp[0];
        
        // Safety check: ensure the array exists before pushing
        if (!rep.filesprocesed) {
          rep.filesprocesed = [];
        }
        
        rep.filesprocesed.push(result);

        await fetch(`http://localhost:3000/fileresult/${rep.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rep)
        });
        console.log("Result saved to database successfully");
      }
    } catch (err) {
      console.error("Failed to save result to database:", err);
    }
  }

  renderUI(result);
}





async function loadLastSession() {
  const getemail = localStorage.getItem("userEmail");
  if (!getemail) return; // If not logged in, do nothing

  try {
    // Fetch the saved results for this user
    const response = await fetch(`http://localhost:3000/fileresult?email=${encodeURIComponent(getemail)}`);
    const resp = await response.json();

    // Check if data exists and has at least one saved result
    if (resp && resp.length > 0 && resp[0].filesprocesed && resp[0].filesprocesed.length > 0) {
      const person = resp[0];
      
      // Get the very last analysis they did
      const lastResult = person.filesprocesed[person.filesprocesed.length - 1];
      
      // Switch to the results view and render the saved data
      setProgressStep(3);
      showView(viewResults);
      renderUI(lastResult);
      
      console.log("Loaded last session from database successfully");
    }
  } catch (err) {
    console.error("Failed to load last session:", err);
  }
}



    loadLastSession();


// Convert text into paragraphs


// New analysis button
const newAnalysisBtn = document.getElementById("newAnalysisBtn");

if (newAnalysisBtn) {
  newAnalysisBtn.addEventListener("click", function () {
    isRunning = false;
    fileList.length = 0;
    localChunks = [];
    rawTextMap = {};

    const stages = aEngine.querySelectorAll(".ae-stage");
    for (let i = 0; i < stages.length; i++) {
      stages[i].className = "ae-stage";
    }

    aEngine.className = "a-engine";
    aStage.className = "anim-stage";
    animStatus.className = "anim-status";
    animStatusText.textContent = "Running";

    // Clear animation docs and connections
    const docs = aStage.querySelectorAll('.a-doc');
    docs.forEach(doc => doc.remove());

    const lines = aStage.querySelectorAll('.connection-line');
    lines.forEach(line => line.remove());

    renderFileList();
    checkButtonState();
    setProgressStep(1);
    showView(viewUpload);
  });
}



// console.log(rawTextMap);


//  not able to write this function exactly and this is not 100% correct so after again able to understand and try to write each and everything write

export function reconstructMatchesFromGrams(textA, textB, commonGramsSet, gramSize = 4) {
  if (!textA || !textB) return { matchesA: [], matchesB: [] };

  // 1. Split into raw words and clean words
  const wordsA = textA.trim().split(/\s+/);
  const wordsB = textB.trim().split(/\s+/);

  const cleanA = wordsA.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const cleanB = wordsB.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Normalize commonGramsSet
  const normalizedGrams = new Set();
  if (commonGramsSet instanceof Set) {
    commonGramsSet.forEach(item => {
      const str = Array.isArray(item) ? item.join(" ") : String(item).trim().toLowerCase();
      normalizedGrams.add(str);
    });
  } else if (Array.isArray(commonGramsSet)) {
    commonGramsSet.forEach(item => {
      const str = Array.isArray(item) ? item.join(" ") : String(item).trim().toLowerCase();
      normalizedGrams.add(str);
    });
  }

  // console.log(normalizedGrams);

  // 2. Pre-index File B 4-grams
  const mapB = new Map();
  for (let j = 0; j <= cleanB.length - gramSize; j++) {
    const gramB = cleanB.slice(j, j + gramSize).join(" ");
    if (!gramB || gramB.includes("  ")) continue;
    if (!mapB.has(gramB)) {
      mapB.set(gramB, []);
    }
    mapB.get(gramB).push(j);
  }

  const visitedA = new Array(wordsA.length).fill(false);
  const visitedB = new Array(wordsB.length).fill(false); // Prevent overlapping highlights in B

  const matchesA = [];
  const matchesB = [];

  // 3. Scan File A and seed expansion
  for (let i = 0; i <= cleanA.length - gramSize; i++) {
    if (visitedA[i]) continue;

    const currentGram = cleanA.slice(i, i + gramSize).join(" ");

    if (normalizedGrams.has(currentGram) && mapB.has(currentGram)) {
      const matchIndicesB = mapB.get(currentGram);

      let bestK = 0;
      let bestBIndex = -1;

      for (const j of matchIndicesB) {
        let k = 0;
        while (
          i + k < cleanA.length &&
          j + k < cleanB.length &&
          cleanA[i + k] !== "" &&
          cleanA[i + k] === cleanB[j + k]
        ) {
          k++;
        }

        if (k > bestK) {
          bestK = k;
          bestBIndex = j;
        }
      }

      if (bestK >= gramSize) {
        // Check if this section in File B is already highlighted to prevent overlapping tags
        let isBVisited = false;
        for (let v = bestBIndex; v < bestBIndex + bestK; v++) {
          if (visitedB[v]) {
            isBVisited = true;
            break;
          }
        }

        if (!isBVisited) {
          // Mark both as visited
          for (let v = i; v < i + bestK; v++) visitedA[v] = true;
          for (let v = bestBIndex; v < bestBIndex + bestK; v++) visitedB[v] = true;

          matchesA.push({
            phrase: wordsA.slice(i, i + bestK).join(" "),
            startIndex: i,
            endIndex: i + bestK,
            length: bestK
          });

          matchesB.push({
            phrase: wordsB.slice(bestBIndex, bestBIndex + bestK).join(" "),
            startIndex: bestBIndex,
            endIndex: bestBIndex + bestK,
            length: bestK
          });
        }

        i += bestK - 1; // Jump past processed continuous block
      }
    }
  }

  return { matchesA, matchesB };
}




