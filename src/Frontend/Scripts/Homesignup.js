// =========================================
// JSON SERVER API
// =========================================
const API_URL = "http://localhost:3000/users";

import {
    togglePassword,
    toggleConfirmPassword,
    checkPasswordStrength,
    handleSignup
} from "../../Backend/HomeBackend.js";


// =========================================
// GET ELEMENTS
// =========================================
const signupForm = document.getElementById("signupForm");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const signupBtn = document.getElementById("signupBtn");
const buttonText = document.getElementById("buttonText");
const message = document.getElementById("message");
const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");

// =========================================
// REQUIREMENT ELEMENTS
// =========================================
const lengthReq = document.getElementById("lengthReq");
const uppercaseReq = document.getElementById("uppercaseReq");
const numberReq = document.getElementById("numberReq");
const specialReq = document.getElementById("specialReq");

// =========================================
// SHOW MESSAGE
// =========================================
function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
}

// =========================================
// CLEAR MESSAGE
// =========================================
function clearMessage() {
    message.textContent = "";
    message.className = "message";
}

// =========================================
// PASSWORD TOGGLE
// =========================================


document
    .getElementById("togglePassword")
    .addEventListener("click", togglePassword);

document
    .getElementById("toggleConfirmPassword")
    .addEventListener("click", toggleConfirmPassword);




password.addEventListener("input", checkPasswordStrength);

// =========================================
// REDIRECT TO LOGIN
// =========================================


signupForm.addEventListener(
    "submit",
    handleSignup
);

// =========================================
// GOOGLE BUTTON
// =========================================
function handleGoogleLogin() {
    showMessage(
        "Google Sign-In is currently unavailable in this demo.",
        "error"
    );
}

document
    .getElementById("googleBtn")
    .addEventListener(
        "click",
        handleGoogleLogin
    );

// =========================================
// GITHUB BUTTON
// =========================================
function handleGithubLogin() {
    showMessage(
        "GitHub Sign-In is currently unavailable in this demo.",
        "error"
    );
}

document
    .getElementById("githubBtn")
    .addEventListener(
        "click",
        handleGithubLogin
    );