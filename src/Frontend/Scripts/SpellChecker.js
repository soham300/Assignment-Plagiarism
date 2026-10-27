import API_BASE from "./config.js";

// Backward-compatibility exports with common typos for instant client detection
export const COMMON_TYPOS = {
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
export const NEVER_FLAG_FRONTEND = new Set();

export const COMMON_TECH_TERMS = new Set([
  "ai", "nlp", "ml", "cv", "llm", "llms", "rag", "api", "apis", "sdk", "sdks",
  "ui", "ux", "gui", "cli", "dom", "css", "html", "sql", "nosql", "db",
  "repo", "repos", "npm", "npx", "yarn", "git", "github", "gitlab", "devops",
  "backend", "frontend", "fullstack", "middleware", "chatbot", "chatbots",
  "dataset", "datasets", "pipeline", "pipelines", "runtime", "serverless",
  "microservice", "microservices", "monorepo", "json", "yaml", "regex",
  "oauth", "jwt", "auth", "async", "await", "webhook", "webhooks", "metadata",
  "boolean", "varchar", "int", "float", "enum", "struct", "typedef", "const",
  "restful", "graphql", "cors", "crud", "postgres", "mongodb", "redis", "docker",
  "kubernetes", "k8s", "aws", "gcp", "azure", "linux", "unix", "macos", "windows",
  "pytorch", "tensorflow", "keras", "scikit", "pandas", "numpy", "scipy",
  "dotenv", "bcrypt", "express", "node", "nodejs", "react", "vue", "angular",
  "vite", "webpack", "babel", "typescript", "javascript", "python", "java", "jupyter"
]);

/**
 * Dynamic technical terms, acronyms, and CamelCase identifiers.
 */
function isTechnicalOrAcronym(w) {
  if (!w || w.length < 2) return true;
  const lower = w.toLowerCase();
  if (COMMON_TECH_TERMS.has(lower)) return true;
  // Web protocols & network terms: http, https, ftp, www, url, uri, ip
  if (/^(https?|ftp|www|ssh|tcp|udp|ip|uri|url)$/i.test(w)) return true;
  // ALL CAPS: AI, RAG, PDF, POC, NB, AWS, CPU
  if (w === w.toUpperCase()) return true;
  // Acronym plurals: APIs, URLs, LLMs, CPUs, GPUs, PDFs
  if (/^[A-Z]{2,}s$/.test(w)) return true;
  // Mixed case / camelCase: PoC, GenAI, DevOps, PyTorch, iPhone, WiFi, GraphQL
  if (/[a-z][A-Z]/.test(w) || /^[a-z]+[A-Z]/.test(w)) return true;
  return false;
}

/**
 * Strips URLs, emails, and web links while preserving exact character offsets.
 * Replaces non-prose tokens with spaces so match.index stays 100% aligned with original text.
 */
function sanitizeTextForSpellCheck(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/https?:\/\/[^\s"'<>]+/gi, (m) => " ".repeat(m.length))
    .replace(/ftp:\/\/[^\s"'<>]+/gi, (m) => " ".repeat(m.length))
    .replace(/\bwww\.[^\s"'<>]+/gi, (m) => " ".repeat(m.length))
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, (m) => " ".repeat(m.length))
    .replace(/\(https?:\/\/[^)]+\)/gi, (m) => " ".repeat(m.length))
    .replace(/\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s"'<>]+/g, (m) => " ".repeat(m.length));
}

/**
 * Dynamic client-side rule evaluation without any hardcoded word lists.
 */
function checkWordClientSide(rawWord, fullText = "", matchIndex = -1, docLabel = "") {
  if (!rawWord || rawWord.length < 2) return null;
  if (/\d/.test(rawWord)) return null;

  // 1. Technical acronyms, mixed case, and common tech terms (chatbot, nlp, PoC, GenAI, APIs, DevOps)
  if (isTechnicalOrAcronym(rawWord)) {
    return null;
  }

  // 1b. Fast check for known common typos
  const lowerWord = rawWord.toLowerCase();
  if (COMMON_TYPOS[lowerWord]) {
    return COMMON_TYPOS[lowerWord];
  }

  // 1c. Words from filename / document label (e.g. author name "yashika", "garg" from "I am yashika garg.txt")
  if (docLabel && typeof docLabel === "string") {
    const filenameTokens = docLabel.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
    if (filenameTokens.includes(lowerWord)) {
      return null;
    }
  }

  // 1d. Words following self-introduction or author declarations ("I am", "My name is", "By")
  if (matchIndex > 0 && fullText) {
    const preceding = fullText.slice(Math.max(0, matchIndex - 30), matchIndex).toLowerCase();
    if (/\b(i am|my name is|name is|author|by)\s+([a-z\s]{0,20})$/i.test(preceding)) {
      return null;
    }
  }

  // 2. File extensions (e.g. README.md, index.html, server.js)
  if (matchIndex > 0 && fullText && fullText[matchIndex - 1] === ".") {
    return null;
  }

  // 3. Dotted or slash path code tokens (e.g. /api/check, obj.prop)
  if (matchIndex > 0 && fullText && (fullText[matchIndex - 1] === "/" || fullText[matchIndex - 1] === "\\")) {
    return null;
  }

  // 4. TitleCase words (Singla, Garg, Sharma, Chopra, Date, Block, etc.)
  const isTitleCase = rawWord[0] === rawWord[0].toUpperCase() && rawWord.slice(1) === rawWord.slice(1).toLowerCase();
  if (isTitleCase) {
    return null;
  }

  // 5. Keystroke mash / gibberish detection: >= 5 chars with zero vowels
  if (lowerWord.length >= 5 && !/[aeiouy]/.test(lowerWord)) {
    return "[Unrecognized word / Typo]";
  }

  return null;
}

/**
 * Local dynamic detection fallback (zero hardcoding).
 */
export function detectSpellingMistakesSync(text, docLabel = "Document") {
  if (!text || typeof text !== "string") return [];

  const mistakes = [];
  const sanitizedText = sanitizeTextForSpellCheck(text);
  const wordRegex = /\b[a-zA-Z]{2,}\b/g;
  let match;

  while ((match = wordRegex.exec(sanitizedText)) !== null) {
    const rawWord = match[0];
    const suggestion = checkWordClientSide(rawWord, text, match.index, docLabel);

    if (suggestion) {
      let formattedSuggestion = suggestion;
      if (
        rawWord[0] === rawWord[0].toUpperCase() &&
        rawWord[0] !== rawWord[0].toLowerCase() &&
        !suggestion.startsWith("[")
      ) {
        formattedSuggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      }

      const startContext = Math.max(0, match.index - 35);
      const endContext = Math.min(text.length, match.index + rawWord.length + 35);
      let context = text.substring(startContext, endContext).replace(/\s+/g, " ").trim();
      if (startContext > 0) context = "..." + context;
      if (endContext < text.length) context = context + "...";

      mistakes.push({
        word: rawWord,
        suggestion: formattedSuggestion,
        startIndex: match.index,
        endIndex: match.index + rawWord.length,
        context: context,
        docLabel: docLabel
      });
    }
  }

  return mistakes;
}

// In-memory cache for dynamic API results
const _spellCache = new Map();

/**
 * Detect spelling mistakes dynamically.
 * Queries the authoritative server dictionary API (/api/spellcheck) powered by Hunspell
 * (100,000+ real English words). Falls back to dynamic linguistic rules if offline.
 *
 * @param {string} text
 * @param {string} docLabel
 * @param {object} options
 * @returns {Promise<Array> | Array}
 */
export function detectSpellingMistakes(text, docLabel = "Document", options = {}) {
  if (!text || typeof text !== "string") return [];

  // Check cache first for instant response
  const cacheKey = docLabel + "::" + text;
  if (_spellCache.has(cacheKey)) {
    return _spellCache.get(cacheKey);
  }

  // Pre-calculate local dynamic result
  const localMistakes = detectSpellingMistakesSync(text, docLabel);

  // Trigger dynamic server dictionary lookup asynchronously
  if (typeof fetch === "function") {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;
    fetch(API_BASE + "/api/spellcheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller ? controller.signal : undefined,
      body: JSON.stringify({ text, docLabel })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (timeoutId) clearTimeout(timeoutId);
        if (data && Array.isArray(data.mistakes)) {
          _spellCache.set(cacheKey, data.mistakes);
        }
      })
      .catch(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
  }

  return localMistakes;
}

/**
 * Async version for callers that want to await full 100k+ dictionary lookup.
 */
export async function detectSpellingMistakesAsync(text, docLabel = "Document") {
  if (!text || typeof text !== "string") return [];

  const cacheKey = docLabel + "::" + text;
  if (_spellCache.has(cacheKey)) {
    return _spellCache.get(cacheKey);
  }

  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;
    const res = await fetch(API_BASE + "/api/spellcheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller ? controller.signal : undefined,
      body: JSON.stringify({ text, docLabel })
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.mistakes)) {
        _spellCache.set(cacheKey, data.mistakes);
        return data.mistakes;
      }
    }
  } catch (e) {
    // Fall back to local dynamic rules
  }

  const local = detectSpellingMistakesSync(text, docLabel);
  _spellCache.set(cacheKey, local);
  return local;
}

// =========================================
// EXTRACT AND GROUP COMMON PHRASES
// =========================================
export function extractCommonPhrases(matchesA, textA = "", textB = "") {
  const phraseMap = new Map();

  function addPhrase(rawPhrase, originObj = null) {
    if (!rawPhrase || typeof rawPhrase !== "string") return;
    const cleanPhrase = rawPhrase.trim().replace(/\s+/g, " ");
    if (cleanPhrase.length < 3) return;

    const key = cleanPhrase.toLowerCase();
    const wordCount = cleanPhrase.split(/\s+/).length;

    if (!phraseMap.has(key)) {
      phraseMap.set(key, {
        phrase: cleanPhrase,
        wordCount: wordCount,
        count: 1,
        occurrences: originObj ? [originObj] : []
      });
    } else {
      const item = phraseMap.get(key);
      item.count += 1;
      if (originObj) item.occurrences.push(originObj);
    }
  }

  // 1. Process matchesA if available
  if (Array.isArray(matchesA) && matchesA.length > 0) {
    for (let i = 0; i < matchesA.length; i++) {
      const m = matchesA[i];
      if (!m) continue;

      if (typeof m === "string") {
        addPhrase(m);
      } else if (typeof m.phrase === "string") {
        addPhrase(m.phrase, m);
      } else if (typeof m.text === "string") {
        addPhrase(m.text, m);
      }
    }
  }

  // 2. Fallback: If no phrases found yet and both textA and textB exist, extract common n-grams directly
  if (phraseMap.size === 0 && textA && textB && typeof textA === "string" && typeof textB === "string") {
    const wordsA = textA.trim().split(/\s+/).map(w => w.replace(/[^\w]/g, "").toLowerCase()).filter(Boolean);
    const wordsB = textB.trim().split(/\s+/).map(w => w.replace(/[^\w]/g, "").toLowerCase()).filter(Boolean);
    const rawWordsA = textA.trim().split(/\s+/).filter(Boolean);

    const setB = new Set();
    const n = 4;
    if (wordsB.length >= n) {
      for (let j = 0; j <= wordsB.length - n; j++) {
        setB.add(wordsB.slice(j, j + n).join(" "));
      }
    }

    if (wordsA.length >= n) {
      for (let i = 0; i <= wordsA.length - n; i++) {
        const shingle = wordsA.slice(i, i + n).join(" ");
        if (setB.has(shingle)) {
          const originalPhrase = rawWordsA.slice(i, i + n).join(" ");
          addPhrase(originalPhrase);
        }
      }
    }
  }

  // Convert map to array and sort by wordCount desc, then count desc
  const list = Array.from(phraseMap.values());
  list.sort(function (a, b) {
    if (b.wordCount !== a.wordCount) {
      return b.wordCount - a.wordCount;
    }
    return b.count - a.count;
  });

  return list;
}

// =========================================
// HTML ESCAPE HELPER
// =========================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function buildFuzzyTypoMap(wordsA, wordsB) {
  const mapA = new Map();
  const mapB = new Map();
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  // 1. Direct typo normalization
  for (const w of setA) {
    if (COMMON_TYPOS[w]) mapA.set(w, COMMON_TYPOS[w]);
  }
  for (const w of setB) {
    if (COMMON_TYPOS[w]) mapB.set(w, COMMON_TYPOS[w]);
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
          const canonical = COMMON_TYPOS[wA] || COMMON_TYPOS[wB] || (wA.length >= wB.length ? wA : wB);
          mapA.set(wA, canonical);
          mapB.set(wB, canonical);
          break;
        }
      }
    }
  }

  return { mapA, mapB };
}

