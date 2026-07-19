import { FormEvent, useEffect, useMemo, useState } from "react";

type WorkType = "Fractional" | "Part-time W-2" | "Contract";
type Seniority = "Mid-level" | "Senior" | "Staff+" | "Leadership";
type BenefitType = "Healthcare" | "Retirement" | "Paid time off" | "Paid leave";

type Job = {
  id: number;
  company: string;
  initials: string;
  accent: string;
  role: string;
  category: string;
  location: string;
  collaboration: string;
  hoursMin: number;
  hoursMax: number;
  rateMin: number;
  rateMax: number;
  workType: WorkType;
  seniority: Seniority;
  duration: string;
  posted: string;
  summary: string;
  expectations: string[];
  benefitTypes: BenefitType[];
  benefits: string[];
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
    collaboration: "Four hours of ET overlap; weekly planning with the data lead",
    hoursMin: 20,
    hoursMax: 24,
    rateMin: 135,
    rateMax: 165,
    workType: "Part-time W-2",
    seniority: "Senior",
    duration: "Ongoing",
    posted: "2 days ago",
    summary:
      "A bounded platform ownership role with a prioritized backlog, documented decisions, and no expectation of after-hours availability.",
    expectations: [
      "Own freshness and reliability for three core pipelines",
      "Ship the migration plan in the first 30 days",
      "Post a concise written progress update each Friday",
    ],
    benefitTypes: ["Healthcare", "Retirement", "Paid time off"],
    benefits: [
      "Medical, dental, and vision at 20+ hrs/week",
      "401(k) after 30 days",
      "Prorated paid time off",
    ],
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
    collaboration: "Three hours of PT overlap on Tuesdays and Thursdays",
    hoursMin: 10,
    hoursMax: 15,
    rateMin: 110,
    rateMax: 150,
    workType: "Contract",
    seniority: "Senior",
    duration: "4 months",
    posted: "3 days ago",
    summary:
      "An independent project with a named technical owner, weekly milestones, and protected focus time for evaluation design.",
    expectations: [
      "Deliver a reproducible evaluation harness by week four",
      "Turn the top failure modes into regression tests",
      "Review findings with the founding ML team once a week",
    ],
    benefitTypes: [],
    benefits: ["No employer-sponsored benefits", "Equipment budget included"],
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
    collaboration: "Async-first; one 45-minute team meeting each week",
    hoursMin: 18,
    hoursMax: 22,
    rateMin: 95,
    rateMax: 125,
    workType: "Part-time W-2",
    seniority: "Mid-level",
    duration: "Ongoing",
    posted: "5 days ago",
    summary:
      "A written-first role organized around a stable analytics roadmap rather than constant availability or meeting attendance.",
    expectations: [
      "Publish definitions for the company’s twelve core metrics",
      "Improve model test coverage to the agreed target",
      "Complete one roadmap-sized analytics project per month",
    ],
    benefitTypes: ["Healthcare", "Retirement", "Paid time off"],
    benefits: [
      "Medical and dental at 20+ hrs/week",
      "401(k) eligibility from day one",
      "Prorated paid time off",
    ],
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
    collaboration: "Two hours of CET overlap; incident support is separately scoped",
    hoursMin: 8,
    hoursMax: 12,
    rateMin: 160,
    rateMax: 210,
    workType: "Fractional",
    seniority: "Staff+",
    duration: "3–6 months",
    posted: "6 days ago",
    summary:
      "A fractional program-lead role with a six-month security plan, explicit decision rights, and no implied on-call duty.",
    expectations: [
      "Complete the cloud threat model in the first month",
      "Run one incident-readiness exercise per quarter",
      "Coach two engineering owners to maintain the program",
    ],
    benefitTypes: [],
    benefits: ["No employer-sponsored benefits", "Professional development stipend"],
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
    collaboration: "Four hours of ET overlap on three weekdays",
    hoursMin: 24,
    hoursMax: 28,
    rateMin: 100,
    rateMax: 140,
    workType: "Part-time W-2",
    seniority: "Senior",
    duration: "Ongoing",
    posted: "8 days ago",
    summary:
      "A senior individual-contributor seat with a small number of active projects and a founder who owns prioritization.",
    expectations: [
      "Establish the core design system in the first quarter",
      "Lead two customer research sessions each month",
      "Take one product area from concept through handoff at a time",
    ],
    benefitTypes: ["Healthcare", "Retirement", "Paid time off", "Paid leave"],
    benefits: [
      "Medical, dental, and vision at 24+ hrs/week",
      "401(k) with 3% match",
      "Prorated PTO and parental leave",
    ],
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
    collaboration: "One onsite day per month; two scheduled leadership blocks weekly",
    hoursMin: 12,
    hoursMax: 16,
    rateMin: 200,
    rateMax: 260,
    workType: "Fractional",
    seniority: "Leadership",
    duration: "Ongoing",
    posted: "9 days ago",
    summary:
      "A coaching and operating-system role; engineering leads retain day-to-day delivery and people-management responsibility.",
    expectations: [
      "Introduce a dependable six-week planning cadence",
      "Coach two engineering leads every other week",
      "Present the hiring and architecture plan within 45 days",
    ],
    benefitTypes: [],
    benefits: ["No employer-sponsored benefits", "Travel costs covered"],
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
    collaboration: "Async-first; no recurring meetings beyond fortnightly planning",
    hoursMin: 15,
    hoursMax: 20,
    rateMin: 120,
    rateMax: 165,
    workType: "Part-time W-2",
    seniority: "Senior",
    duration: "Ongoing",
    posted: "11 days ago",
    summary:
      "A written-first engineering role with small, independently shippable projects and no recurring on-call rotation.",
    expectations: [
      "Own two named platform integrations per quarter",
      "Keep service-level objectives within the published target",
      "Document design decisions before implementation begins",
    ],
    benefitTypes: ["Healthcare", "Retirement", "Paid time off"],
    benefits: [
      "Medical coverage at 20 hrs/week",
      "401(k) eligibility from day one",
      "Prorated paid time off",
    ],
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
    collaboration: "Three hours of PT overlap on Monday and Wednesday",
    hoursMin: 10,
    hoursMax: 15,
    rateMin: 125,
    rateMax: 170,
    workType: "Fractional",
    seniority: "Senior",
    duration: "4–6 months",
    posted: "12 days ago",
    summary:
      "A discovery and roadmap engagement with a single executive sponsor, defined product area, and a fixed meeting budget.",
    expectations: [
      "Complete ten customer interviews in the first six weeks",
      "Publish the API roadmap and decision rationale",
      "Give engineering acceptance-ready requirements each sprint",
    ],
    benefitTypes: [],
    benefits: ["No employer-sponsored benefits", "Home-office stipend included"],
    tags: ["APIs", "B2B SaaS", "Discovery"],
  },
];

