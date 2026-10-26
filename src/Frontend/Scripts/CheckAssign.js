import { extractText } from "./DocumentParser.js";
import {
  addfiles,
  processEntry,
  createChunksLinear,
  buildthegrams,
  applyalgo,
  getthecommongrams,
  createAnimationDocs,
  countUp,
  highlightMatchesInText,
  getFileType,
} from "../../Backend/CheckBackend.js";



export async function updateNavbar() {


  // const profileButton = document.getElementById('profileButton');
  const token = localStorage.getItem("token");

  const loginButton = document.getElementById("loginNavButton");
  const signupButton = document.getElementById("signupNavButton");
  const profileWrap = document.getElementById("profileWrap");
  const profileButton = document.getElementById("profileButton");

  const mobileLoginButton =
    document.getElementById("mobileLoginButton");
  const mobileSignupButton =
    document.getElementById("mobileSignupButton");
  const mobileProfileWrap =
    document.getElementById("mobileProfileWrap");
  const mobileProfileButton =
    document.getElementById("mobileProfileButton");

  function showLoggedOut() {
    if (loginButton) loginButton.style.display = "";
    if (signupButton) signupButton.style.display = "";
    if (profileWrap) profileWrap.classList.remove("show");

    if (mobileLoginButton) mobileLoginButton.style.display = "";
    if (mobileSignupButton) mobileSignupButton.style.display = "";
    if (mobileProfileWrap) mobileProfileWrap.classList.remove("show");
  }

  function showLoggedIn(username) {
    const firstLetter = username?.charAt(0).toUpperCase() || "?";

    if (loginButton) loginButton.style.display = "none";
    if (signupButton) signupButton.style.display = "none";
    if (profileWrap) profileWrap.classList.add("show");
    if (profileButton) profileButton.textContent = firstLetter;

    if (mobileLoginButton) mobileLoginButton.style.display = "none";
    if (mobileSignupButton) mobileSignupButton.style.display = "none";
    if (mobileProfileWrap) mobileProfileWrap.classList.add("show");
    if (mobileProfileButton) {
      mobileProfileButton.textContent = firstLetter;
    }
  }

  // Case 1: No saved token
  if (!token) {
    showLoggedOut();
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8005/profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Case 2: Token is invalid or expired
    if (response.status === 401) {
      localStorage.removeItem("token");
      showLoggedOut();

      await showCustomAlert(
        "Your session has expired. Please log in again."
      );
      return;
    }

    if (!response.ok) {
      throw new Error(
        `Profile request failed: ${response.status}`
      );
    }

    // Case 3: Token is valid
    const result = await response.json();
    console.log(result)
    showLoggedIn(result[0].username);

  } catch (error) {
    console.error("Navbar update error:", error);

    // A network error does not necessarily mean
    // the token has expired. Keep the token.
  }
}



// page java script

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const nav = document.querySelector('.nav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const isOpen = nav.classList.contains('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}

// Profile menu toggle
const profileButton = document.getElementById('profileButton');
const profileMenu = document.getElementById('profileMenu');
const mobileProfileButton = document.getElementById('mobileProfileButton');
const mobileProfileMenu = document.getElementById('mobileProfileMenu');

function toggleProfileMenu(btn, menu) {
  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });
  }
}

toggleProfileMenu(profileButton, profileMenu);
toggleProfileMenu(mobileProfileButton, mobileProfileMenu);

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
  if (profileMenu && !profileMenu.contains(e.target) && profileButton && !profileButton.contains(e.target)) {
    profileMenu.classList.remove('open');
    profileButton.setAttribute('aria-expanded', 'false');
  }
  if (mobileProfileMenu && !mobileProfileMenu.contains(e.target) && mobileProfileButton && !mobileProfileButton.contains(e.target)) {
    mobileProfileMenu.classList.remove('open');
    mobileProfileButton.setAttribute('aria-expanded', 'false');
  }
});

// Set user initial from localStorage
// const userEmail = localStorage.getItem("userEmail") || "User";
// const initial = userEmail.charAt(0).toUpperCase();
updateNavbar()
// if (profileButton) profileButton.textContent = ;
// if (mobileProfileButton) mobileProfileButton.textContent = initial;

// Logout logic
const logoutButtons = document.querySelectorAll('.logout-item');
logoutButtons.forEach(btn => {
  btn.addEventListener('click', () => {


  });
});


// let getemail = document.getElementById("userEmail");
// async function highlightsamehovermatch() {
//   api = await fetch("https://checkassign-assignment-plagiarism.onrender.com/fileresult/" + getemail);
//   data = await api.json();

// }







// let currentuser = localStorage.getItem("loggedIn");
// if (currentuser == null) {
//   window.location.href = "../Templates/index.html";
//   showCustomAlert("login first");
// }

let currentMode = "student";
let fileList = [];
let refStudentFiles = [];
let refTeacherFile = null;
let rawTextMap = {};
let localChunks = [];
let isRunning = false;

const dropZoneLeft = document.getElementById("dropLeft");
const fileInputLeft = document.getElementById("fileInputLeft");
const dropZoneRight = document.getElementById("dropRight");
const fileInputRight = document.getElementById("fileInputRight");
const analyzeBtn = document.getElementById("analyzeBtn");

const viewUpload = document.getElementById("viewUpload");
const viewAnimation = document.getElementById("viewAnimation");
const viewResults = document.getElementById("viewResults");

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

function showView(view) {
  viewUpload.classList.remove("active");
  viewAnimation.classList.remove("active");
  viewResults.classList.remove("active");
  view.classList.add("active");
  window.scrollTo(0, 0);
}

function updateProgress(percent, message) {
  if (progFill) progFill.style.width = percent + "%";
  if (progPct) progPct.textContent = percent + "%";
  if (progMsg) progMsg.textContent = message;
  if (aeStatus) aeStatus.textContent = message;
}

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

    fileList = [];
    refStudentFiles = [];
    refTeacherFile = null;
    rawTextMap = {};
    localChunks = [];

    if (currentMode === "reference") {
      zoneRight.style.display = "flex";
      filePanelSingle.style.display = "none";
      uploadLayout.className = "upload-layout dual";

      document.getElementById("labelLeft").textContent = "Student Assignment";
      document.getElementById("chipLeft").textContent = "S";
      document.getElementById("summaryText").innerHTML = "Upload a <b>student file</b> and the <b>teacher reference</b> to compare.";
    } else {
      zoneRight.style.display = "none";
      filePanelSingle.style.display = "flex";
      uploadLayout.className = "upload-layout single";

      document.getElementById("labelLeft").textContent = "Student Assignments";
      document.getElementById("chipLeft").textContent = "S1";
      document.getElementById("summaryText").innerHTML = "Upload <b>two or more student files</b> to compare them against each other.";
    }

    renderFileList();
    checkButtonState();
  });
}

