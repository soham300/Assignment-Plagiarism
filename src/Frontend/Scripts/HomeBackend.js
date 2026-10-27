import API_BASE from "./config.js";

// =========================================
// LOGIN HANDLER
// =========================================

export async function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
  const password = passwordInput ? passwordInput.value : "";

  // Clear any previous error
  showFormError("loginError", "");
  showFormError("loginInfo", "");

  if (email === "" || password === "") {
    showFormError("loginError", "Please enter your email and password.");
    return;
  }

  const submitBtn = event.target ? event.target.querySelector("button[type='submit']") : null;
  const originalBtnText = submitBtn ? submitBtn.textContent : "Login";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
  }

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showFormError("loginError", data.error || "Invalid email or password.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
      return;
    }

    // Store auth credentials
    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    if (data.user && data.user.name) {
      localStorage.setItem("userName", data.user.name);
    }
    if (data.user && data.user.role) {
      localStorage.setItem("userRole", data.user.role);
    }
    sessionStorage.clear();

    await updateNavbar();
    closeAuth();

    // Show toast feedback and redirect to plagiarism checker
    const toastMsg = document.getElementById("toastMsg");
    const toast = document.getElementById("toast");
    if (toastMsg && toast) {
      toastMsg.textContent = "Login successful! Opening Check Assignment...";
      toast.classList.add("show");
    }

    setTimeout(() => {
      window.location.href = "CheckAssign.html";
    }, 700);

  } catch (err) {
    console.error("Login request error:", err);
    showFormError("loginError", "Could not connect to server. Please try again.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

// =========================================
// SIGNUP HANDLER
// =========================================

export async function handleSignup(event) {
  event.preventDefault();
  const nameInput = document.getElementById("signupName");
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const confirmInput = document.getElementById("signupConfirm");

  const name = nameInput ? nameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
  const password = passwordInput ? passwordInput.value : "";
  const confirmPassword = confirmInput ? confirmInput.value : "";

  // Clear any previous error
  showFormError("signupError", "");

  if (name === "" || email === "" || password === "" || confirmPassword === "") {
    showFormError("signupError", "Please fill all fields.");
    return;
  }

  // Basic email format check
  if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
    showFormError("signupError", "Please enter a valid email address.");
    return;
  }

  if (password.length < 6) {
    showFormError("signupError", "Password must contain at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    showFormError("signupError", "Passwords do not match.");
    return;
  }

  const submitBtn = event.target ? event.target.querySelector("button[type='submit']") : null;
  const originalBtnText = submitBtn ? submitBtn.textContent : "Create Account";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Account...";
  }

  const newUser = {
    name: name,
    email: email,
    password: password
  };

  try {
    const signupRes = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });

    const signupData = await signupRes.json();

    if (!signupRes.ok) {
      showFormError("signupError", signupData.error || "Signup failed. Please try again.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
      return;
    }

    // Auto-login with returned token
    if (signupData.token) {
      localStorage.setItem("authToken", signupData.token);
    }
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);
    sessionStorage.clear();

    const signupForm = document.getElementById("signupForm");
    if (signupForm) signupForm.reset();

    await updateNavbar();
    closeAuth();

    // Show toast feedback and redirect
    const toastMsg = document.getElementById("toastMsg");
    const toast = document.getElementById("toast");
    if (toastMsg && toast) {
      toastMsg.textContent = "Account created! Opening Check Assignment...";
      toast.classList.add("show");
    }

    setTimeout(() => {
      window.location.href = "CheckAssign.html";
    }, 700);

  } catch (err) {
    console.error("Signup request error:", err);
    showFormError("signupError", "Could not connect to server. Please try again.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

// =========================================
// PASSWORD RESET HANDLERS
// =========================================

export async function handleSendResetCode(event) {
  if (event && event.preventDefault) event.preventDefault();
  const emailInput = document.getElementById("resetEmail");
  const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
  const infoEl = document.getElementById("resetTokenInfo");

  showFormError("resetError", "");
  if (!email || email.indexOf("@") === -1) {
    showFormError("resetError", "Please enter your registered email address first.");
    return;
  }

  const btn = document.getElementById("sendResetCodeBtn");
  if (btn) btn.textContent = "Sending...";

  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      if (data.resetToken) {
        const tokenInput = document.getElementById("resetToken");
        if (tokenInput) tokenInput.value = data.resetToken;
      }
      if (infoEl) {
        infoEl.textContent = `Verification code: ${data.resetToken || "Sent to email"} (valid for 15 minutes).`;
        infoEl.style.color = "#10b981";
      }
    } else {
      showFormError("resetError", data.error || "Failed to generate reset code.");
    }
  } catch (err) {
    showFormError("resetError", "Server error while requesting reset code.");
  } finally {
    if (btn) btn.textContent = "Get Code";
  }
}

