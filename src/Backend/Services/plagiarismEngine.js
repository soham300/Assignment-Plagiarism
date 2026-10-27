// src/Services/plagiarismEngine.js
// Authoritative Server-Side Plagiarism Detection Engine
// Uses sliding window n-gram shingling, symmetric Jaccard similarity, and directional document coverage.

const { detectSpellingMistakes, detectSpellingMistakesSync } = require("./spellCheckService");

/**
 * Filter document text based on options (exclude quotes, references/bibliography).
 * @param {string} text
 * @param {object} options
 * @returns {string}
 */
function filterDocumentText(text, options = {}) {
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

/**
 * Normalize text for shingling comparison.
 * Standardizes case, whitespace, dashes, and removes non-alphanumeric punctuation.
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize raw text into word objects with character positions.
 * @param {string} rawText
 * @returns {Array<{ word: string, normalized: string, start: number, end: number }>}
 */
function tokenizeWithPositions(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const tokens = [];
  const regex = /\S+/g;
  let match;

  while ((match = regex.exec(rawText)) !== null) {
    const word = match[0];
    const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized.length > 0) {
      tokens.push({
        word: word,
        normalized: normalized,
        start: match.index,
        end: match.index + word.length
      });
    }
  }

  return tokens;
}

/**
 * Generate sliding-window n-grams (shingles) from tokens.
 * @param {Array<{ normalized: string, start: number, end: number }>} tokens
 * @param {number} n
 * @returns {{ shingles: Array<{ shingle: string, start: number, end: number, tokenIndex: number }>, shingleSet: Set<string>, shingleMap: Map<string, Array<{ start: number, end: number }>> }}
 */
function generateShingles(tokens, n = 4) {
  if (!tokens || tokens.length === 0) {
    return { shingles: [], shingleSet: new Set(), shingleMap: new Map() };
  }

  const effectiveN = Math.max(1, Math.min(n, tokens.length));
  const numberOfShingles = tokens.length - effectiveN + 1;
  const shingles = [];
  const shingleSet = new Set();
  const shingleMap = new Map();

  for (let i = 0; i < numberOfShingles; i++) {
    const slice = tokens.slice(i, i + effectiveN);
    const shingleText = slice.map((t) => t.normalized).join(" ");
    const charStart = slice[0].start;
    const charEnd = slice[slice.length - 1].end;

    const item = {
      shingle: shingleText,
      start: charStart,
      end: charEnd,
      tokenIndex: i
    };

    shingles.push(item);
    shingleSet.add(shingleText);

    if (!shingleMap.has(shingleText)) {
      shingleMap.set(shingleText, []);
    }
    shingleMap.get(shingleText).push({ start: charStart, end: charEnd });
  }

  return { shingles, shingleSet, shingleMap };
}

/**
 * Merge overlapping or contiguous character intervals.
 * @param {Array<{ start: number, end: number }>} intervals
 * @param {string} fullText
 * @returns {Array<{ startIndex: number, endIndex: number, phrase: string, charStart: number, charEnd: number }>}
 */
