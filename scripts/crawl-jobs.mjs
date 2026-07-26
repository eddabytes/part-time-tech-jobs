import { readFile, rename, writeFile } from "node:fs/promises";
import { fetchSource } from "./crawl/adapters.mjs";
import {
  canonicalUrl,
  classifyCandidate,
  normalizeCandidate,
  recordHash,
  reviewCandidate,
} from "./crawl/normalize.mjs";

const root = new URL("../", import.meta.url);
const startedAt = new Date();
const crawlDate = startedAt.toISOString().slice(0, 10);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

async function writeJson(path, value) {
  const target = new URL(path, root);
  const temporary = new URL(`${path}.tmp`, root);
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, target);
}

function sourceId(kind, tenant) {
  return `${kind}:${tenant}`;
}

function rawKey(raw) {
  return `${raw.source.kind}:${raw.source.tenant}:${raw.externalId}`;
}

function recordKey(record) {
  return `${record.sourceKind}:${record.sourceTenant}:${record.sourceJobId}`;
}

function active(record) {
  return record.status === "active";
}

function mergeCurated(existing, incoming) {
  if (!existing.curated) return incoming;
  const curatedFields = [
    "summary",
    "expectations",
    "collaboration",
    "duration",
    "benefitTypes",
    "benefitDisclosure",
    "benefits",
    "tags",
    "category",
    "seniority",
  ];
  const merged = { ...incoming };
  for (const field of curatedFields) {
    if (existing[field] != null) merged[field] = existing[field];
  }
  return merged;
}

function mergeRecord(existing, incoming, counts) {
  const candidate = mergeCurated(existing, incoming);
  const changed = existing.contentHash !== incoming.contentHash;
  if (changed) counts.updated += 1;

  return {
    ...existing,
    ...candidate,
    id: existing.id,
    firstSeenAt: existing.firstSeenAt || crawlDate,
    lastSeenAt: crawlDate,
    lastVerifiedDate: crawlDate,
    lastChangedAt: changed ? crawlDate : existing.lastChangedAt,
    contentHash: incoming.contentHash,
    status: "active",
    consecutiveMisses: 0,
    curated: existing.curated === true,
  };
}

async function runSources(sources, concurrency = 4) {
  const successes = [];
  const failures = [];

  for (let index = 0; index < sources.length; index += concurrency) {
    const batch = sources.slice(index, index + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (source) => ({
        source,
        jobs: await fetchSource(source),
      })),
    );

    results.forEach((result, resultIndex) => {
      const source = batch[resultIndex];
      if (result.status === "fulfilled") {
        successes.push(result.value);
      } else {
        failures.push({
          sourceId: source.id,
          message: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });
  }

  return { successes, failures };
}

async function checkUrl(url) {
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "user-agent": "Part-Time-Tech-Jobs/1.0 (+https://github.com/eddabytes/part-time-tech-jobs)",
      },
    });
    if (response.status === 405) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: {
          "user-agent": "Part-Time-Tech-Jobs/1.0 (+https://github.com/eddabytes/part-time-tech-jobs)",
        },
      });
    }
    return {
      reachable:
        (response.status >= 200 && response.status < 400) ||
        response.status === 403 ||
        response.status === 429,
      status: response.status,
    };
  } catch (error) {
    return { reachable: null, status: null, message: error instanceof Error ? error.message : String(error) };
  }
}

async function checkUncoveredRecords(records, configuredSourceIds, concurrency = 4) {
  const unique = new Map();
  for (const record of records) {
    if (!configuredSourceIds.has(sourceId(record.sourceKind, record.sourceTenant))) {
      unique.set(canonicalUrl(record.sourceUrl), record.sourceUrl);
    }
  }

  const entries = [...unique.entries()];
  const results = new Map();
  for (let index = 0; index < entries.length; index += concurrency) {
    const batch = entries.slice(index, index + concurrency);
    const checked = await Promise.all(
      batch.map(async ([canonical, url]) => [canonical, await checkUrl(url)]),
    );
    for (const [canonical, result] of checked) results.set(canonical, result);
  }
  return results;
}

