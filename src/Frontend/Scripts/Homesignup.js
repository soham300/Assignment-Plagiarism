import {
  handleLogin,
  handleSignup,
  resetPassword,
  togglePassword,
  logoutUser,
  updateNavbar,
  closeAuth,
} from "../../Backend/HomeBackend.js";

// =========================================
// MODAL & PANEL MANAGEMENT (FIXES ARIA ERROR)
// =========================================
const authModal = document.getElementById("authModal");
const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");
const resetPanel = document.getElementById("resetPanel");
const authClose = document.getElementById("authClose");

let lastFocusedElement = null;

function openModal(panelId) {
  // 1. Save the element that triggered the modal to restore focus later
  lastFocusedElement = document.activeElement;

  // 2. ✅ CRITICAL FIX: Remove aria-hidden BEFORE focusing anything inside
  if (authModal) {
    authModal.removeAttribute("aria-hidden");
    authModal.classList.add("open");
    document.body.classList.add("modal-open");
  }

  // 3. Switch to the correct panel
  if (loginPanel) loginPanel.classList.remove("active");
  if (signupPanel) signupPanel.classList.remove("active");
  if (resetPanel) resetPanel.classList.remove("active");

  const targetPanel = document.getElementById(panelId);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // 4. Focus the first input in the active panel AFTER paint
  requestAnimationFrame(() => {
    const firstInput = targetPanel?.querySelector("input");
    if (firstInput) {
      firstInput.focus();
    }
  });
}

function closeModal() {
  if (authModal) {
    authModal.classList.remove("open");
    document.body.classList.remove("modal-open");
    
    // ✅ CRITICAL FIX: Restore aria-hidden AFTER closing
    authModal.setAttribute("aria-hidden", "true");
  }

  // Clear any form errors when closing
  document.querySelectorAll(".auth-field").forEach((field) => {
    field.classList.remove("error");
  });

  // Restore focus to the element that opened the modal
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }

  // Call backend cleanup if it exists
  if (typeof closeAuth === "function") {
    closeAuth();
  }
}

// =========================================
// OPEN MODAL BUTTONS (Navbar & Footer)
// =========================================
const authButtons = document.querySelectorAll(".js-auth-open, [data-auth]");
authButtons.forEach(function (button) {
  button.addEventListener("click", function (event) {
    event.preventDefault();
    const action = button.getAttribute("data-auth");
    if (action === "login") {
      openModal("loginPanel");
    } else if (action === "signup") {
      openModal("signupPanel");
    }
  });
});

// =========================================
// CLOSE MODAL (X button, backdrop, ESC key)
// =========================================
if (authClose) {
  authClose.addEventListener("click", closeModal);
}

if (authModal) {
  authModal.addEventListener("click", function (event) {
    if (event.target === authModal) {
      closeModal(); // Close when clicking the dark backdrop
    }
  });
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && authModal?.classList.contains("open")) {
    closeModal();
  }
});

// =========================================
// PANEL SWITCHING (Inside Modal)
// =========================================
const switchButtons = document.querySelectorAll("[data-switch]");
switchButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const target = button.getAttribute("data-switch");
    if (target === "signup") {
      openModal("signupPanel");
    } else if (target === "reset") {
      openModal("resetPanel");
    } else if (target === "login") {
      openModal("loginPanel");
    }
  });
});

// =========================================
// FORGOT PASSWORD
// =========================================
const forgotLink = document.getElementById("forgotLink");
if (forgotLink !== null) {
  forgotLink.addEventListener("click", function (event) {
    event.preventDefault();
    openModal("resetPanel");
  });
}

// =========================================
// FORM SUBMISSIONS
// =========================================
const loginForm = document.getElementById("loginForm");
if (loginForm !== null) {
  loginForm.addEventListener("submit", handleLogin);
}

const signupForm = document.getElementById("signupForm");
if (signupForm !== null) {
  signupForm.addEventListener("submit", handleSignup);
}

const resetForm = document.getElementById("resetForm");
if (resetForm !== null) {
  resetForm.addEventListener("submit", resetPassword);
}

// =========================================
// PASSWORD SHOW / HIDE
// =========================================
const passwordButtons = document.querySelectorAll(".pw-toggle");
passwordButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const inputId = button.getAttribute("data-target");
    togglePassword(inputId, button);
  });
});

// =========================================
// PROFILE DROPDOWN MENUS
// =========================================
const profileButton = document.getElementById("profileButton");
const profileMenu = document.getElementById("profileMenu");

if (profileButton !== null && profileMenu !== null) {
  profileButton.addEventListener("click", function (event) {
    event.stopPropagation();
    profileMenu.classList.toggle("open");
    const isOpen = profileMenu.classList.contains("open");
    profileButton.setAttribute("aria-expanded", isOpen);
  });
}

const mobileProfileButton = document.getElementById("mobileProfileButton");
const mobileProfileMenu = document.getElementById("mobileProfileMenu");

if (mobileProfileButton !== null && mobileProfileMenu !== null) {
  mobileProfileButton.addEventListener("click", function (event) {
    event.stopPropagation();
    mobileProfileMenu.classList.toggle("open");
    const isOpen = mobileProfileMenu.classList.contains("open");
    mobileProfileButton.setAttribute("aria-expanded", isOpen);
  });
}

// =========================================
// LOGOUT
// =========================================
const logoutButton = document.getElementById("logoutButton");
if (logoutButton !== null) {
  logoutButton.addEventListener("click", function () {
    logoutUser();
    if (profileMenu) profileMenu.classList.remove("open");
  });
}

const mobileLogoutButton = document.getElementById("mobileLogoutButton");
if (mobileLogoutButton !== null) {
  mobileLogoutButton.addEventListener("click", function () {
    logoutUser();
    if (mobileProfileMenu) mobileProfileMenu.classList.remove("open");
  });
}

// =========================================
// CLOSE PROFILE MENU WHEN CLICKING OUTSIDE
// =========================================
document.addEventListener("click", function () {
  if (profileMenu !== null) {
    profileMenu.classList.remove("open");
  }
  if (mobileProfileMenu !== null) {
    mobileProfileMenu.classList.remove("open");
  }
});

// =========================================
// CLEAR ERRORS ON INPUT TYPING
// =========================================
document.querySelectorAll(".auth-field input").forEach((input) => {
  input.addEventListener("input", function () {
    input.closest(".auth-field")?.classList.remove("error");
  });
});

// =========================================
// UPDATE NAVBAR WHEN PAGE LOADS
// =========================================
updateNavbar();