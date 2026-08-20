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

  viewAnimation.classList.remove("active");

  viewResults.classList.remove("active");

  view.classList.add("active");





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

  aStage.classList.add("p-comparing", "p-scanning");

  aEngine.classList.add("active");

  updateProgress(progressValues[0], stageNames[0]);

  await wait(stageDelays[0]);

  // Process the first two files
  localChunks = [];

  const filesToCompare = [fileList[0], fileList[1]];

  for (let i = 0; i < filesToCompare.length; i++) {
    const file = filesToCompare[i];

    let content = "";

    try {
      content = await file.text();
    } catch (error) {
      content = "Content of " + file.name;
    }

    rawTextMap[file.name] = content;

    // Create 100-word chunks
    const chunks = createChunksLinear(content, 100); // a function called from the backend file that make the chunks

    // Create 4-grams
    for (let j = 0; j < chunks.length; j++) {
      chunks[j].grams = buildthegrams(chunks[j], 4); // a funtion call from the backend that make the grams 
    }

    localChunks[i] = chunks;



    // Save data to JSON Server  hence we add in the database 
    // first i get the user from the local storage who is logged in like i have to check that user comes one this page logged in 
    
    
    let ans = localStorage.getItem("loggedIn");

    if (ans) {

      let getemail = localStorage.getItem("userEmail");

      const xyz = {
        filename: file.name,
        filesize: file.size,
        chunks: chunks
      };

      console.log(xyz);

      // Find user using email
      const response = await fetch(
        `http://localhost:3000/filedata?email=${encodeURIComponent(getemail)}`
      );

      const users = await response.json();

      if (users.length === 0) {
        console.log("User not found");
        return;
      }

      // Get the user
      const user = users[0];

      // Add file to filedetails
      user.filedetails.push(xyz);

      // Update the user
      await fetch(`http://localhost:3000/filedata/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
      });

      console.log("File added successfully");
    }



    // try {
    //   await fetch("http://localhost:3000/users", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(data),
    //   });
    // } catch (error) {
    //   console.log("JSON Server notice:", error.message);
    // }
  }

  // Run animation stages
  const stageElements = aEngine.querySelectorAll(".ae-stage");

  for (let i = 0; i < stageElements.length; i++) {
    updateProgress(progressValues[i + 1], stageNames[i + 1]);

    stageElements[i].classList.add("active");

    await wait(stageDelays[i + 1] || 700);

    stageElements[i].classList.remove("active");

    stageElements[i].classList.add("done");
  }

  // Run actual similarity algorithm
  const realScore = await applyalgo(filesToCompare, localChunks);

  aStage.classList.remove("p-scanning");

  aEngine.classList.remove("active");

  aEngine.classList.add("done");

  animStatusText.textContent = "Complete";

  animStatus.classList.add("done");

  await wait(700);

  displayResults(filesToCompare, realScore);

  setProgressStep(3);
  showView(viewResults);
});

// Count similarity percentage
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

// Display results
function displayResults(files, score) {
  const roundedScore = Math.min(100, Math.max(0, Math.round(score)));

  const scoreElement = document.getElementById("resSimilarity");

  countUp(scoreElement, roundedScore);

  const fileA = files[0];
  const fileB = files[1];

  document.getElementById("pairLeft").textContent = fileA.name;

  document.getElementById("pairRight").textContent = fileB.name;

  document.getElementById("pairSub").textContent =
    "Comparison between " + fileA.name + " and " + fileB.name;

  document.getElementById("panelAName").textContent = fileA.name;

  document.getElementById("panelBName").textContent = fileB.name;

  const textA = rawTextMap[fileA.name] || "No content extracted.";

  const textB = rawTextMap[fileB.name] || "No content extracted.";

  document.getElementById("panelABody").innerHTML =
    formatTextToParagraphs(textA);

  document.getElementById("panelBBody").innerHTML =
    formatTextToParagraphs(textB);

  document.getElementById("mFiles").textContent = files.length;

  let matching = 0;

  if (roundedScore > 0) {
    matching = Math.ceil(roundedScore / 10);
  }

  document.getElementById("mMatching").textContent = matching;

  let different = 0;

  if (roundedScore < 100) {
    different = 10 - Math.ceil(roundedScore / 10);

    if (different < 1) {
      different = 1;
    }
  }

  document.getElementById("mDifferent").textContent = different;

  document.getElementById("mPhrases").textContent = Math.round(
    roundedScore * 0.5,
  );

  const firstChunkCount = localChunks[0] ? localChunks[0].length : 0;

  const secondChunkCount = localChunks[1] ? localChunks[1].length : 0;

  document.getElementById("diffList").innerHTML =
    "<li>File 1 has <b>" +
    firstChunkCount +
    " chunks</b> (100 words per chunk).</li>" +
    "<li>File 2 has <b>" +
    secondChunkCount +
    " chunks</b> (100 words per chunk).</li>" +
    "<li>Calculated Jaccard similarity across all 4-gram sets: <b>" +
    roundedScore +
    "%</b>.</li>";

  document.getElementById("matchList").innerHTML =
    "<li>Processed using sliding 4-gram overlapping windows.</li>" +
    "<li>" +
    (roundedScore > 20
      ? "Significant matching phrases detected."
      : "Low phrase similarity across sections.") +
    "</li>";
}

// Convert text into paragraphs
function formatTextToParagraphs(text) {
  const lines = text.split(/\n+/);

  let result = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      result += "<p>" + lines[i] + "</p>";
    }
  }

  return result;
}

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

    renderFileList();
    checkButtonState();

    setProgressStep(1);
    showView(viewUpload);
  });
}

// Initial setup
setProgressStep(1);
checkButtonState();
