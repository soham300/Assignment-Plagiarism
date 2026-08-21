// CheckBackend.js

// ============================================================
// 1. Render selected files to the container
// ============================================================

export async function addfiles(event, filelist, itemstosave) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }

  if (!itemstosave) {
    return;
  }

  itemstosave.innerHTML = "";

  for (let a = 0; a < filelist.length; a++) {
    const file = filelist[a];

    const fileDiv = document.createElement("div");
    fileDiv.className = "file-row";

    const ext =
      file.name
        ?.toLowerCase()
        .match(/\.([a-z0-9]+)$/)?.[1] || "txt";

    const sizeFormatted =
      file.size >= 1048576
        ? (file.size / 1048576).toFixed(1) + " MB"
        : file.size >= 1024
        ? Math.round(file.size / 1024) + " KB"
        : file.size + " B";

    fileDiv.innerHTML = `
      <span class="f-icon ${ext}">
        <svg class="ic">
          <use href="#i-file"></use>
        </svg>
      </span>

      <div class="f-info">
        <div class="f-name" title="${file.name}">
          ${file.name}
        </div>

        <div class="f-meta">
          ${ext.toUpperCase()} • ${sizeFormatted}
        </div>
      </div>

      <button
        type="button"
        class="f-remove"
        aria-label="Remove ${file.name}"
        data-idx="${a}"
      >
        <svg class="ic">
          <use href="#i-x"></use>
        </svg>
      </button>
    `;

    // Click file row to preview file
    fileDiv.addEventListener("click", (e) => {
      if (e.target.closest(".f-remove")) {
        return;
      }

      try {
        const fileURL = URL.createObjectURL(file);

        window.open(fileURL, "_blank");

        // Release object URL later
        setTimeout(() => {
          URL.revokeObjectURL(fileURL);
        }, 10000);
      } catch (err) {
        console.error("Preview error:", err);
      }
    });

    itemstosave.appendChild(fileDiv);
  }
}


// ============================================================
// 2. Read entries recursively
//    Handles folders and files from drag & drop
// ============================================================

export async function processEntry(entry, fileList) {
  if (!entry || !fileList) {
    return;
  }

  // File
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (file) => {
          fileList.push(file);
          resolve();
        },
        (error) => {
          console.error("Unable to read file:", error);
          resolve();
        }
      );
    });
  }

  // Directory
  if (entry.isDirectory) {
    const dirReader = entry.createReader();

    const readEntries = () => {
      return new Promise((resolve, reject) => {
        dirReader.readEntries(resolve, reject);
      });
    };

    try {
      let entries = [];

      // readEntries() may return batches,
      // so keep reading until no entries remain
      while (true) {
        const batch = await readEntries();

        if (!batch || batch.length === 0) {
          break;
        }

        entries = entries.concat(batch);
      }

      for (const childEntry of entries) {
        await processEntry(childEntry, fileList);
      }
    } catch (error) {
      console.error("Directory processing error:", error);
    }
  }
}


// ============================================================
// 3. Create linear chunks of text
//    Default: 100 words per chunk
// ============================================================

export function createChunksLinear(text, wordsPerChunk = 100) {
  if (typeof text !== "string") {
    return [];
  }

  const cleanedText = text.trim();

  if (!cleanedText) {
    return [];
  }

  if (
    !Number.isInteger(wordsPerChunk) ||
    wordsPerChunk <= 0
  ) {
    wordsPerChunk = 100;
  }

  const words = cleanedText.split(/\s+/);

  const totalWords = words.length;

  if (totalWords === 0) {
    return [];
  }

  const chunks = [];

  let chunkIndex = 0;

  for (
    let i = 0;
    i < totalWords;
    i += wordsPerChunk
  ) {
    const chunkWords = words.slice(
      i,
      i + wordsPerChunk
    );

    chunks.push({
      chunkIndex: chunkIndex,
      text: chunkWords.join(" "),
      wordCount: chunkWords.length,
    });

    chunkIndex++;
  }

  return chunks;
}


// ============================================================
// 4. Build n-grams from chunk text
//    Default: 4-grams
// ============================================================

export function buildthegrams(chunk, n = 4) {
  const text =
    typeof chunk === "string"
      ? chunk
      : chunk?.text;

  if (!text || typeof text !== "string") {
    return [];
  }

  if (!Number.isInteger(n) || n <= 0) {
    n = 4;
  }

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const numberOfGrams =
    words.length - n + 1;

  if (numberOfGrams <= 0) {
    return [];
  }

  const grams = [];

  for (
    let i = 0;
    i < numberOfGrams;
    i++
  ) {
    const gramWords = words.slice(
      i,
      i + n
    );

    grams.push(
      gramWords.join(" ")
    );
  }

  return grams;
}


// ============================================================
// 5. Apply similarity algorithm
//
//    Logic:
//    - First use freshly generated local chunks
//    - JSON Server is only used as fallback
//    - Compare every chunk of File 1
//      against every chunk of File 2
//    - Jaccard similarity is used
//    - For every chunk of File 1,
//      highest matching similarity is selected
//    - Final score = average of highest similarities
// ============================================================

