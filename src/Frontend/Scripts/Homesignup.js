import {
    handleLogin,
    handleSignup,
    resetPassword,
    togglePassword,
    logoutUser,
    updateNavbar,
    closeAuth
} from "../../Backend/HomeBackend.js";


// =========================================
// LOGIN FORM
// =========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm !== null) {

    loginForm.addEventListener(
        "submit",
        handleLogin
    );
}


// =========================================
// SIGNUP FORM
// =========================================

const signupForm =
    document.getElementById("signupForm");

if (signupForm !== null) {

    signupForm.addEventListener(
        "submit",
        handleSignup
    );
}


// =========================================
// RESET PASSWORD FORM
// =========================================

const resetForm =
    document.getElementById("resetForm");

if (resetForm !== null) {

    resetForm.addEventListener(
        "submit",
        resetPassword
    );
}


// =========================================
// FORGOT PASSWORD
// =========================================

const forgotLink =
    document.getElementById("forgotLink");

if (forgotLink !== null) {

    forgotLink.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            document.getElementById("loginPanel")
                .classList.remove("active");

            document.getElementById("resetPanel")
                .classList.add("active");

        }
    );
}


// =========================================
// PASSWORD SHOW / HIDE
// =========================================

const passwordButtons =
    document.querySelectorAll(".pw-toggle");

passwordButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            const inputId =
                button.getAttribute("data-target");

            togglePassword(
                inputId,
                button
            );

        }
    );

});


// =========================================
// NAVBAR LOGIN / LOGOUT
// =========================================

const authButtons =
    document.querySelectorAll(".js-auth-open");

authButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            const action =
                button.getAttribute("data-auth");

            if (action === "logout") {

                logoutUser();

                return;
            }

            if (action === "login") {

                document.getElementById("signupPanel")
                    .classList.remove("active");

                document.getElementById("resetPanel")
                    .classList.remove("active");

                document.getElementById("loginPanel")
                    .classList.add("active");

                document.getElementById("authModal")
                    .classList.add("open");
            }

        }
    );

});


// =========================================
// UPDATE NAVBAR WHEN PAGE LOADS
// =========================================

updateNavbar();