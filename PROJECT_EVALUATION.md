# 📋 Project Evaluation & Improvement Guide: Assignment Plagiarism Checker

> **Simple Summary:** This document reviews your project in plain, easy-to-understand language. It highlights what you did well, explains the major issues (with real-life examples), and provides a clear checklist to get your project ready for teachers, examiners, and real users.

---

## 🎯 Quick Scorecard (At a Glance)

| Area | Grade | Quick Verdict |
| :--- | :---: | :--- |
| 🎨 **User Interface & Design** | **B+ (Good)** | The UI looks modern, dark, sleek, and premium. Great first impression! |
| 🛡️ **Security & User Accounts** | **F (Critical)** | Real passwords are leaked in the code, and anyone can reset any account. |
| ⚙️ **System Architecture** | **D (Needs Work)** | The code labeled "Backend" is actually running in the user's browser. |
| 🧮 **Plagiarism Detection Math** | **C- (Flawed)** | The percentage changes depending on which file you upload first. |
| 🧹 **Code Cleanliness** | **C (Average)** | A few very large files (>3,500 lines) that can be split into smaller pieces. |
| 🧪 **Tests & Reliability** | **F (Missing)** | No automated tests to check if features break when changed. |

---

## 🌟 What You Did Really Well!

Before looking at what needs fixing, here is what is already impressive about your project:

1. **Stunning UI Design:** The dark glassmorphism design, clean typography, smooth animations, and toast notifications look very professional.
2. **Side-by-Side Comparison Screen:** The split-screen view where users can compare two files side-by-side with colored text highlights is a great feature that examiners will love.
3. **Multiple File Format Support:** You included parsers for `.txt`, `.pdf` (using PDF.js), and `.docx` (using Mammoth). Supporting Word documents and PDFs in an assignment checker is a big plus.
4. **Good Tech Stack Choices:** You chose modern industry tools like Express, MongoDB/Mongoose, JWT tokens, and Bcrypt password hashing.

---

## ⚠️ The 5 Major Issues (Explained in Plain English)

