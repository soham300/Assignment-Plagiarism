const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

function countUp(el, to, suffix = "", duration = 900) {
  const t0 = performance.now();
  function tick(t) {
    const p = Math.min(1, (t - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* Navbar */
const navbar = $("#navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 10);
});

const navToggle = $("#navToggle");
navToggle.addEventListener("click", () => {
  const open = navbar.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
$$("#mobileMenu a").forEach((a) =>
  a.addEventListener("click", () => navbar.classList.remove("open")),
);

/* Scroll spy */
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      $$(".nav-links a, .mobile-menu nav a").forEach((a) =>
        a.classList.toggle(
          "active",
          a.getAttribute("href") === "#" + en.target.id,
        ),
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" },
);
["home", "features", "how", "teachers", "students", "about"].forEach(
  (id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  },
);

/* Scroll reveals */
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        revealObs.unobserve(en.target);
      }
    });
  },
  { threshold: 0.12 },
);
$$(".reveal").forEach((el) => revealObs.observe(el));

/* Count-up */
const countObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      countUp(el, +el.dataset.count, el.dataset.suffix || "");
      countObs.unobserve(el);
    });
  },
  { threshold: 0.6 },
);
$$("[data-count]").forEach((el) => countObs.observe(el));

const dash = $("#dashTable");
new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        dash.classList.add("in");
        obs.disconnect();
      }
    });
  },
  { threshold: 0.25 },
).observe(dash);

/* =========================================================================
HERO — SIMILARITY ANALYSIS ANIMATION
========================================================================= */
const stage = $("#stage");
const wrap = $("#stageWrap");
const engine = $("#engine");
const docs = $$(".doc", stage);
const links = $$(".link", stage);
const statusEl = $("#engStatus");
const barEl = $("#engBar");
const PULSE_COLORS = ["#4f46e5", "#2563eb", "#d97706", "#059669"];
let stageVisible = true;
let pulseIndex = 0;

new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      stageVisible = en.isIntersecting;
    }),
  { threshold: 0.05 },
).observe(wrap);

function centerPx(el) {
  const s = stage.getBoundingClientRect(),
    r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2 - s.left,
    y: r.top + r.height / 2 - s.top,
  };
}

function updateLinks() {
  const e = centerPx(engine);
  const s = stage.getBoundingClientRect();
  docs.forEach((doc, i) => {
    const p = centerPx(doc);
    const L = links[i];
    L.setAttribute("x1", (p.x / s.width) * 100);
    L.setAttribute("y1", (p.y / s.height) * 100);
    L.setAttribute("x2", (e.x / s.width) * 100);
    L.setAttribute("y2", (e.y / s.height) * 100);
  });
}
window.addEventListener("resize", () => setTimeout(updateLinks, 150));
window.addEventListener("load", updateLinks);
updateLinks();

function firePulse(i) {
  if (!stageVisible) return;
  const from = centerPx(docs[i]);
  const to = centerPx(engine);
  const dot = document.createElement("span");
  dot.className = "pulse";
  dot.style.background = PULSE_COLORS[i];
  stage.appendChild(dot);
  dot.animate(
    [
      {
        transform: `translate(${from.x}px,${from.y}px) scale(1)`,
        opacity: 1,
      },
      {
        transform: `translate(${to.x}px,${to.y}px) scale(.5)`,
        opacity: 0.9,
      },
    ],
    { duration: 800, easing: "cubic-bezier(.45,0,.2,1)" },
  ).onfinish = () => dot.remove();
}

function setStatus(text, mode) {
  statusEl.textContent = text;
  engine.classList.toggle("busy", mode === "busy");
  engine.classList.toggle("done", mode === "done");
}

function resetStage() {
  stage.classList.remove(
    "p-upload",
    "p-compare",
    "p-match",
    "p-result",
    "p-reset",
  );
  $$(".mline.found", stage).forEach((l) => l.classList.remove("found"));
  $$(".rrow", engine).forEach((r) => {
    r.classList.remove("show");
    $(".rval", r).textContent = "0%";
    $(".rbar i", r).style.width = "0%";
  });
  setStatus("Ready", "idle");
  barEl.style.width = "0%";
  updateLinks();
}

