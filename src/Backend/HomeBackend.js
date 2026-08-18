// =========================================
// LOGIN
// =========================================

export function handleLogin(event) {
  event.preventDefault();

  const email = document
    .getElementById("loginEmail")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("loginPassword").value;

  if (email === "" || password === "") {
    alert("Please enter email and password.");
    return;
  }

  const savedUser = localStorage.getItem("user");

  if (savedUser === null) {
    alert("No account found. Please sign up first.");
    return;
  }

  const user = JSON.parse(savedUser);

  if (email === user.email && password === user.password) {
    localStorage.setItem("loggedIn", "true");

    alert("Login successful!");

    updateNavbar();

    closeAuth();
  } else {
    alert("Invalid email or password.");
  }
}

// =========================================
// SIGN UP
// =========================================

export function handleSignup(event) {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();

  const email = document
    .getElementById("signupEmail")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("signupPassword").value;

  const confirmPassword = document.getElementById("signupConfirm").value;

  if (
    name === "" ||
    email === "" ||
    password === "" ||
    confirmPassword === ""
  ) {
    alert("Please fill all fields.");
    return;
  }

  if (password.length < 6) {
    alert("Password must contain at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const savedUser = localStorage.getItem("user");

  if (savedUser !== null) {
    const oldUser = JSON.parse(savedUser);

    if (oldUser.email === email) {
      alert("An account with this email already exists.");
      return;
    }
  }

  const newUser = {
    name: name,
    email: email,
    password: password,
  };

  localStorage.setItem("user", JSON.stringify(newUser));

  // Make sure user is NOT automatically logged in
  localStorage.removeItem("loggedIn");

  alert("Account created successfully! Please login.");

  document.getElementById("signupForm").reset();

  // Close signup
  document.getElementById("signupPanel").classList.remove("active");

  // Open login
  document.getElementById("loginPanel").classList.add("active");
}

// =========================================
// RESET PASSWORD
// =========================================

export function resetPassword(event) {
  event.preventDefault();

  const email = document
    .getElementById("resetEmail")
    .value.trim()
    .toLowerCase();

  const newPassword = document.getElementById("resetPassword").value;

  const confirmPassword = document.getElementById("resetConfirm").value;

  if (email === "" || newPassword === "" || confirmPassword === "") {
    alert("Please fill all fields.");
    return;
  }

  const savedUser = localStorage.getItem("user");

  if (savedUser === null) {
    alert("No account found.");
    return;
  }

  const user = JSON.parse(savedUser);

  if (email !== user.email) {
    alert("No account found with this email.");
    return;
  }

  if (newPassword.length < 6) {
    alert("Password must contain at least 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  user.password = newPassword;

  localStorage.setItem("user", JSON.stringify(user));

  alert("Password reset successfully! Please login.");

  document.getElementById("resetForm").reset();

  document.getElementById("resetPanel").classList.remove("active");

  document.getElementById("loginPanel").classList.add("active");
}

// =========================================
// SHOW / HIDE PASSWORD
// =========================================

export function togglePassword(inputId, button) {
  const passwordInput = document.getElementById(inputId);

  if (passwordInput.type === "password") {
    passwordInput.type = "text";

    button.setAttribute("aria-label", "Hide password");
  } else {
    passwordInput.type = "password";

    button.setAttribute("aria-label", "Show password");
  }
}

// =========================================
// LOGOUT
// =========================================

export function logoutUser() {
  localStorage.removeItem("loggedIn");

  updateNavbar();

  alert("You have been logged out.");
}

// =========================================
// UPDATE NAVBAR
// =========================================

export function updateNavbar() {
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  const savedUser = localStorage.getItem("user");

  // Desktop buttons
  const loginButton = document.getElementById("loginNavButton");

  const signupButton = document.getElementById("signupNavButton");

  const profileWrap = document.getElementById("profileWrap");

  const profileButton = document.getElementById("profileButton");

  // Mobile buttons
  const mobileLoginButton = document.getElementById("mobileLoginButton");

  const mobileSignupButton = document.getElementById("mobileSignupButton");

  const mobileProfileWrap = document.getElementById("mobileProfileWrap");

  const mobileProfileButton = document.getElementById("mobileProfileButton");

  // =========================================
  // LOGGED IN
  // =========================================

  if (loggedIn && savedUser !== null) {
    const user = JSON.parse(savedUser);

    const firstLetter = user.name.charAt(0).toUpperCase();

    // Desktop

    if (loginButton !== null) {
      loginButton.style.display = "none";
    }

    if (signupButton !== null) {
      signupButton.style.display = "none";
    }

    if (profileWrap !== null) {
      profileWrap.classList.add("show");
    }

    if (profileButton !== null) {
      profileButton.textContent = firstLetter;
    }

    // Mobile

    if (mobileLoginButton !== null) {
      mobileLoginButton.style.display = "none";
    }

    if (mobileSignupButton !== null) {
      mobileSignupButton.style.display = "none";
    }

    if (mobileProfileWrap !== null) {
      mobileProfileWrap.classList.add("show");
    }

    if (mobileProfileButton !== null) {
      mobileProfileButton.textContent = firstLetter;
    }
  }

  // =========================================
  // LOGGED OUT
  // =========================================
  else {
    // Desktop

    if (loginButton !== null) {
      loginButton.style.display = "";
    }

    if (signupButton !== null) {
      signupButton.style.display = "";
    }

    if (profileWrap !== null) {
      profileWrap.classList.remove("show");
    }

    // Mobile

    if (mobileLoginButton !== null) {
      mobileLoginButton.style.display = "";
    }

    if (mobileSignupButton !== null) {
      mobileSignupButton.style.display = "";
    }

    if (mobileProfileWrap !== null) {
      mobileProfileWrap.classList.remove("show");
    }
  }
}

// =========================================
// CLOSE AUTH MODAL
// =========================================

export function closeAuth() {
  const authModal = document.getElementById("authModal");

  if (authModal !== null) {
    authModal.classList.remove("open");

    authModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");
  }
}
