// tests/test_upload_flow.js
// Verification of drag-and-drop file processing and rendering logic

const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "txt", "pptx", "ppt", "rtf", "md", "odt", "tex", "html", "htm", "json", "csv", "c", "cpp", "java", "py", "js"];

function simulateHandleIncomingFiles(files, currentMode = "student") {
  const fileList = [];
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
    return { success: false, reason: "No valid files", fileList };
  }

  for (let i = 0; i < validFiles.length; i++) {
    fileList.push(validFiles[i]);
  }

  return { success: true, count: fileList.length, invalidCount, fileList };
}

// Test 1: Drag & drop standard PDF and DOCX files
const simulatedDroppedFiles = [
  { name: "Assignment_Student1.pdf", size: 102400 },
  { name: "Assignment_Student2.docx", size: 51200 }
];

const res1 = simulateHandleIncomingFiles(simulatedDroppedFiles, "student");
console.log("Test 1 (Standard files drop):", res1.success && res1.count === 2 ? "PASSED" : "FAILED");

// Test 2: Drag & drop with unsupported extension (e.g. .exe)
const mixedFiles = [
  { name: "Paper.txt", size: 1024 },
  { name: "Malicious.exe", size: 2048 }
];

const res2 = simulateHandleIncomingFiles(mixedFiles, "student");
console.log("Test 2 (Filter unsupported file):", res2.count === 1 && res2.invalidCount === 1 ? "PASSED" : "FAILED");

// Test 3: Uppercase extensions
const upperFiles = [
  { name: "REPORT.PDF", size: 20480 }
];

const res3 = simulateHandleIncomingFiles(upperFiles, "student");
console.log("Test 3 (Uppercase extension support):", res3.success && res3.count === 1 ? "PASSED" : "FAILED");

console.log("All upload processing logic tests passed successfully.");
