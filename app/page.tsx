"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type WorkType = "Fractional" | "Part-time W-2" | "Contract";
type Seniority = "Mid-level" | "Senior" | "Staff+" | "Leadership";

type Job = {
  id: number;
  company: string;
  initials: string;
  accent: string;
  role: string;
  category: string;
  location: string;
  timezone: string;
  hoursMin: number;
  hoursMax: number;
  rateMin: number;
  rateMax: number;
  workType: WorkType;
  seniority: Seniority;
  duration: string;
  posted: string;
  summary: string;
  tags: string[];
};

const jobs: Job[] = [
  {
    id: 1,
    company: "Northstar Health",
    initials: "NH",
    accent: "#fe7d62",
    role: "Senior Data Engineer",
    category: "Data",
    location: "Remote · United States",
    timezone: "4 hours ET overlap",
    hoursMin: 15,
    hoursMax: 20,
    rateMin: 140,
    rateMax: 180,
    workType: "Fractional",
    seniority: "Senior",
    duration: "6+ months",
    posted: "2 days ago",
    summary:
      "Own a healthcare analytics pipeline and help a small product team move from batch reporting to reliable, near-real-time data products.",
    tags: ["Python", "dbt", "Snowflake"],
  },
  {
    id: 2,
    company: "Relay AI",
    initials: "RA",
    accent: "#b9ef68",
    role: "AI Evaluation Engineer",
    category: "AI / ML",
    location: "Remote · Americas",
    timezone: "3 hours PT overlap",
    hoursMin: 10,
    hoursMax: 15,
    rateMin: 110,
    rateMax: 150,
    workType: "Contract",
    seniority: "Senior",
    duration: "4 months",
    posted: "3 days ago",
    summary:
      "Design evaluation harnesses for agentic workflows, turn failure patterns into test suites, and partner directly with the founding ML team.",
    tags: ["LLMs", "Python", "Evals"],
  },
  {
    id: 3,
    company: "Juniper Climate",
    initials: "JC",
    accent: "#7dd3fc",
    role: "Analytics Engineer",
    category: "Data",
    location: "Remote · US & Canada",
    timezone: "Async-first",
    hoursMin: 12,
    hoursMax: 18,
    rateMin: 95,
    rateMax: 125,
    workType: "Part-time W-2",
    seniority: "Mid-level",
    duration: "Ongoing",
    posted: "5 days ago",
    summary:
      "Build trusted business metrics for a climate-finance platform and create the semantic layer used by product, operations, and customers.",
    tags: ["SQL", "dbt", "Looker"],
  },
  {
    id: 4,
    company: "Ledgerline",
    initials: "LL",
    accent: "#c4b5fd",
    role: "Staff Security Engineer",
    category: "Security",
    location: "Remote · Europe",
    timezone: "2 hours CET overlap",
    hoursMin: 8,
    hoursMax: 12,
    rateMin: 160,
    rateMax: 210,
    workType: "Fractional",
    seniority: "Staff+",
    duration: "3–6 months",
    posted: "6 days ago",
    summary:
      "Lead a practical security program for a growing fintech: threat modeling, cloud hardening, incident readiness, and engineering coaching.",
    tags: ["AWS", "SOC 2", "AppSec"],
  },
  {
    id: 5,
    company: "Morrow Works",
    initials: "MW",
    accent: "#f9c74f",
    role: "Founding Product Designer",
    category: "Design",
    location: "Remote · United States",
    timezone: "4 hours ET overlap",
    hoursMin: 20,
    hoursMax: 25,
    rateMin: 100,
    rateMax: 140,
    workType: "Contract",
    seniority: "Senior",
    duration: "6 months",
    posted: "8 days ago",
    summary:
      "Set the product design foundation for a collaboration startup, from research and flows through a compact, reusable interface system.",
    tags: ["Product design", "Figma", "Research"],
  },
  {
    id: 6,
    company: "Common Thread",
    initials: "CT",
    accent: "#fb7185",
    role: "Fractional VP of Engineering",
    category: "Engineering",
    location: "Hybrid · New York",
    timezone: "1 onsite day / month",
    hoursMin: 12,
    hoursMax: 16,
    rateMin: 200,
    rateMax: 260,
    workType: "Fractional",
    seniority: "Leadership",
    duration: "Ongoing",
    posted: "9 days ago",
    summary:
      "Coach two engineering leads, stabilize delivery, and shape the hiring and architecture plan for a Series A marketplace team.",
    tags: ["Leadership", "Architecture", "Hiring"],
  },
  {
    id: 7,
    company: "Parcel Labs",
    initials: "PL",
    accent: "#5eead4",
    role: "Senior Backend Engineer",
    category: "Engineering",
    location: "Remote · Global",
    timezone: "Async-first",
    hoursMin: 15,
    hoursMax: 20,
    rateMin: 120,
    rateMax: 165,
    workType: "Part-time W-2",
    seniority: "Senior",
    duration: "Ongoing",
    posted: "11 days ago",
    summary:
      "Ship integrations and reliability improvements for a developer tools company with written-first planning and no recurring meetings.",
    tags: ["Go", "Postgres", "APIs"],
  },
  {
    id: 8,
    company: "Kiteframe",
    initials: "KF",
    accent: "#f0abfc",
    role: "Technical Product Manager",
    category: "Product",
    location: "Remote · US & Canada",
    timezone: "3 hours PT overlap",
    hoursMin: 10,
    hoursMax: 15,
    rateMin: 125,
    rateMax: 170,
    workType: "Fractional",
    seniority: "Senior",
    duration: "4–6 months",
    posted: "12 days ago",
    summary:
      "Turn customer discovery into a focused API roadmap and give a small engineering team crisp requirements without adding process overhead.",
    tags: ["APIs", "B2B SaaS", "Discovery"],
  },
];

