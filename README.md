# Part-Time Tech

A worker-first directory for meaningful, accountable technology roles that do
not require a standard 40-hour week.

The premise is simple: part-time should describe capacity, not commitment. Every
listing should make the work concrete by publishing its expected outcomes,
weekly hours, collaboration window, compensation, employment type, and benefits
eligibility thresholds.

This is an open-source product prototype. Its sample companies and roles are
illustrative, not live job openings.

## Product standard

- **Real ownership:** outcomes, decision rights, and management cadence are explicit.
- **Honest capacity:** weekly hours, meeting load, overlap, and on-call terms are visible.
- **The whole offer:** compensation and benefits are searchable, including the hours required to qualify.
- **Broad access:** the product is designed for people balancing health, disability, caregiving, education, other commitments, or simply a preferred way of working.

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