async function runCycle() {
  resetStage();
  await wait(600);
  stage.classList.add("p-upload");
  docs.forEach((d, i) =>
    setTimeout(() => {
      d.classList.add("pop");
      setTimeout(() => d.classList.remove("pop"), 600);
    }, i * 140),
  );
  setStatus("Extracting text…", "busy");
  barEl.style.width = "18%";
  await wait(1200);
  stage.classList.add("p-compare");
  setStatus("Comparing n-grams…", "busy");
  barEl.style.width = "56%";
  const pulses = setInterval(() => {
    firePulse(pulseIndex % 4);
    pulseIndex++;
  }, 260);
  await wait(2000);
  clearInterval(pulses);
  stage.classList.add("p-match");
  setStatus("Detecting matches…", "busy");
  barEl.style.width = "82%";
  const matches = $$(".mline.match", stage);
  matches.forEach((l, i) =>
    setTimeout(() => l.classList.add("found"), 100 + i * 140),
  );
  await wait(matches.length * 140 + 600);
  stage.classList.add("p-result");
  setStatus("Analysis complete", "done");
  barEl.style.width = "100%";
  $$(".rrow", engine).forEach((row, i) =>
    setTimeout(
      () => {
        row.classList.add("show");
        countUp($(".rval", row), +row.dataset.to, "%", 750);
        $(".rbar i", row).style.width = row.dataset.to + "%";
      },
      160 + i * 260,
    ),
  );
  await wait(3600);
  stage.classList.add("p-reset");
  await wait(800);
}

(async function loop() {
  for (; ;) {
    if (!stageVisible) {
      await wait(500);
      continue;
    }
    await runCycle();
  }
})();

/* =========================================================================
TEACHER STAGE — STUDENT → TEACHER REFERENCE ANIMATION
========================================================================= */
const teacherStage = $("#teacherStage");
const teacherWrap = $("#teacherWrap");
const refCountEl = $("#refCount");
let teacherVisible = false;
let teacherRunning = false;

function updateTeacherLinks() {
  const refCard = $("#teacherRef");
  if (!refCard || !teacherStage) return;
  const stageRect = teacherStage.getBoundingClientRect();
  const refRect = refCard.getBoundingClientRect();
  const refCenter = {
    x:
      ((refRect.left + refRect.width / 2 - stageRect.left) /
        stageRect.width) *
      100,
    y:
      ((refRect.top + refRect.height / 2 - stageRect.top) /
        stageRect.height) *
      100,
  };
  const lines = $$(".t-line", teacherStage);
  const tDocs = $$(".t-doc", teacherStage);
  tDocs.forEach((doc, i) => {
    if (!lines[i]) return;
    const r = doc.getBoundingClientRect();
    const cx =
      ((r.left + r.width / 2 - stageRect.left) / stageRect.width) * 100;
    const cy =
      ((r.top + r.height - stageRect.top) / stageRect.height) * 100;
    lines[i].setAttribute("x1", cx);
    lines[i].setAttribute("y1", cy);
    lines[i].setAttribute("x2", refCenter.x);
    lines[i].setAttribute("y2", refCenter.y);
  });
}

window.addEventListener("resize", () =>
  setTimeout(updateTeacherLinks, 150),
);
window.addEventListener("load", updateTeacherLinks);
setTimeout(updateTeacherLinks, 200);

new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      teacherVisible = en.isIntersecting;
      if (en.isIntersecting && !teacherRunning) {
        teacherRunning = true;
        runTeacherCycle();
      }
    }),
  { threshold: 0.2 },
).observe(teacherWrap);

async function runTeacherCycle() {
  while (true) {
    if (!teacherVisible) {
      await wait(500);
      continue;
    }

    teacherStage.classList.remove("p-comparing", "p-done");
    const tDocs = $$(".t-doc", teacherStage);
    tDocs.forEach((d) => {
      d.classList.remove("matched");
      d.style.setProperty("--match", "0%");
    });
    if (refCountEl) refCountEl.textContent = "0";

    await wait(1200);
    updateTeacherLinks();

    teacherStage.classList.add("p-comparing");
    await wait(2400);

    teacherStage.classList.add("p-done");
    let matchedCount = 0;
    tDocs.forEach((d, i) => {
      setTimeout(() => {
        const match = d.dataset.match;
        d.style.setProperty("--match", match + "%");
        d.classList.add("matched");
        if (parseInt(match) >= 70) matchedCount++;
        if (refCountEl)
          refCountEl.textContent = matchedCount + "/" + tDocs.length;
      }, i * 180);
    });

    await wait(4200);
  }
}