const workTypes: Array<"Any" | WorkType> = [
  "Any",
  "Fractional",
  "Part-time W-2",
  "Contract",
];

const benefitOptions: Array<{ label: string; value: "Any" | BenefitType | "None" }> = [
  { label: "Any benefit offering", value: "Any" },
  { label: "Healthcare available", value: "Healthcare" },
  { label: "Retirement plan", value: "Retirement" },
  { label: "Paid time off", value: "Paid time off" },
  { label: "Paid leave", value: "Paid leave" },
  { label: "No employer benefits", value: "None" },
];

function matchesHours(job: Job, value: string) {
  if (value === "under-10") return job.hoursMin < 10;
  if (value === "10-15") return job.hoursMin <= 15 && job.hoursMax >= 10;
  if (value === "16-20") return job.hoursMin <= 20 && job.hoursMax >= 16;
  if (value === "21-30") return job.hoursMax >= 21;
  return true;
}

export default function App() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("any");
  const [workType, setWorkType] = useState<(typeof workTypes)[number]>("Any");
  const [seniority, setSeniority] = useState("Any");
  const [benefit, setBenefit] = useState<(typeof benefitOptions)[number]["value"]>("Any");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (location) params.set("location", location);
    if (hours !== "any") params.set("hours", hours);
    if (workType !== "Any") params.set("type", workType);
    if (seniority !== "Any") params.set("seniority", seniority);
    if (benefit !== "Any") params.set("benefit", benefit);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [role, location, hours, workType, seniority, benefit]);

  const filteredJobs = useMemo(() => {
    const roleQuery = role.trim().toLowerCase();
    const locationQuery = location.trim().toLowerCase();

    return jobs.filter((job) => {
      const roleMatch =
        !roleQuery ||
        [job.role, job.category, ...job.tags].join(" ").toLowerCase().includes(roleQuery);
      const locationMatch =
        !locationQuery ||
        `${job.location} ${job.collaboration}`.toLowerCase().includes(locationQuery);
      const benefitMatch =
        benefit === "Any" ||
        (benefit === "None" ? job.benefitTypes.length === 0 : job.benefitTypes.includes(benefit));

      return (
        roleMatch &&
        locationMatch &&
        matchesHours(job, hours) &&
        (workType === "Any" || job.workType === workType) &&
        (seniority === "Any" || job.seniority === seniority) &&
        benefitMatch
      );
    });
  }, [role, location, hours, workType, seniority, benefit]);

  function resetFilters() {
    setRole("");
    setLocation("");
    setHours("any");
    setWorkType("Any");
    setSeniority("Any");
    setBenefit("Any");
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
          <span className="brand-mark" aria-hidden="true">20</span>
          <span>Part-Time Tech</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#jobs">Browse jobs</a>
          <a href="#standards">Our standard</a>
          <a href="#companies">For companies</a>
          <a className="nav-cta" href="#early-access">Get job alerts</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker"><span className="pulse-dot" /> Built for 8–28 hour workweeks</div>
        <h1>
          Real work.
          <br />
          <span>A week that fits.</span>
        </h1>
        <p className="hero-copy">
          Meaningful, accountable tech roles for people whose health, caregiving,
          studies, other commitments, or preferences do not fit a standard 40-hour week.
        </p>
        <div className="trust-row" aria-label="Platform principles">
          <span>Outcomes made explicit</span>
          <span>Exact capacity disclosed</span>
          <span>Benefit eligibility shown</span>
        </div>
      </section>

      <section className="search-shell" aria-labelledby="filter-heading">
        <div className="search-heading">
          <div>
            <p className="eyebrow">Find your fit</p>
            <h2 id="filter-heading">Search by the workweek and support you need</h2>
          </div>
          <button className="clear-button" onClick={resetFilters} type="button">Clear filters</button>
        </div>

        <div className="filters">
          <label className="wide-field">
            <span>Role or skill</span>
            <input type="search" placeholder="Try Data Engineer or Python" value={role} onChange={(event) => setRole(event.target.value)} />
          </label>
          <label className="wide-field">
            <span>Location or collaboration window</span>
            <input type="search" placeholder="Remote, New York, async-first…" value={location} onChange={(event) => setLocation(event.target.value)} />
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
            <select value={workType} onChange={(event) => setWorkType(event.target.value as (typeof workTypes)[number])}>
              {workTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <span>Seniority</span>
            <select value={seniority} onChange={(event) => setSeniority(event.target.value)}>
              <option>Any</option>
              <option>Mid-level</option>
              <option>Senior</option>
              <option>Staff+</option>
              <option>Leadership</option>
            </select>
          </label>
          <label>
            <span>Benefits</span>
            <select value={benefit} onChange={(event) => setBenefit(event.target.value as (typeof benefitOptions)[number]["value"])}>
              {benefitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="jobs-section" id="jobs" aria-labelledby="jobs-heading">
        <div className="results-bar">
          <div>
            <p className="eyebrow">Curated opportunities</p>
            <h2 id="jobs-heading"><span aria-live="polite">{filteredJobs.length}</span> roles match</h2>
          </div>
          <span className="prototype-badge">Illustrative prototype data</span>
        </div>

        <div className="job-list">
          {filteredJobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="company-logo" style={{ backgroundColor: job.accent }} aria-hidden="true">{job.initials}</div>
              <div className="job-main">
                <div className="job-title-row">
                  <div>
                    <p className="company-name">{job.company} <span className="verified">Example</span></p>
                    <h3>{job.role}</h3>
                  </div>
                  <div className="pay">${job.rateMin}–${job.rateMax}<span>/ hour</span></div>
                </div>

                <div className="job-facts">
                  <span>{job.location}</span>
                  <span>{job.hoursMin}–{job.hoursMax} hrs / week</span>
                  <span>{job.workType}</span>
                  <span>{job.duration}</span>
                </div>

                <div className="benefit-preview">
                  <strong>{job.benefitTypes.includes("Healthcare") ? "Healthcare available" : "No employer healthcare"}</strong>
                  <span>{job.benefits[0]}</span>
                </div>

                <div className="job-bottom">
                  <div className="tag-list" aria-label="Skills">{job.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="job-actions">
                    <span className="posted">Posted {job.posted}</span>
                    <a className="view-role" href="#early-access">Get matched</a>
                  </div>
                </div>

                <details>
                  <summary>See expectations and benefit eligibility</summary>
                  <div className="detail-grid">
                    <div>
                      <h4>Why it works part-time</h4>
                      <p>{job.summary}</p>
                      <p className="overlap-note">Collaboration: {job.collaboration}</p>
                    </div>
                    <div>
                      <h4>Success looks like</h4>
                      <ul>{job.expectations.map((expectation) => <li key={expectation}>{expectation}</li>)}</ul>
                    </div>
                    <div>
                      <h4>Benefits and eligibility</h4>
                      <ul>{job.benefits.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                  </div>
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

      <section className="how-section" id="standards">
        <div className="section-intro">
          <p className="eyebrow">Flexible does not mean vague</p>
          <h2>A smaller workweek deserves clearer expectations.</h2>
          <p className="section-copy">
            Part-time is a capacity agreement, not a lower bar. Every role should tell
            workers what they own and tell managers what can reasonably be delivered.
          </p>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <h3>Define the real job</h3>
            <p>List outcomes, decision rights, reporting cadence, and what is explicitly out of scope.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Respect the capacity</h3>
            <p>Publish weekly hours, required overlap, meeting load, and any on-call expectations.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Show the whole offer</h3>
            <p>Disclose cash compensation, employment type, benefits, and the hours needed to qualify.</p>
          </article>
        </div>
      </section>

      <section className="company-cta" id="companies">
        <div>
          <p className="eyebrow">For hiring teams</p>
          <h2>Define the job. Respect the capacity.</h2>
          <p>
            Reach experienced people who can deliver meaningful outcomes—and give them
            the clarity to do it without pretending the role is full-time.
          </p>
        </div>
        <a href="#early-access">Post an early role</a>
      </section>

      <section className="early-access" id="early-access">
        <div>
          <p className="eyebrow">Early access</p>
          <h2>Help shape the first real listings.</h2>
          <p>The form is an interface prototype; no email address is transmitted or stored yet.</p>
        </div>
        {subscribed ? (
          <div className="success-message" role="status"><span aria-hidden="true">✓</span>Thanks—the alert flow works locally.</div>
        ) : (
          <form onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="alert-email">Email address</label>
            <input id="alert-email" type="email" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <button type="submit">Preview signup</button>
          </form>
        )}
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true">20</span><span>Part-Time Tech</span></a>
        <p>Good work should fit a real life.</p>
        <p>Open-source prototype · 2026</p>
      </footer>
    </main>
  );
}
