# Part-Time Tech

A worker-first directory for meaningful, accountable technology roles that do
not require a standard 40-hour week.

The premise is simple: part-time should describe capacity, not commitment. Every
listing should make the work concrete by publishing its expected outcomes,
weekly hours, collaboration window, compensation, employment type, and benefits
eligibility thresholds.

This is an open-source, source-linked directory populated from public employer
job feeds and a small curated seed set. Every role links to its original listing
and records when it was posted, updated, and checked. Listings can close or
change at any time, so the original posting is always authoritative.

## Product standard

- **Real ownership:** outcomes, decision rights, and management cadence are explicit.
- **Honest capacity:** weekly hours, meeting load, overlap, and on-call terms are visible.
- **The whole offer:** compensation and benefits are searchable, including the hours required to qualify.
- **Broad access:** the product is designed for people balancing health, disability, caregiving, education, other commitments, or simply a preferred way of working.

## Data pipeline

The site reads its catalog from `data/jobs.json`. A daily GitHub Actions
workflow fetches the public job-posting APIs for the sources registered in
`data/sources.json`, normalizes the records, and publishes only technical roles
with a role-specific part-time, fractional, or 30-hours-or-less signal.

The crawler currently supports Greenhouse, Ashby, and Lever. It:

- preserves the original and application URLs;
- extracts weekly hours without filling in missing values;
- keeps employer-stated pay separate from calculated hourly estimates;
- treats benefits as unknown unless the listing establishes eligibility;
- deduplicates canonical source URLs;
- records first-seen, last-seen, last-changed, and last-verified dates;
- requires two confirmed misses before marking a listing closed;
- sends ambiguous part-time language to `data/review-queue.json`; and
- refuses to publish if too many sources fail, active volume drops
  unexpectedly, IDs collide, or required fields are missing.

`data/crawl-report.json` is the audit record for the latest run.

## Local development

```bash
pnpm install
pnpm run dev
```

## Crawl and verify

```bash
pnpm crawl
pnpm test
```

## Deploying

Pushes to `main` run the workflow in `.github/workflows/deploy-pages.yml`. It
validates the catalog, builds the Vite app, and deploys `dist/` to GitHub Pages.

`.github/workflows/refresh-jobs.yml` runs every day at 3:37 AM in
`America/Los_Angeles`, commits the refreshed data when validation passes, and
deploys that exact build. It can also be started manually from the Actions tab.

The workflow uses public ATS endpoints and requires only the repository's
built-in `GITHUB_TOKEN`. Add sources by editing `data/sources.json`; use
`data/manual-overrides.json` to suppress, force-publish, or correct an individual
source URL.

## Contributing

Issues and pull requests are welcome, particularly around source coverage, job
taxonomy, accessibility, benefit disclosure, and employer verification.