export async function applyalgo(
  fileList,
  localFallbackChunks = null
) {
  if (!Array.isArray(fileList)) {
    console.error(
      "applyalgo: fileList must be an array."
    );

    return 0;
  }

  if (fileList.length < 2) {
    console.warn(
      "Similarity requires at least two files."
    );

    return 0;
  }

  const chunksarr = [];

  // ----------------------------------------------------------
  // Get chunks for every file
  // ----------------------------------------------------------

  for (let i = 0; i < fileList.length; i++) {
    let chunks = null;

    // --------------------------------------------------------
    // Priority 1:
    // Use freshly generated local chunks
    // --------------------------------------------------------

    if (
      Array.isArray(localFallbackChunks) &&
      localFallbackChunks[i] &&
      Array.isArray(localFallbackChunks[i])
    ) {
      chunks = localFallbackChunks[i];

      console.log(
        "Using local chunks for:",
        fileList[i]?.name
      );
    }

    // --------------------------------------------------------
    // Priority 2:
    // JSON Server fallback
    // --------------------------------------------------------

    if (!chunks) {
      try {
        const userEmail =
          localStorage.getItem("userEmail");

        const response = await fetch(
          `http://localhost:3000/filedata?email=${encodeURIComponent(
            userEmail || ""
          )}`
        );

        if (response.ok) {
          const data =
            await response.json();

          if (
            Array.isArray(data) &&
            data.length > 0 &&
            Array.isArray(data[0].chunks)
          ) {
            chunks = data[0].chunks;

            console.log(
              "Using JSON Server chunks for:",
              fileList[i]?.name
            );
          }
        } else {
          console.warn(
            "JSON Server returned status:",
            response.status
          );
        }
      } catch (error) {
        console.warn(
          "JSON Server fetch notice for " +
            (fileList[i]?.name || "file"),
          error
        );
      }
    }

    // --------------------------------------------------------
    // If no chunks found
    // --------------------------------------------------------

    chunksarr[i] =
      Array.isArray(chunks)
        ? chunks
        : [];
  }

  // ----------------------------------------------------------
  // Need at least two sets of chunks
  // ----------------------------------------------------------

  if (chunksarr.length < 2) {
    console.warn(
      "Not enough chunk collections available."
    );

    return 0;
  }

  const firstChunks = chunksarr[0];
  const secondChunks = chunksarr[1];

  if (
    !Array.isArray(firstChunks) ||
    !Array.isArray(secondChunks)
  ) {
    console.warn(
      "Invalid chunk data."
    );

    return 0;
  }

  if (
    firstChunks.length === 0 ||
    secondChunks.length === 0
  ) {
    console.warn(
      "One or both files contain no chunks."
    );

    return 0;
  }

  // ----------------------------------------------------------
  // Calculate similarity
  // ----------------------------------------------------------

  let totalSimilarity = 0;

  for (
    let i = 0;
    i < firstChunks.length;
    i++
  ) {
    let highestSimilarity = 0;

    const firstSet = new Set(
      Array.isArray(firstChunks[i]?.grams)
        ? firstChunks[i].grams
        : []
    );

    if (firstSet.size === 0) {
      continue;
    }

    // --------------------------------------------------------
    // Compare current chunk with every chunk
    // of second file
    // --------------------------------------------------------

    for (
      let j = 0;
      j < secondChunks.length;
      j++
    ) {
      const secondSet = new Set(
        Array.isArray(secondChunks[j]?.grams)
          ? secondChunks[j].grams
          : []
      );

      if (secondSet.size === 0) {
        continue;
      }

      // ------------------------------------------------------
      // Intersection
      // ------------------------------------------------------

      let intersectionCount = 0;

      for (const gram of firstSet) {
        if (secondSet.has(gram)) {
          intersectionCount++;
        }
      }

      // ------------------------------------------------------
      // Union
      // ------------------------------------------------------

      const unionSize =
        firstSet.size +
        secondSet.size -
        intersectionCount;

      if (unionSize <= 0) {
        continue;
      }

      // ------------------------------------------------------
      // Jaccard similarity
      // ------------------------------------------------------

      const similarityValue =
        intersectionCount /
        unionSize;

      if (
        similarityValue >
        highestSimilarity
      ) {
        highestSimilarity =
          similarityValue;
      }
    }

    totalSimilarity +=
      highestSimilarity;
  }

  // ----------------------------------------------------------
  // Final percentage
  // ----------------------------------------------------------

  const finalSimilarity =
    (totalSimilarity /
      firstChunks.length) *
    100;

  // Prevent floating point noise
  const roundedSimilarity =
    Number(
      finalSimilarity.toFixed(2)
    );

  console.log(
    "Calculated Similarity:",
    roundedSimilarity
  );

  return roundedSimilarity;
}