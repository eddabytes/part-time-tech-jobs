import { createHash } from "node:crypto";

const TECH_TITLE =
  /\b(engineer|developer|architect|software|data|analytics|security|cyber|devops|cloud|site reliability|sre|machine learning|ml\b|artificial intelligence|product manager|product owner|product designer|content designer|ux\b|ui\b|quality assurance|qa\b|software test|technical support|it support|it administrator|technology|research fellow|ciso)\b/i;
const TECH_CONTEXT =
  /\b(engineering|software|data|security|cyber|devops|cloud|information technology|product|technical|ai|machine learning|monitoring|cloudwatch|grafana|linux)\b/i;
const TITLE_PART_TIME = /\b(part[ -]?time|fractional|half[ -]?time|working student|pt)\b/i;
const BODY_ROLE_PART_TIME =
  /\b(?:this|the)\s+(?:role|position|opportunity)\s+(?:is|will be|offers)[^.\n]{0,80}\bpart[ -]?time\b|\bpart[ -]?time\s+(?:role|position|opportunity|contract|schedule|engagement)\b|\bfractional\s+(?:role|position|engagement|contract|work)\b|\b(?:prefer|preferred|open)\s+(?:to\s+)?(?:work|working)?\s*part[ -]?time\b|\bhalf[ -]?time\b|\b0\.[1-7]\s*fte\b/i;

const SKILLS = [
  ["Python", /\bpython\b/i],
  ["TypeScript", /\btypescript\b/i],
  ["JavaScript", /\bjavascript\b/i],
  ["React", /\breact(?:\.js)?\b/i],
  ["Node.js", /\bnode(?:\.js)?\b/i],
  ["AWS", /\baws\b|amazon web services/i],
  ["Azure", /\bazure\b/i],
  ["GCP", /\bgcp\b|google cloud/i],
  ["Kubernetes", /\bkubernetes\b|\bk8s\b/i],
  ["Docker", /\bdocker\b/i],
  ["Terraform", /\bterraform\b/i],
  ["PostgreSQL", /\bpostgres(?:ql)?\b/i],
  ["SQL", /\bsql\b/i],
  ["Snowflake", /\bsnowflake\b/i],
  ["Salesforce", /\bsalesforce\b/i],
  ["LLMs", /\bllms?\b|large language model/i],
  ["RAG", /\brag\b|retrieval.augmented/i],
  ["Machine learning", /\bmachine learning\b/i],
  ["SOC 2", /\bsoc ?2\b/i],
  ["HIPAA", /\bhipaa\b/i],
  ["IAM", /\biam\b|identity and access/i],
  ["Figma", /\bfigma\b/i],
  ["Product design", /\bproduct design\b/i],
  ["User research", /\buser research\b|interviews?\b/i],
  ["Data quality", /\bdata quality\b/i],
  ["Incident response", /\bincident response\b/i],
  ["Technical writing", /\btechnical writing\b/i],
];

export function decodeHtml(value = "") {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function plainText(value = "") {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|ul|ol|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function oneLine(value = "") {
  return plainText(value).replace(/\s+/g, " ").trim();
}

export function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const parameter of ["gh_src", "lever-source", "lever-origin", "utm_source", "utm_medium", "utm_campaign"]) {
      url.searchParams.delete(parameter);
    }
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\?$/, "");
  } catch {
    return value;
  }
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
}

function parseNumber(value) {
  return Number(String(value).replace(/,/g, ""));
}

