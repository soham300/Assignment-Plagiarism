import {
    createAnimationDocs,
    renderUI,
} from "../../Backend/CheckBackend.js";

let currentReportData = null;

async function showthehistory() {

    const getemail = localStorage.getItem("userEmail");
    const data = await fetch(`http://localhost:3000/fileresult?email=${getemail}`);
    const resp = await data.json();
    const userfiles = resp[0].filesprocesed;

    for (let a = 0; a < userfiles.length; a++) {
        

        let status = 'good';

        if (userfiles[a].roundscore < 25) {
            status = 'poor';
        } else if (userfiles[a].roundscore >= 25 && userfiles[a].roundscore < 75) {
            status = 'good';
        } else {
            status = 'excellent';
        }

        const smallresult = {
            index: a,
            type: 'student',
            title: "testing",
            files: userfiles[a].filenames.join(" "),
            similarity: userfiles[a].roundedscore,
            status: status
        }

        renderHistory(smallresult);
        console.log("soham how are you")

    }

}


async function viewReport(id) {
    const getemail = localStorage.getItem("userEmail");
    const data = await fetch(`http://localhost:3000/fileresult?email=${getemail}`);
    const resp = await data.json();
    const userfiles = resp[0].filesprocesed;
    
    currentReportData = {
        filenames: userfiles[id].filenames,
        filefirstmatches: userfiles[id].filefirstmatches,
        filesecondmatches: userfiles[id].filesecondmatches,
        similarwords: userfiles[id].similarwords,
        roundedscore: userfiles[id].roundedscore,
        textA: userfiles[id].textA,
        textB: userfiles[id].textB,
        chunkCountA: userfiles[id].chunkCountA,
        chunkCountB: userfiles[id].chunkCountB
    };

    const modal = document.getElementById('reportModal');
    const aStage = document.getElementById('aStage');
    const resultsContainer = document.getElementById('resultsContainer');
    const aEngine = document.getElementById('aEngine');
    
    aStage.style.display = 'block';
    resultsContainer.classList.remove('active');
    modal.classList.add('active');
    
    const stageElements = aEngine.querySelectorAll('.ae-stage');
    stageElements.forEach(stage => {
        stage.classList.remove('active', 'done');
    });
    
    aEngine.classList.add('active');
    aEngine.classList.remove('done');

    createAnimationDocs(userfiles[id].filenames);
    
    const stageNames = [
        "Reading assignments...",
        "Extracting text...",
        "Creating linear chunks...",
        "Generating 4-grams...",
        "Comparing sections...",
        "Detecting matches..."
    ];
    
    for (let i = 0; i < stageElements.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        document.getElementById('aeStatus').textContent = stageNames[i];
        stageElements[i].classList.add('active');
        
        if (i > 0) {
            stageElements[i - 1].classList.remove('active');
            stageElements[i - 1].classList.add('done');
        }
    }
    
    setTimeout(() => {
        aEngine.classList.remove('active');
        aEngine.classList.add('done');
        document.getElementById('aeStatus').textContent = 'Complete';
        
        setTimeout(() => {
            aStage.style.display = 'none';
            renderReportResults(currentReportData);
            resultsContainer.classList.add('active');
        }, 500);
    }, 500);
}