export async function resetPassword(event) {
  event.preventDefault();
  const email = document.getElementById("resetEmail").value.trim().toLowerCase();
  const tokenInput = document.getElementById("resetToken");
  const resetToken = tokenInput ? tokenInput.value.trim() : "";
  const newPassword = document.getElementById("resetPassword").value;
  const confirmPassword = document.getElementById("resetConfirm").value;

  // Clear any previous error
  showFormError("resetError", "");

  if (email === "" || newPassword === "" || confirmPassword === "") {
    showFormError("resetError", "Please fill all fields.");
    return;
  }

  if (!resetToken) {
    showFormError("resetError", "Please enter the verification code or click 'Get Code'.");
    return;
  }

  if (newPassword.length < 6) {
    showFormError("resetError", "Password must contain at least 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    showFormError("resetError", "Passwords do not match.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resetToken, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      showFormError("resetError", data.error || "Failed to reset password.");
      return;
    }

    document.getElementById("resetForm").reset();
    document.getElementById("resetPanel").classList.remove("active");
    document.getElementById("loginPanel").classList.add("active");

    showFormError("loginInfo", "Password updated successfully! Please log in.");
  } catch (err) {
    showFormError("resetError", "Server error. Please try again.");
  }
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

export function togglePassword(inputId, button) {
  const passwordInput = document.getElementById(inputId);
  if (!passwordInput) return;
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    button.setAttribute("aria-label", "Hide password");
  } else {
    passwordInput.type = "password";
    button.setAttribute("aria-label", "Show password");
  }
}

export function logoutUser() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  sessionStorage.clear();

  updateNavbar();

  const toastMsg = document.getElementById("toastMsg");
  const toast = document.getElementById("toast");
  if (toastMsg && toast) {
    toastMsg.textContent = "Logged out successfully.";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }
}

// =========================================
// NAVBAR AUTH STATE UPDATE
// =========================================

export async function updateNavbar() {
  const token = localStorage.getItem("authToken");
  const loggedIn = localStorage.getItem("loggedIn") === "true";
  const userEmail = localStorage.getItem("userEmail");
  const userName = localStorage.getItem("userName");
  const loginButton = document.getElementById("loginNavButton");
  const signupButton = document.getElementById("signupNavButton");
  const profileWrap = document.getElementById("profileWrap");
  const profileButton = document.getElementById("profileButton");
  const mobileLoginButton = document.getElementById("mobileLoginButton");
  const mobileSignupButton = document.getElementById("mobileSignupButton");
  const mobileProfileWrap = document.getElementById("mobileProfileWrap");
  const mobileProfileButton = document.getElementById("mobileProfileButton");

  if (loggedIn && (token || userEmail)) {
    const displayName = userName || userEmail || "U";
    const firstLetter = displayName.charAt(0).toUpperCase();

    // Show logged-in UI immediately so there is no flickering
    if (loginButton !== null) loginButton.style.display = "none";
    if (signupButton !== null) signupButton.style.display = "none";
    if (profileWrap !== null) profileWrap.classList.add("show");
    if (profileButton !== null) profileButton.textContent = firstLetter;
    if (mobileLoginButton !== null) mobileLoginButton.style.display = "none";
    if (mobileSignupButton !== null) mobileSignupButton.style.display = "none";
    if (mobileProfileWrap !== null) mobileProfileWrap.classList.add("show");
    if (mobileProfileButton !== null) mobileProfileButton.textContent = firstLetter;

    // Background verification if token exists
    if (token) {
      try {
        const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.user && verifyData.user.name) {
            const letter = verifyData.user.name.charAt(0).toUpperCase();
            if (profileButton !== null) profileButton.textContent = letter;
            if (mobileProfileButton !== null) mobileProfileButton.textContent = letter;
            localStorage.setItem("userName", verifyData.user.name);
          }
        } else if (verifyRes.status === 401 || verifyRes.status === 403) {
          // Token is genuinely invalid on server
          localStorage.removeItem("authToken");
          localStorage.removeItem("loggedIn");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userName");
          updateNavbar();
        }
      } catch (err) {
        // Network temporary disconnect: do not wipe user auth state
        console.warn("Auth verify network notice:", err.message);
      }
    }
  } else {
    if (loginButton !== null) loginButton.style.display = "";
    if (signupButton !== null) signupButton.style.display = "";
    if (profileWrap !== null) profileWrap.classList.remove("show");
    if (mobileLoginButton !== null) mobileLoginButton.style.display = "";
    if (mobileSignupButton !== null) mobileSignupButton.style.display = "";
    if (mobileProfileWrap !== null) mobileProfileWrap.classList.remove("show");
  }
}

export function closeAuth() {
  const authModal = document.getElementById("authModal");
  if (authModal !== null) {
    authModal.classList.remove("open");
    authModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}

export function showFormError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el !== null) {
    el.textContent = message;
  }
}