function renderFileList() {
  if (currentMode === "student") {
    const container = document.getElementById("fileListSingle");
    const badge = document.getElementById("fileCountBadgeSingle");
    const countText = document.getElementById("fileCountSingle");

    container.innerHTML = "";
    addfiles(null, fileList, container);

    if (badge) badge.textContent = fileList.length;
    if (countText) countText.textContent = fileList.length + " files selected";

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
  } else {
    const leftContainer = document.getElementById("fileListLeft");
    const leftCount = document.getElementById("fileCountLeft");
    leftContainer.innerHTML = "";
    addfiles(null, refStudentFiles, leftContainer);
    if (leftCount) leftCount.textContent = refStudentFiles.length + (refStudentFiles.length === 1 ? " file" : " files");

    let leftRemoveButtons = leftContainer.querySelectorAll(".f-remove");
    for (let i = 0; i < leftRemoveButtons.length; i++) {
      leftRemoveButtons[i].addEventListener("click", function (event) {
        event.stopPropagation();
        const index = Number(this.dataset.idx);
        refStudentFiles.splice(index, 1);
        renderFileList();
        checkButtonState();
      });
    }

    const rightContainer = document.getElementById("fileListRight");
    const rightCount = document.getElementById("fileCountRight");
    rightContainer.innerHTML = "";
    if (refTeacherFile) {
      addfiles(null, [refTeacherFile], rightContainer);
      let rightRemoveButtons = rightContainer.querySelectorAll(".f-remove");
      for (let i = 0; i < rightRemoveButtons.length; i++) {
        rightRemoveButtons[i].addEventListener("click", function (event) {
          event.stopPropagation();
          refTeacherFile = null;
          renderFileList();
          checkButtonState();
        });
      }
    }
    if (rightCount) rightCount.textContent = refTeacherFile ? "1 file selected" : "0 files";
  }
}

function checkButtonState() {
  if (currentMode === "student") {
    if (fileList.length >= 2) {
      analyzeBtn.disabled = false;
      analyzeBtn.setAttribute("aria-disabled", "false");
    } else {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute("aria-disabled", "true");
    }
  } else {
    if (refTeacherFile && refStudentFiles.length >= 1) {
      analyzeBtn.disabled = false;
      analyzeBtn.setAttribute("aria-disabled", "false");
    } else {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute("aria-disabled", "true");
    }
  }
}

function handleIncomingFiles(files, isRightZone = false) {
  if (currentMode === "student") {
    if (!isRightZone) {
      for (let i = 0; i < files.length; i++) {
        fileList.push(files[i]);
      }
    }
  } else {
    if (isRightZone) {
      refTeacherFile = files[0];
    } else {
      for (let i = 0; i < files.length; i++) {
        refStudentFiles.push(files[i]);
      }
    }
  }
  renderFileList();
  checkButtonState();
}

