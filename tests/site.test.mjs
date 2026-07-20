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
  const source = await readFile(new URL("src/jobs.ts", root), "utf8");
  assert.equal((source.match(/sourceUrl: "https:\/\//g) ?? []).length, 31);
  assert.equal((source.match(/lastVerifiedDate: checked/g) ?? []).length, 31);
  assert.equal((source.match(/postedDate:/g) ?? []).length, 32);
  assert.equal((source.match(/hourlyPayMin:/g) ?? []).length, 32);
  assert.match(source, /benefitDisclosure: "not-disclosed"/);
  assert.match(source, /hourlyPayIsEstimate: true/);
  assert.doesNotMatch(source, /Northstar Health|Relay AI|Juniper Climate/);
});

test("offers transparent sorting for dates, pay, hours, and company", async () => {
  const source = await readFile(new URL("src/App.tsx", root), "utf8");
  for (const sort of ["posted-desc", "posted-asc", "verified-desc", "pay-desc", "pay-asc", "hours-asc", "company-asc"]) {
    assert.match(source, new RegExp(`value: "${sort}"`));
  }
  assert.match(source, /Pay sorting uses range midpoints; undisclosed pay appears last/);
});
