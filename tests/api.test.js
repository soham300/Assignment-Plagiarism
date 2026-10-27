// tests/api.test.js
// Automated End-to-End API Test Suite for AssignCheck Backend
// Run with: node tests/api.test.js

const http = require("http");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const urlObj = new URL(BASE_URL);

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? (typeof data === "string" ? data : JSON.stringify(data)) : null;
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: options.path,
      method: options.method || "GET",
      headers: {
        ...(options.headers || {}),
        ...(postData ? {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        } : {})
      }
    };

    const client = urlObj.protocol === "https:" ? require("https") : http;

    const req = client.request(reqOptions, (res) => {
      let body = "";
      res.on("data", chunk => (body += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

(async () => {
  console.log("=================================================");
  console.log("🚀 TESTING ASSIGNCHECK BACKEND APIS (MVC)");
  console.log("Target Base URL:", BASE_URL);
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = null) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (details) {
        console.error("     Details:", typeof details === "object" ? JSON.stringify(details, null, 2) : details);
      }
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request({ path: "/api/health" });
    assert(
      health.status === 200 && health.data && health.data.status === "ok",
      "GET /api/health",
      health.data
    );

    // 2. User Registration
    const randomSuffix = Date.now().toString().slice(-6);
    const testEmail = `student_${randomSuffix}@testdomain.edu`;
    const testPassword = "StrongPassword123!";

    const reg = await request({ path: "/users", method: "POST" }, {
      name: "API Test Student",
      email: testEmail,
      password: testPassword,
      role: "student"
    });
    assert(
      reg.status === 201 && reg.data && reg.data.token,
      "POST /users (User Registration)",
      reg.data
    );

    let token = reg.data ? reg.data.token : null;

    // 3. User Login
    const login = await request({ path: "/login", method: "POST" }, {
      email: testEmail,
      password: testPassword
    });
    assert(
      login.status === 200 && login.data && login.data.token,
      "POST /login (Authentication & JWT Generation)",
      login.data
    );

    if (login.data && login.data.token) {
      token = login.data.token;
    }
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 4. Verify Auth Token
    const verify = await request({ path: "/auth/verify", headers: authHeaders });
    assert(
      verify.status === 200 && verify.data && verify.data.success === true,
      "GET /auth/verify (JWT Verification)",
      verify.data
    );

    // 5. Plagiarism Detection API - Identical Texts (Expect 100%)
    const sim100 = await request({ path: "/api/check-similarity", method: "POST" }, {
      textA: "An operating system is system software that manages computer hardware and software resources.",
      textB: "An operating system is system software that manages computer hardware and software resources."
    });
    assert(
      sim100.status === 200 && sim100.data && sim100.data.result && sim100.data.result.similarity === 100,
      "POST /api/check-similarity (Identical Documents -> 100%)",
      sim100.data
    );

    // 6. Plagiarism Detection API - Different Texts (Expect low similarity)
    const simDiff = await request({ path: "/api/check-similarity", method: "POST" }, {
      textA: "Quantum mechanics is a fundamental theory in physics describing nature at the scale of atoms.",
      textB: "Cooking traditional pasta carbonara requires eggs, pecorino cheese, and cured guanciale pork."
    });
    assert(
      simDiff.status === 200 && simDiff.data && simDiff.data.result && simDiff.data.result.similarity < 15,
      "POST /api/check-similarity (Completely Different Documents -> Low %)",
      simDiff.data
    );

    // 7. Dynamic Spell Check API
    const spell = await request({ path: "/api/spellcheck", method: "POST" }, {
      text: "This assignmnt contains som speling mistaks in the text.",
      docLabel: "sample_assignment.docx"
    });
    assert(
      spell.status === 200 && spell.data && Array.isArray(spell.data.mistakes) && spell.data.mistakes.length >= 3,
      "POST /api/spellcheck (Spell Check & Typo Detection)",
      spell.data
    );

    // 8. Create Report
    const repCreate = await request({ path: "/reports", method: "POST", headers: authHeaders }, {
      email: testEmail,
      files: ["assignment_1.docx", "assignment_2.docx"],
      similarity: 65,
      matchingSections: 3,
      differentSections: 1,
      matchingPhrases: 8,
      spellingMistakes: 4,
      type: "student",
      textA: "Sample text A",
      textB: "Sample text B"
    });
    assert(
      repCreate.status === 201 && repCreate.data && repCreate.data.id,
      "POST /reports (Save Analysis Report)",
      repCreate.data
    );

    const createdReportId = repCreate.data ? repCreate.data.id : null;

    // 9. List Reports
    const repList = await request({ path: "/reports", headers: authHeaders });
    assert(
      repList.status === 200 && Array.isArray(repList.data) && repList.data.length >= 1,
      "GET /reports (Retrieve User Reports)",
      repList.data
    );

    // 10. Get Report by ID
    if (createdReportId) {
      const repSingle = await request({ path: `/reports/${createdReportId}`, headers: authHeaders });
      assert(
        repSingle.status === 200 && repSingle.data && repSingle.data.id === createdReportId,
        "GET /reports/:id (Fetch Single Report by ID)",
        repSingle.data
      );
    }

    // 11. Create & Fetch FileData
    const fdCreate = await request({ path: "/filedata", method: "POST", headers: authHeaders }, {
      filedetails: [{ name: "thesis_final.pdf", size: 204850 }]
    });
    assert(
      fdCreate.status === 201 && fdCreate.data,
      "POST /filedata (Store Document Metadata)",
      fdCreate.data
    );

    const fdList = await request({ path: "/filedata", headers: authHeaders });
    assert(
      fdList.status === 200 && Array.isArray(fdList.data),
      "GET /filedata (Retrieve User File Metadata)",
      fdList.data
    );

    // 12. Create & Fetch FileResult
    const frCreate = await request({ path: "/fileresult", method: "POST", headers: authHeaders }, {
      filesprocesed: [{ filename: "thesis_final.pdf", status: "analysed" }]
    });
    assert(
      frCreate.status === 201 && frCreate.data,
      "POST /fileresult (Log Processing Audit Result)",
      frCreate.data
    );

    const frList = await request({ path: "/fileresult", headers: authHeaders });
    assert(
      frList.status === 200 && Array.isArray(frList.data),
      "GET /fileresult (Retrieve Processing Audit Results)",
      frList.data
    );

    // 13. Unified Profile Summary
    const prof = await request({ path: "/api/user-profile-summary", headers: authHeaders });
    assert(
      prof.status === 200 && prof.data && prof.data.user && prof.data.user.email === testEmail,
      "GET /api/user-profile-summary (Unified Dashboard & Profile Data)",
      prof.data
    );

    // 14. Delete Report
    if (createdReportId) {
      const repDel = await request({ path: `/reports/${createdReportId}`, method: "DELETE", headers: authHeaders });
      assert(
        repDel.status === 200,
        "DELETE /reports/:id (Delete Report by ID)",
        repDel.data
      );
    }

  } catch (err) {
    console.error("Test execution exception:", err.message);
    failed++;
  }

  console.log("\n=================================================");
  console.log(`📊 API TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} TOTAL`);
  console.log("=================================================");

  process.exit(failed > 0 ? 1 : 0);
})();