function setupDropZone(dropZone, fileInput, isRightZone) {
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files) {
      handleIncomingFiles(Array.from(fileInput.files), isRightZone);
    }
    fileInput.value = "";
  });

  const dragEvents = ["dragenter", "dragover", "dragleave", "drop"];
  for (let i = 0; i < dragEvents.length; i++) {
    dropZone.addEventListener(dragEvents[i], function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  dropZone.addEventListener("dragover", function () {
    dropZone.parentElement.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", function () {
    dropZone.parentElement.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    dropZone.parentElement.classList.remove("dragover");

    const items = event.dataTransfer.items;
    const files = [];

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
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

    handleIncomingFiles(files, isRightZone);
  });
}

setupDropZone(dropZoneLeft, fileInputLeft, false);
setupDropZone(dropZoneRight, fileInputRight, true);

analyzeBtn.addEventListener("click", async function () {
  if (isRunning) return;

  if (currentMode === "student") {
    sessionStorage.setItem("modeused", "students");
    if (fileList.length < 2) return;
    isRunning = true;
    analyzeBtn.disabled = true;
    setProgressStep(2);
    showView(viewAnimation);
    document.getElementById("animTitle").textContent = "Comparing " + fileList.length + " assignments...";
    createAnimationDocs(fileList);

    aStage.classList.add("p-comparing", "p-scanning");
    aEngine.classList.add("active");

    const filesToProcess = [fileList[0], fileList[1]];
    localChunks = [];
    let filedetails = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      let content = "";
      try { content = await extractText(file); } catch (e) { try { content = await file.text(); } catch (error) { content = "Content of " + file.name; } }
      rawTextMap[file.name] = content;
      const chunks = createChunksLinear(content, 100);
      for (let j = 0; j < chunks.length; j++) {
        chunks[j].grams = buildthegrams(chunks[j], 4);
      }
      localChunks[i] = chunks;

      const xyz = { filename: file.name, filesize: file.size, chunks: chunks };
      filedetails.push(xyz);


      // let ans = localStorage.getItem("loggedIn");
      // if (ans) {
      // // let getemail = localStorage.getItem("userEmail");
      //   const token=localStorage.getItem("token")

      // if(token){



      // }

    }



    const token = localStorage.getItem("token");
    console.log(filedetails)

    try {
      const resp = await fetch(
        "http://localhost:8005/filedata",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            filedetails: filedetails
          })
        });
      if (!resp.ok) {
        console.error("Failed to save file data:", await resp.text());
      } else {
        console.log("File data saved to database successfully");
      }
    } catch (err) {
      console.error("Failed to save file data:", err);
    }

    const stageElements = aEngine.querySelectorAll(".ae-stage");
    const lines = aStage.querySelectorAll('.connection-line');
    const docs = aStage.querySelectorAll('.a-doc');
    const stageNames = ["Reading assignments...", "Extracting text...", "Creating linear chunks (100 words)...", "Generating 4-grams...", "Comparing sections (Jaccard similarity)...", "Detecting matching content...", "Generating final report..."];
    const progressValues = [10, 25, 42, 58, 74, 90, 100];
    const stageDelays = [800, 900, 800, 900, 1000, 900, 600];

    for (let i = 0; i < stageElements.length; i++) {
      updateProgress(progressValues[i], stageNames[i]);
      stageElements[i].classList.add("active");
      if (i >= 3) {
        lines.forEach((line, idx) => {
          if (idx <= i - 3) {
            line.style.opacity = '0.6';
            line.style.animation = 'dashflow 1.4s linear infinite';
          }
        });
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
      await wait(stageDelays[i] || 700);
      stageElements[i].classList.remove("active");
      stageElements[i].classList.add("done");
    }

    const realScore = await applyalgo(filesToProcess, localChunks);
    aStage.classList.remove("p-scanning");
    aEngine.classList.remove("active");
    aEngine.classList.add("done");
    animStatusText.textContent = "Complete";
    animStatus.classList.add("done");
    await wait(700);
    console.log("going to display result")
    displayResults(filesToProcess, realScore);
    setProgressStep(3);
    showView(viewResults);

  } else {
    sessionStorage.setItem("modeused", "teachers");

    if (!refTeacherFile || refStudentFiles.length === 0) return;
    isRunning = true;
    analyzeBtn.disabled = true;
    setProgressStep(2);
    showView(viewAnimation);
    document.getElementById("animTitle").textContent = "Comparing " + refStudentFiles.length + " student(s) with teacher reference...";

    const allRefFiles = [refTeacherFile, ...refStudentFiles];
    createAnimationDocs(allRefFiles);

    aStage.classList.add("p-comparing", "p-scanning");
    aEngine.classList.add("active");

    const stageNames = ["Reading teacher reference...", "Reading student assignments...", "Creating linear chunks (100 words)...", "Generating 4-grams...", "Comparing sections (Jaccard similarity)...", "Detecting matching content...", "Generating final report..."];
    const progressValues = [10, 25, 42, 58, 74, 90, 100];
    const stageDelays = [800, 900, 800, 900, 1000, 900, 600];

    let teacherChunks = [];
    let studentChunksList = [];
    let results = [];

    updateProgress(progressValues[0], stageNames[0]);
    let tContent = "";
    try { tContent = await extractText(refTeacherFile); } catch (err) { try { tContent = await refTeacherFile.text(); } catch (e) { tContent = "Content of " + refTeacherFile.name; } }
    rawTextMap[refTeacherFile.name] = tContent;
    teacherChunks = createChunksLinear(tContent, 100);
    for (let j = 0; j < teacherChunks.length; j++) {
      teacherChunks[j].grams = buildthegrams(teacherChunks[j], 4);
    }
    await wait(stageDelays[0]);

    updateProgress(progressValues[1], stageNames[1]);
    for (let i = 0; i < refStudentFiles.length; i++) {
      const file = refStudentFiles[i];
      let sContent = "";
      try { sContent = await extractText(file); } catch (err) { try { sContent = await file.text(); } catch (e) { sContent = "Content of " + file.name; } }
      rawTextMap[file.name] = sContent;
      const chunks = createChunksLinear(sContent, 100);
      for (let j = 0; j < chunks.length; j++) {
        chunks[j].grams = buildthegrams(chunks[j], 4);
      }
      studentChunksList.push(chunks);
    }
    await wait(stageDelays[1]);

    // Save teacher and student file details to filedata
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const teacherFileDetails = [
          { filename: refTeacherFile.name, filesize: refTeacherFile.size, chunks: teacherChunks }
        ];
        for (let i = 0; i < refStudentFiles.length; i++) {
          teacherFileDetails.push({
            filename: refStudentFiles[i].name,
            filesize: refStudentFiles[i].size,
            chunks: studentChunksList[i]
          });
        }
        const resp = await fetch("http://localhost:8005/filedata", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ filedetails: teacherFileDetails })
        });
        if (!resp.ok) {
          console.error("Failed to save teacher mode filedata:", await resp.text());
        } else {
          console.log("Teacher mode filedata saved to database successfully");
        }
      }
    } catch (err) {
      console.error("Error saving teacher mode filedata:", err);
    }

    const stageElements = aEngine.querySelectorAll(".ae-stage");
    const lines = aStage.querySelectorAll('.connection-line');
    const docs = aStage.querySelectorAll('.a-doc');

    for (let i = 2; i < stageElements.length; i++) {
      updateProgress(progressValues[i], stageNames[i]);
      stageElements[i].classList.add("active");
      if (i >= 3) {
        lines.forEach((line, idx) => {
          if (idx <= i - 3) {
            line.style.opacity = '0.6';
            line.style.animation = 'dashflow 1.4s linear infinite';
          }
        });
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
      await wait(stageDelays[i] || 700);
      stageElements[i].classList.remove("active");
      stageElements[i].classList.add("done");
    }

    for (let i = 0; i < refStudentFiles.length; i++) {
      updateProgress(74 + Math.round((i / refStudentFiles.length) * 20), "Comparing teacher with " + refStudentFiles[i].name + "...");
      const filesToCompare = [refTeacherFile, refStudentFiles[i]];
      const chunksToCompare = [teacherChunks, studentChunksList[i]];

      const score = await applyalgo(filesToCompare, chunksToCompare);
      const commonGrams = getthecommongrams();

      const teacherText = rawTextMap[refTeacherFile.name] || "";
      const studentText = rawTextMap[refStudentFiles[i].name] || "";

      const { matchesA, matchesB } = reconstructMatchesFromGrams(teacherText, studentText, commonGrams, 4);

      results.push({
        filenames: [refTeacherFile.name, refStudentFiles[i].name],
        teacherName: refTeacherFile.name,
        studentName: refStudentFiles[i].name,
        textA: teacherText,
        textB: studentText,
        filefirstmatches: matchesA,
        filesecondmatches: matchesB,
        commonGramsSet: commonGrams,
        similarwords: commonGrams.size,
        roundedscore: Math.round(Math.max(0, Math.min(100, score))),
        studentIndex: i + 1,
      });
      await wait(300);
    }

    updateProgress(100, "Generating final report...");
    await wait(700);

    aStage.classList.remove("p-scanning");
    aEngine.classList.remove("active");
    aEngine.classList.add("done");
    animStatusText.textContent = "Complete";
    animStatus.classList.add("done");
    await wait(700);

    displayTeacherStudentResults(results);
    setProgressStep(3);
    showView(viewResults);
  }

  isRunning = false;
  checkButtonState();
});


