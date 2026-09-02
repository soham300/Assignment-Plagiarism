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

"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE = "http://localhost:3000";

const USERS_API = `${API_BASE}/users`;
const FILEDATA_API = `${API_BASE}/filedata`;
const FILERESULT_API = `${API_BASE}/fileresult`;


/* =========================================================
   LOGIN
========================================================= */

const loggedIn = localStorage.getItem("loggedIn");

if (!loggedIn) {
    window.location.href = "../Templates/index.html";
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

    return (
        localStorage.getItem("userEmail") ||
        localStorage.getItem("email") ||
        loggedIn ||
        ""
    ).trim();
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

async function getUser() {

    const email = getCurrentEmail();

    if (!email) {
        return null;
    }

    try {

        const response = await fetch(
            `${USERS_API}?email=${encodeURIComponent(email)}`
        );

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

        console.error(
            "USER LOAD ERROR:",
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

        const response = await fetch(
            `${FILEDATA_API}?email=${encodeURIComponent(email)}`
        );

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

        console.error(
            "FILEDATA LOAD ERROR:",
            error
        );
    }

    return null;
}


/* =========================================================
   GET ALL FILE RESULTS
========================================================= */

async function getFileResults() {

    const email = getCurrentEmail();

    if (!email) {
        return [];
    }

    try {

        const response = await fetch(
            `${FILERESULT_API}?email=${encodeURIComponent(email)}`
        );

        if (!response.ok) {
            throw new Error("Fileresult API failed");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            return data;
        }

        if (
            data &&
            typeof data === "object"
        ) {
            return [data];
        }

    } catch (error) {

        console.error(
            "FILERESULT LOAD ERROR:",
            error
        );
    }

    return [];
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


        const id =
            report.id ??
            report.reportId ??
            "";


        const filenames =
            Array.isArray(report.filenames)
                ? report.filenames.join("|")
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


        const key =
            String(id) +
            "|" +
            filenames +
            "|" +
            String(score) +
            "|" +
            String(date);


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

        const sessionKeys = [
            "assignCheckReport",
            "lastAnalysisResult"
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


                if (Array.isArray(parsed)) {

                    parsed.forEach(
                        addReport
                    );

                } else {

                    addReport(parsed);

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


        const date =
            new Date(dateValue);


        if (
            !isNaN(date.getTime()) &&
            (
                !latestDate ||
                date > latestDate
            )
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
       FILE COUNT
    */

    if (totalFilesEl) {

        totalFilesEl.textContent =
            String(stats.count);
    }


    if (fileCountEl) {

        fileCountEl.textContent =
            String(stats.count);
    }


    /*
       STORAGE
    */

    if (totalSizeEl) {

        totalSizeEl.textContent =
            formatBytes(
                stats.size
            );
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
       LAST UPLOAD
    */

    if (lastUploadEl) {

        if (stats.latestDate) {

            lastUploadEl.textContent =
                formatDate(
                    stats.latestDate
                );

        } else if (files.length > 0) {

            lastUploadEl.textContent =
                "Recently";

        } else {

            lastUploadEl.textContent =
                "—";
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


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "profile-file-item";


        card.innerHTML = `

            <div class="profile-file-icon ${type.className}">
                ${type.label}
            </div>

            <div class="profile-file-info">

                <div class="profile-file-name">
                    ${escapeHTML(filename)}
                </div>

                <div class="profile-file-meta">

                    ${type.label}

                    ${
                        filesize
                            ? " • " +
                              formatBytes(filesize)
                            : ""
                    }

                    ${
                        fileDate
                            ? " • " +
                              formatDate(fileDate)
                            : ""
                    }

                </div>

            </div>

        `;


        fileListEl.appendChild(
            card
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

        showToast(
            "Report not found."
        );

        return;
    }


    try {

        sessionStorage.setItem(
            "selectedReport",
            JSON.stringify(report)
        );


        sessionStorage.setItem(
            "selectedReportId",
            String(
                report.id ??
                report.reportId ??
                index ??
                ""
            )
        );


        sessionStorage.setItem(
            "viewReport",
            "true"
        );


        sessionStorage.setItem(
            "showsthedisplayornot",
            "true"
        );


    } catch (error) {

        console.error(
            "REPORT SAVE ERROR:",
            error
        );

        return;
    }


    window.location.href =
        "../Templates/DetailedReport.html";
}


/* =========================================================
   OPEN REPORT BY INDEX
========================================================= */

function openReport(index) {

    index = Number(index);


    if (
        isNaN(index) ||
        index < 0 ||
        index >= analysisResults.length
    ) {

        showToast(
            "Report not found."
        );

        return;
    }


    viewReport(
        analysisResults[index],
        index
    );
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

            localStorage.removeItem(
                "loggedIn"
            );

            localStorage.removeItem(
                "userEmail"
            );

            localStorage.removeItem(
                "email"
            );


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
                "../Templates/index.html";
        }
    );
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


    if (userNameEl) {
        userNameEl.textContent =
            "Loading...";
    }


    if (userEmailEl) {
        userEmailEl.textContent =
            email;
    }


    try {

        const [
            user,
            fileData,
            resultData
        ] = await Promise.all([

            getUser(),

            getFileData(),

            getFileResults()

        ]);


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


        console.log(
            "PROFILE FILES:",
            profileFiles
        );


        console.log(
            "FILERESULT DATA:",
            resultData
        );


        console.log(
            "FINAL ANALYSES:",
            analysisResults
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
        */

        renderFiles(
            profileFiles
        );


        /*
           REPORT LIST
        */

        renderReports(
            resultData
        );


    } catch (error) {

        console.error(
            "PROFILE LOAD FAILED:",
            error
        );


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
        "../Templates/index.html";
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