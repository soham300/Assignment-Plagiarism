

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

    // console.log(result);
    localStorage.setItem("token",result.token);


    await showCustomAlert("Login successful!");
    await updateNavbar();
    closeAuth();

  } catch (error) {
    console.error("Login error:", error);
    await showCustomAlert("Unable to login. Please try again.");
  }
}




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

    const result = await userResponse.json();
    
    if (userResponse.status === 409) {
      await showCustomAlert(
        result.message || "An account with this email already exists."
      );
      document.getElementById("signupForm").reset();
      document.getElementById("signupPanel").classList.remove("active");
      document.getElementById("loginPanel").classList.add("active");
      return;
    }

    // Handle other errors  
    if (!userResponse.ok) {
      await showCustomAlert(
        result.message || "Unable to create account. Please try again."
      );
      return;
    }

    // // Create file data
    const fileuserdata = {
      email: email,
      filedetails: []
    };

    await fetch(
      "http://localhost:8005/filedata",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fileuserdata)
      }
    )


    

    // // // Create file result
    const resultsection = {
      email: email,
      
      filesprocesed: []
    };

    await fetch(
      "http://localhost:8005/fileresult",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(resultsection)
      }
    );

    // localStorage.removeItem("loggedIn");
    // localStorage.removeItem("userEmail");
    localStorage.removeItem("token");

    await showCustomAlert("Account created successfully! Please login.");
    document.getElementById("signupForm").reset();
    document.getElementById("signupPanel").classList.remove("active");
    document.getElementById("loginPanel").classList.add("active");

  } catch (error) {
    console.error("Signup error:", error);
    await showCustomAlert("Unable to create account. Please try again.");
  }


}




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




export async function logoutUser() {
  localStorage.removeItem("token");
  await updateNavbar();
  await showCustomAlert("You have been logged out.");
}






export async function updateNavbar() {
  const token = localStorage.getItem("token");

  const loginButton = document.getElementById("loginNavButton");
  const signupButton = document.getElementById("signupNavButton");
  const profileWrap = document.getElementById("profileWrap");
  const profileButton = document.getElementById("profileButton");

  const mobileLoginButton =
    document.getElementById("mobileLoginButton");
  const mobileSignupButton =
    document.getElementById("mobileSignupButton");
  const mobileProfileWrap =
    document.getElementById("mobileProfileWrap");
  const mobileProfileButton =
    document.getElementById("mobileProfileButton");

  function showLoggedOut() {
    if (loginButton) loginButton.style.display = "";
    if (signupButton) signupButton.style.display = "";
    if (profileWrap) profileWrap.classList.remove("show");

    if (mobileLoginButton) mobileLoginButton.style.display = "";
    if (mobileSignupButton) mobileSignupButton.style.display = "";
    if (mobileProfileWrap) mobileProfileWrap.classList.remove("show");
  }

  function showLoggedIn(username) {
    const firstLetter = username?.charAt(0).toUpperCase() || "?";

    if (loginButton) loginButton.style.display = "none";
    if (signupButton) signupButton.style.display = "none";
    if (profileWrap) profileWrap.classList.add("show");
    if (profileButton) profileButton.textContent = firstLetter;

    if (mobileLoginButton) mobileLoginButton.style.display = "none";
    if (mobileSignupButton) mobileSignupButton.style.display = "none";
    if (mobileProfileWrap) mobileProfileWrap.classList.add("show");
    if (mobileProfileButton) {
      mobileProfileButton.textContent = firstLetter;
    }
  }

  // Case 1: No saved token
  if (!token) {
    showLoggedOut();
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8005/profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Case 2: Token is invalid or expired
    if (response.status === 401) {
      localStorage.removeItem("token");
      showLoggedOut();

      await showCustomAlert(
        "Your session has expired. Please log in again."
      );
      return;
    }

    if (!response.ok) {
      throw new Error(
        `Profile request failed: ${response.status}`
      );
    }

    // Case 3: Token is valid
    const result = await response.json();
    console.log(result)
    showLoggedIn(result[0].username);

  } catch (error) {
    console.error("Navbar update error:", error);

    // A network error does not necessarily mean
    // the token has expired. Keep the token.
  }
}




export function closeAuth() {
  const authModal = document.getElementById("authModal");

  if (authModal !== null) {
    document.activeElement?.blur();
    authModal.classList.remove("open");
    authModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}
