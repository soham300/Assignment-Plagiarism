

// login  code is checking in json server and confrminig this to the local storage by putting the email
export async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  if (email === "" || password === "") {
    alert("Please enter email and password.");
    return;
  }
  const response = await fetch("http://localhost:3000/users");
  const users = await response.json();
  let foundUser = null;
  for (let i = 0; i < users.length; i++) {
    const comparedhashpassword = dcodeIO.bcrypt.compareSync(
      password,
      users[i].password
    );

    if (users[i].email === email && comparedhashpassword) {
      foundUser = users[i];
      break;
    }
  }
  if (foundUser === null) {
    alert("Invalid email or password.");
    return;
  }
  localStorage.setItem("loggedIn", "true");
  localStorage.setItem("userEmail", email);
  alert("Login successful!");
  await updateNavbar();
  closeAuth();
}




export async function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirm").value;
  if (name === "" || email === "" || password === "" || confirmPassword === "") {
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
  const response = await fetch("http://localhost:3000/users?email=" + encodeURIComponent(email)); // searching with given email
  const users = await response.json();
  if (users.length > 0) {
    alert("An account with this email already exists.");
    return;
  }

  const hashedPassword = dcodeIO.bcrypt.hashSync(password, 10);
  const newUser = {
    name: name,
    email: email,
    password: hashedPassword
  };
  const fileuserdata = {
    email: email,
    filedetails: []
  }
  await fetch("http://localhost:3000/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser)
  });

  await fetch("http://localhost:3000/filedata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fileuserdata)
  });


  // build one for the result section
    //  result section is formed when a person click on the analyzed button
    const resultsection={
          email:email,
          filesprocesed:[],
        }
    await fetch(`http://localhost:3000/fileresult`,{
      method:"POST",
      headers: {
              "Content-Type": "application/json"
      },
      body: JSON.stringify(resultsection)
    });

  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  alert("Account created successfully! Please login.");
  document.getElementById("signupForm").reset();
  document.getElementById("signupPanel").classList.remove("active");
  document.getElementById("loginPanel").classList.add("active");
}















export async function resetPassword(event) {
  event.preventDefault();
  const email = document.getElementById("resetEmail").value.trim().toLowerCase();
  const newPassword = document.getElementById("resetPassword").value;
  const confirmPassword = document.getElementById("resetConfirm").value;
  if (email === "" || newPassword === "" || confirmPassword === "") {
    alert("Please fill all fields.");
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
  const response = await fetch("http://localhost:3000/users?email=" + encodeURIComponent(email));
  const users = await response.json();
  if (users.length === 0) {
    alert("No account found with this email.");
    return;
  }
  const user = users[0];
  user.password = newPassword;
  await fetch("http://localhost:3000/users/" + user.id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });
  alert("Password reset successfully! Please login.");
  document.getElementById("resetForm").reset();
  document.getElementById("resetPanel").classList.remove("active");
  document.getElementById("loginPanel").classList.add("active");
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


export function logoutUser() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");

  updateNavbar();
  alert("You have been logged out.");
}


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
    const response = await fetch("http://localhost:3000/users?email=" + encodeURIComponent(userEmail));
    const users = await response.json();
    if (users.length === 0) {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("userEmail");
      return;
    }
    const user = users[0];
    const firstLetter = user.name.charAt(0).toUpperCase();
    if (loginButton !== null) loginButton.style.display = "none";
    if (signupButton !== null) signupButton.style.display = "none";
    if (profileWrap !== null) profileWrap.classList.add("show");
    if (profileButton !== null) profileButton.textContent = firstLetter;
    if (mobileLoginButton !== null) mobileLoginButton.style.display = "none";
    if (mobileSignupButton !== null) mobileSignupButton.style.display = "none";
    if (mobileProfileWrap !== null) mobileProfileWrap.classList.add("show");
    if (mobileProfileButton !== null) mobileProfileButton.textContent = firstLetter;
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
