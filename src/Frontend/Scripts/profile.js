/* =========================================================
   ASSIGNCHECK — PROFILE.JS
   UPDATED VERSION
   - Profile
   - Uploaded Files
   - Storage
   - Analyses COUNT FIX
   - Last Upload
   - View Report
   - New Analysis
   - Logout
========================================================= */

import API_BASE from "./config.js";

const USERS_API = `${API_BASE}/users`;
const FILEDATA_API = `${API_BASE}/filedata`;
const FILERESULT_API = `${API_BASE}/fileresult`;


/* =========================================================
   LOGIN
========================================================= */

const loggedIn = localStorage.getItem("loggedIn");

if (!loggedIn) {
    window.location.href = "index.html";
}


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;
let currentFileData = null;
let currentResultData = [];

let profileFiles = [];
let analysisResults = [];


/* =========================================================
   GET CURRENT EMAIL
========================================================= */

function getCurrentEmail() {
    const email = (
        localStorage.getItem("userEmail") ||
        localStorage.getItem("email") ||
        ""
    ).trim();
    if (email && email !== "true" && email !== "null") {
        return email;
    }
    return "";
}


/* =========================================================
   DOM
========================================================= */

const userNameEl =
    document.getElementById("userName");

const userEmailEl =
    document.getElementById("userEmail");

const avatarEl =
    document.getElementById("avatar");

const navAvatarEl =
    document.getElementById("navAvatar");

const totalFilesEl =
    document.getElementById("totalFiles");

const totalSizeEl =
    document.getElementById("totalSize");

const totalAnalysesEl =
    document.getElementById("totalAnalyses");

const lastUploadEl =
    document.getElementById("lastUpload");

const fileCountEl =
    document.getElementById("fileCount");

const fileListEl =
    document.getElementById("fileList");

const detailNameEl =
    document.getElementById("detailName");

