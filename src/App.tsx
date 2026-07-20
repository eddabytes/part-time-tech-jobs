import { FormEvent, useEffect, useMemo, useState } from "react";
import { BenefitType, Job, WorkType, jobs } from "./jobs";

const workTypes: Array<"Any" | WorkType> = ["Any", "Fractional", "Part-time", "Contract"];

const benefitOptions: Array<{ label: string; value: "Any" | BenefitType | "None" | "Unknown" }> = [
  { label: "Any benefit disclosure", value: "Any" },
  { label: "Healthcare listed", value: "Healthcare" },
  { label: "Retirement plan listed", value: "Retirement" },
  { label: "Paid time off listed", value: "Paid time off" },
  { label: "Paid leave listed", value: "Paid leave" },
  { label: "Explicitly no benefits", value: "None" },
  { label: "Benefits not disclosed", value: "Unknown" },
];

const sortOptions = [
  { value: "posted-desc", label: "Posted: newest first" },
  { value: "posted-asc", label: "Posted: oldest first" },
  { value: "verified-desc", label: "Last checked: newest first" },
  { value: "pay-desc", label: "Hourly pay: high to low" },
  { value: "pay-asc", label: "Hourly pay: low to high" },
  { value: "hours-asc", label: "Weekly hours: low to high" },
  { value: "company-asc", label: "Company: A to Z" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00Z`));
}

function hourlyMidpoint(job: Job) {
  if (job.hourlyPayMin === null || job.hourlyPayMax === null) return null;
  return (job.hourlyPayMin + job.hourlyPayMax) / 2;
}

function compareNullable(a: number | null, b: number | null, direction: "asc" | "desc") {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function compareJobs(a: Job, b: Job, sort: SortValue) {
  if (sort === "posted-asc") return a.postedDate.localeCompare(b.postedDate) || a.company.localeCompare(b.company);
  if (sort === "verified-desc") {
    return b.lastVerifiedDate.localeCompare(a.lastVerifiedDate) || b.postedDate.localeCompare(a.postedDate);
  }
  if (sort === "pay-desc") {
    return compareNullable(hourlyMidpoint(a), hourlyMidpoint(b), "desc") || b.postedDate.localeCompare(a.postedDate);
  }
  if (sort === "pay-asc") {
    return compareNullable(hourlyMidpoint(a), hourlyMidpoint(b), "asc") || b.postedDate.localeCompare(a.postedDate);
  }
  if (sort === "hours-asc") {
    return compareNullable(a.hoursMin, b.hoursMin, "asc") || b.postedDate.localeCompare(a.postedDate);
  }
  if (sort === "company-asc") return a.company.localeCompare(b.company) || a.role.localeCompare(b.role);
  return b.postedDate.localeCompare(a.postedDate) || a.company.localeCompare(b.company);
}

function matchesHours(job: Job, value: string) {
  if (value === "any") return true;
  if (job.hoursMin === null || job.hoursMax === null) return false;
  if (value === "under-10") return job.hoursMin < 10;
  if (value === "10-15") return job.hoursMin <= 15 && job.hoursMax >= 10;
  if (value === "16-20") return job.hoursMin <= 20 && job.hoursMax >= 16;
  if (value === "21-30") return job.hoursMax >= 21;
  return true;
}

function benefitLabel(job: Job) {
  if (job.benefitDisclosure === "listed") return "Benefits listed";
  if (job.benefitDisclosure === "none") return "No employer benefits";
  return "Benefits not disclosed";
}

export default function App() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("any");
  const [workType, setWorkType] = useState<(typeof workTypes)[number]>("Any");
  const [seniority, setSeniority] = useState("Any");
  const [benefit, setBenefit] = useState<(typeof benefitOptions)[number]["value"]>("Any");
  const [sort, setSort] = useState<SortValue>("posted-desc");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search);
    setRole(initial.get("role") ?? "");
    setLocation(initial.get("location") ?? "");
    setHours(initial.get("hours") ?? "any");
    setWorkType((initial.get("type") as (typeof workTypes)[number]) ?? "Any");
    setSeniority(initial.get("seniority") ?? "Any");
    setBenefit((initial.get("benefit") as (typeof benefitOptions)[number]["value"]) ?? "Any");
    setSort((initial.get("sort") as SortValue) ?? "posted-desc");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (location) params.set("location", location);
    if (hours !== "any") params.set("hours", hours);
    if (workType !== "Any") params.set("type", workType);
    if (seniority !== "Any") params.set("seniority", seniority);
    if (benefit !== "Any") params.set("benefit", benefit);
    if (sort !== "posted-desc") params.set("sort", sort);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [role, location, hours, workType, seniority, benefit, sort]);

  const filteredJobs = useMemo(() => {
    const roleQuery = role.trim().toLowerCase();
    const locationQuery = location.trim().toLowerCase();

    return jobs.filter((job) => {
      const roleMatch =
        !roleQuery ||
        [job.role, job.company, job.category, ...job.tags].join(" ").toLowerCase().includes(roleQuery);
      const locationMatch =
        !locationQuery ||
        `${job.location} ${job.collaboration}`.toLowerCase().includes(locationQuery);
      const benefitMatch =
        benefit === "Any" ||
        (benefit === "None"
          ? job.benefitDisclosure === "none"
          : benefit === "Unknown"
            ? job.benefitDisclosure === "not-disclosed"
            : job.benefitTypes.includes(benefit));

      return (
        roleMatch &&
        locationMatch &&
        matchesHours(job, hours) &&
        (workType === "Any" || job.workType === workType) &&
        (seniority === "Any" || job.seniority === seniority) &&
        benefitMatch
      );
    }).sort((a, b) => compareJobs(a, b, sort));
  }, [role, location, hours, workType, seniority, benefit, sort]);

  function resetFilters() {
    setRole("");
    setLocation("");
    setHours("any");
    setWorkType("Any");
    setSeniority("Any");
    setBenefit("Any");
    setSort("posted-desc");
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
        <div className="hero-kicker"><span className="pulse-dot" /> 31 source-linked openings · checked July 19, 2026</div>
        <h1>Real work.<br /><span>A week that fits.</span></h1>
        <p className="hero-copy">
          Meaningful, accountable tech roles for people whose health, caregiving,
          studies, other commitments, or preferences do not fit a standard 40-hour week.
        </p>
        <div className="trust-row" aria-label="Platform principles">
          <span>Original sources linked</span>
          <span>Missing details flagged</span>
          <span>Benefit eligibility separated</span>
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
            <span>Role, company, or skill</span>
            <input type="search" placeholder="Try Data Engineer, healthcare, or Python" value={role} onChange={(event) => setRole(event.target.value)} />
          </label>
          <label className="wide-field">
            <span>Location or collaboration requirement</span>
            <input type="search" placeholder="Remote, PT overlap, Secret clearance…" value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <label>
            <span>Hours / week</span>
            <select value={hours} onChange={(event) => setHours(event.target.value)}>
              <option value="any">Any or undisclosed</option>
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
              <option>Entry-level</option>
              <option>Mid-level</option>
              <option>Senior</option>
              <option>Not specified</option>
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
            <p className="eyebrow">Current public listings</p>
            <h2 id="jobs-heading"><span aria-live="polite">{filteredJobs.length}</span> roles match</h2>
          </div>
          <div className="results-tools">
            <label className="sort-control">
              <span>Sort results</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortValue)}>
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <div className="crawl-status">
              <strong>31-role crawl · July 19, 2026</strong>
              <span>Pay sorting uses range midpoints; undisclosed pay appears last.</span>
            </div>
          </div>
        </div>

        <div className="job-list">
          {filteredJobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="company-logo" style={{ backgroundColor: job.accent }} aria-hidden="true">{job.initials}</div>
              <div className="job-main">
                <div className="job-title-row">
                  <div>
                    <p className="company-name">{job.company} <span className="verified">Source checked</span></p>
                    <h3>{job.role}</h3>
                  </div>
                  <div className="pay">
                    {job.compensation}
                    <span className={job.hourlyPayIsEstimate ? "estimated-pay" : undefined}>
                      {job.hourlyPayIsEstimate
                        ? "Calculated hourly estimate"
                        : job.hourlyPayMin === null
                          ? "Not included in pay sorting"
                          : "Published hourly pay"}
                    </span>
                  </div>
                </div>

                <div className="job-facts">
                  <span>{job.location}</span>
                  <span className={job.hoursMin === null ? "undisclosed-fact" : undefined}>{job.scheduleText}</span>
                  <span>{job.workType}</span>
                  <span>{job.duration}</span>
                </div>

                <div className={`benefit-preview ${job.benefitDisclosure}`}>
                  <strong>{benefitLabel(job)}</strong>
                  <span>{job.benefits[0]}</span>
                </div>

                <div className="job-bottom">
                  <div>
                    <div className="tag-list" aria-label="Skills">{job.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <p className="source-line">
                      {job.postedDateIsEstimate ? "Approx. posted" : "Posted"} {formatDate(job.postedDate)}
                      {" · "}Checked {formatDate(job.lastVerifiedDate)} via {job.sourceName}
                    </p>
                  </div>
                  <div className="job-actions">
                    <a className="view-role" href={job.sourceUrl} target="_blank" rel="noreferrer">View original listing ↗</a>
                  </div>
                </div>

                <details>
                  <summary>See responsibilities, working terms, and benefit disclosure</summary>
                  <div className="detail-grid">
                    <div>
                      <h4>How the role is scoped</h4>
                      <p>{job.summary}</p>
                      <p className="overlap-note">Working terms: {job.collaboration}</p>
                      <p className="pay-method"><strong>Pay normalization:</strong> {job.hourlyPayNote}</p>
                    </div>
                    <div>
                      <h4>Stated responsibilities</h4>
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
              <h3>No current listing matches every filter.</h3>
              <p>Clear a filter or join the prototype alert list.</p>
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
            Part-time is a capacity agreement, not a lower bar. We publish what the source says,
            flag what it omits, and never manufacture an hours range or benefits promise.
          </p>
        </div>
        <div className="steps-grid">
          <article><span>01</span><h3>Trace every listing</h3><p>Each card links to the employer or original public posting and includes the date we checked it.</p></article>
          <article><span>02</span><h3>Separate facts from gaps</h3><p>Undisclosed hours, compensation, and eligibility thresholds remain visibly undisclosed.</p></article>
          <article><span>03</span><h3>Recheck before applying</h3><p>Openings change quickly. The source—not this index—remains authoritative for availability and terms.</p></article>
        </div>
      </section>

      <section className="company-cta" id="companies">
        <div>
          <p className="eyebrow">For hiring teams</p>
          <h2>Define the job. Respect the capacity.</h2>
          <p>Publish outcomes, weekly hours, collaboration requirements, compensation, and the exact eligibility rule for every benefit.</p>
        </div>
        <a href="#early-access">Submit a future role</a>
      </section>

      <section className="early-access" id="early-access">
        <div>
          <p className="eyebrow">Early access</p>
          <h2>Help shape the next crawl.</h2>
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
        <p>Open-source prototype · Sources checked July 19, 2026</p>
      </footer>
    </main>
  );
}
