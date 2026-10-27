// toast.js
// Modern, accessible Toast & Confirmation Modal UI for AssignCheck
// Replaces blocking alert() and confirm() dialogs with elegant glassmorphic notifications

let toastContainer = null;

function ensureToastStyles() {
  if (document.getElementById("assigncheck-toast-styles")) return;

  const style = document.createElement("style");
  style.id = "assigncheck-toast-styles";
  style.textContent = `
    .ac-toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: 420px;
      width: calc(100vw - 48px);
    }

    .ac-toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 14px;
      background: rgba(18, 22, 36, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #f1f3f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .ac-toast.ac-toast-visible {
      transform: translateX(0);
      opacity: 1;
    }

    .ac-toast.ac-toast-hiding {
      transform: translateX(120%);
      opacity: 0;
    }

    .ac-toast-icon {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      margin-top: 1px;
    }

    .ac-toast-content {
      flex: 1;
      min-width: 0;
      word-break: break-word;
    }

    .ac-toast-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 2px;
      color: #ffffff;
    }

    .ac-toast-message {
      font-size: 13.5px;
      color: #b8c0d9;
    }

    .ac-toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: #7d87a8;
      cursor: pointer;
      padding: 2px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background-color 0.15s;
    }

    .ac-toast-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .ac-toast-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      transform-origin: left;
    }

    /* Types */
    .ac-toast-success {
      border-left: 4px solid #10b981;
    }
    .ac-toast-success .ac-toast-icon { color: #10b981; }
    .ac-toast-success .ac-toast-bar { background: linear-gradient(90deg, #10b981, #34d399); }

    .ac-toast-error {
      border-left: 4px solid #f43f5e;
    }
    .ac-toast-error .ac-toast-icon { color: #f43f5e; }
    .ac-toast-error .ac-toast-bar { background: linear-gradient(90deg, #f43f5e, #fb7185); }

    .ac-toast-warning {
      border-left: 4px solid #f59e0b;
    }
    .ac-toast-warning .ac-toast-icon { color: #f59e0b; }
    .ac-toast-warning .ac-toast-bar { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

    .ac-toast-info {
      border-left: 4px solid #3b82f6;
    }
    .ac-toast-info .ac-toast-icon { color: #3b82f6; }
    .ac-toast-info .ac-toast-bar { background: linear-gradient(90deg, #3b82f6, #60a5fa); }

    /* Modal Backdrop & Confirm Box */
    .ac-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 7, 15, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .ac-modal-backdrop.ac-modal-visible {
      opacity: 1;
    }

    .ac-modal-card {
      background: #131726;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      padding: 28px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      transform: scale(0.92);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      color: #f1f3f9;
    }

    .ac-modal-backdrop.ac-modal-visible .ac-modal-card {
      transform: scale(1);
    }

    .ac-modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .ac-modal-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
      flex-shrink: 0;
    }

    .ac-modal-icon.ac-icon-info {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    .ac-modal-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }

    .ac-modal-body {
      color: #a4adc9;
      font-size: 14.5px;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .ac-modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .ac-btn {
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .ac-btn-cancel {
      background: rgba(255, 255, 255, 0.08);
      color: #c5cde3;
    }

    .ac-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }

    .ac-btn-danger {
      background: #e11d48;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);
    }

    .ac-btn-danger:hover {
      background: #f43f5e;
    }

    .ac-btn-primary {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }

    .ac-btn-primary:hover {
      background: #3b82f6;
    }
  `;
  document.head.appendChild(style);
}

function ensureToastContainer() {
  ensureToastStyles();
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement("div");
    toastContainer.className = "ac-toast-container";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

const ICONS = {
  success: `<svg class="ac-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
  error: `<svg class="ac-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
  warning: `<svg class="ac-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
  info: `<svg class="ac-toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
};

/**
 * Display a modern toast notification
 * @param {string} message - Message text
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Auto close duration in ms (default: 3500)
 */
export function showToast(message, type = "info", duration = 3500) {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = `ac-toast ac-toast-${type}`;

  const iconSvg = ICONS[type] || ICONS.info;

  const defaultTitles = {
    success: "Success",
    error: "Error",
    warning: "Notice",
    info: "Information"
  };

  toast.innerHTML = `
    ${iconSvg}
    <div class="ac-toast-content">
      <div class="ac-toast-title">${defaultTitles[type] || "Notice"}</div>
      <div class="ac-toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="ac-toast-close" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div class="ac-toast-bar"></div>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("ac-toast-visible");
  });

  const progressBar = toast.querySelector(".ac-toast-bar");
  if (progressBar && duration > 0) {
    progressBar.style.transition = `transform ${duration}ms linear`;
    requestAnimationFrame(() => {
      progressBar.style.transform = "scaleX(0)";
    });
  }

  let dismissTimeout = null;
  const dismiss = () => {
    if (dismissTimeout) clearTimeout(dismissTimeout);
    toast.classList.remove("ac-toast-visible");
    toast.classList.add("ac-toast-hiding");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  };

  toast.querySelector(".ac-toast-close").addEventListener("click", dismiss);

  if (duration > 0) {
    dismissTimeout = setTimeout(dismiss, duration);
  }

  return { dismiss };
}

/**
 * Display a sleek confirmation modal (replaces window.confirm)
 * @param {string} message - Question / prompt message
 * @param {object} options - Configuration options
 * @returns {Promise<boolean>}
 */
export function showConfirm(message, {
  title = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true
} = {}) {
  ensureToastStyles();

  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "ac-modal-backdrop";

    const iconSvg = isDanger
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;

    backdrop.innerHTML = `
      <div class="ac-modal-card" role="dialog" aria-modal="true" aria-labelledby="ac-modal-title">
        <div class="ac-modal-header">
          <div class="ac-modal-icon ${isDanger ? '' : 'ac-icon-info'}">
            ${iconSvg}
          </div>
          <h3 id="ac-modal-title" class="ac-modal-title">${escapeHtml(title)}</h3>
        </div>
        <div class="ac-modal-body">${escapeHtml(message)}</div>
        <div class="ac-modal-actions">
          <button type="button" class="ac-btn ac-btn-cancel" id="ac-cancel-btn">${escapeHtml(cancelText)}</button>
          <button type="button" class="ac-btn ${isDanger ? 'ac-btn-danger' : 'ac-btn-primary'}" id="ac-confirm-btn">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Fade in
    requestAnimationFrame(() => {
      backdrop.classList.add("ac-modal-visible");
    });

    const cleanup = (result) => {
      backdrop.classList.remove("ac-modal-visible");
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        document.removeEventListener("keydown", onKeyDown);
        resolve(result);
      }, 250);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") cleanup(false);
      if (e.key === "Enter") cleanup(true);
    };

    document.addEventListener("keydown", onKeyDown);

    backdrop.querySelector("#ac-cancel-btn").addEventListener("click", () => cleanup(false));
    backdrop.querySelector("#ac-confirm-btn").addEventListener("click", () => cleanup(true));

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) cleanup(false);
    });

    backdrop.querySelector("#ac-confirm-btn").focus();
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Make accessible to non-module scripts as well
if (typeof window !== "undefined") {
  window.showToast = showToast;
  window.showConfirm = showConfirm;
}
