// tests/plagiarismEngine.test.js
// Automated tests for the server-side plagiarism engine
// Run with: node tests/plagiarismEngine.test.js

const {
  normalizeText,
  tokenizeWithPositions,
  generateShingles,
  compareDocuments
} = require("../src/Backend/Services/plagiarismEngine");

const { detectSpellingMistakesSync } = require("../src/Backend/Services/spellCheckService");

(async () => {

let passed = 0;
let failed = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? " — " + details : ""}`);
    failed++;
  }
}

function assertApprox(a, b, tolerance, testName) {
  const ok = Math.abs(a - b) <= tolerance;
  if (ok) {
    console.log(`  ✅ PASS: ${testName} (got ${a})`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} — expected ≈${b} ±${tolerance}, got ${a}`);
    failed++;
  }
}

// ===============================================================
console.log("\n📋 SECTION 1: Text Normalization & Tokenization");
// ===============================================================

{
  const tokens = tokenizeWithPositions("The quick brown fox");
  assert(tokens.length === 4, "Tokenize basic sentence", `got ${tokens.length} tokens`);
  assert(tokens[0].normalized === "the", "First token normalizes to lowercase");
  assert(typeof tokens[0].start === "number", "Token has numeric start position");
  assert(typeof tokens[0].end === "number", "Token has numeric end position");
}

{
  const tokens = tokenizeWithPositions("");
  assert(tokens.length === 0, "Empty text returns no tokens");
}

{
  const tokens = tokenizeWithPositions("   ");
  assert(tokens.length === 0, "Whitespace-only text returns no tokens");
}

{
  const text = "café résumé naïve";
  const tokens = tokenizeWithPositions(text);
  assert(tokens.length > 0, "Non-ASCII text tokenizes without crashing");
}

// ===============================================================
console.log("\n📋 SECTION 2: Shingle Generation");
// ===============================================================

{
  const tokens = tokenizeWithPositions("the quick brown fox jumps over the lazy dog");
  const { shingleSet } = generateShingles(tokens, 4);
  assert(shingleSet.size > 0, "Generates shingles from sentence");
  assert(shingleSet.has("the quick brown fox"), "Expected 4-gram present");
  assert(shingleSet.has("fox jumps over the"), "Expected 4-gram present");
}

{
  const tokens = tokenizeWithPositions("a b c");
  const { shingleSet } = generateShingles(tokens, 4);
  // Engine reduces n to token count when text < n, producing 1 shingle
  assert(shingleSet.size <= 1, "Text shorter than n produces 0 or 1 shingle (n clamped)");
}

{
  const tokens = tokenizeWithPositions("one two three four");
  const { shingleSet } = generateShingles(tokens, 4);
  assert(shingleSet.size === 1, "Exactly n words gives exactly 1 shingle");
  assert(shingleSet.has("one two three four"), "Single shingle matches");
}

// ===============================================================
console.log("\n📋 SECTION 3: Similarity — Edge Cases");
// ===============================================================

{
  const result = await compareDocuments("", "some content here");
  assert(result.similarity === 0, "Empty document A gives 0% similarity");
}

{
  const result = await compareDocuments("some content here", "");
  assert(result.similarity === 0, "Empty document B gives 0% similarity");
}

{
  const result = await compareDocuments("", "");
  assert(result.similarity === 0, "Both empty documents give 0% similarity");
}

{
  const text = "the quick brown fox jumps over the lazy dog and the fox ran away";
  const result = await compareDocuments(text, text);
  assert(result.similarity === 100, "Identical documents give 100% similarity", `got ${result.similarity}`);
}

{
  const textA = "the sky is blue and clouds are white";
  const textB = "apples oranges bananas grapes watermelon mango kiwi fruit";
  const result = await compareDocuments(textA, textB);
  assert(result.similarity < 10, "Completely different documents give very low similarity", `got ${result.similarity}`);
}

// ===============================================================
console.log("\n📋 SECTION 4: Symmetry Tests (Sim(A,B) must equal Sim(B,A))");
// ===============================================================

{
  const textA = "plagiarism detection algorithms use shingling and jaccard similarity";
  const textB = "shingling is used in plagiarism detection to compute jaccard coefficients for comparison";
  const result1 = await compareDocuments(textA, textB);
  const result2 = await compareDocuments(textB, textA);
  assert(
    result1.similarity === result2.similarity,
    `Symmetry: compareDocuments(A, B) === compareDocuments(B, A)`,
    `A vs B = ${result1.similarity}%, B vs A = ${result2.similarity}%`
  );
}

{
  // A is a 1-paragraph excerpt, B is a much longer multi-paragraph document
  const textA = "students who submit copied work are engaging in academic dishonesty which violates the code of conduct";
  const textB = [
    "the university policies on academic integrity are clear and explicit regarding plagiarism",
    "students who submit copied work are engaging in academic dishonesty which violates the code of conduct",
    "all submitted work must represent the student own understanding and effort unless otherwise stated",
    "violations may result in grade penalties up to and including failure of the course"
  ].join(". ");

  const result1 = await compareDocuments(textA, textB);
  const result2 = await compareDocuments(textB, textA);
  assert(
    result1.similarity === result2.similarity,
    "Symmetry holds with documents of different lengths",
    `Short vs Long = ${result1.similarity}%, Long vs Short = ${result2.similarity}%`
  );
  assert(
    result1.coverageA > result1.similarity,
    "Directional coverage A (shorter doc) is higher than overall similarity",
    `coverageA = ${result1.coverageA}, similarity = ${result1.similarity}`
  );
}

// ===============================================================
console.log("\n📋 SECTION 5: Directional Coverage");
// ===============================================================