export function extractHours(text) {
  const normalized = oneLine(text);
  const range = normalized.match(
    /\b(?:approximately|approx\.?|about|around|~)?\s*(\d{1,2}(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:\/|per|a)\s*week\b/i,
  );
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (max <= 40 && min <= max) {
      return { min, max, label: `${min}–${max} hrs / week`, evidence: range[0] };
    }
  }

  const upTo = normalized.match(/\bup to\s+(\d{1,2})\s*(?:hours?|hrs?)\s*(?:\/|per|a)\s*week\b/i);
  if (upTo && Number(upTo[1]) <= 40) {
    return { min: 0, max: Number(upTo[1]), label: `Up to ${upTo[1]} hrs / week`, evidence: upTo[0] };
  }

  const atLeast = normalized.match(/\bat least\s+(\d{1,2})\s*(?:hours?|hrs?)\s*(?:\/|per|a)\s*week\b/i);
  if (atLeast && Number(atLeast[1]) <= 40) {
    return { min: Number(atLeast[1]), max: null, label: `${atLeast[1]}+ hrs / week`, evidence: atLeast[0] };
  }

  const single = normalized.match(
    /\b(?:approximately|approx\.?|about|around|~)?\s*(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:\/|per|a)\s*week\b/i,
  );
  if (single && Number(single[1]) <= 40) {
    const hours = Number(single[1]);
    return { min: hours, max: hours, label: `~${hours} hrs / week`, evidence: single[0] };
  }

  const monthly = normalized.match(
    /\b(\d{1,3})\s*(?:-|–|—|to)\s*(\d{1,3})\s*(?:hours?|hrs?)\s*(?:\/|per|a)\s*month\b/i,
  );
  if (monthly) {
    return {
      min: null,
      max: null,
      label: `${monthly[1]}–${monthly[2]} hrs / month`,
      evidence: monthly[0],
    };
  }

  const fte = normalized.match(/\b(0\.[1-7])\s*fte\b/i);
  if (fte) {
    return { min: null, max: null, label: `${fte[1]} FTE; exact hours not disclosed`, evidence: fte[0] };
  }

  const halfTime = normalized.match(/\bhalf[ -]?time\b|\b50%\s+(?:schedule|role|position|fte)\b/i);
  if (halfTime) {
    return { min: null, max: null, label: "Half-time; exact hours not disclosed", evidence: halfTime[0] };
  }

  return { min: null, max: null, label: "Weekly hours not disclosed", evidence: null };
}

function currencyDetails(token) {
  const compact = token.replace(/\s+/g, "").toUpperCase();
  if (compact === "£") return { code: "GBP", symbol: "£" };
  if (compact === "€") return { code: "EUR", symbol: "€" };
  if (compact === "CA$" || compact === "CAD") return { code: "CAD", symbol: "CA$" };
  if (compact === "A$" || compact === "AUD") return { code: "AUD", symbol: "A$" };
  return { code: "USD", symbol: "$" };
}

function formatAmount(value, symbol, decimals = false) {
  return `${symbol}${value.toLocaleString("en-US", {
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: decimals && !Number.isInteger(value) ? 2 : 0,
  })}`;
}

function textHourlyPay(text) {
  const normalized = oneLine(text);
  const token = "(?:US\\$|USD\\s*\\$?|CA\\$|CAD\\s*\\$?|A\\$|AUD\\s*\\$?|£|€|\\$)";
  const range = normalized.match(
    new RegExp(`(${token})\\s*([\\d,.]+)\\s*(?:-|–|—|to)\\s*(?:${token})?\\s*([\\d,.]+)\\s*(?:/|per\\s+)(?:hour|hr)\\b`, "i"),
  );
  if (range) {
    const currency = currencyDetails(range[1]);
    return {
      min: parseNumber(range[2]),
      max: parseNumber(range[3]),
      currency: currency.code,
      symbol: currency.symbol,
      evidence: range[0],
    };
  }

  const single = normalized.match(
    new RegExp(`(${token})\\s*([\\d,.]+)\\s*(?:/|per\\s+)(?:hour|hr)\\b`, "i"),
  );
  if (single) {
    const currency = currencyDetails(single[1]);
    const amount = parseNumber(single[2]);
    return { min: amount, max: amount, currency: currency.code, symbol: currency.symbol, evidence: single[0] };
  }

  return null;
}

function structuredPay(compensation) {
  if (!compensation) return null;

  if (Array.isArray(compensation.summaryComponents)) {
    const hourly = compensation.summaryComponents.find(
      (component) =>
        component.compensationType === "Salary" &&
        /hour/i.test(component.interval ?? "") &&
        component.minValue != null,
    );
    if (hourly) {
      const currency = currencyDetails(hourly.currencyCode || "USD");
      return {
        kind: "hourly",
        min: Number(hourly.minValue),
        max: Number(hourly.maxValue ?? hourly.minValue),
        currency: currency.code,
        symbol: currency.symbol,
      };
    }

    const annual = compensation.summaryComponents.find(
      (component) =>
        component.compensationType === "Salary" &&
        /year/i.test(component.interval ?? "") &&
        component.minValue != null,
    );
    if (annual) {
      const currency = currencyDetails(annual.currencyCode || "USD");
      return {
        kind: "annual",
        min: Number(annual.minValue),
        max: Number(annual.maxValue ?? annual.minValue),
        currency: currency.code,
        symbol: currency.symbol,
      };
    }
  }

  if (compensation.min != null && compensation.interval) {
    const currency = currencyDetails(compensation.currency || "USD");
    return {
      kind: /hour/i.test(compensation.interval) ? "hourly" : "annual",
      min: Number(compensation.min),
      max: Number(compensation.max ?? compensation.min),
      currency: currency.code,
      symbol: currency.symbol,
    };
  }

  return null;
}