console.log("soham what are you doing");

async function displayResults(files, score) {
  sessionStorage.setItem("showsthedisplayornot", true);
  const fileA = files[0];
  const fileB = files[1];
  // const getemail = localStorage.getItem("userEmail");

  const teacherView = document.getElementById("teacherResultsView");
  if (teacherView) teacherView.style.display = "none";

  const studentView = document.querySelector(".results-wrap");
  if (studentView) studentView.style.display = "flex";

  const textA = rawTextMap[fileA.name] || "No content extracted.";
  const textB = rawTextMap[fileB.name] || "No content extracted.";

  const roundedScore = Math.min(100, Math.max(0, Math.round(score)));
  const scoreElement = document.getElementById("resSimilarity");
  countUp(scoreElement, roundedScore);

  let commonGramsSet = getthecommongrams();
  const { matchesA, matchesB } = reconstructMatchesFromGrams(textA, textB, commonGramsSet);

  const firstChunkCount = localChunks[0] ? localChunks[0].length : 0;
  const secondChunkCount = localChunks[1] ? localChunks[1].length : 0;

  const result = {
    filenames: [fileA.name, fileB.name],
    filefirstmatches: matchesA,
    filesecondmatches: matchesB,
    similarwords: commonGramsSet.size,
    roundedscore: roundedScore,
    textA: textA,
    textB: textB,
    chunkCountA: firstChunkCount,
    chunkCountB: secondChunkCount
  };

  // if (getemail) {
  try {
    // const data = await fetch(`https://checkassign-assignment-plagiarism.onrender.com/fileresult?email=${encodeURIComponent(getemail)}`);
    // const resp = await data.json();

    const token = localStorage.getItem("token");
    if (token) {
      // const rep = resp[0];

      const addtoarr = [
        { mode: "students" },
        result
      ];

      // if (!rep.filesprocesed) rep.filesprocesed = [];

      await fetch("http://localhost:8005/fileresult", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fileresult: addtoarr
        })
      });
      console.log("Result saved to database successfully");
    }
  } catch (err) {
    console.error("Failed to save result to database:", err);
  }
  renderUI(result);
  try {
    sessionStorage.setItem("lastSessionMode", "students");
    sessionStorage.setItem("lastSessionResult", JSON.stringify(result));
  } catch (e) {
    console.error("SessionStorage save failed", e);
  }
}


// }


async function displayTeacherStudentResults(results) {
  if (!results || results.length === 0) {
    console.error("No results to display");
    return;
  }

  try {
    const arrtoallstudetscomparetoteacher = [
      { mode: "teachers" },
      ...results
    ];

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No login token found");
    } else {
      const response = await fetch(
        "http://localhost:8005/fileresult",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fileresult: arrtoallstudetscomparetoteacher
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save result");
      }

      console.log("Teacher results saved successfully", data);
    }

  } catch (err) {
    console.error("Failed to save result:", err);
  }

  renderUIforteachers(results);

  try {
    sessionStorage.setItem("lastSessionMode", "teachers");
    sessionStorage.setItem("lastSessionResult", JSON.stringify(results));
  } catch (e) {
    console.error("SessionStorage save failed", e);
  }
}


