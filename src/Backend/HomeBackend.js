// =========================================
// LOGIN
// =========================================

export function handleLogin(event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
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
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
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

        const user = JSON.parse(savedUser);

        if (user.email === email) {
            alert("An account with this email already exists.");
            return;
        }
    }

    const newUser = {
        name: name,
        email: email,
        password: password
    };

    localStorage.setItem(
        "user",
        JSON.stringify(newUser)
    );

    alert("Account created successfully! Please login.");

    document.getElementById("signupForm").reset();

    // Open login panel
    document.getElementById("signupPanel")
        .classList.remove("active");

    document.getElementById("loginPanel")
        .classList.add("active");
}


// =========================================
// FORGOT / RESET PASSWORD
// =========================================

export function resetPassword(event) {

    event.preventDefault();

    const email = document.getElementById("resetEmail").value.trim().toLowerCase();
    const newPassword = document.getElementById("resetPassword").value;
    const confirmPassword = document.getElementById("resetConfirm").value;

    if (
        email === "" ||
        newPassword === "" ||
        confirmPassword === ""
    ) {
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

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );

    alert("Password reset successfully! Please login.");

    document.getElementById("resetForm").reset();

    document.getElementById("resetPanel")
        .classList.remove("active");

    document.getElementById("loginPanel")
        .classList.add("active");
}


// =========================================
// PASSWORD VISIBILITY
// =========================================

export function togglePassword(inputId, button) {

    const passwordInput =
        document.getElementById(inputId);

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        button.setAttribute(
            "aria-label",
            "Hide password"
        );

    } else {

        passwordInput.type = "password";

        button.setAttribute(
            "aria-label",
            "Show password"
        );
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

    const loginButtons =
        document.querySelectorAll(".js-auth-open");

    const loggedIn =
        localStorage.getItem("loggedIn") === "true";

    loginButtons.forEach(function(button) {

        if (loggedIn) {

            button.textContent = "Logout";

            button.setAttribute(
                "data-auth",
                "logout"
            );

        } else {

            button.textContent = "Login";

            button.setAttribute(
                "data-auth",
                "login"
            );
        }
    });
}


// =========================================
// CLOSE AUTH MODAL
// =========================================

export function closeAuth() {

    const authModal =
        document.getElementById("authModal");

    if (authModal !== null) {
        authModal.classList.remove("open");
    }
}