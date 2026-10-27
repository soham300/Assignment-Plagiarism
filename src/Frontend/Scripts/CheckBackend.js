// src/Frontend/Scripts/CheckBackend.js
// Client-side document processing, text extraction, safe rendering, and symmetric comparison preview

import API_BASE from "./config.js";

// Re-export SpellChecker functions for easy access
export {
  COMMON_TYPOS,
  detectSpellingMistakes,
  detectSpellingMistakesAsync,
  extractCommonPhrases,
  highlightTextWithMatchesAndTypos,
} from "./SpellChecker.js";

// Safe text escaping helper
export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Show selected files with safe DOM rendering (XSS immune)
export async function addfiles(event, filelist, itemstosave) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }

  if (!itemstosave) {
    return;
  }

  itemstosave.innerHTML = "";

  for (let i = 0; i < filelist.length; i++) {
    const file = filelist[i];
    if (!file) continue;

    const fileDiv = document.createElement("div");
    fileDiv.className = "file-row";

    let ext = "txt";
    const fileName = file.name || "unnamed_file";
    const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (match) {
      ext = match[1];
    }

    let sizeFormatted;
    if (file.size >= 1048576) {
      sizeFormatted = (file.size / 1048576).toFixed(1) + " MB";
    } else if (file.size >= 1024) {
      sizeFormatted = Math.round(file.size / 1024) + " KB";
    } else {
      sizeFormatted = (file.size || 0) + " B";
    }

    // Safe DOM construction preventing XSS
    const iconSpan = document.createElement("span");
    iconSpan.className = "f-icon " + ext.replace(/[^a-z0-9]/g, "");
    iconSpan.innerHTML = '<svg class="ic"><use href="#i-file"/></svg>';

    const infoDiv = document.createElement("div");
    infoDiv.className = "f-info";

    const nameDiv = document.createElement("div");
    nameDiv.className = "f-name";
    nameDiv.setAttribute("title", fileName);
    nameDiv.textContent = fileName; // Safe textContent prevents script execution

    const metaDiv = document.createElement("div");
    metaDiv.className = "f-meta";
    metaDiv.textContent = ext.toUpperCase() + " • " + sizeFormatted;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(metaDiv);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "f-remove";
    removeBtn.setAttribute("aria-label", "Remove " + fileName);
    removeBtn.setAttribute("data-idx", String(i));
    removeBtn.innerHTML = '<svg class="ic"><use href="#i-x"/></svg>';

    fileDiv.appendChild(iconSpan);
    fileDiv.appendChild(infoDiv);
    fileDiv.appendChild(removeBtn);

    fileDiv.addEventListener("click", function (event) {
      if (event.target.closest(".f-remove")) {
        return;
      }

      try {
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, "_blank");
      } catch (error) {
        console.log("Preview error:", error);
      }
    });

    itemstosave.appendChild(fileDiv);
  }
}

// Extract text from .txt, .pdf, or .docx files in the browser
export async function extractFileText(file) {
  if (!file) return "";
  const name = (file.name || "").toLowerCase();

  // 1. PDF files (PDF.js)
  if (name.endsWith(".pdf") && window.pdfjsLib) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          .map(function (item) { return item.str || ""; })
          .filter(function (str) { return str.trim().length > 0; });
        fullText += pageStrings.join(" ") + "\n\n";
      }
      const trimmed = fullText.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
      console.warn("PDF had no extractable text layer. Falling back to text decoder.");
    } catch (err) {
      console.warn("PDF extraction notice:", err);
    }
  }

  // 2. Word DOCX files (Mammoth)
  if (name.endsWith(".docx") && window.mammoth) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return (result.value || "").trim();
    } catch (err) {
      console.warn("DOCX extraction notice:", err);
    }
  }

  // 3. Plain text / fallback
  try {
    return await file.text();
  } catch (err) {
    console.error("Text extraction failed:", err);
    return "";
  }
}

