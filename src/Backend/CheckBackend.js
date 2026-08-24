// 1. Render file list cards to container
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

// 2. Read entries recursively (handles folders and files from drag & drop)
export async function processEntry(entry, fileList) {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => {
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

// 3. Create linear chunks of text (100 words each)
export function createChunksLinear(text, wordsPerChunk = 100) {
  const words = text.trim().split(/\s+/);
  const totalWords = words.length;

  if (totalWords === 0 || words[0] === "") return [];

  const chunks = [];
  let chunkIndex = 0;

  for (let i = 0; i < totalWords; i += wordsPerChunk) {
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

  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/);

  const noofgrams = words.length - n + 1;

  if (noofgrams <= 0) return [];

  const grams = [];

  for (let i = 0; i < noofgrams; i++) {
    const gramvalue = words.slice(i, i + n);
    grams.push(gramvalue.join(" "));
  }

  return grams;
}





// export async function applyalgo(fileList){
//     // let response=await fetch(`http://localhost:3000/users?filename:eq=${fileList[0].name}`);
//     // let data=await response.json();
//     // if(!data){
//     //   alert("server is not responsding error");
//     // }
//     // console.log(data);
//     // console.log(fileList);


//     let chunksarr=[];
//     for(let i=0;i<fileList.length;i++){
//       let response=await fetch(`http://localhost:3000/users/?filename:eq=${fileList[i].name}`);
//       let data=await response.json();
//       console.log("soham")
//       chunksarr[i]=data[0].chunks;
//       console.log(data);


//     }

//           let totalmaxsimlarity=0;
//           let firstlength=chunksarr[0].length;
//           let secondlength=chunksarr[1].length;
//           let count=0;
//           for(let i=0;i<firstlength;i++){
//               let similarity=0;
//               const firstset=new Set(chunksarr[0][i].grams);
//               for(let j=0;j<secondlength;j++){
//                 const secondset=new Set(chunksarr[1][j].grams);
//                if (firstset.size === 0 || secondset.size === 0) continue;

//                 let intersectioncount=0;
//                 for(const a of firstset){
//                     if(secondset.has(a)){
//                       intersectioncount++;
//                     }
//                 }
//                 count++;

//                 const unionSize = firstset.size + secondset.size - intersectioncount;
//                 const similarityvalue = intersectioncount / unionSize;
//                 // console.log("first set:"+[...firstset])
//                 // console.log("second set:" +[...secondset]);
//                 // console.log(similarityvalue);
//                 similarity=Math.max(similarityvalue,similarity);
//               } 
//               totalmaxsimlarity+=similarity;
//           }
//           console.log("final");
//           console.log((totalmaxsimlarity/firstlength)*100);
//           // console.log(similarity/count); 

   
//     // console.log(chunksarr);


// }



// Jaccard alog working compare kar raha ha first chunk grams with all the chunks grams
let commongrams=[];
export async function applyalgo(fileList, localFallbackChunks = null) {
  commongrams=[];
  let chunksarr = [];
  

  for (let i = 0; i < fileList.length; i++) {
    let chunks = null;
      let getemail = localStorage.getItem("userEmail");
       
    try {
      
       // if (data && data.length > 0 && data[0].chunks) { // this is now taking the first
       //  taken file and second taken file but this is not correct so we have to take the
       //  all recent added file from the data base and get it from the last or cannot store
       //  the name in the localstorage 
        // because a person can add more that one file of same name as he did in past
        //  this things done in CheckAssign 
      let response = await fetch( // there is no need of getting the fetch as when we are making 
      // the chunks we are storing that in list and share when need to call the apply algo
        `http://localhost:3000/filedata?email=${encodeURIComponent(getemail)}`
      );
      if (response.ok) {
        let data = await response.json();
        // console.log(data.filedetails);
        console.log("soham")
        if (data && data.length > 0 && data[0].chunks) { 
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
          commongrams.push(a);
          console.log(a);
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


export function getthecommongrams(){
    return new Set(commongrams); 
}


export function countUp(element, targetNumber) {
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

export function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    'pdf': { label: 'PDF', color: '--danger', icon: 'pdf' },
    'docx': { label: 'DOCX', color: '--s1', icon: 'docx' },
    'doc': { label: 'DOC', color: '--s1', icon: 'docx' },
    'pptx': { label: 'PPTX', color: '--warn', icon: 'pptx' },
    'ppt': { label: 'PPT', color: '--warn', icon: 'pptx' },
    'txt': { label: 'TXT', color: '--good', icon: 'txt' }
  };
  return types[ext] || { label: 'FILE', color: '--muted', icon: 'txt' };
}


export function renderUI(result) {
  const roundedScore = result.roundedscore;
  
  // 1. Update Score
  const scoreElement = document.getElementById("resSimilarity");
  if (scoreElement) countUp(scoreElement, roundedScore);

  const fileAName = result.filenames[0];
  const fileBName = result.filenames[1];

  // 2. Update File Names and Badges
  if (document.getElementById("pairLeft")) document.getElementById("pairLeft").textContent = fileAName;
  if (document.getElementById("pairRight")) document.getElementById("pairRight").textContent = fileBName;
  if (document.getElementById("panelAName")) document.getElementById("panelAName").textContent = fileAName;
  if (document.getElementById("panelBName")) document.getElementById("panelBName").textContent = fileBName;

  const typeA = getFileType(fileAName);
  const typeB = getFileType(fileBName);
  if (document.getElementById("panelAFmt")) document.getElementById("panelAFmt").textContent = typeA.label;
  if (document.getElementById("panelBFmt")) document.getElementById("panelBFmt").textContent = typeB.label;

  // 3. Update Text Panels (Uses the SAVED text from the database)
  const textA = result.textA || "No content extracted.";
  const textB = result.textB || "No content extracted.";

  if (document.getElementById("panelABody")) {
    document.getElementById("panelABody").innerHTML = highlightMatchesInText(textA, result.filefirstmatches);
  }
  if (document.getElementById("panelBBody")) {
    document.getElementById("panelBBody").innerHTML = highlightMatchesInText(textB, result.filesecondmatches);
  }

  // 4. Update Stats
  if (document.getElementById("mFiles")) document.getElementById("mFiles").textContent = result.filenames.length;
  if (document.getElementById("mMatching")) document.getElementById("mMatching").textContent = result.similarwords;

  let different = 0;
  if (roundedScore < 100) {
    different = 10 - Math.ceil(roundedScore / 10);
    if (different < 1) different = 1;
  }
  if (document.getElementById("mDifferent")) document.getElementById("mDifferent").textContent = different;
  if (document.getElementById("mPhrases")) document.getElementById("mPhrases").textContent = Math.round(roundedScore * 0.5);

  // 5. Update Lists
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


export function createAnimationDocs(files) {
 
  const aStage = document.getElementById('aStage');
  if (!aStage) {
    console.warn("Animation stage (#aStage) not found in DOM. Skipping animation.");
    return;
  }

  // Clear existing docs and connections
  const existingDocs = aStage.querySelectorAll('.a-doc');
  existingDocs.forEach(doc => doc.remove());

  const connectionsSvg = aStage.querySelector('.a-connections');
  if (connectionsSvg) {
    connectionsSvg.innerHTML = '';
  }

  const numFiles = files.length;

  // Define positions based on number of files
  let positions = [];
  if (numFiles === 2) {
    positions = [
      { top: '35%', left: '10%' },
      { top: '35%', right: '10%' }
    ];
  } else if (numFiles === 3) {
    positions = [
      { top: '15%', left: '10%' },
      { top: '15%', right: '10%' },
      { top: '65%', left: '35%' }
    ];
  } else {
    positions = [
      { top: '10%', left: '8%' },
      { top: '60%', left: '8%' },
      { top: '10%', right: '8%' },
      { top: '60%', right: '8%' }
    ];
  }

  // Create document cards
  files.forEach((file, index) => {
    if (index >= positions.length) return;

    const pos = positions[index];
    
    // FIX 2: Handle both File objects and plain strings (from history database)
    const fileName = typeof file === 'string' ? file : file.name;
    const fileType = getFileType(fileName);
    
    const label = index === 0 ? 'Student A' : index === 1 ? 'Student B' :
                  index === 2 ? 'Student C' : `File ${index + 1}`;
    const chip = index === 0 ? 'S1' : index === 1 ? 'S2' :
                 index === 2 ? 'S3' : `F${index + 1}`;

    // Shorten filename for display
    const displayName = fileName.length > 20 ? fileName.substring(0, 18) + '...' : fileName;

    const doc = document.createElement('div');
    doc.className = 'a-doc';
    doc.style.cssText = `${pos.top ? `top: ${pos.top};` : ''} ${pos.left ? `left: ${pos.left};` : ''} ${pos.right ? `right: ${pos.right};` : ''}`;

    doc.innerHTML = `
      <div class="a-doc-head">
        <div class="a-avatar" style="background: var(${fileType.color})">${chip}</div>
        <div class="a-id">
          <span class="a-name">${label}</span>
          <span class="a-fname">${displayName}</span>
        </div>
      </div>
      <div class="a-lines">
        <div class="a-line"><i class="tag" style="background: var(${fileType.color})">1</i></div>
        <div class="a-line"><i class="tag" style="background: var(${fileType.color})">2</i></div>
        <div class="a-line"><i class="tag" style="background: var(${fileType.color})">3</i></div>
        <div class="a-line"></div>
        <div class="a-line"></div>
      </div>
    `;

    aStage.appendChild(doc);
  });

  // Add connection lines from each document to center engine
  const docs = aStage.querySelectorAll('.a-doc');
  const centerX = 50;
  const centerY = 50;

  docs.forEach((doc, index) => {
    const rect = doc.getBoundingClientRect();
    const stageRect = aStage.getBoundingClientRect();

    // Calculate position relative to stage
    const docLeft = ((rect.left - stageRect.left) / stageRect.width) * 100;
    const docTop = ((rect.top - stageRect.top) / stageRect.height) * 100;
    const docRight = docLeft + ((rect.width / stageRect.width) * 100);
    const docBottom = docTop + ((rect.height / stageRect.height) * 100);

    // Determine connection point (closest edge to center)
    let startX, startY;
    if (docLeft < 50) {
      startX = docRight;
    } else {
      startX = docLeft;
    }

    if (docTop < 50) {
      startY = docBottom;
    } else {
      startY = docTop;
    }

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', centerX);
    line.setAttribute('y2', centerY);
    line.setAttribute('stroke', 'var(--primary)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6 8');
    line.style.opacity = '0';
    line.classList.add('connection-line');

    connectionsSvg.appendChild(line);
  });
}




export function highlightMatchesInText(text, matchedPhrases) {
  if (!text || !matchedPhrases || matchedPhrases.length === 0) {
    return formatTextToParagraphs(text);
  }

  // 1. Find all words and their exact character indices in the original text
  const words = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    words.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // 2. Map the word-based indices from matchedPhrases to character indices
  const highlightIntervals = [];

  for (const phraseInfo of matchedPhrases) {
    const startWordIdx = phraseInfo.startIndex;
    const endWordIdx = phraseInfo.endIndex; // exclusive

    if (startWordIdx >= 0 && endWordIdx <= words.length && startWordIdx < endWordIdx) {
      const charStart = words[startWordIdx].start;
      const charEnd = words[endWordIdx - 1].end;
      highlightIntervals.push({ start: charStart, end: charEnd });
    }
  }

  // 3. Merge overlapping or adjacent intervals to prevent broken/nested HTML tags
  highlightIntervals.sort((a, b) => a.start - b.start);
  const mergedIntervals = [];
  for (const interval of highlightIntervals) {
    if (mergedIntervals.length === 0) {
      mergedIntervals.push({ ...interval });
    } else {
      const last = mergedIntervals[mergedIntervals.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        mergedIntervals.push({ ...interval });
      }
    }
  }

  // 4. Reconstruct the text with <mark> tags
  let result = "";
  let currentIndex = 0;

  for (const interval of mergedIntervals) {
    // Add text before the highlight
    result += text.substring(currentIndex, interval.start);
    // Add highlighted text
    result += `<mark class="highlight-match">${text.substring(interval.start, interval.end)}</mark>`;
    currentIndex = interval.end;
  }
  // Add remaining text
  result += text.substring(currentIndex);

  // 5. Convert to paragraphs (uses your existing function)
  return formatTextToParagraphs(result);
}


export function formatTextToParagraphs(text) {
  const lines = text.split(/\n+/);
  let result = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      result += "<p>" + lines[i] + "</p>";
    }
  }

  return result;
}