const workTypes: Array<"Any" | WorkType> = [
  "Any",
  "Fractional",
  "Part-time W-2",
  "Contract",
];

function matchesHours(job: Job, value: string) {
  if (value === "under-10") return job.hoursMin < 10;
  if (value === "10-15") return job.hoursMin <= 15 && job.hoursMax >= 10;
  if (value === "16-20") return job.hoursMin <= 20 && job.hoursMax >= 16;
  if (value === "21-30") return job.hoursMax >= 21;
  return true;
}

export default function Home() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("any");
  const [workType, setWorkType] = useState<(typeof workTypes)[number]>("Any");
  const [seniority, setSeniority] = useState("Any");
  const [minRate, setMinRate] = useState("0");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (location) params.set("location", location);
    if (hours !== "any") params.set("hours", hours);
    if (workType !== "Any") params.set("type", workType);
    if (seniority !== "Any") params.set("seniority", seniority);
    if (minRate !== "0") params.set("rate", minRate);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [role, location, hours, workType, seniority, minRate]);

  const filteredJobs = useMemo(() => {
    const roleQuery = role.trim().toLowerCase();
    const locationQuery = location.trim().toLowerCase();
    const rateFloor = Number(minRate);

    return jobs.filter((job) => {
      const roleMatch =
        !roleQuery ||
        [job.role, job.category, ...job.tags]
          .join(" ")
          .toLowerCase()
          .includes(roleQuery);
      const locationMatch =
        !locationQuery ||
        `${job.location} ${job.timezone}`.toLowerCase().includes(locationQuery);
      return (
        roleMatch &&
        locationMatch &&
        matchesHours(job, hours) &&
        (workType === "Any" || job.workType === workType) &&
        (seniority === "Any" || job.seniority === seniority) &&
        job.rateMax >= rateFloor
      );
    });
  }, [role, location, hours, workType, seniority, minRate]);

  function resetFilters() {
    setRole("");
    setLocation("");
    setHours("any");
    setWorkType("Any");
    setSeniority("Any");
    setMinRate("0");
  }

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Part-Time Tech home">
          <span className="brand-mark" aria-hidden="true">
            20
          </span>
          <span>Part-Time Tech</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#jobs">Browse jobs</a>
          <a href="#how-it-works">How it works</a>
          <a href="#companies">For companies</a>
          <a className="nav-cta" href="#early-access">
            Get job alerts
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker">
          <span className="pulse-dot" /> Built for 8–24 hour workweeks
        </div>
        <h1>
          Serious tech work.
          <br />
          <span>Fewer hours.</span>
        </h1>
        <p className="hero-copy">
          Verified part-time and fractional roles for experienced people in
          engineering, data, AI, security, product, and design.
        </p>
        <div className="trust-row" aria-label="Platform principles">
          <span>Cash compensation required</span>
          <span>Exact hours disclosed</span>
          <span>Human-reviewed roles</span>
        </div>
      </section>

      <section className="search-shell" aria-labelledby="filter-heading">
        <div className="search-heading">
          <div>
            <p className="eyebrow">Find your fit</p>
            <h2 id="filter-heading">Search by the week you actually want</h2>
          </div>
          <button className="clear-button" onClick={resetFilters} type="button">
            Clear filters
          </button>
        </div>

        <div className="filters">
          <label className="wide-field">
            <span>Role or skill</span>
            <input
              type="search"
              placeholder="Try Data Engineer or Python"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </label>
          <label className="wide-field">
            <span>Location or timezone</span>
            <input
              type="search"
              placeholder="Remote, New York, CET…"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>
          <label>
            <span>Hours / week</span>
            <select value={hours} onChange={(event) => setHours(event.target.value)}>
              <option value="any">Any schedule</option>
              <option value="under-10">Under 10 hours</option>
              <option value="10-15">10–15 hours</option>
              <option value="16-20">16–20 hours</option>
              <option value="21-30">21–30 hours</option>
            </select>
          </label>
          <label>
            <span>Engagement</span>
            <select
              value={workType}
              onChange={(event) =>
                setWorkType(event.target.value as (typeof workTypes)[number])
              }
            >
              {workTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Seniority</span>
            <select
              value={seniority}
              onChange={(event) => setSeniority(event.target.value)}
            >
              <option>Any</option>
              <option>Mid-level</option>
              <option>Senior</option>
              <option>Staff+</option>
              <option>Leadership</option>
            </select>
          </label>
          <label>
            <span>Minimum rate</span>
            <select value={minRate} onChange={(event) => setMinRate(event.target.value)}>
              <option value="0">Any rate</option>
              <option value="100">$100+ / hour</option>
              <option value="125">$125+ / hour</option>
              <option value="150">$150+ / hour</option>
              <option value="200">$200+ / hour</option>
            </select>
          </label>
        </div>
      </section>

      <section className="jobs-section" id="jobs" aria-labelledby="jobs-heading">
        <div className="results-bar">
          <div>
            <p className="eyebrow">Curated opportunities</p>
            <h2 id="jobs-heading">
              <span aria-live="polite">{filteredJobs.length}</span> roles match
            </h2>
          </div>
          <span className="prototype-badge">Prototype data</span>
        </div>

        <div className="job-list">
          {filteredJobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div
                className="company-logo"
                style={{ backgroundColor: job.accent }}
                aria-hidden="true"
              >
                {job.initials}
              </div>
              <div className="job-main">
                <div className="job-title-row">
                  <div>
                    <p className="company-name">
                      {job.company} <span className="verified">Verified</span>
                    </p>
                    <h3>{job.role}</h3>
                  </div>
                  <div className="pay">
                    ${job.rateMin}–${job.rateMax}
                    <span>/ hour</span>
                  </div>
                </div>

                <div className="job-facts">
                  <span>{job.location}</span>
                  <span>{job.hoursMin}–{job.hoursMax} hrs / week</span>
                  <span>{job.workType}</span>
                  <span>{job.duration}</span>
                </div>

                <div className="job-bottom">
                  <div className="tag-list" aria-label="Skills">
                    {job.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="job-actions">
                    <span className="posted">Posted {job.posted}</span>
                    <a className="view-role" href="#early-access">
                      Get matched
                    </a>
                  </div>
                </div>

                <details>
                  <summary>Why this role works part-time</summary>
                  <p>{job.summary}</p>
                  <p className="overlap-note">Required collaboration: {job.timezone}</p>
                </details>
              </div>
            </article>
          ))}

          {filteredJobs.length === 0 && (
            <div className="empty-state">
              <p className="empty-icon" aria-hidden="true">↗</p>
              <h3>No exact match—yet.</h3>
              <p>Clear a filter or join the alert list and we’ll keep watch for you.</p>
              <button onClick={resetFilters} type="button">Show all roles</button>
            </div>
          )}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-intro">
          <p className="eyebrow">Less noise, more signal</p>
          <h2>Part-time should describe the job—not hide in the fine print.</h2>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <h3>Every role is structured</h3>
            <p>Hours, cash compensation, duration, location, and employment type are mandatory.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Every company is checked</h3>
            <p>We verify the company, hiring owner, application path, and that the opening is current.</p>
          </article>
          <article>
            <span>03</span>
            <h3>You own the relationship</h3>
            <p>Apply directly or request an introduction. No bidding war and no percentage of your pay.</p>
          </article>
        </div>
      </section>

      <section className="company-cta" id="companies">
        <div>
          <p className="eyebrow">For hiring teams</p>
          <h2>Need senior output—not another full-time seat?</h2>
          <p>
            Reach experienced technical people who have already chosen focused,
            flexible work.
          </p>
        </div>
        <a href="#early-access">Post an early role</a>
      </section>

      <section className="early-access" id="early-access">
        <div>
          <p className="eyebrow">Early access</p>
          <h2>Get the first verified roles in your inbox.</h2>
          <p>One useful email a week. No application spam.</p>
        </div>
        {subscribed ? (
          <div className="success-message" role="status">
            <span aria-hidden="true">✓</span>
            You’re on the prototype list.
          </div>
        ) : (
          <form onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="alert-email">Email address</label>
            <input
              id="alert-email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit">Join early access</button>
          </form>
        )}
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">20</span>
          <span>Part-Time Tech</span>
        </a>
        <p>Good work should fit a good life.</p>
        <p>Prototype · 2026</p>
      </footer>
    </main>
  );
}
