/**
 * DocumentParser.js
 * High-accuracy client-side text extraction for .pdf, .docx, and .txt files.
 */

// Helper: Dynamically load external scripts if not already in document
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load library from ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Configure PDF.js worker
 */
function initPdfWorker() {
  if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
}

/**
 * Extract plain text from .txt, .csv, .md, or code files
 */
async function extractPlainText(file) {
  const rawText = await file.text();
  return cleanExtractedText(rawText);
}

/**
 * Extract text from a PDF file using PDF.js
 * @param {File} file 
 * @param {Function} [onProgress] - Optional progress callback: (currentPage, totalPages) => void
 */
async function extractPDFText(file, onProgress) {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  }
  initPdfWorker();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  const pagesText = [];
  const totalPages = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (typeof onProgress === "function") {
      onProgress(pageNum, totalPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageLines = [];
    let lastY = null;

    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === "") continue;

      // Group text items by line using Y-coordinate
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageLines.push("\n");
      } else if (pageLines.length > 0 && !pageLines[pageLines.length - 1].endsWith(" ")) {
        pageLines.push(" ");
      }

      pageLines.push(item.str);
      lastY = item.transform[5];
    }

    const pageStr = pageLines.join("").trim();
    if (pageStr) {
      pagesText.push(pageStr);
    }
  }

  return cleanExtractedText(pagesText.join("\n\n"));
}

/**
 * Extract text from a Word (.docx) file using Mammoth.js
 */
async function extractDocxText(file) {
  if (!window.mammoth) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return cleanExtractedText(result.value);
}

/**
 * Clean extracted text for plagiarism processing:
 * - Normalizes line endings
 * - Collapses excessive whitespaces
 * - Preserves structural paragraphs
 */
function cleanExtractedText(text) {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Check if a string contains binary control characters
 */
function isBinaryGarbage(text) {
  if (!text || text.length === 0) return false;
  let controlChars = 0;
  const sample = text.slice(0, 1000);
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      controlChars++;
    }
  }
  return controlChars / sample.length > 0.05;
}

/**
 * Main Public API: Extracts readable text from any supported assignment file.
 * Supports: .pdf, .docx, .txt, .md, .csv
 * 
 * @param {File} file 
 * @param {Function} [onProgress] - (currentPage, totalPages)
 * @returns {Promise<string>} Clean text content
 */
export async function extractText(file, onProgress = null) {
  if (!file) return "";

  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  // 1. PDF
  if (name.endsWith(".pdf") || type === "application/pdf") {
    try {
      const text = await extractPDFText(file, onProgress);
      if (text.trim().length > 0) return text;
    } catch (err) {
      console.warn("PDF extraction warning for " + file.name + ":", err);
    }
  }

  // 2. Word (.docx)
  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const text = await extractDocxText(file);
      if (text.trim().length > 0) return text;
    } catch (err) {
      console.warn("DOCX extraction warning for " + file.name + ":", err);
    }
  }

  // 3. Plain Text / Markdown / Code
  try {
    const text = await extractPlainText(file);
    if (!isBinaryGarbage(text)) {
      return text;
    }
  } catch (err) {
    console.warn("Text extraction warning for " + file.name + ":", err);
  }

  return `[Extracted content for ${file.name} - ${file.size} bytes]`;
}