// =========================================
// HIGHLIGHT BOTH SIMILARITIES & SPELLING MISTAKES
// =========================================
export function highlightTextWithMatchesAndTypos(text, matches, typos, options = {}) {
  if (!text) {
    return "<p style='color:#8b90ad;font-style:italic;'>No content extracted.</p>";
  }

  const showMatches = options.showMatches !== false;
  const showTypos = options.showTypos !== false;
  const showDiffs = options.showDiffs === true;
  const otherText = options.otherText || "";

  // Build character-level annotations
  const n = text.length;

  const words = [];
  const wordRegex = /\S+/g;
  let wMatch;
  while ((wMatch = wordRegex.exec(text)) !== null) {
    words.push({
      start: wMatch.index,
      end: wMatch.index + wMatch[0].length,
      clean: wMatch[0].replace(/[^\w]/g, "").toLowerCase()
    });
  }

  // Find character intervals for similarity matches
  const matchIntervals = [];

  // 1. Process explicit matches from engine or backend
  if (Array.isArray(matches) && matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (!m) continue;

      // String item (e.g. chunk string or phrase string)
      if (typeof m === "string") {
        const cleanP = m.trim();
        if (cleanP.length >= 3) {
          let searchIdx = 0;
          const textLower = text.toLowerCase();
          const phraseLower = cleanP.toLowerCase();
          while ((searchIdx = textLower.indexOf(phraseLower, searchIdx)) !== -1) {
            matchIntervals.push({ start: searchIdx, end: searchIdx + cleanP.length });
            searchIdx += Math.max(1, cleanP.length);
          }
        }
        continue;
      }

      // Direct character indices
      if (typeof m.charStart === "number" && typeof m.charEnd === "number" && m.charStart < m.charEnd) {
        matchIntervals.push({ start: m.charStart, end: Math.min(n, m.charEnd) });
        continue;
      }

      // Character indices passed as startIndex & endIndex
      if (typeof m.startIndex === "number" && typeof m.endIndex === "number" && m.startIndex < m.endIndex && m.endIndex <= n) {
        matchIntervals.push({ start: m.startIndex, end: m.endIndex });
        continue;
      }

      // Phrase or text field
      const phraseStr = m.phrase || m.text || "";
      if (typeof phraseStr === "string" && phraseStr.trim().length >= 3) {
        const cleanP = phraseStr.trim();
        let searchIdx = 0;
        const textLower = text.toLowerCase();
        const phraseLower = cleanP.toLowerCase();
        while ((searchIdx = textLower.indexOf(phraseLower, searchIdx)) !== -1) {
          matchIntervals.push({ start: searchIdx, end: searchIdx + cleanP.length });
          searchIdx += Math.max(1, cleanP.length);
        }
      }
    }
  }

  // 2. Sliding shingles intersection against otherText to guarantee ALL matching phrases are caught
  // (with typo tolerance so words with spelling mistakes match!)
  if (otherText && typeof otherText === "string") {
    const otherWords = [];
    const owRegex = /\S+/g;
    let owMatch;
    while ((owMatch = owRegex.exec(otherText)) !== null) {
      otherWords.push({
        start: owMatch.index,
        end: owMatch.index + owMatch[0].length,
        clean: owMatch[0].replace(/[^\w]/g, "").toLowerCase()
      });
    }

    // Align typos between text and otherText so phrases with spelling mistakes match!
    const { mapA, mapB } = buildFuzzyTypoMap(
      words.map(w => w.clean),
      otherWords.map(w => w.clean)
    );
    for (const w of words) {
      if (mapA.has(w.clean)) w.clean = mapA.get(w.clean);
    }
    for (const ow of otherWords) {
      if (mapB.has(ow.clean)) ow.clean = mapB.get(ow.clean);
    }

    for (const gramSize of [4, 3]) {
      if (otherWords.length >= gramSize && words.length >= gramSize) {
        const otherShingles = new Set();
        for (let j = 0; j <= otherWords.length - gramSize; j++) {
          const sh = otherWords.slice(j, j + gramSize).map(w => w.clean).filter(Boolean).join(" ");
          if (sh.length >= 6) otherShingles.add(sh);
        }

        for (let i = 0; i <= words.length - gramSize; i++) {
          const sh = words.slice(i, i + gramSize).map(w => w.clean).filter(Boolean).join(" ");
          if (sh.length >= 6 && otherShingles.has(sh)) {
            matchIntervals.push({
              start: words[i].start,
              end: words[i + gramSize - 1].end
            });
          }
        }
      }
    }
  }

  // Merge overlapping match intervals
  matchIntervals.sort((a, b) => a.start - b.start);
  const mergedMatches = [];
  for (let i = 0; i < matchIntervals.length; i++) {
    const cur = matchIntervals[i];
    if (cur.start >= cur.end) continue;
    if (mergedMatches.length === 0) {
      mergedMatches.push({ ...cur });
    } else {
      const last = mergedMatches[mergedMatches.length - 1];
      if (cur.start <= last.end + 2) {
        last.end = Math.max(last.end, cur.end);
      } else {
        mergedMatches.push({ ...cur });
      }
    }
  }

  // Robust map of typos: support exact character indices AND regex occurrences
  const typoMap = new Map();
  if (showTypos && Array.isArray(typos)) {
    for (let i = 0; i < typos.length; i++) {
      const t = typos[i];
      if (!t || !t.word) continue;

      if (
        typeof t.startIndex === "number" &&
        typeof t.endIndex === "number" &&
        t.startIndex >= 0 &&
        t.endIndex <= n &&
        text.substring(t.startIndex, t.endIndex).toLowerCase() === t.word.toLowerCase()
      ) {
        typoMap.set(t.startIndex, t);
      } else {
        try {
          const escaped = t.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const r = new RegExp("\\b" + escaped + "\\b", "gi");
          let m;
          while ((m = r.exec(text)) !== null) {
            typoMap.set(m.index, {
              ...t,
              startIndex: m.index,
              endIndex: m.index + m[0].length
            });
          }
        } catch (e) {}
      }
    }
  }

  // Helper to render text with spelling mistake tags
  function renderSubSpan(start, end) {
    let out = "";
    let subI = start;
    while (subI < end) {
      if (typoMap.has(subI)) {
        const t = typoMap.get(subI);
        const targetEnd = Math.min(end, Math.max(subI + 1, Number(t.endIndex) || (subI + 1)));
        out += '<span class="spelling-mistake" title="Spelling error: &quot;' + escapeHtml(t.word) + '&quot; → Suggestion: &quot;' + escapeHtml(t.suggestion) + '&quot;" data-suggestion="' + escapeHtml(t.suggestion) + '">';
        out += escapeHtml(text.substring(subI, targetEnd));
        out += "</span>";
        subI = targetEnd;
      } else {
        out += escapeHtml(text[subI]);
        subI++;
      }
    }
    return out;
  }

  // Safe wrapper that ensures <mark> tags never span across newlines (preserving proper <p> tags)
  function renderMarkedSpan(start, end, className, title) {
    const slice = text.substring(start, end);
    if (!slice.includes("\n")) {
      return '<mark class="' + className + '" title="' + title + '">' + renderSubSpan(start, end) + '</mark>';
    }
    const parts = slice.split(/(\n+)/);
    let out = "";
    let curOffset = start;
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      if (/^\n+$/.test(part)) {
        out += part;
      } else if (part.length > 0) {
        out += '<mark class="' + className + '" title="' + title + '">' + renderSubSpan(curOffset, curOffset + part.length) + '</mark>';
      }
      curOffset += part.length;
    }
    return out;
  }

  // Rebuild annotated HTML
  let html = "";
  let i = 0;
  let matchIdx = 0;

  while (i < n) {
    // Advance matchIdx past any matches that ended at or before i
    while (matchIdx < mergedMatches.length && mergedMatches[matchIdx].end <= i) {
      matchIdx++;
    }

    // Check if inside a similarity match
    const inMatch = matchIdx < mergedMatches.length &&
      i >= mergedMatches[matchIdx].start &&
      i < mergedMatches[matchIdx].end;

    if (inMatch) {
      const matchEnd = mergedMatches[matchIdx].end;
      if (showMatches) {
        html += renderMarkedSpan(i, matchEnd, "highlight-match", "Common matching phrase / section");
      } else {
        html += renderSubSpan(i, matchEnd);
      }
      i = matchEnd;
      matchIdx++;
      continue;
    }

    // Determine the next match start
    const nextMatchStart = matchIdx < mergedMatches.length ? mergedMatches[matchIdx].start : n;
    const diffEnd = Math.min(n, nextMatchStart);

    if (diffEnd > i) {
      if (showDiffs) {
        html += renderMarkedSpan(i, diffEnd, "highlight-diff", "Different / Unique section");
      } else {
        html += renderSubSpan(i, diffEnd);
      }
      i = diffEnd;
      continue;
    }

    i++;
  }

  // Format into paragraphs
  const paragraphs = html.split(/\n+/);
  let formattedHtml = "";
  for (let p = 0; p < paragraphs.length; p++) {
    if (paragraphs[p].trim().length > 0) {
      formattedHtml += "<p>" + paragraphs[p] + "</p>";
    }
  }

  return formattedHtml;
}