export function extractPay(raw, hours) {
  const fromText = textHourlyPay(raw.description);
  if (fromText) {
    const compensation =
      fromText.min === fromText.max
        ? `${formatAmount(fromText.min, fromText.symbol)} / hour`
        : `${formatAmount(fromText.min, fromText.symbol)}–${formatAmount(fromText.max, fromText.symbol)} / hour`;
    return {
      compensation,
      hourlyPayMin: fromText.min,
      hourlyPayMax: fromText.max,
      hourlyPayIsEstimate: false,
      hourlyPayComparable: fromText.currency === "USD",
      payCurrency: fromText.currency,
      hourlyPayNote: `Employer-stated hourly pay: “${fromText.evidence}”.`,
    };
  }

  const structured = structuredPay(raw.compensation);
  if (structured?.kind === "hourly") {
    const compensation =
      structured.min === structured.max
        ? `${formatAmount(structured.min, structured.symbol)} / hour`
        : `${formatAmount(structured.min, structured.symbol)}–${formatAmount(structured.max, structured.symbol)} / hour`;
    return {
      compensation,
      hourlyPayMin: structured.min,
      hourlyPayMax: structured.max,
      hourlyPayIsEstimate: false,
      hourlyPayComparable: structured.currency === "USD",
      payCurrency: structured.currency,
      hourlyPayNote: "Employer-stated hourly compensation from the ATS.",
    };
  }

  if (structured?.kind === "annual" && hours.min != null && hours.max != null && hours.min > 0) {
    const min = structured.min / (hours.max * 52);
    const max = structured.max / (hours.min * 52);
    return {
      compensation: `≈ ${formatAmount(min, structured.symbol, true)}–${formatAmount(max, structured.symbol, true)} / hour`,
      hourlyPayMin: Number(min.toFixed(2)),
      hourlyPayMax: Number(max.toFixed(2)),
      hourlyPayIsEstimate: true,
      hourlyPayComparable: structured.currency === "USD",
      payCurrency: structured.currency,
      hourlyPayNote: `Calculated from ${formatAmount(structured.min, structured.symbol)}–${formatAmount(structured.max, structured.symbol)} annual ÷ ${hours.min === hours.max ? `${hours.min} × 52` : `${hours.min}–${hours.max} weekly hours × 52`}.`,
    };
  }

  if (structured?.kind === "annual") {
    return {
      compensation: `${formatAmount(structured.min, structured.symbol)}–${formatAmount(structured.max, structured.symbol)} / year`,
      hourlyPayMin: null,
      hourlyPayMax: null,
      hourlyPayIsEstimate: false,
      hourlyPayComparable: false,
      payCurrency: structured.currency,
      hourlyPayNote: "Employer-stated annual compensation; weekly hours are not precise enough for an hourly conversion.",
    };
  }

  return {
    compensation: "Pay not disclosed",
    hourlyPayMin: null,
    hourlyPayMax: null,
    hourlyPayIsEstimate: false,
    hourlyPayComparable: false,
    payCurrency: null,
    hourlyPayNote: "The source does not publish usable compensation.",
  };
}

function isTechnicalRole(raw) {
  const title = raw.title ?? "";
  const context = `${raw.department ?? ""} ${raw.team ?? ""} ${raw.description ?? ""}`.slice(0, 4_000);
  if (TECH_TITLE.test(title)) return true;
  if (
    /\bai\b/i.test(title) &&
    /\b(engineer|architect|developer|strategist|trainer|product|research|tools?|software|data|coding|computer|cyber|security|technical)\b/i.test(
      title,
    )
  ) {
    return true;
  }
  if (
    /\boperations specialist\b/i.test(title) &&
    /\b(engineering|technology|security|it)\b/i.test(`${raw.department ?? ""} ${raw.team ?? ""}`) &&
    /\b(logs?|monitoring|dashboard|cloudwatch|grafana|linux|incident)\b/i.test(context)
  ) {
    return true;
  }
  return false;
}

