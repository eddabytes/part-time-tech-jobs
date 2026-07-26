const USER_AGENT =
  "Part-Time-Tech-Jobs/1.0 (+https://github.com/eddabytes/part-time-tech-jobs)";

async function fetchJson(url, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastError;
}

function greenhouseUrl(source) {
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.tenant)}/jobs?content=true`;
}

function ashbyUrl(source) {
  return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.tenant)}?includeCompensation=true`;
}

function leverUrl(source) {
  return `https://api.lever.co/v0/postings/${encodeURIComponent(source.tenant)}?mode=json`;
}

function normalizeGreenhouse(source, job) {
  return {
    source,
    externalId: String(job.id),
    title: job.title ?? "",
    company: job.company_name || source.company,
    location: job.location?.name ?? "",
    secondaryLocations: (job.offices ?? []).map((office) => office.location || office.name).filter(Boolean),
    description: job.content ?? "",
    employmentType: "",
    workplaceType: /remote/i.test(job.location?.name ?? "") ? "remote" : "",
    department: (job.departments ?? []).map((department) => department.name).join(", "),
    team: "",
    publishedAt: job.first_published ?? null,
    updatedAt: job.updated_at ?? null,
    deadline: job.application_deadline ?? null,
    sourceUrl: job.absolute_url,
    applyUrl: job.absolute_url,
    compensation: null,
  };
}

function normalizeAshby(source, job) {
  return {
    source,
    externalId: String(job.id),
    title: job.title ?? "",
    company: source.company,
    location: job.location ?? "",
    secondaryLocations: (job.secondaryLocations ?? []).map((item) => item.location).filter(Boolean),
    description: job.descriptionPlain || job.descriptionHtml || "",
    employmentType: job.employmentType ?? "",
    workplaceType: job.workplaceType ?? (job.isRemote ? "remote" : ""),
    department: job.department ?? "",
    team: job.team ?? "",
    publishedAt: job.publishedAt ?? null,
    updatedAt: null,
    deadline: null,
    sourceUrl: job.jobUrl,
    applyUrl: job.applyUrl || job.jobUrl,
    compensation: job.compensation ?? null,
  };
}

function normalizeLever(source, job) {
  const listText = (job.lists ?? [])
    .map((list) => `${list.text || ""}\n${list.content || ""}`)
    .join("\n");

  return {
    source,
    externalId: String(job.id),
    title: job.text ?? "",
    company: source.company,
    location: job.categories?.location ?? "",
    secondaryLocations: job.categories?.allLocations ?? [],
    description: [
      job.openingPlain,
      job.descriptionPlain,
      job.descriptionBodyPlain,
      listText,
      job.additionalPlain,
    ]
      .filter(Boolean)
      .join("\n"),
    employmentType: job.categories?.commitment ?? "",
    workplaceType: job.workplaceType ?? "",
    department: job.categories?.department ?? "",
    team: job.categories?.team ?? "",
    publishedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    updatedAt: null,
    deadline: null,
    sourceUrl: job.hostedUrl,
    applyUrl: job.applyUrl || job.hostedUrl,
    compensation: job.salaryRange ?? null,
  };
}

export async function fetchSource(source) {
  if (source.kind === "greenhouse") {
    const payload = await fetchJson(greenhouseUrl(source));
    return (payload.jobs ?? []).map((job) => normalizeGreenhouse(source, job));
  }

  if (source.kind === "ashby") {
    const payload = await fetchJson(ashbyUrl(source));
    return (payload.jobs ?? []).filter((job) => job.isListed !== false).map((job) => normalizeAshby(source, job));
  }

  if (source.kind === "lever") {
    const payload = await fetchJson(leverUrl(source));
    return (Array.isArray(payload) ? payload : []).map((job) => normalizeLever(source, job));
  }

  throw new Error(`Unsupported source kind: ${source.kind}`);
}
