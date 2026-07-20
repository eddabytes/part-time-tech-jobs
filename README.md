# Part-Time Tech

A worker-first directory for meaningful, accountable technology roles that do
not require a standard 40-hour week.

The premise is simple: part-time should describe capacity, not commitment. Every
listing should make the work concrete by publishing its expected outcomes,
weekly hours, collaboration window, compensation, employment type, and benefits
eligibility thresholds.

This is an open-source product prototype populated with a small manual crawl of
public job postings. Every role links to its source and records the date it was
checked. Listings can close or change at any time, so the original posting is
always authoritative.

## Product standard

- **Real ownership:** outcomes, decision rights, and management cadence are explicit.
- **Honest capacity:** weekly hours, meeting load, overlap, and on-call terms are visible.
- **The whole offer:** compensation and benefits are searchable, including the hours required to qualify.
- **Broad access:** the product is designed for people balancing health, disability, caregiving, education, other commitments, or simply a preferred way of working.

## Current data

`src/jobs.ts` contains eight public listings checked on July 19, 2026. The first
pass uses employer ATS pages where available and established job boards when an
employer page could not be located. No undisclosed hours, pay, benefits, or
eligibility thresholds are inferred.

This is currently a curated snapshot, not an automated scraper. A production
crawler should add expiration checks, source-specific adapters, deduplication,
and a review queue before publishing records.

## Local development

```bash
pnpm install
pnpm run dev
```

## Production build

```bash
pnpm run build
```

## Deploying

Pushes to `main` run the workflow in `.github/workflows/deploy-pages.yml`. It
builds the Vite app and deploys `dist/` to GitHub Pages.

## Contributing

Issues and pull requests are welcome, particularly around job taxonomy,
accessibility, benefit disclosure, and employer verification.