// Read files and folders from drag and drop
export async function processEntry(entry, fileList) {
  if (!entry) return;
  if (entry.isFile) {
    return new Promise(function (resolve) {
      entry.file(
        function (file) {
          if (file) fileList.push(file);
          resolve();
        },
        function (err) {
          console.warn("Could not read file entry:", err);
          resolve();
        }
      );
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();

    const entries = await new Promise(function (resolve) {
      reader.readEntries(
        function (results) {
          resolve(results || []);
        },
        function (err) {
          console.warn("Could not read directory:", err);
          resolve([]);
        }
      );
    });

    if (entries && entries.length) {
      for (let i = 0; i < entries.length; i++) {
        await processEntry(entries[i], fileList);
      }
    }
  }
}

// Filter Document Text Helper (Exclude References, Citations, Quotes)
export function filterDocumentText(text, options = {}) {
  if (!text || typeof text !== "string") return "";

  let processed = text;

  // 1. Exclude Quotes
  if (options.excludeQuotes) {
    processed = processed.replace(/"[^"\n\r]*"/g, " ");
    processed = processed.replace(/[“"][^”"\n\r]*[”"]/g, " ");
    processed = processed.replace(/‘[^’\n\r]*’/g, " ");
  }

  // 2. Exclude Bibliography / References at the end of documents
  if (options.excludeReferences) {
    const refRegex = /\n\s*(references|bibliography|works\s+cited|literature\s+cited|sources)\s*[:\n\r][\s\S]*$/i;
    processed = processed.replace(refRegex, "");
  }

  return processed;
}

// Normalize text for shingles
export function normalizeTokens(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

// Create linear chunks (backward compatibility)
export function createChunksLinear(text, wordsPerChunk = 100) {
  const words = (text || "").trim().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) {
    return [];
  }

  const chunks = [];
  let chunkIndex = 0;

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunkWords = words.slice(i, i + wordsPerChunk);

    chunks.push({
      chunkIndex: chunkIndex,
      text: chunkWords.join(" "),
      wordCount: chunkWords.length,
    });

    chunkIndex++;
  }

  return chunks;
}

// Build n-grams from chunk (backward compatibility)
export function buildthegrams(chunk, n = 4) {
  let text;
  if (typeof chunk === "string") {
    text = chunk;
  } else {
    text = chunk ? chunk.text : "";
  }

  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  const effectiveN = Math.max(1, Math.min(n, words.length));
  const numberOfGrams = words.length - effectiveN + 1;
  if (numberOfGrams <= 0) return [];

  const grams = [];
  for (let i = 0; i < numberOfGrams; i++) {
    grams.push(words.slice(i, i + effectiveN).join(" "));
  }

  return grams;
}

// Global set to store common grams
let lastCommonGrams = new Set();

export function getthecommongrams(firstGrams = null, secondGrams = null) {
  if (firstGrams && secondGrams) {
    const common = new Set();
    const secondSet = new Set(secondGrams);
    for (const gram of firstGrams) {
      if (secondSet.has(gram)) {
        common.add(gram);
      }
    }
    return common;
  }
  return lastCommonGrams;
}

const ENGINE_COMMON_TYPOS = {
  diffrent: "different",
  differnt: "different",
  mistka: "mistake",
  mistak: "mistake",
  plagarism: "plagiarism",
  plagerism: "plagiarism",
  documnt: "document",
  progamming: "programming",
  programing: "programming",
  algoritm: "algorithm",
  teh: "the",
  recieve: "receive",
  seperate: "separate",
  definately: "definitely",
  definatly: "definitely",
  occured: "occurred",
  occurance: "occurrence",
  untill: "until",
  wierd: "weird",
  goverment: "government",
  enviroment: "environment",
  recommand: "recommend",
  acheive: "achieve",
  accross: "across",
  basicly: "basically",
  begining: "beginning",
  calender: "calendar",
  embarass: "embarrass",
  guarentee: "guarantee",
  happend: "happened",
  interupt: "interrupt",
  knowlege: "knowledge",
  neccessary: "necessary",
  necesary: "necessary",
  noticable: "noticeable",
  peice: "piece",
  privilege: "privilege",
  publically: "publicly",
  refered: "referred",
  relevent: "relevant",
  similer: "similar",
  succesful: "successful",
  suprise: "surprise",
  tommorow: "tomorrow",
  truely: "truly",
  unfortunatly: "unfortunately",
  efficently: "efficiently"
};

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function buildFuzzyTypoMap(wordsA, wordsB) {
  const mapA = new Map();
  const mapB = new Map();
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  // 1. Direct typo normalization
  for (const w of setA) {
    if (ENGINE_COMMON_TYPOS[w]) mapA.set(w, ENGINE_COMMON_TYPOS[w]);
  }
  for (const w of setB) {
    if (ENGINE_COMMON_TYPOS[w]) mapB.set(w, ENGINE_COMMON_TYPOS[w]);
  }

  // 2. Cross-document typo tolerance (Levenshtein distance 1 for 4-7 chars, <=2 for 8+ chars)
  for (const wA of setA) {
    if (setB.has(wA)) continue;
    if (wA.length < 4) continue;
    const canA = mapA.get(wA) || wA;

    for (const wB of setB) {
      if (setA.has(wB)) continue;
      if (wB.length < 4) continue;
      if (wA[0] !== wB[0]) continue;
      const canB = mapB.get(wB) || wB;
      if (canA === canB) continue;

      const maxDist = Math.min(wA.length, wB.length) >= 7 ? 2 : 1;
      if (Math.abs(wA.length - wB.length) <= maxDist) {
        if (levenshtein(wA, wB) <= maxDist) {
          const canonical = ENGINE_COMMON_TYPOS[wA] || ENGINE_COMMON_TYPOS[wB] || (wA.length >= wB.length ? wA : wB);
          mapA.set(wA, canonical);
          mapB.set(wB, canonical);
          break;
        }
      }
    }
  }

  return { mapA, mapB };
}

// Calculate Symmetric Jaccard Similarity and Directional Coverages
export function calculateSymmetricSimilarity(tokensA, tokensB, n = 4) {
  if (!tokensA || !tokensB || tokensA.length === 0 || tokensB.length === 0) {
    return { similarity: 0, coverageA: 0, coverageB: 0, commonGrams: new Set() };
  }

  // Align typos across documents so spelling mistakes count towards similarity
  const { mapA, mapB } = buildFuzzyTypoMap(tokensA, tokensB);
  const alignedA = tokensA.map(t => mapA.get(t) || t);
  const alignedB = tokensB.map(t => mapB.get(t) || t);

  const effectiveN = Math.max(1, Math.min(n, Math.min(alignedA.length, alignedB.length)));
  const setA = new Set();
  const setB = new Set();

  for (let i = 0; i <= alignedA.length - effectiveN; i++) {
    setA.add(alignedA.slice(i, i + effectiveN).join(" "));
  }
  for (let i = 0; i <= alignedB.length - effectiveN; i++) {
    setB.add(alignedB.slice(i, i + effectiveN).join(" "));
  }

  const commonGrams = new Set();
  for (const gram of setA) {
    if (setB.has(gram)) {
      commonGrams.add(gram);
    }
  }

  const unionSize = setA.size + setB.size - commonGrams.size;
  let similarity = unionSize > 0 ? (commonGrams.size / unionSize) * 100 : 0;
  const coverageA = setA.size > 0 ? (commonGrams.size / setA.size) * 100 : 0;
  const coverageB = setB.size > 0 ? (commonGrams.size / setB.size) * 100 : 0;

  // For short texts (< 10 tokens), blend with token-level Jaccard so that
  // simple overlaps like "hello" in both docs always register as similar
  const isShort = tokensA.length < 10 || tokensB.length < 10;
  if (isShort) {
    const tokenSetA = new Set(tokensA);
    const tokenSetB = new Set(tokensB);
    const commonTokens = new Set();
    for (const t of tokenSetA) {
      if (tokenSetB.has(t)) commonTokens.add(t);
    }
    const tokenUnion = tokenSetA.size + tokenSetB.size - commonTokens.size;
    const tokenJaccard = tokenUnion > 0 ? (commonTokens.size / tokenUnion) * 100 : 0;
    // Weight token Jaccard more heavily for very short texts
    const blendWeight = Math.max(0, Math.min(1, 1 - (Math.min(tokensA.length, tokensB.length) / 10)));
    similarity = similarity * (1 - blendWeight) + tokenJaccard * blendWeight;
  }

  return {
    similarity: Math.round(similarity * 10) / 10,
    coverageA: Math.round(coverageA * 10) / 10,
    coverageB: Math.round(coverageB * 10) / 10,
    commonGrams
  };
}

// Primary similarity comparison entry point (Symmetric Jaccard)
export async function applyalgo(fileList, localFallbackChunks = null) {
  lastCommonGrams = new Set();

  // If passed chunks directly
  if (
    Array.isArray(fileList) &&
    fileList.length >= 2 &&
    Array.isArray(fileList[0]) &&
    Array.isArray(fileList[1])
  ) {
    const textA = fileList[0].map(c => c.text || "").join(" ");
    const textB = fileList[1].map(c => c.text || "").join(" ");
    const tokensA = normalizeTokens(textA);
    const tokensB = normalizeTokens(textB);

    const result = calculateSymmetricSimilarity(tokensA, tokensB, 4);
    lastCommonGrams = result.commonGrams;
    return result.similarity;
  }

  // If raw texts or chunks passed in localFallbackChunks
  if (Array.isArray(localFallbackChunks) && localFallbackChunks.length >= 2) {
    const textA = (localFallbackChunks[0] || []).map(c => c.text || "").join(" ");
    const textB = (localFallbackChunks[1] || []).map(c => c.text || "").join(" ");
    const tokensA = normalizeTokens(textA);
    const tokensB = normalizeTokens(textB);

    const result = calculateSymmetricSimilarity(tokensA, tokensB, 4);
    lastCommonGrams = result.commonGrams;
    return result.similarity;
  }

  return 0;
}