function mergeMatchIntervals(intervals, fullText) {
  if (!intervals || intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [];

  for (const cur of sorted) {
    if (merged.length === 0) {
      merged.push({ start: cur.start, end: cur.end });
    } else {
      const prev = merged[merged.length - 1];
      // If intervals overlap or are adjacent (allowing for small whitespace gap)
      if (cur.start <= prev.end + 2) {
        prev.end = Math.max(prev.end, cur.end);
      } else {
        merged.push({ start: cur.start, end: cur.end });
      }
    }
  }

  return merged.map((m) => {
    const rawPhrase = fullText.substring(m.start, m.end).trim();
    return {
      startIndex: m.start,
      endIndex: m.end,
      charStart: m.start,
      charEnd: m.end,
      phrase: rawPhrase,
      length: rawPhrase.split(/\s+/).length
    };
  });
}

/**
 * Extract and summarize common phrases between Document A and Document B.
 * @param {Array<object>} matchesA
 * @returns {Array<{ phrase: string, wordCount: number, count: number }>}
 */
function extractCommonPhrases(matchesA) {
  if (!Array.isArray(matchesA) || matchesA.length === 0) return [];

  const phraseMap = new Map();

  for (const m of matchesA) {
    if (!m || !m.phrase) continue;
    const phrase = m.phrase.trim();
    if (phrase.length < 3) continue;

    const key = phrase.toLowerCase();
    const wordCount = phrase.split(/\s+/).length;

    if (!phraseMap.has(key)) {
      phraseMap.set(key, {
        phrase: phrase,
        wordCount: wordCount,
        count: 1
      });
    } else {
      phraseMap.get(key).count += 1;
    }
  }

  return Array.from(phraseMap.values()).sort((a, b) => b.wordCount - a.wordCount);
}

/**
 * Core Authoritative Comparison Function.
 * Calculates:
 *  1. Overall Symmetric Similarity (Jaccard index): |A ∩ B| / |A ∪ B|
 *  2. Directional Coverage A -> B: |A ∩ B| / |A|
 *  3. Directional Coverage B -> A: |A ∩ B| / |B|
 *  4. Character-level matching intervals for highlighting.
 *  5. Academic spelling mistakes / typos.
 *
 * @param {string} textA
 * @param {string} textB
 * @param {object} options - { excludeQuotes, excludeReferences, nGramSize }
 * @returns {object}
 */
async function compareDocuments(textA, textB, options = {}) {
  const nGramSize = Number(options.nGramSize) || 4;

  const rawA = textA || "";
  const rawB = textB || "";

  // 1. Filter text according to options
  const filteredA = filterDocumentText(rawA, options);
  const filteredB = filterDocumentText(rawB, options);

  // 2. Tokenize with character positions
  const tokensA = tokenizeWithPositions(filteredA);
  const tokensB = tokenizeWithPositions(filteredB);

  // Edge cases: either document is empty
  if (tokensA.length === 0 || tokensB.length === 0) {
    const mistakesA = await detectSpellingMistakes(filteredA, "Document 1");
    const mistakesB = await detectSpellingMistakes(filteredB, "Document 2");

    return {
      similarity: 0,
      coverageA: 0,
      coverageB: 0,
      symmetric: true,
      matchingSections: 0,
      differentSections: 0,
      matchingPhrases: 0,
      spellingMistakes: mistakesA.length + mistakesB.length,
      commonPhrases: [],
      filefirstmatches: [],
      filesecondmatches: [],
      spellingMistakesA: mistakesA,
      spellingMistakesB: mistakesB,
      totalShinglesA: 0,
      totalShinglesB: 0,
      sharedShingles: 0,
      disclaimer: "Estimated textual overlap based on sliding n-gram analysis. Does not constitute definitive proof of academic misconduct."
    };
  }

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

  // 2b. Typo-tolerant normalization: align words with typos across documents so spelling mistakes count towards similarity
  const { mapA, mapB } = buildFuzzyTypoMap(
    tokensA.map((t) => t.normalized),
    tokensB.map((t) => t.normalized)
  );
  for (const t of tokensA) {
    if (mapA.has(t.normalized)) t.normalized = mapA.get(t.normalized);
  }
  for (const t of tokensB) {
    if (mapB.has(t.normalized)) t.normalized = mapB.get(t.normalized);
  }

  // 3. Generate sliding shingles
  const shingleDataA = generateShingles(tokensA, nGramSize);
  const shingleDataB = generateShingles(tokensB, nGramSize);

  const setA = shingleDataA.shingleSet;
  const setB = shingleDataB.shingleSet;

  // 4. Calculate intersection and union
  const commonShingles = new Set();
  const intervalsA = [];
  const intervalsB = [];

  for (const shingle of setA) {
    if (setB.has(shingle)) {
      commonShingles.add(shingle);

      // Collect intervals in Document A
      const locsA = shingleDataA.shingleMap.get(shingle) || [];
      for (const loc of locsA) intervalsA.push(loc);

      // Collect intervals in Document B
      const locsB = shingleDataB.shingleMap.get(shingle) || [];
      for (const loc of locsB) intervalsB.push(loc);
    }
  }

  const intersectionSize = commonShingles.size;
  const unionSize = setA.size + setB.size - intersectionSize;

  // 5. Symmetric Jaccard Similarity (Guaranteed A vs B === B vs A)
  const overallSimilarity = unionSize > 0 ? (intersectionSize / unionSize) * 100 : 0;

  // 6. Directional Coverage (Containment)
  const coverageA = setA.size > 0 ? (intersectionSize / setA.size) * 100 : 0;
  const coverageB = setB.size > 0 ? (intersectionSize / setB.size) * 100 : 0;

  // 7. Merge matching intervals
  const matchesA = mergeMatchIntervals(intervalsA, filteredA);
  const matchesB = mergeMatchIntervals(intervalsB, filteredB);
  const commonPhrases = extractCommonPhrases(matchesA);

  // 8. Spelling and typo detection
  const mistakesA = await detectSpellingMistakes(filteredA, "Document 1");
  const mistakesB = await detectSpellingMistakes(filteredB, "Document 2");

  const roundedSim = Math.round(overallSimilarity * 10) / 10;
  const roundedCovA = Math.round(coverageA * 10) / 10;
  const roundedCovB = Math.round(coverageB * 10) / 10;

  const differentSections = Math.max(0, (setA.size + setB.size) - intersectionSize * 2);

  return {
    similarity: roundedSim,
    coverageA: roundedCovA,
    coverageB: roundedCovB,
    symmetric: true,
    matchingSections: matchesA.length,
    differentSections: differentSections,
    matchingPhrases: commonPhrases.length,
    spellingMistakes: mistakesA.length + mistakesB.length,
    commonPhrases: commonPhrases,
    filefirstmatches: matchesA,
    filesecondmatches: matchesB,
    spellingMistakesA: mistakesA,
    spellingMistakesB: mistakesB,
    totalShinglesA: setA.size,
    totalShinglesB: setB.size,
    sharedShingles: intersectionSize,
    disclaimer: "Estimated textual overlap based on sliding n-gram analysis. Does not constitute definitive proof of academic misconduct."
  };
}

module.exports = {
  filterDocumentText,
  normalizeText,
  tokenizeWithPositions,
  generateShingles,
  mergeMatchIntervals,
  extractCommonPhrases,
  compareDocuments
};
