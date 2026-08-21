// CheckBackend.js
// Functions used by CheckAssign.js

// Show selected files
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

    const fileDiv = document.createElement("div");
    fileDiv.className = "file-row";

    let ext = "txt";

    if (file.name) {
      const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);

      if (match) {
        ext = match[1];
      }
    }

    let sizeFormatted;

    if (file.size >= 1048576) {
      sizeFormatted = (file.size / 1048576).toFixed(1) + " MB";
    } else if (file.size >= 1024) {
      sizeFormatted = Math.round(file.size / 1024) + " KB";
    } else {
      sizeFormatted = file.size + " B";
    }

    fileDiv.innerHTML =
      '<span class="f-icon ' +
      ext +
      '">' +
      '<svg class="ic"><use href="#i-file"/></svg>' +
      "</span>" +
      '<div class="f-info">' +
      '<div class="f-name" title="' +
      file.name +
      '">' +
      file.name +
      "</div>" +
      '<div class="f-meta">' +
      ext.toUpperCase() +
      " • " +
      sizeFormatted +
      "</div>" +
      "</div>" +
      '<button type="button" class="f-remove" ' +
      'aria-label="Remove ' +
      file.name +
      '" ' +
      'data-idx="' +
      i +
      '">' +
      '<svg class="ic"><use href="#i-x"/></svg>' +
      "</button>";

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

// Read files and folders from drag and drop
export async function processEntry(entry, fileList) {
  if (entry.isFile) {
    return new Promise(function (resolve) {
      entry.file(function (file) {
        fileList.push(file);
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();

    const entries = await new Promise(function (resolve) {
      reader.readEntries(resolve);
    });

    for (let i = 0; i < entries.length; i++) {
      await processEntry(entries[i], fileList);
    }
  }
}

// Create 100-word chunks
export function createChunksLinear(text, wordsPerChunk = 100) {
  const words = text.trim().split(/\s+/);

  if (words.length === 0 || words[0] === "") {
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

// Create 4-grams
export function buildthegrams(chunk, n = 4) {
  let text;

  if (typeof chunk === "string") {
    text = chunk;
  } else {
    text = chunk.text;
  }

  if (!text) {
    return [];
  }

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/);

  const numberOfGrams = words.length - n + 1;

  if (numberOfGrams <= 0) {
    return [];
  }

  const grams = [];

  for (let i = 0; i < numberOfGrams; i++) {
    const gramWords = words.slice(i, i + n);

    grams.push(gramWords.join(" "));
  }

  return grams;
}

// Compare the two files
export async function applyalgo(fileList, localFallbackChunks = null) {
  const chunksarr = [];

  // Get chunks
  for (let i = 0; i < fileList.length; i++) {
    let chunks = null;

    // IMPORTANT:
    // Use freshly generated local chunks first
    if (localFallbackChunks && localFallbackChunks[i]) {
      chunks = localFallbackChunks[i];
    }

    // JSON Server only as fallback
    if (!chunks) {
      try {
        const response = await fetch(
          "http://localhost:3000/users/?filename=" +
            encodeURIComponent(fileList[i].name)
        );

        if (response.ok) {
          const data = await response.json();

          if (data.length > 0 && data[0].chunks) {
            chunks = data[0].chunks;
          }
        }
      } catch (error) {
        console.log(
          "JSON Server fetch notice for " + fileList[i].name,
          error
        );
      }
    }

    chunksarr[i] = chunks || [];
  }

  // Need two files
  if (chunksarr.length < 2) {
    return 0;
  }

  if (!chunksarr[0] || !chunksarr[1]) {
    return 0;
  }

  const firstLength = chunksarr[0].length;
  const secondLength = chunksarr[1].length;

  if (firstLength === 0 || secondLength === 0) {
    return 0;
  }

  // ORIGINAL SIMILARITY ALGORITHM
  let totalSimilarity = 0;

  for (let i = 0; i < firstLength; i++) {
    let highestSimilarity = 0;

    const firstSet = new Set(
      chunksarr[0][i].grams || []
    );

    for (let j = 0; j < secondLength; j++) {
      const secondSet = new Set(
        chunksarr[1][j].grams || []
      );

      if (
        firstSet.size === 0 ||
        secondSet.size === 0
      ) {
        continue;
      }

      let intersectionCount = 0;

      for (const gram of firstSet) {
        if (secondSet.has(gram)) {
          intersectionCount++;
        }
      }

      const unionSize =
        firstSet.size +
        secondSet.size -
        intersectionCount;

      let similarity = 0;

      if (unionSize > 0) {
        similarity =
          intersectionCount / unionSize;
      }

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
      }
    }

    totalSimilarity += highestSimilarity;
  }

  const finalSimilarity =
    (totalSimilarity / firstLength) * 100;

  console.log(
    "Calculated Similarity:",
    finalSimilarity
  );

  return finalSimilarity;
}