function renderReportResults(data) {
    const roundedScore = data.roundedscore;
    
    const scoreElement = document.getElementById("resSimilarity");
    if (scoreElement) {
        let current = 0;
        const increment = Math.max(1, Math.ceil(roundedScore / 30));
        const timer = setInterval(function () {
            current += increment;
            if (current >= roundedScore) {
                current = roundedScore;
                clearInterval(timer);
            }
            scoreElement.textContent = current + "%";
        }, 25);
    }

    const fileAName = data.filenames[0];
    const fileBName = data.filenames[1];

    if (document.getElementById("panelAName")) document.getElementById("panelAName").textContent = fileAName;
    if (document.getElementById("panelBName")) document.getElementById("panelBName").textContent = fileBName;

    const getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'pdf': { label: 'PDF', color: '--danger' },
            'docx': { label: 'DOCX', color: '--s1' },
            'doc': { label: 'DOC', color: '--s1' },
            'txt': { label: 'TXT', color: '--good' }
        };
        return types[ext] || { label: 'FILE', color: '--muted' };
    };

    const typeA = getFileType(fileAName);
    const typeB = getFileType(fileBName);
    if (document.getElementById("panelAFmt")) document.getElementById("panelAFmt").textContent = typeA.label;
    if (document.getElementById("panelBFmt")) document.getElementById("panelBFmt").textContent = typeB.label;

    const textA = data.textA || "No content extracted.";
    const textB = data.textB || "No content extracted.";

    const highlightMatchesInText = (text, matchedPhrases) => {
        if (!text || !matchedPhrases || matchedPhrases.length === 0) {
            return formatTextToParagraphs(text);
        }

        const words = [];
        const regex = /\S+/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            words.push({
                start: match.index,
                end: match.index + match[0].length
            });
        }

        const highlightIntervals = [];

        for (const phraseInfo of matchedPhrases) {
            const startWordIdx = phraseInfo.startIndex;
            const endWordIdx = phraseInfo.endIndex;

            if (startWordIdx >= 0 && endWordIdx <= words.length && startWordIdx < endWordIdx) {
                const charStart = words[startWordIdx].start;
                const charEnd = words[endWordIdx - 1].end;
                highlightIntervals.push({ start: charStart, end: charEnd });
            }
        }

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

        let result = "";
        let currentIndex = 0;

        for (const interval of mergedIntervals) {
            result += text.substring(currentIndex, interval.start);
            result += `<span class="highlight-match">${text.substring(interval.start, interval.end)}</span>`;
            currentIndex = interval.end;
        }
        result += text.substring(currentIndex);

        return formatTextToParagraphs(result);
    };

    const formatTextToParagraphs = (text) => {
        const lines = text.split(/\n+/);
        let result = "";
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0) {
                result += "<p>" + lines[i] + "</p>";
            }
        }
        return result;
    };

    if (document.getElementById("panelABody")) {
        document.getElementById("panelABody").innerHTML = highlightMatchesInText(textA, data.filefirstmatches);
    }
    if (document.getElementById("panelBBody")) {
        document.getElementById("panelBBody").innerHTML = highlightMatchesInText(textB, data.filesecondmatches);
    }

    if (document.getElementById("mFiles")) document.getElementById("mFiles").textContent = data.filenames.length;
    if (document.getElementById("mMatching")) document.getElementById("mMatching").textContent = data.similarwords;

    let different = 0;
    if (roundedScore < 100) {
        different = 10 - Math.ceil(roundedScore / 10);
        if (different < 1) different = 1;
    }
    if (document.getElementById("mDifferent")) document.getElementById("mDifferent").textContent = different;
    if (document.getElementById("mPhrases")) document.getElementById("mPhrases").textContent = Math.round(roundedScore * 0.5);
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('active');
    currentReportData = null;
}






let currentFilter = 'all';
const container = document.getElementById('historyList');
function renderHistory(data) {

    const isStudent = data.type === 'student';

    const iconSvg = isStudent
        ? '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
        : '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';

    const card = document.createElement('div');
    card.className = 'history-card';

    card.style.animationDelay = `${data.index * 0.05}s`;

    card.innerHTML = `
        <div class="card-icon ${data.type || ''}">
            <svg class="ic" style="width:24px;height:24px" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                ${iconSvg}
            </svg>
        </div>

        <div class="card-info">
            <div class="card-title">
                <h3>${data.title}</h3>
                <span class="score-badge ${data.status}">
                    <svg class="ic" style="width:14px;height:14px"
                        viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M19 5 5 19"/>
                        <circle cx="6.5" cy="6.5" r="2.5"/>
                        <circle cx="17.5" cy="17.5" r="2.5"/>
                    </svg>

                    ${data.similarity}% Match
                </span>
            </div>

            <div class="card-meta">
                <span>
                    <svg class="ic" style="width:14px;height:14px"
                        viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <path d="M14 2v6h6"/>
                    </svg>

                    ${data.files}
                </span>

                <span class="dot"></span>

                <span>
                    <svg class="ic" style="width:14px;height:14px"
                        viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>

                    ${data.date || new Date().toLocaleDateString()}
                </span>
            </div>
        </div>

        <div class="card-actions">

            <button class="action-btn"
                    title="View Report"
                    onclick="viewReport(${data.index})">

                <svg class="ic" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>

            </button>

            <button class="action-btn"
                    title="Download"
                    onclick="downloadReport(${data.index})">

                <svg class="ic" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>

            </button>

            <button class="action-btn delete"
                    title="Delete"
                    onclick="deleteItem(${data.index})">

                <svg class="ic" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>

            </button>

        </div>
    `;

    container.appendChild(card);
    

    const countAll = document.getElementById('countAll');

    if (countAll) {
        countAll.textContent =
            container.querySelectorAll('.history-card').length;
    }
}


showthehistory();

