    export function togglePassword() {
        const icon = document.getElementById("togglePassword");

        if (password.type === "password") {
            password.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            password.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }

    export function toggleConfirmPassword() {
        const icon = document.getElementById("toggleConfirmPassword");

        if (confirmPassword.type === "password") {
            confirmPassword.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            confirmPassword.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }

    }



    export function updateRequirement(element, valid) {
        const icon = element.querySelector("i");

        if (valid) {
            element.classList.remove("invalid");
            element.classList.add("valid");
            icon.className = "fa-solid fa-circle-check";
        } else {
            element.classList.remove("valid");
            element.classList.add("invalid");
            icon.className = "fa-solid fa-circle";
        }
    }



    export function checkPasswordStrength() {

        const value = password.value;
        let score = 0;

        const hasLength = value.length >= 6;
        const hasUppercase = /[A-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);

        updateRequirement(lengthReq, hasLength);
        updateRequirement(uppercaseReq, hasUppercase);
        updateRequirement(numberReq, hasNumber);
        updateRequirement(specialReq, hasSpecial);

        if (hasLength) {
            score += 25;
        }

        if (hasUppercase) {
            score += 25;
        }

        if (hasNumber) {
            score += 25;
        }

        if (hasSpecial) {
            score += 25;
        }

        if (value.length === 0) {
            strengthFill.style.width = "0%";
            strengthFill.style.background = "transparent";
            strengthText.textContent = "Password strength";
            strengthText.style.color = "#6B7280";

            return;
        }

        if (score <= 25) {
            strengthFill.style.width = "25%";
            strengthFill.style.background = "#DC2626";
            strengthText.textContent = "Weak password";
            strengthText.style.color = "#DC2626";
        } else if (score <= 50) {
            strengthFill.style.width = "50%";
            strengthFill.style.background = "#F97316";
            strengthText.textContent = "Fair password";
            strengthText.style.color = "#F97316";
        } else if (score <= 75) {
            strengthFill.style.width = "75%";
            strengthFill.style.background = "#EAB308";
            strengthText.textContent = "Good password";
            strengthText.style.color = "#CA8A04";
        } else {
            strengthFill.style.width = "100%";
            strengthFill.style.background = "#16A34A";
            strengthText.textContent = "Strong password";
            strengthText.style.color = "#16A34A";
        }
    }



    export async function handleSignup(event) {
        event.preventDefault();
        console.log("soham");
        clearMessage();

        // =========================================
        // GET VALUES
        // =========================================
        const nameValue = fullName.value.trim();
        const emailValue = email.value.trim().toLowerCase();
        const passwordValue = password.value;
        const confirmValue = confirmPassword.value;

        // =========================================
        // NAME VALIDATION
        // =========================================
        if (nameValue.length < 2) {
            showMessage(
                "Please enter a valid full name.",
                "error"
            );

            return;
        }

        // =========================================
        // EMAIL VALIDATION
        // =========================================
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(emailValue)) {
            showMessage(
                "Please enter a valid email address.",
                "error"
            );

            return;
        }

        // =========================================
        // PASSWORD LENGTH
        // =========================================
        if (passwordValue.length < 6) {
            showMessage(
                "Password must contain at least 6 characters.",
                "error"
            );

            return;
        }

        // =========================================
        // UPPERCASE
        // =========================================
        if (!/[A-Z]/.test(passwordValue)) {
            showMessage(
                "Password must contain at least one uppercase letter.",
                "error"
            );

            return;
        }

        // =========================================
        // NUMBER
        // =========================================
        if (!/[0-9]/.test(passwordValue)) {
            showMessage(
                "Password must contain at least one number.",
                "error"
            );

            return;
        }

        // =========================================
        // SPECIAL CHARACTER
        // =========================================
        if (!/[^A-Za-z0-9]/.test(passwordValue)) {
            showMessage(
                "Password must contain at least one special character.",
                "error"
            );

            return;
        }

        // =========================================
        // CONFIRM PASSWORD
        // =========================================
        if (passwordValue !== confirmValue) {
            showMessage(
                "Passwords do not match.",
                "error"
            );

            return;
        }

        // =========================================
        // LOADING
        // =========================================
        signupBtn.disabled = true;

        buttonText.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin me-2"></i> Creating Account...';

        try {
            // =========================================
            // CHECK EXISTING EMAIL
            // =========================================
            const checkResponse = await fetch(
                API_URL +
                "?email=" +
                encodeURIComponent(emailValue)
            );

            if (!checkResponse.ok) {
                throw new Error("Server error");
            }

            const existingUsers = await checkResponse.json();

            // =========================================
            // DUPLICATE EMAIL
            // =========================================
            if (existingUsers.length > 0) {
                showMessage(
                    "An account with this email already exists.",
                    "error"
                );

                signupBtn.disabled = false;
                buttonText.textContent = "Create Account";

                return;
            }

            // =========================================
            // CREATE USER
            // =========================================
            const newUser = {
                name: nameValue,
                email: emailValue,
                password: passwordValue
            };

            // =========================================
            // POST USER
            // =========================================
            const response = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(newUser)
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to create account"
                );
            }

            // =========================================
            // GET CREATED USER
            // =========================================
            const createdUser = await response.json();

            console.log(
                "User created:",
                createdUser
            );

            // =========================================
            // SUCCESS
            // =========================================
            showMessage(
                "Account created successfully! Redirecting to login...",
                "success"
            );

            // =========================================
            // RESET FORM
            // =========================================
            signupForm.reset();

            strengthFill.style.width = "0%";
            strengthFill.style.background = "transparent";

            strengthText.textContent =
                "Password strength";

            strengthText.style.color =
                "#6B7280";

            updateRequirement(
                lengthReq,
                false
            );

            updateRequirement(
                uppercaseReq,
                false
            );

            updateRequirement(
                numberReq,
                false
            );

            updateRequirement(
                specialReq,
                false
            );

            // =========================================
            // REDIRECT TO LOGIN
            // =========================================
            setTimeout(
                redirectToLogin,
                1500
            );

        } catch (error) {
            console.error(
                "Signup Error:",
                error
            );

            showMessage(
                "Unable to connect to JSON Server. Please make sure JSON Server is running on port 3001.",
                "error"
            );

            signupBtn.disabled = false;

            buttonText.textContent =
                "Create Account";
        }
    }

