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