window.viewReport = viewReport;
window.closeReportModal = closeReportModal;
// window.downloadReport = function(id) { console.log('Download', id); };
window.deleteItem = async function(id) { 
    const getemail = localStorage.getItem("userEmail");
    const data = await fetch(`http://localhost:3000/fileresult?email=${getemail}`);
    const resp = await data.json();
    const userfiles = resp[0].filesprocesed;

    // console.log(userfiles[id]);
    userfiles.splice(id,1);
    await fetch("http://localhost:3000/fileresult/"+resp[0].id,{
        method:"PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(resp[0])
    })
    const toremovefromthecontainer=container.children[id];
    if (toremovefromthecontainer) {
    toremovefromthecontainer.remove();
    } else {
    console.log("No child found at index " + targetIndex);
    }

    console.log("file is deleted"); 
};



window.clearAllHistory = async function() { 
    const getemail = localStorage.getItem("userEmail");
    const data = await fetch(`http://localhost:3000/fileresult?email=${getemail}`);
    const resp = await data.json();
    const userfiles = resp[0].filesprocesed;
    await fetch("http://localhost:3000/fileresult/"+resp[0].id,{
        method:"PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(resp[0])
    })

    if(container){
        container.remove()
    }
    

 };



// const newAnalysisBtn = document.getElementById("nav-id");

// if (newAnalysisBtn) {
//   newAnalysisBtn.addEventListener("click", function () {
//     console.log("soham luthra");
    
//     fileList.length = 0;
//     localChunks = [];
//     rawTextMap = {};

//     const stages = aEngine.querySelectorAll(".ae-stage");
//     for (let i = 0; i < stages.length; i++) {
//       stages[i].className = "ae-stage";
//     }

//     aEngine.className = "a-engine";
//     aStage.className = "anim-stage";
//     animStatus.className = "anim-status";
//     animStatusText.textContent = "Running";

//     // Clear animation docs and connections
//     const docs = aStage.querySelectorAll('.a-doc');
//     docs.forEach(doc => doc.remove());

//     const lines = aStage.querySelectorAll('.connection-line');
//     lines.forEach(line => line.remove());

//     renderFileList();
//     checkButtonState();
//     setProgressStep(1);
//     showView(viewUpload);
//   });
// }


// // Initial setup
// setProgressStep(1);
// checkButtonState();
// window.filterHistory = function(type, btn) {
//     document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
//     btn.classList.add('active');
// };




// function filterHistory(type, btnElement) {
//     currentFilter = type;

//     // Update active button state
//     document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
//     btnElement.classList.add('active');

//     // Filter data
//     const filtered = type === 'all'
//         ? dummyHistoryData
//         : dummyHistoryData.filter(item => item.type === type);

//     renderHistory(filtered);
// }

      
        

// function downloadReport(id) {
//     showToast('Preparing download...', 'success');
//     // Trigger your download logic here
// }

// function deleteItem(id) {
//     if (confirm('Are you sure you want to delete this analysis?')) {
//         // Remove from dummy array (Replace with your API delete call)
//         const index = dummyHistoryData.findIndex(item => item.id === id);
//         if (index > -1) {
//             dummyHistoryData.splice(index, 1);
//             // Re-render with current filter
//             const filtered = currentFilter === 'all'
//                 ? dummyHistoryData
//                 : dummyHistoryData.filter(item => item.type === currentFilter);
//             renderHistory(filtered);
//             showToast('Analysis deleted successfully', 'success');
//         }
//     }
// }

// function clearAllHistory() {
//     if (confirm('Clear all history? This cannot be undone.')) {
//         dummyHistoryData.length = 0;
//         renderHistory([]);
//         showToast('All history cleared', 'success');
//     }
// }

    
//     function showToast(message, type = 'info', duration = 3000) {
//         let container = document.querySelector('.toast-container');
//         if (!container) {
//             container = document.createElement('div');
//             container.className = 'toast-container';
//             document.body.appendChild(container);
//         }
//         const icons = {
//             success: '<path d="M20 6 9 17l-5-5"/>',
//             error: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
//             info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
//         };
//         const toast = document.createElement('div');
//         toast.className = `toast ${type}`;
//         toast.innerHTML = `
//     <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[type] || icons.info}</svg>
//     <span>${message}</span>
//   `;
//         container.appendChild(toast);
//         requestAnimationFrame(() => toast.classList.add('show'));
//         setTimeout(() => {
//             toast.classList.remove('show');
//             setTimeout(() => toast.remove(), 400);
//         }, duration);
//     }