function renderUIforteachers(results) {
  if (!results || results.length === 0) return;

  // Ensure results-wrap is visible (all modern elements live here)
  const resultsWrap = document.querySelector(".results-wrap");
  if (resultsWrap) {
    resultsWrap.style.display = "flex";
  }

  // Hide dynamic old grid view if present
  const oldTeacherView = document.getElementById("teacherResultsView");
  if (oldTeacherView) {
    oldTeacherView.style.display = "none";
  }

  // 1. Show & Populate Batch Overview (Classroom Leaderboard)
  const batchOverview = document.getElementById("batchOverview");
  if (batchOverview) {
    batchOverview.style.display = "flex";
  }

  // 2. Populate Batch KPIs
  const kpiAvgSim = document.getElementById("kpiAvgSim");
  const kpiHighestSim = document.getElementById("kpiHighestSim");
  const kpiFlagged = document.getElementById("kpiFlagged");
  const kpiClean = document.getElementById("kpiClean");

  let totalSim = 0;
  let maxSim = 0;
  let flaggedCount = 0;
  let cleanCount = 0;

  results.forEach(r => {
    const s = r.roundedscore || 0;
    totalSim += s;
    if (s > maxSim) maxSim = s;
    if (s >= 30) flaggedCount++;
    if (s < 20) cleanCount++;
  });

  const avgSim = Math.round(totalSim / (results.length || 1));
  if (kpiAvgSim) kpiAvgSim.textContent = avgSim + "%";
  if (kpiHighestSim) kpiHighestSim.textContent = maxSim + "%";
  if (kpiFlagged) kpiFlagged.textContent = flaggedCount;
  if (kpiClean) kpiClean.textContent = cleanCount;

  // 3. Populate Top Metrics
  const resSim = document.getElementById("resSimilarity");
  if (resSim) countUp(resSim, avgSim);

  const mFiles = document.getElementById("mFiles");
  if (mFiles) mFiles.textContent = results.length + 1; // 1 teacher + students

  let totalMatchingSections = 0;
  results.forEach(r => {
    totalMatchingSections += (r.filesecondmatches ? r.filesecondmatches.length : 0);
  });
  const mMatching = document.getElementById("mMatching");
  if (mMatching) mMatching.textContent = totalMatchingSections;

  // 4. Populate Batch Table
  const batchTableBody = document.getElementById("batchTableBody");
  if (batchTableBody) {
    batchTableBody.innerHTML = "";
    results.forEach((res, idx) => {
      const score = res.roundedscore || 0;
      const riskClass = score >= 50 ? "high" : score >= 20 ? "mid" : "low";
      const riskLabel = score >= 50 ? "High Risk (>50%)" : score >= 20 ? "Moderate" : "Clean (<20%)";
      const wordCount = (res.textB || "").trim().split(/\s+/).filter(Boolean).length;
      const matchCount = res.filesecondmatches ? res.filesecondmatches.length : 0;

      const tr = document.createElement("tr");
      if (idx === 0) tr.className = "active-row";
      tr.innerHTML = `
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${escapeHTML(res.studentName || 'Student ' + (idx + 1))}</strong></td>
        <td>${wordCount} words</td>
        <td><span class="kpi-val" style="font-size:16px">${score}%</mark></td>
        <td><span class="risk-badge ${riskClass}">${riskLabel}</mark></td>
        <td>${matchCount} phrases</td>
        <td><button type="button" class="btn-inspect" data-idx="${idx}">Inspect</button></td>
      `;

      tr.querySelector(".btn-inspect").addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".batch-table tbody tr").forEach(row => row.classList.remove("active-row"));
        tr.classList.add("active-row");
        inspectStudentInPanels(res, idx + 1);
        const tabs = document.querySelectorAll(".student-tab");
        if (tabs[idx]) {
          tabs.forEach(t => t.classList.remove("active"));
          tabs[idx].classList.add("active");
        }
        document.getElementById("comparePanels")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      tr.addEventListener("click", () => {
        document.querySelectorAll(".batch-table tbody tr").forEach(row => row.classList.remove("active-row"));
        tr.classList.add("active-row");
        inspectStudentInPanels(res, idx + 1);
        const tabs = document.querySelectorAll(".student-tab");
        if (tabs[idx]) {
          tabs.forEach(t => t.classList.remove("active"));
          tabs[idx].classList.add("active");
        }
        document.getElementById("comparePanels")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      batchTableBody.appendChild(tr);
    });
  }

  // 5. Populate Student Tabs if multiple students
  const studentTabsWrap = document.getElementById("studentTabsWrap");
  const studentTabs = document.getElementById("studentTabs");
  if (studentTabsWrap && studentTabs) {
    if (results.length > 1) {
      studentTabsWrap.style.display = "flex";
      studentTabs.innerHTML = "";
      results.forEach((r, idx) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "student-tab" + (idx === 0 ? " active" : "");
        const score = r.roundedscore || 0;
        const riskClass = score >= 50 ? "high" : score >= 20 ? "mid" : "low";
        tab.innerHTML = `<span>${escapeHTML(r.studentName || 'Student ' + (idx + 1))}</mark><span class="tab-badge ${riskClass}">${score}%</mark>`;
        tab.onclick = () => {
          document.querySelectorAll(".student-tab").forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          document.querySelectorAll(".batch-table tbody tr").forEach((row, rIdx) => {
            row.classList.toggle("active-row", rIdx === idx);
          });
          inspectStudentInPanels(r, idx + 1);
          document.getElementById("comparePanels")?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        studentTabs.appendChild(tab);
      });
    } else {
      studentTabsWrap.style.display = "none";
    }
  }

  // 6. CSV Export Button
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  if (exportCsvBtn) {
    exportCsvBtn.onclick = () => {
      let csv = "Rank,Student Submission,Word Count,Similarity %,Risk Level,Matched Phrases\n";
      results.forEach((r, idx) => {
        const score = r.roundedscore || 0;
        const risk = score >= 50 ? "High Risk" : score >= 20 ? "Moderate" : "Clean";
        const wordCount = (r.textB || "").trim().split(/\s+/).filter(Boolean).length;
        const matchCount = r.filesecondmatches ? r.filesecondmatches.length : 0;
        csv += `${idx + 1},"${(r.studentName || '').replace(/"/g, '""')}",${wordCount},${score}%,${risk},${matchCount}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "classroom_plagiarism_report.csv";
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  // 7. Print Report Button
  const printReportBtn = document.getElementById("printReportBtn");
  if (printReportBtn) {
    printReportBtn.onclick = () => window.print();
  }

  // 8. Default Inspection: inspect the first student
  inspectStudentInPanels(results[0], 1);
}

function displayStudentDocument(result, colorIndex) {
  const docTitle = document.getElementById("docTitle");
  if (docTitle) {
    docTitle.textContent = result.studentName ? result.studentName.replace(/\.[^/.]+$/, "") : "Student Document";
  }

  const docContent = document.getElementById("docContent");
  if (docContent && result.textB) {
    docContent.innerHTML = highlightStudentText(result.textB, result.filesecondmatches, colorIndex);
  }
}


function highlightMatchingText(text, matchingGramsSet) {
  if (!text || text.trim() === "") {
    return "<p>No content extracted.</p>";
  }

  if (!matchingGramsSet || (matchingGramsSet.size === 0 && (!Array.isArray(matchingGramsSet) || matchingGramsSet.length === 0))) {
    return "<p>" + escapeHTML(text).replace(/\n+/g, "</p><p>") + "</p>";
  }

  const set = (matchingGramsSet instanceof Set) ? matchingGramsSet : new Set(matchingGramsSet);

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
      if (set.has(gram)) {
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

function highlightStudentText(studentText, matches, colorIndex) {
  if (!studentText) return "<p>No content</p>";
  if (!matches || matches.length === 0) {
    return "<p>" + escapeHTML(studentText).replace(/\n/g, "<br>") + "</p>";
  }

  const words = studentText.split(/\s+/);
  const positions = [];
  let pos = 0;

  for (let i = 0; i < words.length; i++) {
    positions.push(pos);
    pos += words[i].length + 1;
  }

  const intervals = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    if (match.startIndex >= 0 && match.endIndex <= words.length) {
      intervals.push({
        start: positions[match.startIndex],
        end: positions[match.endIndex - 1] + words[match.endIndex - 1].length,
        text: studentText.substring(positions[match.startIndex], positions[match.endIndex - 1] + words[match.endIndex - 1].length)
      });
    }
  }

  intervals.sort((a, b) => a.start - b.start);

  let html = "";
  let cursor = 0;

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    if (interval.start < cursor) continue;

    if (interval.start > cursor) {
      html += escapeHTML(studentText.substring(cursor, interval.start));
    }

    html += `<mark class="hl match">${escapeHTML(interval.text)}</mark>`;
    cursor = interval.end;
  }

  if (cursor < studentText.length) {
    html += escapeHTML(studentText.substring(cursor));
  }

  return "<p>" + html.replace(/\n+/g, "</p><p>") + "</p>";
}

function updateTeacherStats(results) {
  let totalScore = 0;
  let totalMatches = 0;
  let maxScore = 0;

  results.forEach(result => {
    totalScore += result.roundedscore || 0;
    totalMatches += result.filesecondmatches ? result.filesecondmatches.length : 0;
    if (result.roundedscore > maxScore) {
      maxScore = result.roundedscore;
    }
  });

  const avgScore = Math.round(totalScore / results.length);

  const scoreEl = document.getElementById("overallScore");
  const scoreFill = document.getElementById("scoreFill");
  const matchesEl = document.getElementById("matchingSections");
  const refMatchEl = document.getElementById("referenceMatch");
  const sourcesEl = document.getElementById("sourcesCompared");

  if (scoreEl) scoreEl.textContent = avgScore + "%";
  if (scoreFill) scoreFill.style.width = avgScore + "%";
  if (matchesEl) matchesEl.textContent = totalMatches;
  if (refMatchEl) refMatchEl.textContent = maxScore + "%";
  if (sourcesEl) sourcesEl.textContent = results.length;
}

function highlightMatches(text, matches) {
  if (!text || !matches || matches.length === 0) {
    return "<p>" + escapeHTML(text).replace(/\n/g, "<br>") + "</p>";
  }
  const words = text.split(/\s+/);
  const positions = [];
  let position = 0;
  for (let i = 0; i < words.length; i++) {
    positions.push(position);
    position += words[i].length + 1;
  }
  const intervals = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    if (match.startIndex >= 0 && match.endIndex <= words.length) {
      intervals.push({
        start: positions[match.startIndex],
        end: positions[match.endIndex - 1] + words[match.endIndex - 1].length,
      });
    }
  }
  intervals.sort(function (a, b) { return a.start - b.start; });

  let html = "";
  let cursor = 0;
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    if (interval.start < cursor) continue;
    html += escapeHTML(text.slice(cursor, interval.start));
    html += '<mark class="hl match">' + escapeHTML(text.slice(interval.start, interval.end)) + "</mark>";
    cursor = interval.end;
  }
  html += escapeHTML(text.slice(cursor));
  return "<p>" + html.replace(/\n+/g, "</p><p>") + "</p>";
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function reconstructMatchesFromGrams(textA, textB, commonGramsSet, gramSize = 4) {
  if (!textA || !textB) return { matchesA: [], matchesB: [] };

  const wordsA = textA.trim().split(/\s+/);
  const wordsB = textB.trim().split(/\s+/);

  const cleanA = wordsA.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const cleanB = wordsB.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ""));

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

  const mapB = new Map();
  for (let j = 0; j <= cleanB.length - gramSize; j++) {
    const gramB = cleanB.slice(j, j + gramSize).join(" ");
    if (!gramB || gramB.includes("  ")) continue;
    if (!mapB.has(gramB)) mapB.set(gramB, []);
    mapB.get(gramB).push(j);
  }

  const visitedA = new Array(wordsA.length).fill(false);
  const visitedB = new Array(wordsB.length).fill(false);
  const matchesA = [];
  const matchesB = [];

  for (let i = 0; i <= cleanA.length - gramSize; i++) {
    if (visitedA[i]) continue;

    const currentGram = cleanA.slice(i, i + gramSize).join(" ");

    if (normalizedGrams.has(currentGram) && mapB.has(currentGram)) {
      const matchIndicesB = mapB.get(currentGram);
      let bestK = 0;
      let bestBIndex = -1;

      for (const j of matchIndicesB) {
        let k = 0;
        while (i + k < cleanA.length && j + k < cleanB.length && cleanA[i + k] !== "" && cleanA[i + k] === cleanB[j + k]) {
          k++;
        }
        if (k > bestK) {
          bestK = k;
          bestBIndex = j;
        }
      }

      if (bestK >= gramSize) {
        let isBVisited = false;
        for (let v = bestBIndex; v < bestBIndex + bestK; v++) {
          if (visitedB[v]) {
            isBVisited = true;
            break;
          }
        }

        if (!isBVisited) {
          for (let v = i; v < i + bestK; v++) visitedA[v] = true;
          for (let v = bestBIndex; v < bestBIndex + bestK; v++) visitedB[v] = true;

          matchesA.push({ phrase: wordsA.slice(i, i + bestK).join(" "), startIndex: i, endIndex: i + bestK, length: bestK });
          matchesB.push({ phrase: wordsB.slice(bestBIndex, bestBIndex + bestK).join(" "), startIndex: bestBIndex, endIndex: bestBIndex + bestK, length: bestK });
        }
        i += bestK - 1;
      }
    }
  }

  return { matchesA, matchesB };
}


let currentActiveMatchIdx = -1;
function inspectStudentInPanels(result, colorIndex) {
  const comparePanels = document.getElementById("comparePanels");
  const resPair = document.getElementById("resPair");
  const pairLeft = document.getElementById("pairLeft");
  const pairRight = document.getElementById("pairRight");
  const panelAName = document.getElementById("panelAName");
  const panelBName = document.getElementById("panelBName");
  const panelABody = document.getElementById("panelABody");
  const panelBBody = document.getElementById("panelBBody");
  const panelAFmt = document.getElementById("panelAFmt");
  const panelBFmt = document.getElementById("panelBFmt");

  if (comparePanels) comparePanels.style.display = "grid";
  if (resPair) resPair.style.display = "flex";

  const tName = result.teacherName || (result.filenames && result.filenames[0]) || "Teacher Reference";
  const sName = result.studentName || (result.filenames && result.filenames[1]) || "Student Assignment";
  if (pairLeft) pairLeft.textContent = tName;
  if (pairRight) pairRight.textContent = sName;
  if (panelAName) panelAName.textContent = tName;
  if (panelBName) panelBName.textContent = sName;

  if (panelAFmt) panelAFmt.textContent = (tName.split(".").pop() || "TXT").toUpperCase();
  if (panelBFmt) panelBFmt.textContent = (sName.split(".").pop() || "TXT").toUpperCase();

  // Highlighting: use sliding 4-gram matching if available, fallback to intervals
  if (panelABody) {
    if (result.commonGramsSet && (result.commonGramsSet.size > 0 || (Array.isArray(result.commonGramsSet) && result.commonGramsSet.length > 0))) {
      panelABody.innerHTML = highlightMatchingText(result.textA, result.commonGramsSet);
    } else {
      panelABody.innerHTML = highlightMatches(result.textA, result.filefirstmatches || []);
    }
  }
  if (panelBBody) {
    if (result.commonGramsSet && (result.commonGramsSet.size > 0 || (Array.isArray(result.commonGramsSet) && result.commonGramsSet.length > 0))) {
      panelBBody.innerHTML = highlightMatchingText(result.textB, result.commonGramsSet);
    } else {
      panelBBody.innerHTML = highlightMatches(result.textB, result.filesecondmatches || []);
    }
  }

  setupPanelMatchNavigation();
}

function setupPanelMatchNavigation() {
  const prevBtn = document.getElementById("prevMatchBtn");
  const nextBtn = document.getElementById("nextMatchBtn");
  const counter = document.getElementById("matchCounter");
  const matchNavInfo = document.getElementById("matchNavInfo");
  const matchNavBar = document.getElementById("matchNavBar");
  const syncToggle = document.getElementById("syncScrollToggle");
  const panelABody = document.getElementById("panelABody");
  const panelBBody = document.getElementById("panelBBody");

  const marksB = panelBBody ? panelBBody.querySelectorAll(".hl.match") : [];
  const marksA = panelABody ? panelABody.querySelectorAll(".hl.match") : [];
  const totalMatches = marksB.length > 0 ? marksB.length : marksA.length;

  if (matchNavBar) matchNavBar.style.display = totalMatches > 0 ? "flex" : "none";
  if (matchNavInfo) {
    matchNavInfo.textContent = totalMatches > 0
      ? `${totalMatches} matching phrase section${totalMatches === 1 ? '' : 's'} detected`
      : "No matching phrases detected";
  }
  if (counter) counter.textContent = totalMatches > 0 ? `1 / ${totalMatches}` : "0 / 0";

  currentActiveMatchIdx = 0;

  function scrollToCurrentMatch() {
    if (totalMatches <= 0) return;

    // Clear previous focus
    if (panelABody) panelABody.querySelectorAll(".hl.match.focused").forEach(m => m.classList.remove("focused"));
    if (panelBBody) panelBBody.querySelectorAll(".hl.match.focused").forEach(m => m.classList.remove("focused"));

    if (marksB[currentActiveMatchIdx]) {
      marksB[currentActiveMatchIdx].classList.add("focused");
      marksB[currentActiveMatchIdx].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (marksA[currentActiveMatchIdx]) {
      marksA[currentActiveMatchIdx].classList.add("focused");
      marksA[currentActiveMatchIdx].scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (counter) counter.textContent = `${currentActiveMatchIdx + 1} / ${totalMatches}`;
    if (prevBtn) prevBtn.disabled = totalMatches <= 1;
    if (nextBtn) nextBtn.disabled = totalMatches <= 1;
  }

  if (prevBtn) {
    prevBtn.disabled = totalMatches <= 1;
    prevBtn.onclick = () => {
      if (totalMatches <= 0) return;
      currentActiveMatchIdx = (currentActiveMatchIdx - 1 + totalMatches) % totalMatches;
      scrollToCurrentMatch();
    };
  }

  if (nextBtn) {
    nextBtn.disabled = totalMatches <= 1;
    nextBtn.onclick = () => {
      if (totalMatches <= 0) return;
      currentActiveMatchIdx = (currentActiveMatchIdx + 1) % totalMatches;
      scrollToCurrentMatch();
    };
  }

  if (syncToggle && panelABody && panelBBody) {
    let isSyncing = false;
    panelABody.onscroll = () => {
      if (!syncToggle.checked || isSyncing) return;
      isSyncing = true;
      const pct = panelABody.scrollTop / (panelABody.scrollHeight - panelABody.clientHeight || 1);
      panelBBody.scrollTop = pct * (panelBBody.scrollHeight - panelBBody.clientHeight);
      setTimeout(() => { isSyncing = false; }, 40);
    };
    panelBBody.onscroll = () => {
      if (!syncToggle.checked || isSyncing) return;
      isSyncing = true;
      const pct = panelBBody.scrollTop / (panelBBody.scrollHeight - panelBBody.clientHeight || 1);
      panelABody.scrollTop = pct * (panelABody.scrollHeight - panelABody.clientHeight);
      setTimeout(() => { isSyncing = false; }, 40);
    };
  }

  // Scroll to first match initially
  if (totalMatches > 0) {
    scrollToCurrentMatch();
  }
}
async function loadLastSessionstudents() {

  const token = localStorage.getItem("token");


  try {
    // const response = await fetch(`https://checkassign-assignment-plagiarism.onrender.com/fileresult?email=${encodeURIComponent(getemail)}`);
    const response = await fetch(
      "http://localhost:8005/fileresult", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }
    )
    const resp = await response.json();

    if (resp && resp.length > 0 && resp[0].filesprocesed && resp[0].filesprocesed.length > 0) {
      const person = resp[0];
      const lastResult = person.filesprocesed[person.filesprocesed.length - 1];

      const teacherView = document.getElementById("teacherResultsView");
      if (teacherView) teacherView.style.display = "none";
      const studentView = document.querySelector(".results-wrap");
      if (studentView) studentView.style.display = "flex";

      setProgressStep(3);
      showView(viewResults);
      if (lastResult[0].mode == "students") {
        renderUI(lastResult[1]);
      }
      console.log("Loaded last session from database successfully");
    }
  } catch (err) {
    console.error("Failed to load last session:", err);
  }
}

export function renderUI(result) {
  const roundedScore = result.roundedscore;

  const scoreElement = document.getElementById("resSimilarity");
  if (scoreElement) countUp(scoreElement, roundedScore);

  const fileAName = result.filenames[0];
  const fileBName = result.filenames[1];

  if (document.getElementById("pairLeft")) document.getElementById("pairLeft").textContent = fileAName;
  if (document.getElementById("pairRight")) document.getElementById("pairRight").textContent = fileBName;
  if (document.getElementById("panelAName")) document.getElementById("panelAName").textContent = fileAName;
  if (document.getElementById("panelBName")) document.getElementById("panelBName").textContent = fileBName;

  const typeA = getFileType(fileAName);
  const typeB = getFileType(fileBName);
  if (document.getElementById("panelAFmt")) document.getElementById("panelAFmt").textContent = typeA.label;
  if (document.getElementById("panelBFmt")) document.getElementById("panelBFmt").textContent = typeB.label;

  const textA = result.textA || "No content extracted.";
  const textB = result.textB || "No content extracted.";

  if (document.getElementById("panelABody")) {
    document.getElementById("panelABody").innerHTML = highlightMatchesInText(textA, result.filefirstmatches);
  }
  if (document.getElementById("panelBBody")) {
    document.getElementById("panelBBody").innerHTML = highlightMatchesInText(textB, result.filesecondmatches);
  }

  if (document.getElementById("mFiles")) document.getElementById("mFiles").textContent = result.filenames.length;
  if (document.getElementById("mMatching")) document.getElementById("mMatching").textContent = result.similarwords;

  let different = 0;
  if (roundedScore < 100) {
    different = 10 - Math.ceil(roundedScore / 10);
    if (different < 1) different = 1;
  }
  if (document.getElementById("mDifferent")) document.getElementById("mDifferent").textContent = different;
  if (document.getElementById("mPhrases")) document.getElementById("mPhrases").textContent = Math.round(roundedScore * 0.5);

  if (document.getElementById("diffList")) {
    document.getElementById("diffList").innerHTML =
      "<li>File 1 has <b>" + (result.chunkCountA || 0) + " chunks</b> (100 words per chunk).</li>" +
      "<li>File 2 has <b>" + (result.chunkCountB || 0) + " chunks</b> (100 words per chunk).</li>" +
      "<li>Calculated Jaccard similarity across all 4-gram sets: <b>" + roundedScore + "%</b>.</li>";
  }

  if (document.getElementById("matchList")) {
    document.getElementById("matchList").innerHTML =
      "<li>Processed using sliding 4-gram overlapping windows.</li>" +
      "<li>" + (roundedScore > 20 ? "Significant matching phrases detected." : "Low phrase similarity across sections.") + "</li>";
  }
}

async function loadLastSessionsteachers() {
  const getemail = localStorage.getItem("userEmail");
  if (!getemail) return;

  try {
    const response = await fetch(`https://checkassign-assignment-plagiarism.onrender.com/fileresult?email=${encodeURIComponent(getemail)}`);
    const resp = await response.json();

    if (resp && resp.length > 0 && resp[0].filesprocesed && resp[0].filesprocesed.length > 0) {
      const person = resp[0];
      const lastResult = person.filesprocesed[person.filesprocesed.length - 1];

      const teacherView = document.getElementById("teacherResultsView");
      if (teacherView) teacherView.style.display = "none";
      const studentView = document.querySelector(".results-wrap");
      if (studentView) studentView.style.display = "flex";

      setProgressStep(3);
      showView(viewResults);
      if (lastResult[0].mode == "teachers") {
        let arrtocheck = [];
        for (let x = 1; x < lastResult.length; x++) {
          arrtocheck.push(lastResult[x]);
        }
        renderUIforteachers(arrtocheck);
      }
      console.log("Loaded last session from database successfully");
    }
  } catch (err) {
    console.error("Failed to load last session:", err);
  }
}

const savedMode = sessionStorage.getItem("lastSessionMode");
const savedResult = sessionStorage.getItem("lastSessionResult");

if (savedMode && savedResult) {
  try {
    const parsedResult = JSON.parse(savedResult);
    if (savedMode === "students") {
      const teacherView = document.getElementById("teacherResultsView");
      if (teacherView) teacherView.style.display = "none";
      const studentView = document.querySelector(".results-wrap");
      if (studentView) studentView.style.display = "flex";

      setProgressStep(3);
      showView(viewResults);
      renderUI(parsedResult);
    } else if (savedMode === "teachers") {
      const studentView = document.querySelector(".results-wrap");
      if (studentView) studentView.style.display = "none";

      setProgressStep(3);
      showView(viewResults);
      renderUIforteachers(parsedResult);
    }
  } catch (err) {
    console.error("Failed to load session from sessionStorage:", err);
    initializeDefaultView();
  }
} else {
  initializeDefaultView();
}

function initializeDefaultView() {
  isRunning = false;
  fileList = [];
  refStudentFiles = [];
  refTeacherFile = null;
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

  const docs = aStage.querySelectorAll('.a-doc');
  docs.forEach(doc => doc.remove());

  const lines = aStage.querySelectorAll('.connection-line');
  lines.forEach(line => line.remove());

  const teacherView = document.getElementById("teacherResultsView");
  if (teacherView) teacherView.style.display = "none";
  const studentView = document.querySelector(".results-wrap");
  if (studentView) studentView.style.display = "flex";

  renderFileList();
  checkButtonState();
  setProgressStep(1);
  showView(viewUpload);
}


// Use event delegation to catch clicks on dynamically created buttons
document.addEventListener("click", function (event) {
  // Check if the clicked element (or the SVG/span inside it) is the new analysis button
  const btn = event.target.closest("#newAnalysisBtn");

  if (btn) {
    event.preventDefault(); // Prevent any default link behavior

    // 1. Clear session storage to prevent loading old results
    sessionStorage.removeItem("lastSessionMode");
    sessionStorage.removeItem("lastSessionResult");
    sessionStorage.removeItem("modeused");
    sessionStorage.removeItem("showsthedisplayornot");

    // 2. Reset state variables
    isRunning = false;
    fileList = [];
    refStudentFiles = [];
    refTeacherFile = null;
    localChunks = [];
    rawTextMap = {};

    // 3. Reset UI elements
    const stages = aEngine.querySelectorAll(".ae-stage");
    for (let i = 0; i < stages.length; i++) {
      stages[i].className = "ae-stage";
    }

    aEngine.className = "a-engine";
    aStage.className = "anim-stage";
    animStatus.className = "anim-status";
    animStatusText.textContent = "Running";

    const docs = aStage.querySelectorAll('.a-doc');
    docs.forEach(doc => doc.remove());

    const lines = aStage.querySelectorAll('.connection-line');
    lines.forEach(line => line.remove());

    const teacherView = document.getElementById("teacherResultsView");
    if (teacherView) teacherView.style.display = "none";

    const studentView = document.querySelector(".results-wrap");
    if (studentView) studentView.style.display = "flex";

    renderFileList();
    checkButtonState();
    setProgressStep(1);
    showView(viewUpload);

    // 4. Optional: Navigate to a fresh page. 
    // If you prefer to just reset the UI on the current page, comment out the line below.
    window.location.href = "../templates/checkAssign.html";
  }
});

setProgressStep(1);
checkButtonState();




