/* =========================================================
   ASSIGNCHECK — PROFILE.JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const profileButton = document.getElementById("profileButton");
    const profileMenu = document.getElementById("profileMenu");

    const navToggle = document.getElementById("navToggle");

    const editProfileBtn = document.getElementById("editProfileBtn");
    const editModal = document.getElementById("editModal");

    const closeModal = document.getElementById("closeModal");
    const cancelEdit = document.getElementById("cancelEdit");

    const profileForm = document.getElementById("profileForm");

    const nameInput = document.getElementById("nameInput");
    const emailInput = document.getElementById("emailInput");

    const passwordModal = document.getElementById("passwordModal");

    const closePasswordModal =
        document.getElementById("closePasswordModal");

    const cancelPassword =
        document.getElementById("cancelPassword");

    const passwordForm =
        document.getElementById("passwordForm");

    const changePasswordBtn =
        document.getElementById("changePasswordBtn");

    const changeEmailBtn =
        document.getElementById("changeEmailBtn");

    const deleteAccountBtn =
        document.getElementById("deleteAccountBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    /* =====================================================
       STORAGE KEYS
       ===================================================== */

    const PROFILE_KEY = "assigncheck_profile";
    const HISTORY_KEYS = [
        "assigncheck_history",
        "analysisHistory",
        "history",
        "assignmentHistory"
    ];


    /* =====================================================
       DEFAULT PROFILE
       ===================================================== */

    const defaultProfile = {
        name: "User",
        email: "user@email.com",
        memberSince: new Date().toISOString()
    };


    /* =====================================================
       GET PROFILE
       ===================================================== */

    function getProfile() {

        try {

            const savedProfile =
                localStorage.getItem(PROFILE_KEY);

            if (!savedProfile) {
                return defaultProfile;
            }

            const parsed =
                JSON.parse(savedProfile);

            return {
                ...defaultProfile,
                ...parsed
            };

        } catch (error) {

            console.error(
                "Unable to load profile:",
                error
            );

            return defaultProfile;
        }
    }


    /* =====================================================
       SAVE PROFILE
       ===================================================== */

    function saveProfile(profile) {

        localStorage.setItem(
            PROFILE_KEY,
            JSON.stringify(profile)
        );
    }


    /* =====================================================
       INITIAL PROFILE
       ===================================================== */

    let profile = getProfile();


    /* =====================================================
       INITIALIZE PROFILE
       ===================================================== */

    renderProfile(profile);

    renderStatistics();

    renderRecentActivity();


    /* =====================================================
       RENDER PROFILE
       ===================================================== */

    function renderProfile(user) {

        const name =
            user.name || "User";

        const email =
            user.email || "user@email.com";


        /* ---------- Initial ---------- */

        const initial =
            getInitial(name);


        /* ---------- Main Profile ---------- */

        setText(
            "profileName",
            name
        );

        setText(
            "profileEmail",
            email
        );

        setText(
            "detailName",
            name
        );

        setText(
            "detailEmail",
            email
        );


        /* ---------- Navbar ---------- */

        setText(
            "profileButton",
            initial
        );

        setText(
            "menuAvatar",
            initial
        );

        setText(
            "menuUserName",
            name
        );

        setText(
            "menuUserEmail",
            email
        );


        /* ---------- Settings ---------- */

        setText(
            "settingEmail",
            email
        );


        /* ---------- Avatar ---------- */

        setText(
            "profileAvatar",
            initial
        );


        /* ---------- Member Since ---------- */

        setText(
            "memberSince",
            formatMemberDate(
                user.memberSince
            )
        );
    }


    /* =====================================================
       GET INITIAL
       ===================================================== */

    function getInitial(name) {

        if (!name) {
            return "U";
        }

        const cleaned =
            name.trim();

        if (!cleaned) {
            return "U";
        }

        const parts =
            cleaned.split(/\s+/);

        if (parts.length >= 2) {

            return (
                parts[0][0] +
                parts[parts.length - 1][0]
            ).toUpperCase();
        }

        return cleaned[0].toUpperCase();
    }


    /* =====================================================
       SET TEXT HELPER
       ===================================================== */

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }


    /* =====================================================
       FORMAT MEMBER DATE
       ===================================================== */

    function formatMemberDate(dateValue) {

        if (!dateValue) {
            return "—";
        }

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       PROFILE DROPDOWN
       ===================================================== */

    if (profileButton && profileMenu) {

        profileButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                const isOpen =
                    profileMenu.classList.toggle("open");

                profileButton.setAttribute(
                    "aria-expanded",
                    isOpen
                );
            }
        );


        document.addEventListener(
            "click",
            (event) => {

                if (
                    !profileMenu.contains(event.target) &&
                    !profileButton.contains(event.target)
                ) {

                    profileMenu.classList.remove(
                        "open"
                    );

                    profileButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            }
        );
    }


    /* =====================================================
       MOBILE NAV
       ===================================================== */

    if (navToggle) {

        navToggle.addEventListener(
            "click",
            () => {

                const nav =
                    document.querySelector(".nav-links");

                if (!nav) {
                    return;
                }

                const visible =
                    nav.classList.toggle("mobile-open");

                navToggle.setAttribute(
                    "aria-expanded",
                    visible
                );
            }
        );
    }


    /* =====================================================
       OPEN EDIT MODAL
       ===================================================== */

    if (editProfileBtn) {

        editProfileBtn.addEventListener(
            "click",
            () => {

                nameInput.value =
                    profile.name || "";

                emailInput.value =
                    profile.email || "";

                openModal(editModal);
            }
        );
    }


    /* =====================================================
       CLOSE EDIT MODAL
       ===================================================== */

    if (closeModal) {

        closeModal.addEventListener(
            "click",
            () => {

                closeModalWindow(
                    editModal
                );
            }
        );
    }


    if (cancelEdit) {

        cancelEdit.addEventListener(
            "click",
            () => {

                closeModalWindow(
                    editModal
                );
            }
        );
    }


    /* =====================================================
       EDIT PROFILE SUBMIT
       ===================================================== */

    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const name =
                    nameInput.value.trim();

                const email =
                    emailInput.value.trim();


                if (!name || !email) {

                    alert(
                        "Please fill in all fields."
                    );

                    return;
                }


                profile = {
                    ...profile,

                    name,
                    email
                };


                saveProfile(profile);

                renderProfile(profile);

                closeModalWindow(editModal);

                showToast(
                    "Profile updated successfully."
                );
            }
        );
    }


    /* =====================================================
       EMAIL BUTTON
       ===================================================== */

    if (changeEmailBtn) {

        changeEmailBtn.addEventListener(
            "click",
            () => {

                nameInput.value =
                    profile.name || "";

                emailInput.value =
                    profile.email || "";

                openModal(editModal);

                setTimeout(
                    () => {
                        emailInput.focus();
                    },
                    100
                );
            }
        );
    }


    /* =====================================================
       PASSWORD MODAL
       ===================================================== */

    if (changePasswordBtn) {

        changePasswordBtn.addEventListener(
            "click",
            () => {

                openModal(
                    passwordModal
                );
            }
        );
    }


    if (closePasswordModal) {

        closePasswordModal.addEventListener(
            "click",
            () => {

                closeModalWindow(
                    passwordModal
                );
            }
        );
    }


    if (cancelPassword) {

        cancelPassword.addEventListener(
            "click",
            () => {

                closeModalWindow(
                    passwordModal
                );
            }
        );
    }


    /* =====================================================
       PASSWORD FORM
       ===================================================== */

    if (passwordForm) {

        passwordForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const currentPassword =
                    document.getElementById(
                        "currentPassword"
                    ).value;

                const newPassword =
                    document.getElementById(
                        "newPassword"
                    ).value;

                const confirmPassword =
                    document.getElementById(
                        "confirmPassword"
                    ).value;


                if (
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                ) {

                    alert(
                        "Please fill in all password fields."
                    );

                    return;
                }


                if (newPassword.length < 6) {

                    alert(
                        "New password must contain at least 6 characters."
                    );

                    return;
                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    alert(
                        "New password and confirm password do not match."
                    );

                    return;
                }


                /*
                 * Frontend-only demo.
                 *
                 * Real password changes should
                 * be handled by your backend.
                 */


                passwordForm.reset();

                closeModalWindow(
                    passwordModal
                );

                showToast(
                    "Password updated successfully."
                );
            }
        );
    }


    /* =====================================================
       DELETE ACCOUNT
       ===================================================== */

    if (deleteAccountBtn) {

        deleteAccountBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to delete your account? This action cannot be undone."
                    );


                if (!confirmed) {
                    return;
                }


                localStorage.removeItem(
                    PROFILE_KEY
                );


                /*
                 * Remove known history keys.
                 */

                HISTORY_KEYS.forEach(
                    (key) => {

                        localStorage.removeItem(
                            key
                        );
                    }
                );


                profile =
                    defaultProfile;


                renderProfile(profile);

                renderStatistics();

                renderRecentActivity();


                showToast(
                    "Account data removed."
                );
            }
        );
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmed) {
                    return;
                }


                /*
                 * Don't delete profile.
                 * Only clear session/login data.
                 */

                localStorage.removeItem(
                    "assigncheck_logged_in"
                );

                localStorage.removeItem(
                    "currentUser"
                );

                localStorage.removeItem(
                    "userSession"
                );


                /*
                 * Change this path according
                 * to your login page.
                 */

                window.location.href =
                    "../Templates/index.html";
            }
        );
    }


    /* =====================================================
       MODAL HELPERS
       ===================================================== */

    function openModal(modal) {

        if (!modal) {
            return;
        }

        modal.classList.add("active");

        document.body.style.overflow =
            "hidden";
    }


    function closeModalWindow(modal) {

        if (!modal) {
            return;
        }

        modal.classList.remove("active");

        document.body.style.overflow =
            "";
    }


    /* =====================================================
       CLOSE MODAL ON OVERLAY CLICK
       ===================================================== */

    [editModal, passwordModal].forEach(
        (modal) => {

            if (!modal) {
                return;
            }

            modal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target === modal
                    ) {

                        closeModalWindow(
                            modal
                        );
                    }
                }
            );
        }
    );


    /* =====================================================
       ESCAPE KEY
       ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key !== "Escape") {
                return;
            }

            closeModalWindow(editModal);

            closeModalWindow(passwordModal);
        }
    );


    /* =====================================================
       HISTORY DATA
       ===================================================== */

    function getHistory() {

        for (const key of HISTORY_KEYS) {

            const stored =
                localStorage.getItem(key);

            if (!stored) {
                continue;
            }

            try {

                const parsed =
                    JSON.parse(stored);

                if (Array.isArray(parsed)) {
                    return parsed;
                }

                if (
                    parsed &&
                    Array.isArray(parsed.history)
                ) {

                    return parsed.history;
                }

                if (
                    parsed &&
                    Array.isArray(parsed.analyses)
                ) {

                    return parsed.analyses;
                }

            } catch (error) {

                console.warn(
                    `Unable to read ${key}:`,
                    error
                );
            }
        }

        return [];
    }


    /* =====================================================
       NORMALIZE HISTORY
       ===================================================== */

    function normalizeHistory(history) {

        return history
            .map((item, index) => {

                if (!item) {
                    return null;
                }


                const name =
                    item.fileName ||
                    item.filename ||
                    item.assignmentName ||
                    item.name ||
                    item.title ||
                    `Assignment ${index + 1}`;


                let similarity =
                    item.similarity ??
                    item.similarityScore ??
                    item.overallSimilarity ??
                    item.score ??
                    0;


                if (
                    typeof similarity === "string"
                ) {

                    similarity =
                        parseFloat(
                            similarity.replace(
                                "%",
                                ""
                            )
                        );
                }


                similarity =
                    Number(similarity);


                if (
                    !Number.isFinite(similarity)
                ) {

                    similarity = 0;
                }


                const date =
                    item.date ||
                    item.createdAt ||
                    item.timestamp ||
                    item.time ||
                    new Date().toISOString();


                return {
                    name,
                    similarity,
                    date
                };

            })
            .filter(Boolean);
    }


    /* =====================================================
       STATISTICS
       ===================================================== */

    function renderStatistics() {

        const history =
            normalizeHistory(
                getHistory()
            );


        const total =
            history.length;


        /*
         * Most assignment comparison
         * analyses contain 2 documents.
         */

        const documents =
            history.reduce(
                (totalDocuments, item) => {

                    return totalDocuments + 2;

                },
                0
            );


        let average =
            0;


        if (total > 0) {

            const sum =
                history.reduce(
                    (totalScore, item) => {

                        return (
                            totalScore +
                            item.similarity
                        );

                    },
                    0
                );


            average =
                Math.round(
                    sum / total
                );
        }


        /*
         * Reports generated.
         *
         * If your history stores a
         * reportGenerated flag, use it.
         * Otherwise every analysis is
         * treated as a generated report.
         */

        const reports =
            history.filter(
                item => {

                    return (
                        item.reportGenerated !== false
                    );

                }
            ).length;


        setText(
            "totalAnalyses",
            total
        );

        setText(
            "documentsChecked",
            documents
        );

        setText(
            "averageSimilarity",
            `${average}%`
        );

        setText(
            "reportsGenerated",
            reports
        );
    }


    /* =====================================================
       RECENT ACTIVITY
       ===================================================== */

    function renderRecentActivity() {

        const activityList =
            document.getElementById(
                "activityList"
            );


        if (!activityList) {
            return;
        }


        const history =
            normalizeHistory(
                getHistory()
            );


        if (!history.length) {

            activityList.innerHTML = `

                <div class="empty-activity">

                    <div class="empty-icon">
                        📋
                    </div>

                    <h3>
                        No recent analyses
                    </h3>

                    <p>
                        Your recent assignment analyses
                        will appear here.
                    </p>

                    <a
                        href="CheckAssign.html"
                        class="analyze-btn">

                        Analyze Assignment

                    </a>

                </div>

            `;

            return;
        }


        /*
         * Newest first.
         */

        history.sort(
            (a, b) => {

                return (
                    new Date(b.date) -
                    new Date(a.date)
                );
            }
        );


        const recent =
            history.slice(0, 4);


        activityList.innerHTML =
            recent
                .map(
                    item => {

                        return `

                            <div class="activity-item">

                                <div class="activity-icon">
                                    📄
                                </div>

                                <div class="activity-info">

                                    <strong>
                                        ${escapeHTML(
                                            item.name
                                        )}
                                    </strong>

                                    <span>
                                        ${formatActivityDate(
                                            item.date
                                        )}
                                    </span>

                                </div>

                                <div class="activity-score">
                                    ${Math.round(
                                        item.similarity
                                    )}%
                                </div>

                            </div>

                        `;
                    }
                )
                .join("");
    }


    /* =====================================================
       ACTIVITY DATE
       ===================================================== */

    function formatActivityDate(dateValue) {

        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Recently";
        }


        return date.toLocaleDateString(
            "en-US",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(message) {

        const oldToast =
            document.querySelector(
                ".profile-toast"
            );


        if (oldToast) {
            oldToast.remove();
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            "profile-toast";


        toast.textContent =
            message;


        toast.style.position =
            "fixed";

        toast.style.bottom =
            "25px";

        toast.style.right =
            "25px";

        toast.style.zIndex =
            "9999";

        toast.style.padding =
            "12px 17px";

        toast.style.borderRadius =
            "10px";

        toast.style.background =
            "#18182c";

        toast.style.color =
            "#ffffff";

        toast.style.fontSize =
            "12px";

        toast.style.fontWeight =
            "600";

        toast.style.boxShadow =
            "0 10px 30px rgba(0,0,0,0.15)";


        document.body.appendChild(
            toast
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateY(5px)";

                toast.style.transition =
                    "0.2s ease";


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    200
                );

            },
            2500
        );
    }

});