export function classifyCandidate(raw) {
  const text = oneLine(raw.description);
  const technical = isTechnicalRole(raw);
  const employment = `${raw.employmentType ?? ""} ${raw.title ?? ""}`;
  const structuredPartTime = /\bpart\s*time\b|\bparttime\b|\bfractional\b/i.test(employment);
  const titlePartTime = TITLE_PART_TIME.test(raw.title ?? "");
  const bodyRolePartTime = BODY_ROLE_PART_TIME.test(text);
  let hours = extractHours(text);
  const scheduleConflict =
    hours.min != null &&
    hours.min > 30 &&
    /\b(?:fractional|part[ -]?time)\b[^.\n]{0,80}\b(?:or|and|\/)\s*full[ -]?time\b/i.test(
      `${raw.title ?? ""} ${text}`,
    );
  if (scheduleConflict) {
    hours = {
      min: null,
      max: null,
      label: "Fractional hours not disclosed; full-time option is 40 hrs / week",
      evidence: null,
    };
  }
  const hoursSignal =
    hours.min != null &&
    hours.min <= 30 &&
    (hours.max == null || hours.max <= 30);

  if (!technical) {
    return { disposition: "reject", reason: "Title is outside the technical-role taxonomy", hours };
  }
  if (structuredPartTime || titlePartTime || hoursSignal || bodyRolePartTime) {
    return {
      disposition: "publish",
      reason: structuredPartTime
        ? "ATS marks the role as part-time"
        : titlePartTime
          ? "Title explicitly states part-time or fractional"
          : hoursSignal
            ? "Posting states a workload of 30 hours per week or less"
            : "Role-specific copy explicitly states part-time",
      hours,
      scheduleConflict,
    };
  }
  if (/\bpart[ -]?time\b|\bfractional\b/i.test(text)) {
    return {
      disposition: "review",
      reason: "Part-time language is present but may only describe benefits or a different employment option",
      hours,
    };
  }
  return { disposition: "reject", reason: "No role-specific part-time signal", hours };
}

function categoryFor(raw) {
  const title = raw.title ?? "";
  if (/\b(cto|chief technology|vp engineering|head of engineering)\b/i.test(title)) return "Leadership";
  if (/\b(product manager|product owner)\b/i.test(title)) return "Product";
  if (/\b(design|ux|ui|user research)\b/i.test(title)) return "Design";
  if (/\b(data|analytics|business intelligence|machine learning|ml\b|ai\b)\b/i.test(title)) return "Data";
  if (/\b(security|cyber|compliance|soc\b|devsecops)\b/i.test(title)) return "Security";
  if (/\b(it support|it administrator|help desk|technical support)\b/i.test(title)) return "IT";
  return "Engineering";
}

function seniorityFor(title) {
  if (/\b(chief|cto|principal|staff|lead|head|director|senior|sr\.?)\b/i.test(title)) return "Senior";
  if (/\b(junior|entry|engineer i\b|associate|student|fellow|intern)\b/i.test(title)) return "Entry-level";
  if (/\b(mid|engineer ii\b|3\+ years|2\+ years)\b/i.test(title)) return "Mid-level";
  return "Not specified";
}

function workTypeFor(raw) {
  const value = `${raw.title ?? ""} ${raw.employmentType ?? ""}`;
  if (/\bfractional\b/i.test(value)) return "Fractional";
  if (/\bcontract|contractor|temporary|freelance\b/i.test(value)) return "Contract";
  return "Part-time";
}

function locationFor(raw) {
  const locations = [raw.location, ...(raw.secondaryLocations ?? [])]
    .map((location) => oneLine(location))
    .filter(Boolean);
  const unique = [...new Set(locations)];
  const place = unique.slice(0, 3).join(" · ") || "Location not disclosed";
  if (/remote/i.test(raw.workplaceType ?? "") && !/remote/i.test(place)) return `Remote · ${place}`;
  return place;
}

function sentenceCandidates(text) {
  return oneLine(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 320)
    .filter((sentence) => !/equal opportunity|privacy notice|data processing|about us|about the company/i.test(sentence));
}

