import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalUrl,
  classifyCandidate,
  extractHours,
  extractPay,
} from "../scripts/crawl/normalize.mjs";

function raw(overrides = {}) {
  return {
    title: "Software Engineer",
    description: "",
    employmentType: "",
    department: "Engineering",
    team: "Product",
    compensation: null,
    ...overrides,
  };
}

test("publishes a technical role with explicit part-time hours", () => {
  const result = classifyCandidate(
    raw({ description: "This part-time role requires approximately 15-20 hours per week." }),
  );
  assert.equal(result.disposition, "publish");
  assert.deepEqual(result.hours, {
    min: 15,
    max: 20,
    label: "15–20 hrs / week",
    evidence: "approximately 15-20 hours per week",
  });
});

test("recognizes PT as part-time only when it appears in the title", () => {
  const result = classifyCandidate(
    raw({
      title: "Content Designer (Contract Role, PT)",
      description: "Shape product content and LLM-assisted UX flows.",
    }),
  );
  assert.equal(result.disposition, "publish");
});

test("does not mistake generic benefit boilerplate for a part-time role", () => {
  const result = classifyCandidate(
    raw({ description: "Full-time and part-time employees may be eligible for healthcare benefits." }),
  );
  assert.equal(result.disposition, "review");
});

test("rejects nontechnical specialists even when their description mentions software", () => {
  const result = classifyCandidate(
    raw({
      title: "Business Loan Processing Specialist",
      department: "Operations",
      description: "Work 10 hours per week using internal software and technology tools.",
    }),
  );
  assert.equal(result.disposition, "reject");
});

test("extracts partial hour commitments without inventing a maximum", () => {
  assert.deepEqual(extractHours("Most projects involve at least 10 hours per week."), {
    min: 10,
    max: null,
    label: "10+ hrs / week",
    evidence: "at least 10 hours per week",
  });
});

test("preserves monthly commitments without pretending they are weekly hours", () => {
  assert.deepEqual(extractHours("This contract requires 80-100 hours per month."), {
    min: null,
    max: null,
    label: "80–100 hrs / month",
    evidence: "80-100 hours per month",
  });
});

test("does not assign full-time hours to a fractional option", () => {
  const result = classifyCandidate(
    raw({
      title: "AI Strategist (Fractional or Full-time)",
      description: "Join on a fractional, contract, or full-time basis. Ongoing, 40 hours per week dedication.",
    }),
  );
  assert.equal(result.disposition, "publish");
  assert.deepEqual(result.hours, {
    min: null,
    max: null,
    label: "Fractional hours not disclosed; full-time option is 40 hrs / week",
    evidence: null,
  });
});

test("prefers employer-stated hourly copy over an inconsistent annual ATS field", () => {
  const pay = extractPay(
    raw({
      description: "Competitive hourly rate ($40-$50/hr).",
      compensation: {
        min: 75_000,
        max: 150_000,
        currency: "USD",
        interval: "per-year-salary",
      },
    }),
    { min: null, max: null },
  );
  assert.equal(pay.compensation, "$40–$50 / hour");
  assert.equal(pay.hourlyPayIsEstimate, false);
});

test("canonicalizes tracking parameters and trailing slashes", () => {
  assert.equal(
    canonicalUrl("https://example.com/jobs/123/?utm_source=test&gh_src=abc"),
    "https://example.com/jobs/123",
  );
});