/* =========================================================================
STUDENT STAGE — STUDENT-TO-STUDENT COMPARISON ANIMATION
========================================================================= */
const studentStage = $("#studentStage");
const studentWrap = $("#studentWrap");
const sScore = $("#sScore");
let studentVisible = false;
let studentRunning = false;

new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      studentVisible = en.isIntersecting;
      if (en.isIntersecting && !studentRunning) {
        studentRunning = true;
        runStudentCycle();
      }
    }),
  { threshold: 0.2 },
).observe(studentWrap);

async function runStudentCycle() {
  const scores = [73, 68, 81, 54, 47, 62];
  let scoreIdx = 0;

  while (true) {
    if (!studentVisible) {
      await wait(500);
      continue;
    }

    studentStage.classList.remove("p-comparing", "p-result");
    const sLines = $$(".s-line", studentStage);
    sLines.forEach((l) => l.classList.remove("highlighted"));
    sScore.style.opacity = "0";
    sScore.style.transform = "scale(.5)";

    await wait(1200);

    studentStage.classList.add("p-comparing");
    await wait(2400);

    const matchIndices = [1, 3, 4];
    const sDocA = $("#sDocA");
    const sDocB = $("#sDocB");
    const linesA = Array.from(sDocA.querySelectorAll(".s-line"));
    const linesB = Array.from(sDocB.querySelectorAll(".s-line"));

    matchIndices.forEach((idx, i) => {
      setTimeout(() => {
        if (linesA[idx]) linesA[idx].classList.add("highlighted");
        if (linesB[idx]) linesB[idx].classList.add("highlighted");
      }, i * 280);
    });

    await wait(1200);

    studentStage.classList.add("p-result");
    const score = scores[scoreIdx % scores.length];
    scoreIdx++;
    sScore.innerHTML = score + "<small>%</small>";
    sScore.style.opacity = "1";
    sScore.style.transform = "scale(1)";

    await wait(3800);
  }
}

/* =========================================================================
REPORT — source filter
========================================================================= */
const docPanel = $("#docPanel");
$$(".src-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const wasOn = btn.classList.contains("on");
    $$(".src-btn").forEach((b) => b.classList.remove("on"));
    docPanel.classList.remove("f1", "f2", "f3");
    if (!wasOn) {
      btn.classList.add("on");
      docPanel.classList.add("f" + btn.dataset.src);
    }
  });
});

/* =========================================================================
TOAST
========================================================================= */
let toastTimer;
function showToast(msg) {
  $("#toastMsg").textContent = msg;
  const t = $("#toast");
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}
$$("[data-demo]").forEach((el) =>
  el.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("This is a homepage preview — accounts are not open yet.");
  }),
);

/* =========================================================================
AUTH MODAL — open, close and switch panels
========================================================================= */
const authModal = $("#authModal");
const authClose = $("#authClose");

function openAuthPanel(panelName) {
  $$(".auth-panel").forEach((panel) => panel.classList.remove("active"));

  const panel = document.getElementById(panelName + "Panel");
  if (panel) panel.classList.add("active");

  if (authModal) {
    authModal.classList.add("open");
    authModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
}

function closeAuthModal() {
  if (!authModal) return;

  authModal.classList.remove("open");
  authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

/* Login button from the navbar */
$$(".js-auth-open").forEach((button) => {
  /* Homesignup.js handles the navbar login/logout buttons. */
  if (button.closest(".nav-actions") || button.closest(".mobile-cta"))
    return;
});

/* Login / Sign Up buttons inside the auth dialog */
$$("[data-switch]").forEach((button) => {
  button.addEventListener("click", function () {
    openAuthPanel(this.getAttribute("data-switch"));
  });
});

/* Close button */
if (authClose) {
  authClose.addEventListener("click", closeAuthModal);
}

/* Close when clicking the dark area outside the card */
if (authModal) {
  authModal.addEventListener("click", function (event) {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });
}

/* Escape key closes the dialog */
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeAuthModal();
  }
});

/* Footer account links */
$$(".foot-col a[data-auth]").forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault();
    openAuthPanel(this.getAttribute("data-auth"));
  });
});