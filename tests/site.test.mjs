import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("builds a GitHub Pages-compatible entry point", async () => {
  const html = await readFile(new URL("dist/index.html", root), "utf8");
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /Part-Time Tech/);
  assert.match(html, /\/part-time-tech-jobs\/assets\//);
});

test("publishes the GitHub Pages bypass file", async () => {
  await readFile(new URL("dist/.nojekyll", root), "utf8");
});

test("ships an auditable real-listing snapshot", async () => {
  const records = JSON.parse(await readFile(new URL("data/jobs.json", root), "utf8"));
  const active = records.filter((job) => job.status === "active");
  assert.ok(active.length >= 20);
  assert.ok(active.every((job) => job.sourceUrl.startsWith("https://")));
  assert.ok(active.every((job) => job.lastVerifiedDate));
  assert.ok(active.some((job) => job.benefitDisclosure === "not-disclosed"));
  assert.ok(active.some((job) => job.hourlyPayIsEstimate === true));
  assert.ok(active.some((job) => job.curated === false));
});

test("offers transparent sorting for dates, pay, hours, and company", async () => {
  const source = await readFile(new URL("src/App.tsx", root), "utf8");
  for (const sort of ["posted-desc", "posted-asc", "updated-desc", "verified-desc", "pay-desc", "pay-asc", "hours-asc", "company-asc"]) {
    assert.match(source, new RegExp(`value: "${sort}"`));
  }
  assert.match(source, /Pay sorting uses range midpoints; undisclosed pay appears last/);
});

test("publishes crawler provenance and lifecycle metadata", async () => {
  const records = JSON.parse(await readFile(new URL("data/jobs.json", root), "utf8"));
  for (const job of records) {
    assert.ok(job.sourceKind);
    assert.ok(job.sourceTenant);
    assert.ok(job.sourceJobId);
    assert.ok(job.firstSeenAt);
    assert.ok(job.lastSeenAt);
    assert.ok(job.lastChangedAt);
    assert.ok(job.contentHash);
  }
});
