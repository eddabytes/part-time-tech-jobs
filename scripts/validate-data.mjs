import { readFile } from "node:fs/promises";
import { canonicalUrl } from "./crawl/normalize.mjs";

const root = new URL("../", import.meta.url);
const jobs = JSON.parse(await readFile(new URL("data/jobs.json", root), "utf8"));
const sources = JSON.parse(await readFile(new URL("data/sources.json", root), "utf8"));
const report = JSON.parse(await readFile(new URL("data/crawl-report.json", root), "utf8"));

const ids = new Set();
const urls = new Set();
let active = 0;

for (const job of jobs) {
  for (const field of ["id", "company", "role", "sourceUrl", "sourceKind", "sourceTenant", "sourceJobId", "status"]) {
    if (!job[field]) throw new Error(`${job.id || "(missing id)"} has no ${field}`);
  }
  if (!/^https:\/\//.test(job.sourceUrl)) throw new Error(`${job.id} has a non-HTTPS source URL`);
  if (ids.has(job.id)) throw new Error(`Duplicate job id: ${job.id}`);
  ids.add(job.id);
  const url = canonicalUrl(job.sourceUrl);
  if (urls.has(url)) throw new Error(`Duplicate source URL: ${url}`);
  urls.add(url);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(job.postedDate)) throw new Error(`${job.id} has an invalid posted date`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(job.lastVerifiedDate)) throw new Error(`${job.id} has an invalid verification date`);
  if (job.status === "active") {
    active += 1;
    if ((job.consecutiveMisses ?? 0) >= 2) throw new Error(`${job.id} is active after two missed crawls`);
  }
}

if (active < 20) throw new Error(`Only ${active} active jobs passed validation`);
if (sources.filter((source) => source.enabled).length < 10) throw new Error("The source registry is unexpectedly small");
if (report.status === "failed") throw new Error("The latest crawl report failed its quality gate");

console.log(`Validated ${active} active jobs across ${sources.filter((source) => source.enabled).length} configured sources`);