const detailEmailEl =
    document.getElementById("detailEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const toastEl =
    document.getElementById("toast");


/* =========================================================
   SAFE TEXT
========================================================= */

function safeText(value, fallback = "") {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return fallback;
    }

    return String(value);
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   INITIAL
========================================================= */

function getInitial(name, email) {

    const value =
        safeText(name) ||
        safeText(email) ||
        "U";

    return (
        value
            .trim()
            .charAt(0)
            .toUpperCase() || "U"
    );
}


/* =========================================================
   FORMAT BYTES
========================================================= */

function formatBytes(bytes) {

    bytes = Number(bytes) || 0;

    if (bytes <= 0) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    let index = 0;
    let size = bytes;

    while (
        size >= 1024 &&
        index < units.length - 1
    ) {
        size /= 1024;
        index++;
    }

    if (index === 0) {
        return Math.round(size) + " B";
    }

    return size.toFixed(2) + " " + units[index];
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    if (!toastEl) {
        console.log(message);
        return;
    }

    toastEl.textContent = message;

    toastEl.classList.add("show");

    setTimeout(function () {

        toastEl.classList.remove("show");

    }, 2500);
}


/* =========================================================
   GET USER
========================================================= */

function getAuthHeaders(extra = {}) {
    const token = localStorage.getItem("authToken");
    const headers = { ...extra };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

/* =========================================================
   FAST UNIFIED PROFILE SUMMARY (<50ms single round-trip)
========================================================= */

async function fetchProfileSummary(email) {
    if (!email) return null;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(`${API_BASE}/api/user-profile-summary`, {
            headers: getAuthHeaders(),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.success) {
                const results = [...(data.reports || [])];
                if (data.fileResult && Array.isArray(data.fileResult.filesprocesed)) {
                    results.push(data.fileResult);
                }
                return {
                    user: data.user,
                    fileData: data.fileData,
                    resultData: results
                };
            }
        }
    } catch (e) {
        console.warn("Unified summary fetch fallback:", e);
    }
    return null;
}

async function getUser() {
    const email = getCurrentEmail();

    if (!email) {
        return null;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const response = await fetch(
            `${USERS_API}?email=${encodeURIComponent(email)}`,
            { headers: getAuthHeaders(), signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error("Users API failed");
        }

        const data = await response.json();

        if (
            Array.isArray(data) &&
            data.length > 0
        ) {
            return data[0];
        }

    } catch (error) {
        console.warn(
            "USER LOAD NOTICE:",
            error
        );
    }

    return null;
}


/* =========================================================
   GET FILE DATA
========================================================= */

async function getFileData() {
    const email = getCurrentEmail();

    if (!email) {
        return null;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const response = await fetch(
            `${FILEDATA_API}?email=${encodeURIComponent(email)}`,
            { headers: getAuthHeaders(), signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error("Filedata API failed");
        }

        const data = await response.json();

        if (
            Array.isArray(data) &&
            data.length > 0
        ) {
            return data[0];
        }

    } catch (error) {
        console.warn(
            "FILEDATA LOAD NOTICE:",
            error
        );
    }

    return null;
}


/* =========================================================
   GET ALL FILE RESULTS (Parallelized with Promise.allSettled)
========================================================= */

async function getFileResults() {
    const email = getCurrentEmail();
    if (!email) return [];
    const results = [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const [reportsRes, fileResultRes] = await Promise.allSettled([
        fetch(`${API_BASE}/reports?email=${encodeURIComponent(email)}`, {
            headers: getAuthHeaders(),
            signal: controller.signal
        }),
        fetch(`${FILERESULT_API}?email=${encodeURIComponent(email)}`, {
            headers: getAuthHeaders(),
            signal: controller.signal
        })
    ]);
    clearTimeout(timeoutId);

    if (reportsRes.status === "fulfilled" && reportsRes.value.ok) {
        try {
            const repData = await reportsRes.value.json();
            if (Array.isArray(repData)) results.push(...repData);
        } catch (e) {}
    }

    if (fileResultRes.status === "fulfilled" && fileResultRes.value.ok) {
        try {
            const data = await fileResultRes.value.json();
            if (Array.isArray(data)) {
                results.push(...data);
            } else if (data && typeof data === "object") {
                results.push(data);
            }
        } catch (e) {}
    }

    return results;
}


/* =========================================================
   UPDATE USER PROFILE
========================================================= */

function updateProfile(user) {

    const email =
        safeText(
            user?.email,
            getCurrentEmail()
        );

    const name =
        safeText(
            user?.name ||
            user?.username ||
            user?.fullName ||
            user?.fullname,
            email
                ? email.split("@")[0]
                : "User"
        );

    const initial =
        getInitial(
            name,
            email
        );

    if (userNameEl) {
        userNameEl.textContent = name;
    }

    if (userEmailEl) {
        userEmailEl.textContent = email;
    }

    if (detailNameEl) {
        detailNameEl.textContent = name;
    }

    if (detailEmailEl) {
        detailEmailEl.textContent = email;
    }

    if (avatarEl) {
        avatarEl.textContent = initial;
    }

    if (navAvatarEl) {
        navAvatarEl.textContent = initial;
    }
}


/* =========================================================
   GET FILE ARRAY
========================================================= */

function getFilesFromFileData(fileData) {

    if (!fileData) {
        return [];
    }

    if (Array.isArray(fileData.filedetails)) {
        return fileData.filedetails;
    }

    if (Array.isArray(fileData.files)) {
        return fileData.files;
    }

    if (Array.isArray(fileData.filesprocessed)) {
        return fileData.filesprocessed;
    }

    if (Array.isArray(fileData.filesProcessed)) {
        return fileData.filesProcessed;
    }

    return [];
}


/* =========================================================
   IMPORTANT:
   GET ANALYSIS ARRAY
========================================================= */

function getSavedReports(resultData, fileData) {

    const reports = [];

    /*
       Duplicate protection.
    */

    const keys = new Set();


    function addReport(report) {

        if (
            !report ||
            typeof report !== "object"
        ) {
            return;
        }

        if (
            Object.keys(report).length === 0
        ) {
            return;
        }

        // Ownership check: If report defines an email, it MUST match the current logged-in user
        const currentEmail = getCurrentEmail().toLowerCase();
        const reportEmail = (report.email || report.userEmail || "").trim().toLowerCase();
        if (currentEmail && reportEmail && reportEmail !== currentEmail) {
            return;
        }

        const id =
            report.id ??
            report.reportId ??
            report.customId ??
            "";

        const filenames =
            Array.isArray(report.filenames) && report.filenames.length > 0
                ? report.filenames.join("|")
                : Array.isArray(report.files) && report.files.length > 0
                    ? report.files.join("|")
                    : safeText(
                        report.filename ||
                        report.fileName ||
                        ""
                    );

        const score =
            report.roundedscore ??
            report.roundedScore ??
            report.score ??
            report.similarity ??
            report.similarityScore ??
            "";

        const date =
            report.createdAt ??
            report.created_at ??
            report.timestamp ??
            report.date ??
            report.uploadedAt ??
            "";

        const key = id
            ? String(id)
            : filenames + "|" + String(score) + "|" + String(date);

        if (keys.has(key)) {
            return;
        }

        keys.add(key);

        reports.push(report);
    }


    /*
       ----------------------------------------------------
       CASE 1:
       fileresult response is array
       ----------------------------------------------------
    */

    if (Array.isArray(resultData)) {

        resultData.forEach(function (record) {

            if (!record) {
                return;
            }


            /*
               filesprocesed
            */

            if (
                Array.isArray(
                    record.filesprocesed
                )
            ) {

                record.filesprocesed.forEach(
                    addReport
                );
            }


            /*
               filesProcessed
            */

            if (
                Array.isArray(
                    record.filesProcessed
                )
            ) {

                record.filesProcessed.forEach(
                    addReport
                );
            }


            /*
               analysisResults
            */

            if (
                Array.isArray(
                    record.analysisResults
                )
            ) {

                record.analysisResults.forEach(
                    addReport
                );
            }


            /*
               analyses
            */

            if (
                Array.isArray(
                    record.analyses
                )
            ) {

                record.analyses.forEach(
                    addReport
                );
            }


            /*
               reports
            */

            if (
                Array.isArray(
                    record.reports
                )
            ) {

                record.reports.forEach(
                    addReport
                );
            }


            /*
               results
            */

            if (
                Array.isArray(
                    record.results
                )
            ) {

                record.results.forEach(
                    addReport
                );
            }


            /*
               history
            */

            if (
                Array.isArray(
                    record.history
                )
            ) {

                record.history.forEach(
                    addReport
                );
            }


            /*
               If the record ITSELF is one report.
            */

            if (
                Array.isArray(record.filenames) ||
                record.score !== undefined ||
                record.similarity !== undefined ||
                record.roundedscore !== undefined ||
                record.roundedScore !== undefined
            ) {

                addReport(record);
            }

        });
    }


    /*
       ----------------------------------------------------
       CASE 2:
       Single object
       ----------------------------------------------------
    */

    if (
        resultData &&
        !Array.isArray(resultData) &&
        typeof resultData === "object"
    ) {

        if (
            Array.isArray(
                resultData.filesprocesed
            )
        ) {

            resultData.filesprocesed.forEach(
                addReport
            );
        }

        if (
            Array.isArray(
                resultData.filesProcessed
            )
        ) {

            resultData.filesProcessed.forEach(
                addReport
            );
        }

        if (
            Array.isArray(
                resultData.analysisResults
            )
        ) {

            resultData.analysisResults.forEach(
                addReport
            );
        }

        if (
            Array.isArray(
                resultData.analyses
            )
        ) {

            resultData.analyses.forEach(
                addReport
            );
        }

        if (
            Array.isArray(
                resultData.reports
            )
        ) {

            resultData.reports.forEach(
                addReport
            );
        }

        if (
            Array.isArray(
                resultData.results
            )
        ) {

            resultData.results.forEach(
                addReport
            );
        }
    }


    /*
       ----------------------------------------------------
       CASE 3:
       FILEDATA nested results
       ----------------------------------------------------
    */

    const files =
        getFilesFromFileData(
            fileData
        );


    if (Array.isArray(files)) {

        files.forEach(function (file) {

            if (
                !file ||
                typeof file !== "object"
            ) {
                return;
            }


            if (
                Array.isArray(file.results)
            ) {

                file.results.forEach(
                    addReport
                );
            }


            if (
                Array.isArray(file.reports)
            ) {

                file.reports.forEach(
                    addReport
                );
            }


            if (
                Array.isArray(
                    file.analysisResults
                )
            ) {

                file.analysisResults.forEach(
                    addReport
                );
            }

        });
    }


    /*
       ----------------------------------------------------
       CASE 4:
       SESSION STORAGE FALLBACK
       ----------------------------------------------------
    */

    if (reports.length === 0) {

        const currentEmail = getCurrentEmail().toLowerCase();
        const sessionKeys = [
            "assignCheckReport",
            "lastAnalysisResult",
            "reportData",
            "selectedReport"
        ];

        sessionKeys.forEach(function (key) {

            try {

                const raw =
                    sessionStorage.getItem(key);

                if (!raw) {
                    return;
                }

                const parsed =
                    JSON.parse(raw);

                const checkAndAdd = function (item) {
                    if (!item || typeof item !== "object") return;
                    const itemEmail = (item.email || item.userEmail || "").trim().toLowerCase();
                    // If user is logged in, only allow session reports belonging to this user
                    if (currentEmail) {
                        if (itemEmail === currentEmail) {
                            addReport(item);
                        } else {
                            // Stale report from previous user or anonymous session — clean up
                            sessionStorage.removeItem(key);
                        }
                    } else {
                        addReport(item);
                    }
                };

                if (Array.isArray(parsed)) {
                    parsed.forEach(checkAndAdd);
                } else {
                    checkAndAdd(parsed);
                }

            } catch (error) {

                console.error(
                    "SESSION REPORT ERROR:",
                    error
                );
            }

        });
    }


    return reports;
}


/* =========================================================
   CALCULATE FILE STATS
========================================================= */

function calculateFileStats(files) {

    let totalSize = 0;
    let latestDate = null;


    files.forEach(function (file) {

        totalSize += Number(
            file?.filesize ??
            file?.size ??
            0
        );

        const dateValue =
            file?.uploadedAt ||
            file?.createdAt ||
            file?.date ||
            file?.timestamp;


        if (!dateValue) {
            return;
        }


        const date = new Date(dateValue);

        if (
            !isNaN(date.getTime()) &&
            (!latestDate || date > latestDate)
        ) {
            latestDate = date;
        }

    });


    return {
        count: files.length,
        size: totalSize,
        latestDate: latestDate
    };
}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics(
    files,
    results
) {

    const stats =
        calculateFileStats(
            files
        );


    /*
       FILE COUNT — fallback to unique filenames from reports if no filedata
    */

    let displayCount = stats.count;

    if (displayCount === 0 && Array.isArray(results)) {
        const uniqueFiles = new Set();
        results.forEach(function (record) {
            const addFiles = function (item) {
                if (!item) return;
                if (Array.isArray(item.files)) item.files.forEach(f => f && uniqueFiles.add(f));
                if (Array.isArray(item.filenames)) item.filenames.forEach(f => f && uniqueFiles.add(f));
            };
            addFiles(record);
            if (Array.isArray(record.filesprocesed)) record.filesprocesed.forEach(addFiles);
        });
        displayCount = uniqueFiles.size;
    }

    if (totalFilesEl) {
        totalFilesEl.textContent = String(displayCount);
    }

    if (fileCountEl) {
        fileCountEl.textContent = String(displayCount);
    }


    /*
       STORAGE — fallback to text content size from reports when no file sizes stored
    */

    let displaySize = stats.size;

    if (displaySize === 0 && Array.isArray(results)) {
        // Files are processed client-side; sizes aren't stored for existing records.
        // Estimate from the textA + textB content stored in each report instead.
        results.forEach(function (record) {
            const addTextSize = function (item) {
                if (!item || typeof item !== "object") return;
                displaySize += (item.textA ? item.textA.length : 0);
                displaySize += (item.textB ? item.textB.length : 0);
            };
            addTextSize(record);
            if (Array.isArray(record.filesprocesed)) record.filesprocesed.forEach(addTextSize);
        });
    }

    if (totalSizeEl) {
        totalSizeEl.textContent = formatBytes(displaySize);
    }


    /*
       ====================================================
       ANALYSES CARD — FIXED
       ====================================================
    */

    analysisResults =
        getSavedReports(
            results,
            currentFileData
        );


    const count =
        analysisResults.length;


    console.log(
        "TOTAL ANALYSES:",
        count
    );


    console.log(
        "ANALYSIS RESULTS:",
        analysisResults
    );


    if (totalAnalysesEl) {

        totalAnalysesEl.textContent =
            String(count);
    }


    /*
       LAST UPLOAD — also check report dates as fallback
    */

    if (lastUploadEl) {

        let displayDate = stats.latestDate;

        // Fallback: if no file dates, check analysis/report dates
        if (!displayDate && Array.isArray(results)) {
            results.forEach(function (record) {
                // Handle both direct reports and nested structures
                const checkDate = function (item) {
                    if (!item || typeof item !== "object") return;
                    const d = new Date(
                        item.date || item.createdAt || item.timestamp || ""
                    );
                    if (!isNaN(d.getTime()) && (!displayDate || d > displayDate)) {
                        displayDate = d;
                    }
                };
                checkDate(record);
                if (Array.isArray(record.filesprocesed)) record.filesprocesed.forEach(checkDate);
            });
        }

        if (displayDate) {
            lastUploadEl.textContent = formatDate(displayDate);
        } else if (files.length > 0) {
            lastUploadEl.textContent = "Recently";
        } else {
            lastUploadEl.textContent = "—";
        }
    }
}


/* =========================================================
   FILE TYPE
========================================================= */

function getFileType(filename) {

    const name =
        safeText(
            filename
        ).toLowerCase();


    const ext =
        name.includes(".")
            ? name.split(".").pop()
            : "";


    const types = {

        pdf: {
            label: "PDF",
            className: "pdf"
        },

        doc: {
            label: "DOC",
            className: "doc"
        },

        docx: {
            label: "DOCX",
            className: "doc"
        },

        ppt: {
            label: "PPT",
            className: "ppt"
        },

        pptx: {
            label: "PPTX",
            className: "ppt"
        },

        txt: {
            label: "TXT",
            className: "txt"
        }

    };


    return (
        types[ext] || {
            label: "FILE",
            className: "file"
        }
    );
}


/* =========================================================
   RENDER EMPTY FILES
========================================================= */

function renderEmptyFiles() {

    if (!fileListEl) {
        return;
    }


    fileListEl.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ↑
            </div>

            <h3>
                No files uploaded yet
            </h3>

            <p>
                Upload assignments to start
                your first analysis.
            </p>

        </div>

    `;
}


/* =========================================================
   RENDER FILES
========================================================= */

function renderFiles(files) {

    if (!fileListEl) {
        return;
    }


    if (
        !Array.isArray(files) ||
        files.length === 0
    ) {

        renderEmptyFiles();

        return;
    }


    fileListEl.innerHTML = "";


    const displayFiles =
        files
            .slice()
            .reverse();


    displayFiles.forEach(function (file) {

        const filename =
            safeText(
                file?.filename ||
                file?.fileName ||
                file?.name,
                "Unknown File"
            );


        const filesize =
            Number(
                file?.filesize ??
                file?.size ??
                0
            );


        const type =
            getFileType(
                filename
            );


        const fileDate =
            file?.uploadedAt ||
            file?.createdAt ||
            file?.date ||
            file?.timestamp;


        const item =
            document.createElement(
                "div"
            );


        // Use CSS classes that match profile.html styles
        item.className = "file-item";


        item.innerHTML = `

            <div class="file-icon">
                ${type.label}
            </div>

            <div class="file-info">

                <div class="file-name">
                    ${escapeHTML(filename)}
                </div>

                <div class="file-meta">
                    ${type.label}${filesize ? " &bull; " + formatBytes(filesize) : ""}
                </div>

            </div>

            ${fileDate ? `<div class="file-date">${formatDate(fileDate)}</div>` : ""}

        `;


        fileListEl.appendChild(
            item
        );

    });
}


/* =========================================================
   VIEW REPORT
========================================================= */

function viewReport(
    report,
    index
) {

    if (!report) {
        showToast("Report not found.");
        return;
    }

    try {
        sessionStorage.setItem("selectedReport", JSON.stringify(report));
        sessionStorage.setItem("reportData", JSON.stringify(report));
        sessionStorage.setItem("lastAnalysisResult", JSON.stringify(report));
        sessionStorage.setItem("showsthedisplayornot", "true");
        sessionStorage.setItem("viewReport", "true");
        sessionStorage.setItem(
            "selectedReportId",
            String(report.id ?? report.customId ?? report._id ?? index ?? "")
        );
    } catch (error) {
        console.error("REPORT SAVE ERROR:", error);
        return;
    }

    const repId = report.id || report.customId || report._id;
    if (repId) {
        window.location.href = "DetailedReport.html?id=" + encodeURIComponent(repId);
    } else {
        window.location.href = "DetailedReport.html";
    }
}


/* =========================================================
   OPEN REPORT (BY INDEX OR LATEST)
========================================================= */

function openReport(index) {
    // If called with no argument, open latest analysis
    if (index === undefined || index === null || isNaN(Number(index))) {
        if (analysisResults && analysisResults.length > 0) {
            viewReport(analysisResults[0], 0);
            return;
        }

        const sessionRaw = sessionStorage.getItem("reportData") || sessionStorage.getItem("lastAnalysisResult") || sessionStorage.getItem("selectedReport");
        if (sessionRaw) {
            try {
                const parsed = JSON.parse(sessionRaw);
                viewReport(parsed, 0);
                return;
            } catch (e) {}
        }

        window.location.href = "DetailedReport.html";
        return;
    }

    index = Number(index);

    if (
        isNaN(index) ||
        index < 0 ||
        index >= analysisResults.length
    ) {
        showToast("Report not found.");
        return;
    }

    viewReport(analysisResults[index], index);
}


/* =========================================================
   RENDER REPORTS
========================================================= */

function renderReports(resultData) {

    const reportContainer =
        document.getElementById(
            "reportList"
        );


    analysisResults =
        getSavedReports(
            resultData,
            currentFileData
        );


    if (!reportContainer) {
        return;
    }


    reportContainer.innerHTML = "";


    if (
        analysisResults.length === 0
    ) {

        reportContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    No analyses yet
                </h3>

                <p>
                    Your completed comparison
                    reports will appear here.
                </p>

            </div>

        `;

        return;
    }


    const latestReports =
        analysisResults
            .slice()
            .reverse();


    latestReports.forEach(function (
        report,
        reverseIndex
    ) {

        const originalIndex =
            analysisResults.length -
            1 -
            reverseIndex;


        const filenames =
            Array.isArray(
                report?.filenames
            )
                ? report.filenames
                : [];


        const score =
            Number(
                report?.roundedscore ??
                report?.roundedScore ??
                report?.score ??
                report?.similarity ??
                0
            );


        const item =
            document.createElement(
                "div"
            );


        item.className =
            "profile-report-item";


        item.innerHTML = `

            <div class="report-info">

                <div class="report-title">

                    ${escapeHTML(
                        filenames.join(" vs ") ||
                        report?.filename ||
                        report?.fileName ||
                        "Assignment Analysis"
                    )}

                </div>

                <div class="report-meta">

                    Similarity:
                    ${Math.round(score)}%

                </div>

            </div>

            <button
                type="button"
                class="view-report-btn"
            >
                View Report →
            </button>

        `;


        const button =
            item.querySelector(
                ".view-report-btn"
            );


        if (button) {

            button.addEventListener(
                "click",
                function () {

                    viewReport(
                        report,
                        originalIndex
                    );

                }
            );
        }


        reportContainer.appendChild(
            item
        );

    });
}


/* =========================================================
   NEW ANALYSIS
========================================================= */

function setupNewAnalysis() {

    const buttons =
        document.querySelectorAll(
            "#newAnalysisBtn, .new-analysis-btn, [data-action='new-analysis']"
        );


    buttons.forEach(function (button) {

        if (
            button.dataset.profileBound ===
            "true"
        ) {
            return;
        }


        button.dataset.profileBound =
            "true";


        button.addEventListener(
            "click",
            function () {

                sessionStorage.removeItem(
                    "assignCheckReport"
                );

                sessionStorage.removeItem(
                    "selectedReport"
                );

                sessionStorage.removeItem(
                    "selectedReportId"
                );

                sessionStorage.removeItem(
                    "viewReport"
                );

                sessionStorage.removeItem(
                    "showsthedisplayornot"
                );


                window.location.href =
                    "../Templates/CheckAssign.html";
            }
        );

    });
}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    if (!logoutBtn) {
        return;
    }


    if (
        logoutBtn.dataset.profileBound ===
        "true"
    ) {
        return;
    }


    logoutBtn.dataset.profileBound =
        "true";


    logoutBtn.addEventListener(
        "click",
        function () {
            const email = getCurrentEmail();
            if (email) {
                try {
                    localStorage.removeItem("assigncheck_profile_cache_" + email);
                    localStorage.removeItem("assigncheck_history_cache_" + email);
                } catch (e) {}
            }

            localStorage.removeItem(
                "authToken"
            );

            localStorage.removeItem(
                "loggedIn"
            );

            localStorage.removeItem(
                "userEmail"
            );

            localStorage.removeItem(
                "email"
            );


            sessionStorage.clear();

            window.location.href =
                "../Templates/index.html";
        }
    );
}


/* =========================================================
   SWR CACHE HELPERS (<5ms instant rendering)
========================================================= */

function hydrateProfileFromCache(email) {
    if (!email) return false;
    try {
        const cachedRaw = localStorage.getItem("assigncheck_profile_cache_" + email);
        if (!cachedRaw) return false;

        const cache = JSON.parse(cachedRaw);
        if (!cache || !cache.user) return false;

        currentUser = cache.user;
        currentFileData = cache.fileData || null;
        currentResultData = cache.resultData || [];

        updateProfile(cache.user);

        profileFiles = cache.profileFiles || getFilesFromFileData(cache.fileData);
        analysisResults = cache.analysisResults || getSavedReports(cache.resultData, cache.fileData);

        updateStatistics(profileFiles, currentResultData);

        let filesToRender = profileFiles;
        if (filesToRender.length === 0 && Array.isArray(currentResultData)) {
            const fileMap = {};
            const processItem = function (item) {
                if (!item || typeof item !== "object") return;
                const date = item.date || item.createdAt || item.timestamp || "";
                const addName = function (name) {
                    if (!name) return;
                    if (!fileMap[name] || (date && date > (fileMap[name].uploadedAt || ""))) {
                        fileMap[name] = { filename: name, filesize: 0, uploadedAt: date };
                    }
                };
                if (Array.isArray(item.files)) item.files.forEach(addName);
                if (Array.isArray(item.filenames)) item.filenames.forEach(addName);
            };
            currentResultData.forEach(function (record) {
                processItem(record);
                if (Array.isArray(record.filesprocesed)) record.filesprocesed.forEach(processItem);
            });
            filesToRender = Object.values(fileMap);
        }

        renderFiles(filesToRender);
        renderReports(currentResultData);

        return true;
    } catch (e) {
        console.warn("Profile SWR hydration error:", e);
        return false;
    }
}

function saveProfileToCache(email, user, fileData, resultData, profileFiles, analysisResults) {
    if (!email) return;
    try {
        localStorage.setItem(
            "assigncheck_profile_cache_" + email,
            JSON.stringify({
                timestamp: Date.now(),
                user,
                fileData,
                resultData,
                profileFiles,
                analysisResults
            })
        );
    } catch (e) {}
}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    const email =
        getCurrentEmail();


    if (!email) {

        window.location.href =
            "../Templates/index.html";

        return;
    }


    if (userEmailEl) {
        userEmailEl.textContent =
            email;
    }


    // 1. Instant Cache Hydration (SWR: 0ms perceived loading time!)
    const hasRenderedFromCache = hydrateProfileFromCache(email);

    if (!hasRenderedFromCache && userNameEl) {
        userNameEl.textContent =
            "Loading...";
    }


    // 2. Fetch fresh data (Fast unified summary first, fallback to parallel)
    try {
        let summary = await fetchProfileSummary(email);

        let user, fileData, resultData;

        if (summary) {
            user = summary.user;
            fileData = summary.fileData;
            resultData = summary.resultData;
        } else {
            const [
                userRes,
                fileDataRes,
                resultDataRes
            ] = await Promise.allSettled([
                getUser(),
                getFileData(),
                getFileResults()
            ]);

            user = userRes.status === "fulfilled" ? userRes.value : null;
            fileData = fileDataRes.status === "fulfilled" ? fileDataRes.value : null;
            resultData = resultDataRes.status === "fulfilled" ? resultDataRes.value : [];
        }


        currentUser =
            user;

        currentFileData =
            fileData;

        currentResultData =
            resultData;


        /*
           PROFILE
        */

        updateProfile(
            user || {
                email: email
            }
        );


        /*
           FILES
        */

        profileFiles =
            getFilesFromFileData(
                fileData
            );


        /*
           ANALYSES
        */

        analysisResults =
            getSavedReports(
                resultData,
                fileData
            );


        /*
           STATISTICS
        */

        updateStatistics(
            profileFiles,
            resultData
        );


        /*
           FILE LIST
           Fallback: if no /filedata records, build file list from reports
        */

        let filesToRender = profileFiles;

        if (filesToRender.length === 0 && Array.isArray(resultData)) {
            const fileMap = {};
            const processItem = function (item) {
                if (!item || typeof item !== "object") return;
                const date = item.date || item.createdAt || item.timestamp || "";
                const addName = function (name) {
                    if (!name) return;
                    if (!fileMap[name] || (date && date > (fileMap[name].uploadedAt || ""))) {
                        fileMap[name] = { filename: name, filesize: 0, uploadedAt: date };
                    }
                };
                if (Array.isArray(item.files)) item.files.forEach(addName);
                if (Array.isArray(item.filenames)) item.filenames.forEach(addName);
            };
            resultData.forEach(function (record) {
                processItem(record);
                if (Array.isArray(record.filesprocesed)) record.filesprocesed.forEach(processItem);
            });
            filesToRender = Object.values(fileMap);
        }

        renderFiles(filesToRender);


        /*
           REPORT LIST
        */

        renderReports(
            resultData
        );


        /*
           SAVE TO CACHE FOR NEXT INSTANT LOAD
        */

        saveProfileToCache(
            email,
            user,
            fileData,
            resultData,
            profileFiles,
            analysisResults
        );


    } catch (error) {

        console.error(
            "PROFILE LOAD FAILED:",
            error
        );

        if (!hasRenderedFromCache) {
            updateProfile({
                email: email
            });

            if (totalFilesEl) {
                totalFilesEl.textContent = "0";
            }

            if (totalSizeEl) {
                totalSizeEl.textContent = "0 B";
            }

            if (totalAnalysesEl) {
                totalAnalysesEl.textContent = "0";
            }

            if (lastUploadEl) {
                lastUploadEl.textContent = "—";
            }

            analysisResults = [];
            renderEmptyFiles();
        }
    }
}



/* =========================================================
   REFRESH
========================================================= */

async function refreshProfile() {

    await loadProfile();

    showToast(
        "Profile refreshed."
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

function goToDashboard() {

    window.location.href =
        "CheckAssign.html";
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openReport =
    openReport;

window.viewReport =
    viewReport;

window.refreshProfile =
    refreshProfile;

window.goToDashboard =
    goToDashboard;


/* =========================================================
   INITIALIZE
========================================================= */

let profileInitialized = false;


async function initializeProfile() {

    if (profileInitialized) {
        return;
    }


    profileInitialized =
        true;


    setupLogout();

    setupNewAnalysis();


    /*
       Refresh buttons
    */

    const refreshButtons =
        document.querySelectorAll(
            "#refreshBtn, .refresh-btn, [data-action='refresh']"
        );


    refreshButtons.forEach(
        function (button) {

            if (
                button.dataset.profileBound ===
                "true"
            ) {
                return;
            }


            button.dataset.profileBound =
                "true";


            button.addEventListener(
                "click",
                refreshProfile
            );

        }
    );


    await loadProfile();
}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeProfile
    );

} else {

    initializeProfile();

}