function deduplicate(records) {
  const byUrl = new Map();
  for (const record of records) {
    const key = canonicalUrl(record.sourceUrl);
    const prior = byUrl.get(key);
    if (!prior || (prior.sourceTier === "aggregator" && record.sourceTier !== "aggregator")) {
      byUrl.set(key, record);
    }
  }
  return [...byUrl.values()];
}

function applyOverrides(record, overrides) {
  const url = canonicalUrl(record.sourceUrl);
  return overrides.fieldOverrides[url] ? { ...record, ...overrides.fieldOverrides[url] } : record;
}

function validateOutput(records, previousActiveCount, sourceSuccesses, sourceCount) {
  const activeRecords = records.filter(active);
  if (sourceSuccesses / sourceCount < 0.7) {
    throw new Error(`Only ${sourceSuccesses} of ${sourceCount} configured sources succeeded`);
  }
  if (activeRecords.length === 0) throw new Error("The crawl produced no active jobs");
  if (previousActiveCount >= 10 && activeRecords.length < previousActiveCount * 0.7) {
    throw new Error(
      `Active job count fell from ${previousActiveCount} to ${activeRecords.length}; refusing to publish`,
    );
  }

  const ids = new Set();
  const urls = new Set();
  for (const record of records) {
    if (!record.id || !record.role || !record.company || !record.sourceUrl) {
      throw new Error(`Record ${record.id || "(missing id)"} is missing a required field`);
    }
    if (ids.has(record.id)) throw new Error(`Duplicate record id: ${record.id}`);
    ids.add(record.id);
    const url = canonicalUrl(record.sourceUrl);
    if (urls.has(url)) throw new Error(`Duplicate source URL: ${url}`);
    urls.add(url);
  }
}

const [sources, previousJobs, previousReview, overrides] = await Promise.all([
  readJson("data/sources.json"),
  readJson("data/jobs.json"),
  readJson("data/review-queue.json"),
  readJson("data/manual-overrides.json"),
]);

const enabledSources = sources.filter((source) => source.enabled);
const configuredSourceIds = new Set(enabledSources.map((source) => source.id));
const previousByIdentity = new Map(previousJobs.map((record) => [recordKey(record), record]));
const previousByUrl = new Map(
  previousJobs.map((record) => [canonicalUrl(record.sourceUrl), record]),
);

const { successes, failures } = await runSources(enabledSources);
const successfulSourceIds = new Set(successes.map(({ source }) => source.id));
const rawJobs = successes.flatMap(({ jobs }) => jobs);
const seenRawKeys = new Set(rawJobs.map(rawKey));
const suppress = new Set(overrides.suppressSourceUrls.map(canonicalUrl));
const forcePublish = new Set(overrides.forcePublishSourceUrls.map(canonicalUrl));

const candidates = [];
const review = [];
for (const raw of rawJobs) {
  const url = canonicalUrl(raw.sourceUrl);
  if (suppress.has(url)) continue;
  const classification = classifyCandidate(raw);
  if (forcePublish.has(url)) {
    classification.disposition = "publish";
    classification.reason = "Explicitly approved in manual overrides";
  }

  if (classification.disposition === "publish") {
    candidates.push(normalizeCandidate(raw, classification, crawlDate));
  } else if (classification.disposition === "review") {
    review.push(reviewCandidate(raw, classification, crawlDate));
  }
}

const dedupedCandidates = deduplicate(candidates);
const counts = { added: 0, updated: 0, closed: 0 };
const output = [];
const matchedExistingIds = new Set();

for (const incoming of dedupedCandidates) {
  const existing =
    previousByIdentity.get(recordKey(incoming)) ||
    previousByUrl.get(canonicalUrl(incoming.sourceUrl));
  if (existing) {
    matchedExistingIds.add(existing.id);
    output.push(applyOverrides(mergeRecord(existing, incoming, counts), overrides));
  } else {
    counts.added += 1;
    output.push(applyOverrides(incoming, overrides));
  }
}

const uncoveredChecks = await checkUncoveredRecords(previousJobs, configuredSourceIds);

