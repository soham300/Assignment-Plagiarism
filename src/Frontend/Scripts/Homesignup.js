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
// LOGIN FORM
// =========================================

const loginForm = document.getElementById("loginForm");

if (loginForm !== null) {
  loginForm.addEventListener("submit", handleLogin);
}

// =========================================
// SIGN UP FORM
// =========================================

const signupForm = document.getElementById("signupForm");

if (signupForm !== null) {
  signupForm.addEventListener("submit", handleSignup);
}

// =========================================
// RESET PASSWORD FORM
// =========================================

const resetForm = document.getElementById("resetForm");

if (resetForm !== null) {
  resetForm.addEventListener("submit", resetPassword);
}

// =========================================
// FORGOT PASSWORD
// =========================================

const forgotLink = document.getElementById("forgotLink");

if (forgotLink !== null) {
  forgotLink.addEventListener("click", function (event) {
    event.preventDefault();

    document.getElementById("loginPanel").classList.remove("active");

    document.getElementById("resetPanel").classList.add("active");
  });
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
// LOGIN / SIGN UP NAVBAR BUTTONS
// =========================================

const authButtons = document.querySelectorAll(".js-auth-open");

authButtons.forEach(function (button) {
  button.addEventListener("click", function (event) {
    event.preventDefault();

    const action = button.getAttribute("data-auth");

    // =================================
    // LOGIN
    // =================================

    if (action === "login") {
      document.getElementById("signupPanel").classList.remove("active");

      document.getElementById("resetPanel").classList.remove("active");

      document.getElementById("loginPanel").classList.add("active");

      document.getElementById("authModal").classList.add("open");

      return;
    }

    // =================================
    // SIGN UP
    // =================================

    if (action === "signup") {
      document.getElementById("loginPanel").classList.remove("active");

      document.getElementById("resetPanel").classList.remove("active");

      document.getElementById("signupPanel").classList.add("active");

      document.getElementById("authModal").classList.add("open");

      return;
    }
  });
});

// =========================================
// PROFILE BUTTON
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

// =========================================
// MOBILE PROFILE BUTTON
// =========================================

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

    profileMenu.classList.remove("open");
  });
}

// =========================================
// MOBILE LOGOUT
// =========================================

const mobileLogoutButton = document.getElementById("mobileLogoutButton");

if (mobileLogoutButton !== null) {
  mobileLogoutButton.addEventListener("click", function () {
    logoutUser();

    mobileProfileMenu.classList.remove("open");
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
// UPDATE NAVBAR WHEN PAGE LOADS
// =========================================

updateNavbar();
