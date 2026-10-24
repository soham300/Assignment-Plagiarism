// ======================================================
// LOGIN
// ======================================================


export async function handleLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (email === "" || password === "") {
    await showCustomAlert("Please enter email and password.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8005/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      await showCustomAlert(
        result.message || "Invalid email or password."
      );
      return;
    }

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", result.user.email);

    await showCustomAlert("Login successful!");
    await updateNavbar();
    closeAuth();

  } catch (error) {
    console.error("Login error:", error);
    await showCustomAlert("Unable to login. Please try again.");
  }
}


// ======================================================
// SIGNUP
// ======================================================

export async function handleSignup(event) {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value.trim();
  const confirmPassword = document.getElementById("signupConfirm").value.trim();

  if (name === "" || email === "" || password === "" || confirmPassword === "") {
    await showCustomAlert("Please fill all fields.");
    return;
  }

  if (password.length < 6) {
    await showCustomAlert("Password must contain at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    await showCustomAlert("Passwords do not match.");
    return;
  }

  try {
    // const response = await fetch(
    //   "http://localhost:8005/users?"
    // );

    // if (!response.ok) {
    //   throw new Error("Failed to check existing users.");
    // }

    // const users = await response.json();

    // if (users.length > 0) {
    //   await showCustomAlert("An account with this email already exists.");
    //   return;
    // }

    // Backend will hash the password automatically, so send plain text
    const newUser = {
      username: name,
      email: email,
      password: password
    };

    const userResponse = await fetch(
      "http://localhost:8005/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUser)
      }
    );

    if (!userResponse.ok) {
      throw new Error("Failed to create user.");
    }

    // // Create file data
    // const fileuserdata = {
    //   email: email,
    //   filedetails: []
    // };

    // await fetch(
    //   "http://localhost:8005/filedata",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(fileuserdata)
    //   }
    // )


    

    // // Create file result
    // const resultsection = {
    //   email: email,
    //   filesprocesed: []
    // };

    // await fetch(
    //   "http://localhost:8005/fileresult",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(resultsection)
    //   }
    // );

    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userEmail");

    await showCustomAlert("Account created successfully! Please login.");
    document.getElementById("signupForm").reset();
    document.getElementById("signupPanel").classList.remove("active");
    document.getElementById("loginPanel").classList.add("active");

  } catch (error) {
    console.error("Signup error:", error);
    await showCustomAlert("Unable to create account. Please try again.");
  }


}


// ======================================================
// SHOW / HIDE PASSWORD
// ======================================================

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


// ======================================================
// LOGOUT
// ======================================================

export async function logoutUser() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");

  await updateNavbar();
  await showCustomAlert("You have been logged out.");
}


// ======================================================
// UPDATE NAVBAR
// ======================================================

export async function updateNavbar() {
  const loggedIn = localStorage.getItem("loggedIn") === "true";
  const userEmail = localStorage.getItem("userEmail");

  const loginButton = document.getElementById("loginNavButton");
  const signupButton = document.getElementById("signupNavButton");
  const profileWrap = document.getElementById("profileWrap");
  const profileButton = document.getElementById("profileButton");
  const mobileLoginButton = document.getElementById("mobileLoginButton");
  const mobileSignupButton = document.getElementById("mobileSignupButton");
  const mobileProfileWrap = document.getElementById("mobileProfileWrap");
  const mobileProfileButton = document.getElementById("mobileProfileButton");

  if (loggedIn && userEmail !== null) {
    try {
      const response = await fetch(
        "https://checkassign-assignment-plagiarism.onrender.com/users?email=" +
        encodeURIComponent(userEmail)
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user.");
      }

      const users = await response.json();

      if (users.length === 0) {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userEmail");
        return;
      }

      const user = users[0];
      const firstLetter = user.name.charAt(0).toUpperCase();

      // DESKTOP NAVBAR
      if (loginButton !== null) loginButton.style.display = "none";
      if (signupButton !== null) signupButton.style.display = "none";
      if (profileWrap !== null) profileWrap.classList.add("show");
      if (profileButton !== null) profileButton.textContent = firstLetter;

      // MOBILE NAVBAR
      if (mobileLoginButton !== null) mobileLoginButton.style.display = "none";
      if (mobileSignupButton !== null) mobileSignupButton.style.display = "none";
      if (mobileProfileWrap !== null) mobileProfileWrap.classList.add("show");
      if (mobileProfileButton !== null) mobileProfileButton.textContent = firstLetter;

    } catch (error) {
      console.error("Navbar update error:", error);
    }
  } else {
    // LOGGED OUT
    if (loginButton !== null) loginButton.style.display = "";
    if (signupButton !== null) signupButton.style.display = "";
    if (profileWrap !== null) profileWrap.classList.remove("show");

    if (mobileLoginButton !== null) mobileLoginButton.style.display = "";
    if (mobileSignupButton !== null) mobileSignupButton.style.display = "";
    if (mobileProfileWrap !== null) mobileProfileWrap.classList.remove("show");
  }
}


// ======================================================
// CLOSE AUTH MODAL
// ======================================================

export function closeAuth() {
  const authModal = document.getElementById("authModal");

  if (authModal !== null) {
    document.activeElement?.blur();
    authModal.classList.remove("open");
    authModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}