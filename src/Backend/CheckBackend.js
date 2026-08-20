// CheckBackend.js
// Functions used by CheckAssign.js

// Show selected files
export async function addfiles(event, filelist, itemstosave) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if (!itemstosave) return;
  itemstosave.innerHTML = "";

  for (let a = 0; a < filelist.length; a++) {
    const file = filelist[a];
    const fileDiv = document.createElement("div");
    fileDiv.className = "file-row";

    const ext = file.name ? file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "txt" : "txt";
    const sizeFormatted =
      file.size >= 1048576
        ? (file.size / 1048576).toFixed(1) + " MB"
        : file.size >= 1024
        ? Math.round(file.size / 1024) + " KB"
        : file.size + " B";

    fileDiv.innerHTML = `
      <span class="f-icon ${ext}"><svg class="ic"><use href="#i-file"/></svg></span>
      <div class="f-info">
        <div class="f-name" title="${file.name}">${file.name}</div>
        <div class="f-meta">${ext.toUpperCase()} • ${sizeFormatted}</div>
      </div>
      <button type="button" class="f-remove" aria-label="Remove ${file.name}" data-idx="${a}">
        <svg class="ic"><use href="#i-x"/></svg>
      </button>
    `;

    // Click to preview file in browser
    fileDiv.addEventListener("click", (e) => {
      if (e.target.closest(".f-remove")) return;
      try {
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, "_blank");
      } catch (err) {
        console.error("Preview error:", err);
      }
    });

    itemstosave.appendChild(fileDiv);
  }

      }
    });

    itemstosave.appendChild(fileDiv);
  }
}

// 2. Read entries recursively (handles folders and files from drag & drop)
export async function processEntry(entry, fileList) {
  if (entry.isFile) {
    return new Promise(function (resolve) {
      entry.file(function (file) {
        fileList.push(file);
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries = await new Promise((resolve) =>
      dirReader.readEntries(resolve)
    );

    for (const childEntry of entries) {
      await processEntry(childEntry, fileList);
    }
    }
  }
}

// 3. Create linear chunks of text (100 words each)
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

// 4. Build n-grams from chunk text (4-grams)
export function buildthegrams(chunk, n = 4) {
  const text = typeof chunk === "string" ? chunk : chunk.text;

  if (!text) {
    return [];
  }

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/);

  const words =
    text
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
  }

  return grams;
}

// Compare the two files
export async function applyalgo(fileList, localFallbackChunks = null) {
  const chunksarr = [];


      if (response.ok) {
        const data = await response.json();


  const firstLength = chunksarr[0].length;
  const secondLength = chunksarr[1].length;

// Jaccard alog working compare kar raha ha first chunk grams with all the chunks grams
export async function applyalgo(fileList, localFallbackChunks = null) {
  let chunksarr = [];
  

  for (let i = 0; i < fileList.length; i++) {
    let chunks = null;
      let getemail = localStorage.getItem("userEmail");
       
    try {
      
      let response = await fetch(
        `http://localhost:3000/filedata?email=${encodeURIComponent(getemail)}`
      );
      if (response.ok) {
        let data = await response.json();
        console.log("soham")
        if (data && data.length > 0 && data[0].chunks) {
          chunks = data[0].chunks;
        }
      }
    } catch (err) {
      console.warn("JSON-Server fetch notice for " + fileList[i].name, err);
    }

    if (!chunks && localFallbackChunks && localFallbackChunks[i]) {
      chunks = localFallbackChunks[i];
    }
    chunksarr[i] = chunks || [];
  }

  if (chunksarr.length < 2 || !chunksarr[0] || !chunksarr[1]) {
    return 0;
  }

  let totalmaxsimlarity = 0;
  let firstlength = chunksarr[0].length;
  let secondlength = chunksarr[1].length;
  let count = 0;

  if (firstlength === 0 || secondlength === 0) return 0;

  for (let i = 0; i < firstlength; i++) {
    let similarity = 0;
    const firstset = new Set(chunksarr[0][i].grams);

    for (let j = 0; j < secondlength; j++) {
      const secondset = new Set(chunksarr[1][j].grams);
      if (firstset.size === 0 || secondset.size === 0) continue;

      let intersectioncount = 0;
      for (const a of firstset) {
        if (secondset.has(a)) {
          intersectioncount++;
        }
      }
      count++;

      const unionSize = firstset.size + secondset.size - intersectioncount;
      const similarityvalue = unionSize > 0 ? intersectioncount / unionSize : 0;

      similarity = Math.max(similarityvalue, similarity);
    }
    totalmaxsimlarity += similarity;
  }

  const finalSimilarity = firstlength > 0 ? (totalmaxsimlarity / firstlength) * 100 : 0;
  console.log("Calculated Similarity:", finalSimilarity);
  return finalSimilarity;
}