function summaryFor(raw) {
  const sentences = sentenceCandidates(raw.description);
  const preferred = sentences.find((sentence) =>
    /\b(you will|you'll|we are (?:looking|seeking|hiring)|this role|the role|responsible for)\b/i.test(sentence),
  );
  const summary = preferred || sentences[0];
  if (!summary) return `See the original ${raw.source.kind} listing for the complete scope and responsibilities.`;
  return summary.length > 240 ? `${summary.slice(0, 237).trim()}…` : summary;
}

function expectationsFor(raw) {
  const lines = plainText(raw.description)
    .split("\n")
    .map((line) => line.replace(/^[•*-]\s*/, "").trim())
    .filter((line) => line.length >= 25 && line.length <= 180)
    .filter((line) =>
      /^(build|design|develop|maintain|own|lead|monitor|support|collaborate|create|implement|manage|conduct|provide|analy[sz]e|review|deliver|configure|write|troubleshoot|integrate|define|execute)\b/i.test(
        line,
      ),
    );
  const unique = [...new Set(lines)].slice(0, 3);
  return unique.length > 0 ? unique : ["Deliver the responsibilities described in the original employer listing"];
}

function collaborationFor(raw, hours) {
  const lines = plainText(raw.description)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 20 && line.length <= 220);
  const match = lines.find((line) =>
    /\b(hours? per week|hrs?\/week|time ?zone|overlap|async|schedule|weekend|remote|client meetings?)\b/i.test(line),
  );
  if (match) return match;
  if (hours.evidence) return `The posting states ${hours.evidence}.`;
  return "See the original listing for schedule and collaboration expectations.";
}

function durationFor(raw) {
  const match = sentenceCandidates(raw.description).find((sentence) =>
    /\b(\d+\s*(?:week|month)s?|duration|through\s+[A-Z][a-z]+|extension|convert to full[ -]?time|temporary)\b/i.test(sentence),
  );
  return match ? (match.length > 160 ? `${match.slice(0, 157)}…` : match) : "Not stated";
}

const HEALTH_BENEFIT =
  /\b(?:medical (?:insurance|coverage|benefits?)|health insurance|health(?:care| care) (?:benefits?|coverage|plan)|dental (?:insurance|coverage|benefits?|plan)|vision (?:insurance|coverage|benefits?|plan))\b/i;

function benefitsFor(raw) {
  const text = oneLine(raw.description);
  const noBenefits =
    /\b(?:no|without)\s+(?:company|employer)?\s*benefits\b|\bnot\s+benefits?[ -]?eligible\b|\bnot\s+eligible\s+for\s+(?:company|employer)?\s*benefits\b/i.test(
      text,
    );
  if (noBenefits) {
    return {
      benefitTypes: [],
      benefitDisclosure: "none",
      benefits: ["The posting explicitly states that employer benefits are not provided."],
    };
  }

  const fullTimeOnly =
    /\b(?:benefits|medical|health|dental|vision)[^.\n]{0,120}\bfull[ -]?time employees\b|\bfull[ -]?time employees[^.\n]{0,120}\b(?:benefits|medical|health|dental|vision)\b/i.test(
      text,
    );
  const types = [];
  if (!fullTimeOnly && HEALTH_BENEFIT.test(text)) types.push("Healthcare");
  if (!fullTimeOnly && /\b(401\s*\(?k\)?|retirement|pension)\b/i.test(text)) types.push("Retirement");
  if (!fullTimeOnly && /\b(paid time off|pto|paid vacation|vacation days|annual leave)\b/i.test(text)) types.push("Paid time off");
  if (!fullTimeOnly && /\b(paid parental|paid sick|sick days|family leave|life leave)\b/i.test(text)) types.push("Paid leave");

  const evidence = sentenceCandidates(raw.description)
    .filter((sentence) =>
      HEALTH_BENEFIT.test(sentence) ||
      /\b(401\s*\(?k\)?|retirement|pension|paid time off|pto|paid vacation|paid parental|paid sick|annual leave)\b/i.test(sentence),
    )
    .slice(0, 2)
    .map((sentence) => (sentence.length > 180 ? `${sentence.slice(0, 177)}…` : sentence));

  if (fullTimeOnly) {
    return {
      benefitTypes: [],
      benefitDisclosure: "not-disclosed",
      benefits: ["The posting discusses benefits for full-time employees; part-time eligibility is not established."],
    };
  }
  if (types.length > 0) {
    return {
      benefitTypes: [...new Set(types)],
      benefitDisclosure: "listed",
      benefits: evidence.length > 0 ? evidence : ["The posting lists employer benefits; verify eligibility in the original listing."],
    };
  }
  return {
    benefitTypes: [],
    benefitDisclosure: "not-disclosed",
    benefits: ["Employer benefits or part-time eligibility are not disclosed."],
  };
}