### 1. 🚨 Real Email and Plaintext Password are Saved in the Code
* **Where it is:** [`db.json:10-14`](file:///c:/Users/HP/Assignment-Plagiarism/db.json#L10-L14)
* **What's happening:**  
  Inside your project file `db.json`, there is an actual student account with the password saved as plain text:
  ```json
  {
    "name": "Yashika Garg",
    "email": "yashika3073.beai24@chitkara.edu.in",
    "password": "123456789"
  }
  ```
* **Why it's dangerous:** Anyone who looks at your GitHub repository can see this university email and use the password `"123456789"` to log in.
* **How to fix it:** Delete real user credentials from `db.json`. Only store hashed passwords (like `$2a$10$...`) in the database, never in sample code files.

---

### 2. 🚨 Anyone Can Reset Anyone Else's Password in 1 Second
* **Where it is:** [`server.js:421-444`](file:///c:/Users/HP/Assignment-Plagiarism/server.js#L421-L444)
* **What's happening:**  
  When someone calls the `/auth/reset-password` endpoint, the server simply asks: *"What is the email and what is the new password?"*  
  It **does not ask** for:
  - An email verification code (OTP),
  - A password reset link,
  - Or the user's old password.
* **Real-life Example:**  
  If Student A knows Student B's email address, Student A can send a request to your server and instantly change Student B's password to anything they want. Student B is immediately locked out of their account.
* **How to fix it:** For a simple project, require the user to enter their **current password** before allowing a password change. For an advanced flow, send a temporary 6-digit OTP to the user's email.

---

### 3. 🚨 Anyone Can Delete or Read Any Report (Missing Lock on the Door)
* **Where it is:** [`server.js:534-554`](file:///c:/Users/HP/Assignment-Plagiarism/server.js#L534-L554)
* **What's happening:**  
  When a user deletes a report, the server checks if the user is authorized **only if** they send a login token.  
  If someone sends a delete request **without any login token**, the security check is skipped entirely, and the server deletes the report anyway!
* **Also:** The routes `GET /users`, `GET /reports`, and `GET /filedata` do not check if you are logged in. Anyone can open `http://localhost:3000/users` in their browser and see every registered student's name and email.
* **How to fix it:** Add your existing `authenticateToken` middleware directly to the route:
  ```javascript
  // Before:
  app.delete("/reports/:id", async (req, res) => { ... });

  // After (Protected):
  app.delete("/reports/:id", authenticateToken, async (req, res) => { ... });
  ```

---

### 4. 🧮 The Plagiarism Math Has a Bug: A vs B $\neq$ B vs A
* **Where it is:** [`src/Backend/CheckBackend.js:350-408`](file:///c:/Users/HP/Assignment-Plagiarism/src/Backend/CheckBackend.js#L350-L408)
* **What's happening:**  
  The formula divides the similarity score **only by the number of chunks in the first file**.
* **Real-life Example:**
  - Suppose **File 1** is a short 1-page essay copied completely from **File 2** (which is a 50-page textbook).
  - If you check **File 1 against File 2**: the score is **100%**.
  - But if you check **File 2 against File 1**: the score drops to **2%**!
* **The Second Problem (Students Can Cheat):**  
  The plagiarism calculation runs inside the student's web browser, not on the server. The browser then tells the server what score it got. A student who knows how to open browser developer tools (F12) can easily change the score to `0%` before saving it.
* **How to fix it:**
  1. Make the math fair: Calculate how much of File 1 matches File 2, and how much of File 2 matches File 1, or use total shared word phrases.
  2. Move the file comparison code to the Node.js server (`server.js`) so students cannot modify the results.

---

### 5. 📁 Folder Confusion: "Backend" Files Are Actually Frontend Files
* **Where it is:** The folder `src/Backend/` containing [`CheckBackend.js`](file:///c:/Users/HP/Assignment-Plagiarism/src/Backend/CheckBackend.js), [`HomeBackend.js`](file:///c:/Users/HP/Assignment-Plagiarism/src/Backend/HomeBackend.js), and [`SpellChecker.js`](file:///c:/Users/HP/Assignment-Plagiarism/src/Backend/SpellChecker.js).
* **What's happening:**  
  In web development:
  - **Backend** means code that runs on the server (in Node.js).
  - **Frontend** means code that runs in the user's browser (Chrome, Firefox, Safari).
  
  All the files inside your `src/Backend/` folder use browser features like `window`, `document`, and `alert()`. Node.js does not have these features and cannot run them.
* **Why this matters for your viva / evaluation:** An examiner who inspects your folder structure will immediately ask: *"Why are browser scripts placed inside a Backend folder?"*
* **How to fix it:** Rename or move these scripts to `src/Frontend/Scripts/` (or create a real backend processing file in Node.js).

---

## 💡 Bonus Review: How Your Spell Checker Works

* **Where it is:** [`src/Backend/SpellChecker.js`](file:///c:/Users/HP/Assignment-Plagiarism/src/Backend/SpellChecker.js)
* **How it currently works:**  
  It has a fixed list of around 350 common typos (e.g., `"teh"` $\rightarrow$ `"the"`, `"recieve"` $\rightarrow$ `"receive"`).
* **What happens in practice:**
  - If a student makes one of those specific 350 mistakes, it finds it!
  - If a student writes any other spelling mistake (like `"computr"` or `"asignmnt"`), it will not notice it because it only knows those 350 words.
* **Easy improvement for your project:** Mention in your presentation that this is a **"Common Academic Typos Detector"** rather than a full English dictionary spell checker. This makes your project sound honest, thoughtful, and technically accurate!

---

## 🛠️ Step-by-Step Fixes Checklist (Easy Roadmap)

### Step 1: Security Fixes (Takes ~30 minutes)
- [ ] **Clean `db.json`**: Remove personal email addresses and replace plain passwords with sample hashes.
- [ ] **Lock the Reset Password Route**: In [`server.js`](file:///c:/Users/HP/Assignment-Plagiarism/server.js), ensure users must enter their existing password to set a new password.
- [ ] **Lock the Delete & View Routes**: Add `authenticateToken` to `DELETE /reports/:id`, `GET /users`, and `GET /reports`.
- [ ] **Fix File Name Display (Prevent XSS)**: In [`CheckBackend.js`](file:///c:/Users/HP/Assignment-Plagiarism/src/Backend/CheckBackend.js#L54), use `.textContent = file.name` instead of putting raw `file.name` directly inside `innerHTML`.

### Step 2: Algorithmic & Logic Fixes (Takes ~1 hour)
- [ ] **Make the Similarity Math Symmetric**: Show two clear scores:
  - *Overall Similarity*: How much the two documents overlap in total.
  - *Containment Score*: How much of Document 1 is copied from Document 2.
- [ ] **Prevent Window Shift**: Use sliding word chunks (overlapping by 20–30 words) so inserting a single word does not break the whole detection.

### Step 3: Code Cleanup & Documentation (Takes ~30 minutes)
- [ ] **Update `README.md`**: Remove old commands about `json-server` and replace with `npm start` or `node server.js`.
- [ ] **Fix Broken Image Previews in README**: Update screenshot paths from `.png` to `.jpeg`.
- [ ] **Split `CheckAssign.js`**: Break the 3,600-line file into smaller files (e.g., `fileUpload.js`, `reportView.js`, `pdfExport.js`).

---

## 🎓 Questions Your Teacher / Examiner Might Ask (And How to Answer!)

| Question They Might Ask | Honest & Impressive Answer You Can Give |
| :--- | :--- |
| **"How does your algorithm detect plagiarism?"** | *"It breaks the text into 100-word chunks, creates 4-word sequences (4-grams), and uses the Jaccard similarity formula to calculate how many phrases match between the two files."* |
| **"Where does the comparison happen?"** | *"Currently, it processes client-side in the browser using PDF.js and Mammoth for fast local preview. In our next phase, we plan to move the comparison to an Express API endpoint to ensure tamper-proof grading."* |
| **"How do you store passwords?"** | *"Passwords are never stored as plain text in the main database; we use the Bcrypt algorithm with salt rounds to securely hash them before saving to MongoDB."* |
| **"What happens if someone uploads a 100-page book?"** | *"Because files are chunked into 100-word segments, we can pinpoint exact matching sections rather than comparing the entire text as a single block."* |

---

## 🏁 Summary

You have built a **visually attractive, functional prototype with great user experience and ambitious features**. By fixing the security checks in [`server.js`](file:///c:/Users/HP/Assignment-Plagiarism/server.js) and refining the similarity calculation in [`CheckBackend.js`](file:///c:/Users/HP/Assignment-Plagiarism/src/Backend/CheckBackend.js), your project will easily go from an **academic prototype** to an **A-grade, production-ready portfolio project**.