for (const existing of previousJobs) {
  if (matchedExistingIds.has(existing.id)) continue;
  const identity = recordKey(existing);
  const configuredId = sourceId(existing.sourceKind, existing.sourceTenant);
  const sourceSucceeded = successfulSourceIds.has(configuredId);
  const sourceFailed = configuredSourceIds.has(configuredId) && !sourceSucceeded;

  if (sourceSucceeded && seenRawKeys.has(identity)) {
    if (existing.curated) {
      output.push({
        ...existing,
        status: "active",
        lastSeenAt: crawlDate,
        lastVerifiedDate: crawlDate,
        consecutiveMisses: 0,
      });
    } else {
      output.push({
        ...existing,
        status: "review",
        lastSeenAt: crawlDate,
        lastVerifiedDate: crawlDate,
        consecutiveMisses: 0,
      });
    }
    continue;
  }

  if (sourceFailed) {
    output.push(existing);
    continue;
  }

  if (!configuredSourceIds.has(configuredId)) {
    const result = uncoveredChecks.get(canonicalUrl(existing.sourceUrl));
    if (result?.reachable === true) {
      output.push({
        ...existing,
        status: "active",
        lastSeenAt: crawlDate,
        lastVerifiedDate: crawlDate,
        consecutiveMisses: 0,
      });
      continue;
    }
    if (result?.reachable == null) {
      output.push(existing);
      continue;
    }
  }

  const misses = (existing.consecutiveMisses ?? 0) + 1;
  const nextStatus = misses >= 2 ? "closed" : existing.status;
  if (existing.status !== "closed" && nextStatus === "closed") counts.closed += 1;
  output.push({
    ...existing,
    status: nextStatus,
    lastVerifiedDate: crawlDate,
    consecutiveMisses: misses,
    closedAt: nextStatus === "closed" ? existing.closedAt || crawlDate : existing.closedAt,
  });
}

const uniqueOutput = deduplicate(output)
  .map((record) => ({ ...record, contentHash: recordHash(record) }))
  .sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return b.postedDate.localeCompare(a.postedDate) || a.company.localeCompare(b.company);
  });

const reviewById = new Map(previousReview.map((item) => [item.id, item]));
for (const item of review) {
  const previous = reviewById.get(item.id);
  reviewById.set(item.id, previous ? { ...previous, ...item, firstReviewedAt: previous.firstReviewedAt } : item);
}
const currentReviewIds = new Set(review.map((item) => item.id));
const reviewOutput = [...reviewById.values()]
  .filter((item) => currentReviewIds.has(item.id))
  .sort((a, b) => a.company.localeCompare(b.company) || a.role.localeCompare(b.role));

const previousActiveCount = previousJobs.filter(active).length;
let report;
try {
  validateOutput(uniqueOutput, previousActiveCount, successes.length, enabledSources.length);
  report = {
    status: failures.length === 0 ? "success" : "partial",
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    sources: {
      configured: enabledSources.length,
      succeeded: successes.length,
      failed: failures.length,
      details: successes.map(({ source, jobs }) => ({
        id: source.id,
        rawJobs: jobs.length,
        status: "success",
      })),
    },
    counts: {
      rawJobs: rawJobs.length,
      candidates: dedupedCandidates.length,
      published: uniqueOutput.filter(active).length,
      added: counts.added,
      updated: counts.updated,
      closed: counts.closed,
      review: reviewOutput.length,
    },
    failures,
  };
} catch (error) {
  report = {
    status: "failed",
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    sources: {
      configured: enabledSources.length,
      succeeded: successes.length,
      failed: failures.length,
    },
    counts: {
      rawJobs: rawJobs.length,
      candidates: dedupedCandidates.length,
      published: previousActiveCount,
      added: counts.added,
      updated: counts.updated,
      closed: counts.closed,
      review: reviewOutput.length,
    },
    failures: [...failures, { sourceId: "quality-gate", message: error.message }],
  };
  await writeJson("data/crawl-report.json", report);
  throw error;
}

await Promise.all([
  writeJson("data/jobs.json", uniqueOutput),
  writeJson("data/review-queue.json", reviewOutput),
  writeJson("data/crawl-report.json", report),
]);

console.log(
  `Crawl ${report.status}: ${report.counts.published} active jobs, ${report.counts.added} added, ${report.counts.updated} updated, ${report.counts.review} queued for review`,
);