function tagsFor(raw) {
  const text = `${raw.title} ${plainText(raw.description)}`;
  const tags = SKILLS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  return tags.slice(0, 4).length > 0 ? tags.slice(0, 4) : [categoryFor(raw)];
}

function colorFor(value) {
  const colors = ["#b9ef68", "#7dd3fc", "#c4b5fd", "#fe7d62", "#f9c74f", "#5eead4", "#fb7185", "#f0abfc"];
  const hash = createHash("sha256").update(value).digest();
  return colors[hash[0] % colors.length];
}

function initialsFor(company) {
  return company
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function recordHash(record) {
  const stable = {
    company: record.company,
    role: record.role,
    location: record.location,
    scheduleText: record.scheduleText,
    compensation: record.compensation,
    workType: record.workType,
    sourceUrl: canonicalUrl(record.sourceUrl),
  };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").slice(0, 16);
}

export function normalizeCandidate(raw, classification, crawlDate) {
  const hours = classification.hours;
  const pay = extractPay(raw, hours);
  const benefits = benefitsFor(raw);
  const postedDate = toDate(raw.publishedAt);
  const sourceName =
    raw.source.kind === "greenhouse"
      ? "Greenhouse"
      : raw.source.kind === "ashby"
        ? "Ashby"
        : raw.source.tenant === "jobgether"
          ? "Lever / Jobgether"
          : "Lever";
  const sourceUrl = canonicalUrl(raw.sourceUrl);

  const record = {
    id: `auto-${raw.source.kind}-${slug(raw.source.tenant)}-${slug(raw.externalId)}`,
    company: raw.source.tier === "aggregator" ? `Confidential via ${raw.source.company.replace(/^Confidential via /, "")}` : raw.company,
    initials: initialsFor(raw.source.tier === "aggregator" ? raw.source.company : raw.company),
    accent: colorFor(`${raw.company}:${raw.externalId}`),
    role: oneLine(raw.title),
    category: categoryFor(raw),
    location: locationFor(raw),
    collaboration: classification.scheduleConflict
      ? "The source offers fractional or full-time engagement; it quantifies only the 40-hour full-time option."
      : collaborationFor(raw, hours),
    scheduleText: hours.label,
    hoursMin: hours.min,
    hoursMax: hours.max,
    ...pay,
    workType: workTypeFor(raw),
    seniority: seniorityFor(raw.title),
    duration: durationFor(raw),
    postedDate: postedDate || crawlDate,
    postedDateIsEstimate: !postedDate,
    lastVerifiedDate: crawlDate,
    sourceUpdatedDate: toDate(raw.updatedAt),
    sourceName,
    sourceUrl,
    applyUrl: canonicalUrl(raw.applyUrl || raw.sourceUrl),
    summary: summaryFor(raw),
    expectations: expectationsFor(raw),
    ...benefits,
    tags: tagsFor(raw),
    sourceKind: raw.source.kind,
    sourceTenant: raw.source.tenant,
    sourceJobId: raw.externalId,
    sourceTier: raw.source.tier,
    status: "active",
    firstSeenAt: crawlDate,
    lastSeenAt: crawlDate,
    lastChangedAt: crawlDate,
    consecutiveMisses: 0,
    curated: false,
    publicationReason: classification.reason,
  };
  record.contentHash = recordHash(record);
  return record;
}

export function reviewCandidate(raw, classification, crawlDate) {
  return {
    id: `${raw.source.kind}:${raw.source.tenant}:${raw.externalId}`,
    company: raw.company,
    role: oneLine(raw.title),
    location: locationFor(raw),
    sourceUrl: canonicalUrl(raw.sourceUrl),
    sourceKind: raw.source.kind,
    sourceTenant: raw.source.tenant,
    sourceJobId: raw.externalId,
    reason: classification.reason,
    firstReviewedAt: crawlDate,
    lastReviewedAt: crawlDate,
  };
}
