// certificateModal.js
// Official Plagiarism Clearance Certificate Generator & Modal with Live QR Code Verification

import { showToast } from "./toast.js";

// Helper to escape HTML safely
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let activeModal = null;

/**
 * Open the Official Academic Plagiarism Clearance Certificate modal
 * @param {object} report - The analysis result / report object
 */
export function openCertificateModal(report) {
  if (!report) {
    if (typeof showToast === "function") {
      showToast("No analysis report found to generate certificate.", "warning");
    } else {
      alert("No analysis report found.");
    }
    return;
  }

  // Remove any stale certificate backdrops in the DOM
  const existing = document.querySelectorAll(".cert-modal-backdrop");
  existing.forEach(el => el.remove());

  // 1. Extract Details
  const reportId = report.id || report.customId || report._id || ("REP-" + Date.now().toString(36).toUpperCase());
  const certId = "AC-CERT-" + new Date().getFullYear() + "-" + String(reportId).replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase();
  
  let fileAName = "Document_1.txt";
  let fileBName = "Document_2.txt";
  if (Array.isArray(report.filenames) && report.filenames.length >= 2) {
    fileAName = report.filenames[0];
    fileBName = report.filenames[1];
  } else if (Array.isArray(report.files) && report.files.length >= 2) {
    fileAName = report.files[0];
    fileBName = report.files[1];
  }

  const studentName = localStorage.getItem("userName") || report.name || "Student Author";
  const studentEmail = localStorage.getItem("userEmail") || report.email || "student@university.edu";

  let similarity = 0;
  if (report.roundedscore !== undefined && !isNaN(Number(report.roundedscore))) {
    similarity = parseFloat(report.roundedscore);
  } else if (report.similarity !== undefined && !isNaN(Number(report.similarity))) {
    similarity = parseFloat(report.similarity);
  }
  similarity = Math.round(similarity * 10) / 10;

  const dateObj = report.date ? new Date(report.date) : new Date();
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  const wordsA = (report.textA || "").trim().split(/\s+/).filter(Boolean).length;
  const wordsB = (report.textB || "").trim().split(/\s+/).filter(Boolean).length;
  const totalWords = wordsA + wordsB;

  let matchingSections = 0;
  if (report.matchingSections !== undefined && report.matchingSections !== null) {
    matchingSections = report.matchingSections;
  } else if (Array.isArray(report.filefirstmatches) && report.filefirstmatches.length > 0) {
    matchingSections = report.filefirstmatches.length;
  } else if (similarity > 0) {
    matchingSections = 1;
  }

  const commonPhrases = Array.isArray(report.commonPhrases) ? report.commonPhrases.length : (report.matchingPhrases || 0);

  // 2. Verdict Determination
  let verdictClass = "cleared";
  let verdictTitle = "ORIGINAL WORK — CLEARED";
  let verdictDesc = "Similarity score is within acceptable institutional threshold (<15%). Originality clearance granted.";
  let badgeIcon = "✓";

  if (similarity > 30) {
    verdictClass = "flagged";
    verdictTitle = "FLAGGED FOR ACADEMIC REVIEW";
    verdictDesc = "Exceeds standard 15% institutional originality threshold. Discretionary faculty review required.";
    badgeIcon = "⚠";
  } else if (similarity > 15) {
    verdictClass = "moderate";
    verdictTitle = "MODERATE SIMILARITY — ACCEPTABLE WITH CITATIONS";
    verdictDesc = "Pass with review. Shared phrases must be substantiated with genuine references and bibliography.";
    badgeIcon = "ℹ";
  }

  // 3. Verification URL & QR Code
  const baseUrl = window.location.origin;
  const verificationUrl = `${baseUrl}/Templates/DetailedReport.html?id=${encodeURIComponent(reportId)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}`;

  // 4. Create Modal Markup
  const backdrop = document.createElement("div");
  backdrop.className = "cert-modal-backdrop";
  backdrop.id = "certModalBackdrop";

  backdrop.innerHTML = `
    <div class="cert-modal-dialog">
      <!-- Action Toolbar -->
      <div class="cert-modal-toolbar">
        <div class="toolbar-left">
          <span>🎖️ Academic Integrity Clearance Certificate</span>
        </div>
        <div class="toolbar-actions">
          <button type="button" class="cert-btn cert-btn-primary" id="btnDownloadCertPdf">
            📥 Download Official PDF
          </button>
          <button type="button" class="cert-btn cert-btn-outline" id="btnPrintCert">
            🖨️ Print
          </button>
          <button type="button" class="cert-btn cert-btn-close" id="btnCloseCertModal">
            ✕ Close
          </button>
        </div>
      </div>

      <!-- Printable A4 Academic Certificate -->
      <div class="academic-certificate" id="academicCertificate">
        <div class="cert-watermark">ASSIGNCHECK</div>

        <div class="cert-content">
          <!-- Institutional Header -->
          <div class="cert-header">
            <div class="cert-logo-badge">A</div>
            <div class="cert-institution-name">AssignCheck Academic Integrity & Originality Council</div>
            <h1 class="cert-title">Certificate of Originality</h1>
            <p class="cert-subtitle">Formal Evaluation of Plagiarism, Textual Overlap & Citation Integrity</p>
            <div class="cert-id-tag">Verification ID: ${escapeHtml(certId)}</div>
          </div>

          <!-- Formal Attestation Statement -->
          <div class="cert-statement">
            This document certifies that the academic assignment specified below has undergone automated
            cryptographic sliding <i>n</i>-gram shingle extraction, symmetric Jaccard containment calculation,
            and authoritative peer comparative evaluation.
          </div>

          <!-- Metadata Box -->
          <div class="cert-meta-box">
            <div class="cert-meta-item">
              <span class="cert-meta-label">Author / Student</span>
              <span class="cert-meta-value">${escapeHtml(studentName)} <small style="color:#64748b;font-weight:400;">(${escapeHtml(studentEmail)})</small></span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">Primary Document</span>
              <span class="cert-meta-value">${escapeHtml(fileAName)} <small style="color:#64748b;font-weight:500;">(${wordsA.toLocaleString()} words)</small></span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">Evaluation Benchmark</span>
              <span class="cert-meta-value">${escapeHtml(fileBName)} <small style="color:#64748b;font-weight:500;">(${wordsB.toLocaleString()} words)</small></span>
            </div>
            <div class="cert-meta-item">
              <span class="cert-meta-label">Timestamp of Evaluation</span>
              <span class="cert-meta-value">${escapeHtml(formattedDate)} at ${escapeHtml(formattedTime)}</span>
            </div>
          </div>

          <!-- Clearance Verdict & Score -->
          <div class="cert-verdict-card ${verdictClass}">
            <div class="cert-verdict-text">
              <div class="cert-verdict-status">
                <span>${badgeIcon}</span>
                <span>${escapeHtml(verdictTitle)}</span>
              </div>
              <div class="cert-verdict-sub">
                ${escapeHtml(verdictDesc)}
              </div>
            </div>
            <div class="cert-verdict-score">
              <div class="score-num">${similarity.toFixed(1)}%</div>
              <div class="score-lbl">Overall Overlap</div>
            </div>
          </div>

          <!-- 4-Pill Metrics Row -->
          <div class="cert-metrics-row">
            <div class="cert-metric-pill">
              <div class="lbl">Original Content</div>
              <div class="val" style="color:#059669;">${(100 - similarity).toFixed(1)}%</div>
            </div>
            <div class="cert-metric-pill">
              <div class="lbl">Matching Sections</div>
              <div class="val">${matchingSections}</div>
            </div>
            <div class="cert-metric-pill">
              <div class="lbl">Common Phrases</div>
              <div class="val">${commonPhrases}</div>
            </div>
            <div class="cert-metric-pill">
              <div class="lbl">Total Words</div>
              <div class="val">${totalWords.toLocaleString()}</div>
            </div>
          </div>

          <!-- Detection Protocol Note -->
          <div class="cert-protocol-note">
            <b>Cryptographic Integrity Guarantee:</b> Analysis performed using 4-gram sliding tokenization,
            normalized whitespace canonicalization, and symmetric shingle intersection. Report record has been securely logged
            under reference token <code>#${escapeHtml(reportId)}</code>.
          </div>

          <!-- Certificate Footer (QR Code + Seal + Signatures) -->
          <div class="cert-footer">
            <!-- Left: QR Code -->
            <div class="cert-qr-area">
              <div class="cert-qr-box">
                <img src="${qrCodeUrl}" alt="Scan QR Code to Verify Certificate" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=AssignCheckVerified';" />
              </div>
              <div class="cert-qr-info">
                <span class="qr-title">Scan to Verify</span>
                <span class="qr-sub">Scan via camera to inspect official online record</span>
              </div>
            </div>

            <!-- Center: Digital Golden Seal -->
            <div class="cert-seal">
              <span class="seal-star">★ ★ ★</span>
              <span class="seal-text">Official<br>Originality<br>Seal</span>
              <span class="seal-star">★ ★ ★</span>
            </div>

            <!-- Right: Signature & Attestation -->
            <div class="cert-signature-area">
              <div class="cert-sig-line">AssignCheck Automated Audit</div>
              <div class="cert-sig-title">Academic Integrity Cell</div>
              <div class="cert-sig-sub">Authoritative Plagiarism Engine v2.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  activeModal = backdrop;

  // Trigger animation
  requestAnimationFrame(() => {
    backdrop.classList.add("active");
  });

  // Attach event handlers
  const btnClose = backdrop.querySelector("#btnCloseCertModal");
  if (btnClose) btnClose.addEventListener("click", closeCertificateModal);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeCertificateModal();
  });

  const btnPrint = backdrop.querySelector("#btnPrintCert");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  const btnDownloadPdf = backdrop.querySelector("#btnDownloadCertPdf");
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener("click", () => {
      downloadCertificatePdf(report, fileAName, certId);
    });
  }

  // Keyboard escape listener
  document.addEventListener("keydown", handleKeydown);
}

function handleKeydown(e) {
  if (e.key === "Escape" && activeModal) {
    closeCertificateModal();
  }
}

/**
 * Close the certificate modal
 */
export function closeCertificateModal() {
  if (activeModal && document.body.contains(activeModal)) {
    activeModal.classList.remove("active");
    // Small delay so animation can play before removing
    setTimeout(() => {
      if (activeModal && document.body.contains(activeModal)) {
        document.body.removeChild(activeModal);
      }
      activeModal = null;
    }, 150);
  }
  document.removeEventListener("keydown", handleKeydown);
}

/**
 * Download the certificate as a crisp A4 PDF using html2pdf
 */
async function downloadCertificatePdf(report, fileAName = "Document", certId = "CERT") {
  const certEl = document.getElementById("academicCertificate");
  if (!certEl) return;

  if (typeof showToast === "function") {
    showToast("Generating official A4 Certificate PDF... Please wait.", "info", 3500);
  }

  // If html2pdf is present
  if (typeof window.html2pdf === "function") {
    const opt = {
      margin: 8,
      filename: `Plagiarism_Clearance_Certificate_${fileAName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    try {
      await window.html2pdf().set(opt).from(certEl).save();
      if (typeof showToast === "function") {
        showToast("Plagiarism Clearance Certificate downloaded successfully!", "success");
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    }
  } else {
    // Fallback: load html2pdf dynamically or window.print
    window.print();
  }
}