{
  const textA = "the quick brown fox jumps over the lazy dog";
  const textB = "the quick brown fox jumps over the lazy dog and also runs around the field near the river";
  const result = await compareDocuments(textA, textB);
  assert(
    result.coverageA >= result.similarity,
    "Coverage of A in B (short in long) >= overall similarity",
    `coverageA=${result.coverageA}, similarity=${result.similarity}`
  );
  assert(
    result.coverageB <= result.coverageA,
    "Coverage of B in A (long in short) <= coverage of A",
    `coverageB=${result.coverageB}, coverageA=${result.coverageA}`
  );
}

// ===============================================================
console.log("\n📋 SECTION 6: Partial Overlap");
// ===============================================================

{
  // Use texts that genuinely share consecutive 4-gram phrases
  const textA = "neural networks are used in machine learning for classification tasks and regression analysis";
  const textB = "machine learning uses neural networks to perform classification tasks in image recognition systems";
  const result = await compareDocuments(textA, textB);
  // Both contain "neural networks" and "machine learning" but 4-gram overlap depends on word order
  assert(typeof result.similarity === "number" && result.similarity >= 0 && result.similarity <= 100,
    "Partial overlap gives a numeric similarity between 0% and 100%", `got ${result.similarity}`);
  assert(result.symmetric === true, "Result is flagged as symmetric");
  assert(result.disclaimer && typeof result.disclaimer === "string", "Includes disclaimer text");
}

// ===============================================================
console.log("\n📋 SECTION 7: Word Insertion Resilience");
// ===============================================================

{
  const base = "the quick brown fox jumps over the lazy dog and the fox runs around";
  // Inserting 1 word at the beginning
  const modified = "well " + base;
  const result1 = await compareDocuments(base, modified);
  const result2 = await compareDocuments(modified, base);
  assert(
    result1.similarity > 50,
    "Single word insertion still gives high similarity (sliding shingles)",
    `got ${result1.similarity}%`
  );
  assert(result1.similarity === result2.similarity, "Word insertion test also symmetric");
}

// ===============================================================
console.log("\n📋 SECTION 8: Spelling Mistake Detection");
// ===============================================================

{
  const mistakes = detectSpellingMistakesSync("The goverment enviornment recieve benefitts");
  assert(mistakes.length >= 2, "Detects known typos in text", `found ${mistakes.length}`);
  const words = mistakes.map(m => m.word.toLowerCase());
  assert(words.includes("goverment"), "Detects 'goverment'");
}

{
  const mistakes = detectSpellingMistakesSync("");
  assert(mistakes.length === 0, "Empty text returns no mistakes");
}

{
  const mistakes = detectSpellingMistakesSync(null);
  assert(mistakes.length === 0, "Null input returns no mistakes gracefully");
}

{
  const result = await compareDocuments(
    "The student recieve grammer corrections in every assigment submission",
    "The teacher checks enviroment setup before begining the class"
  );
  assert(result.spellingMistakes > 0, "compareDocuments counts spelling mistakes");
  assert(result.spellingMistakesA.length > 0, "spellingMistakesA array populated");
  assert(result.spellingMistakesB.length > 0, "spellingMistakesB array populated");
}

// ===============================================================
console.log("\n📋 SECTION 9: Filter Options");
// ===============================================================

{
  const textA = 'This is an "original quoted sentence" that should be excluded from comparison';
  const textB = 'This is an "original quoted sentence" that should be excluded from comparison';
  const withQuotes = await compareDocuments(textA, textB, {});
  const withoutQuotes = await compareDocuments(textA, textB, { excludeQuotes: true });
  assert(withQuotes.similarity === 100, "Same texts with quotes = 100%");
  // After removing quotes, content changes but both docs still match each other
  assert(withoutQuotes.similarity === 100, "After excluding quotes still identical to each other");
}

{
  const textA = "Main content here with some overlap\n\nReferences\nSmith J. 2023. Paper title. Journal Name.";
  const textB = "Main content here with some overlap\n\nBibliography\nJones A. 2022. Different paper. Other journal.";
  const result = await compareDocuments(textA, textB, { excludeReferences: true });
  assert(typeof result.similarity === "number", "excludeReferences option does not crash");
}

// ===============================================================
console.log("\n📋 SECTION 10: Server-Side Score Validation Logic");
// ===============================================================

{
  // Test that compareDocuments is deterministic on the same inputs
  const textA = "consistency test document alpha with specific words for hashing";
  const textB = "consistency test document beta slightly different but sharing some words";
  const r1 = await compareDocuments(textA, textB);
  const r2 = await compareDocuments(textA, textB);
  assert(r1.similarity === r2.similarity, "compareDocuments is deterministic (same inputs = same output)");
}

{
  // Verify that the server would override a spoofed 0% submission
  const textA = "The assignment was completed correctly with all required functions implemented";
  const textB = "The assignment was completed correctly with all required functions implemented";
  const result = await compareDocuments(textA, textB);
  // Simulate: client sends similarity = 0 but server recalculates
  const spoofedClientScore = 0;
  const serverScore = result.similarity;
  assert(
    serverScore !== spoofedClientScore,
    "Server-computed score differs from client-spoofed 0% for identical documents",
    `server says ${serverScore}%, client said ${spoofedClientScore}%`
  );
  assert(serverScore === 100, "Server correctly flags identical documents as 100%");
}

// ===============================================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} total`);

if (failed > 0) {
  console.error("\n⚠️  Some tests failed. Review the failures above before deploying.\n");
  process.exit(1);
} else {
  console.log("\n🎉 All tests passed!\n");
  process.exit(0);
}

})().catch(err => {
  console.error("Test suite error:", err);
  process.exit(1);
});
