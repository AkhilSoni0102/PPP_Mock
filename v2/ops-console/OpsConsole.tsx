"use client";

// ProPoojaPaath ops console (admin portal) — design reference, website only, English only.
//
// Areas: Dashboard · Pandits · Review queue · Pandit detail · Onboard a pandit ·
// Users & roles · Reference data · Audit log, plus Sign in and "No access yet".
// Navigation shows only what the signed-in person's roles allow.
// Everything runs on the sample data in data.ts; nothing is sent anywhere.

import { useState, type ReactNode } from "react";
import { STATUS_LABEL, STATUS_TONE, type Status } from "../pandit-app/shared/schema";
import { AUDIT, DELETION_REQUESTS, PANDITS, REFERENCE, USERS, type Pandit, type RefEntry, type Role } from "./data";
import "./ops-console.css";

type Page = "dashboard" | "pandits" | "queue" | "onboard" | "users" | "reference" | "audit";
type Props = {
  theme?: "light" | "dark";
  /** Roles of the signed-in person. An empty list shows "No access yet". */
  roles?: Role[];
  /** Start on the sign-in screen. */
  signedOut?: boolean;
  assetBase?: string;
  userName?: string;
};

const NAV: { id: Page; label: string; roles: Role[] }[] = [
  { id: "dashboard", label: "Dashboard", roles: ["admin", "reviewer", "staff"] },
  { id: "pandits", label: "Pandits", roles: ["admin", "reviewer", "staff"] },
  { id: "queue", label: "Review queue", roles: ["admin", "reviewer"] },
  { id: "onboard", label: "Onboard a pandit", roles: ["admin", "staff"] },
  { id: "users", label: "Users & roles", roles: ["admin"] },
  { id: "reference", label: "Reference data", roles: ["admin"] },
  { id: "audit", label: "Audit log", roles: ["admin"] },
];
const STATUSES = Object.keys(STATUS_LABEL) as Status[];
const QUEUE: Status[] = ["submitted", "ai_passed", "ai_failed", "under_review"];

function Badge({ status }: { status: Status }) {
  return <span className={`oc__badge is-${STATUS_TONE[status]}`}>{STATUS_LABEL[status].en}</span>;
}

export default function OpsConsole({ theme = "light", roles = ["admin"], signedOut = false, assetBase = "/logo-reveal", userName = "Arjun Mehta" }: Props) {
  const [out, setOut] = useState(signedOut);
  const [page, setPage] = useState<Page>("dashboard");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pandits, setPandits] = useState<Pandit[]>(PANDITS);
  const [audit, setAudit] = useState(AUDIT);
  const [filter, setFilter] = useState<{ q: string; status: "" | Status; source: "" | "self" | "staff" }>({ q: "", status: "", source: "" });
  const can = (r: Role) => roles.includes(r);
  const nav = NAV.filter((n) => n.roles.some(can));
  const go = (p: Page) => { setPage(p); setOpenId(null); };
  const log = (what: string, record: string, fields: string) => setAudit((a) => [{ when: "Just now", who: userName, what, record, fields }, ...a]);
  const update = (id: string, change: (p: Pandit) => Pandit) => setPandits((list) => list.map((p) => (p.id === id ? change(p) : p)));
  const visible = can("admin") || can("reviewer") ? pandits : pandits.filter((p) => p.preparedBy === userName);

  const shell = (body: ReactNode) => <div className={`oc oc--${theme}`}>{body}</div>;

  if (out)
    return shell(
      <div className="oc__gate">
        <img src={`${assetBase}/logo.png`} alt="" />
        <h1>ProPoojaPaath ops console</h1>
        <p>For the team that onboards and reviews pandits.</p>
        <form className="oc__gateform" onSubmit={(e) => { e.preventDefault(); setOut(false); }}>
          <button type="button" className="oc__btn oc__btn--wide" onClick={() => setOut(false)}>Continue with Google</button>
          <p className="oc__or"><span>or</span></p>
          <label>Email<input className="oc__input" type="email" autoComplete="username" /></label>
          <label>Password<input className="oc__input" type="password" autoComplete="current-password" /></label>
          <button type="submit" className="oc__btn oc__btn--primary">Sign in</button>
          <button type="button" className="oc__link">Email me a sign-in link instead</button>
        </form>
      </div>
    );

  if (roles.length === 0)
    return shell(
      <div className="oc__gate">
        <img src={`${assetBase}/logo.png`} alt="" />
        <h1>No access yet</h1>
        <p>You are signed in, but no role has been given to your account. Ask an admin to add you.</p>
        <button type="button" className="oc__btn" onClick={() => setOut(true)}>Sign out</button>
      </div>
    );

  const current = openId ? pandits.find((p) => p.id === openId) ?? null : null;
  const title = current ? current.name : nav.find((n) => n.id === page)?.label ?? "Dashboard";

  return shell(
    <div className="oc__frame">
      <aside className="oc__side">
        <div className="oc__brand"><img src={`${assetBase}/logo.png`} alt="" /><span>ProPoojaPaath<small>Ops console</small></span></div>
        <nav aria-label="Console">
          {nav.map((n) => (
            <button key={n.id} type="button" className={page === n.id && !current ? "is-current" : ""} aria-current={page === n.id && !current ? "page" : undefined} onClick={() => go(n.id)}>
              {n.label}
              {n.id === "queue" && <span className="oc__count">{pandits.filter((p) => QUEUE.includes(p.status)).length}</span>}
            </button>
          ))}
        </nav>
        <div className="oc__me">
          <strong>{userName}</strong>
          <small>{roles.join(" · ")}</small>
          <button type="button" className="oc__link" onClick={() => setOut(true)}>Sign out</button>
        </div>
      </aside>

      <main className="oc__main">
        <header className="oc__head">
          {current && <button type="button" className="oc__link" onClick={() => setOpenId(null)}>← Back</button>}
          <h1>{title}</h1>
          {current && <Badge status={current.status} />}
          {current && <span className="oc__muted">Profile {current.percent}% complete · version {current.version}</span>}
        </header>

        {current ? (
          <Detail p={current} can={can} me={userName} update={update} log={log} />
        ) : page === "dashboard" ? (
          <Dashboard pandits={visible} can={can} open={(s) => { setFilter({ q: "", status: s, source: "" }); go("pandits"); }} goQueue={() => go("queue")} />
        ) : page === "pandits" ? (
          <>
            <div className="oc__filters">
              <label>Search by name<input className="oc__input" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} /></label>
              <label>Status
                <select className="oc__input" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value as Status | "" })}>
                  <option value="">All statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s].en}</option>)}
                </select>
              </label>
              <label>Source
                <select className="oc__input" value={filter.source} onChange={(e) => setFilter({ ...filter, source: e.target.value as "" | "self" | "staff" })}>
                  <option value="">Self and staff</option><option value="self">Self</option><option value="staff">Staff</option>
                </select>
              </label>
            </div>
            <PanditTable rows={visible.filter((p) => p.name.toLowerCase().includes(filter.q.toLowerCase()) && (!filter.status || p.status === filter.status) && (!filter.source || p.source === filter.source))} open={setOpenId} empty="No pandits match these filters." />
          </>
        ) : page === "queue" ? (
          <>
            <p className="oc__muted">Profiles waiting for a decision, oldest first.</p>
            <PanditTable rows={pandits.filter((p) => QUEUE.includes(p.status)).reverse()} open={setOpenId} empty="Nothing is waiting for review." />
          </>
        ) : page === "onboard" ? (
          <Onboard onCreate={(v) => {
            setPandits((list) => [{
              id: `new-${list.length}`, name: v.name, status: "draft", source: "staff", preparedBy: userName, phoneByStaff: `+91 ${v.phone}`,
              updated: "Today", percent: 30, version: 1, gender: v.gender, languages: [], traditions: [], services: [],
              address: [v.line, v.city, v.state, v.pin].filter(Boolean).join(", "), documents: [], attempts: [], history: [],
            }, ...list]);
            log("Created profile for a pandit", v.name, "name, gender, address, consent");
          }} />
        ) : page === "users" ? (
          <Users log={log} />
        ) : page === "reference" ? (
          <Reference log={log} />
        ) : (
          <div className="oc__tablewrap">
            <table className="oc__table">
              <thead><tr><th>When</th><th>Who</th><th>What</th><th>Record</th><th>Fields changed</th></tr></thead>
              <tbody>{audit.map((a, i) => <tr key={i}><td>{a.when}</td><td>{a.who}</td><td>{a.what}</td><td>{a.record}</td><td>{a.fields}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- dashboard and lists

function Dashboard({ pandits, can, open, goQueue }: { pandits: Pandit[]; can: (r: Role) => boolean; open: (s: Status) => void; goQueue: () => void }) {
  const count = (s: Status) => pandits.filter((p) => p.status === s).length;
  const waiting = pandits.filter((p) => QUEUE.includes(p.status)).length;
  const most = Math.max(1, ...STATUSES.map(count));
  return (
    <>
      <div className="oc__tiles">
        <div className="oc__tile"><span>Profiles</span><strong>{pandits.length}</strong></div>
        <button type="button" className="oc__tile oc__tile--link" onClick={goQueue} disabled={!can("admin") && !can("reviewer")}><span>Waiting for review</span><strong>{waiting}</strong></button>
        <div className="oc__tile"><span>Verified</span><strong>{count("approved")}</strong></div>
      </div>
      <div className="oc__cols">
        <section className="oc__card">
          <h2>By status</h2>
          <ul className="oc__bars">
            {STATUSES.map((s) => (
              <li key={s}>
                <button type="button" onClick={() => open(s)}>
                  <span>{STATUS_LABEL[s].en}</span>
                  <i><b className={`is-${STATUS_TONE[s]}`} style={{ width: `${(count(s) / most) * 100}%` }} /></i>
                  <strong>{count(s)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </section>
        {can("admin") && (
          <section className="oc__card">
            <h2>Account deletion requests</h2>
            <p className="oc__muted">Delete each account and its data within 30 days.</p>
            <table className="oc__table oc__table--plain">
              <thead><tr><th>Contact</th><th>Requested</th></tr></thead>
              <tbody>{DELETION_REQUESTS.map((d) => <tr key={d.contact}><td>{d.contact}</td><td>{d.requested}</td></tr>)}</tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}

function PanditTable({ rows, open, empty }: { rows: Pandit[]; open: (id: string) => void; empty: string }) {
  if (!rows.length) return <p className="oc__empty">{empty}</p>;
  return (
    <div className="oc__tablewrap">
      <table className="oc__table">
        <thead><tr><th>Name</th><th>Status</th><th>Source</th><th>Submitted</th><th>Updated</th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td><button type="button" className="oc__link" onClick={() => open(p.id)}>{p.name}</button></td>
              <td><Badge status={p.status} /></td>
              <td>{p.source === "staff" ? "Staff" : "Self"}</td>
              <td>{p.submitted ?? "—"}</td>
              <td>{p.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------- pandit detail

function Detail({ p, can, me, update, log }: { p: Pandit; can: (r: Role) => boolean; me: string; update: (id: string, c: (p: Pandit) => Pandit) => void; log: (what: string, record: string, fields: string) => void }) {
  const [reason, setReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [viewed, setViewed] = useState<string | null>(null);
  const [error, setError] = useState("");
  const decides = can("admin") || can("reviewer");
  const ownWork = p.preparedBy === me && !can("admin");
  const move = (to: Status, why: string, what: string) => {
    update(p.id, (x) => ({ ...x, status: to, updated: "Today", history: [...x.history, { when: "Just now", who: me, to, reason: why || undefined }] }));
    log(what, p.name, `status: ${p.status} → ${to}`);
  };
  const decide = (to: Status, what: string) => {
    if (reason.trim().length < 5) return setError("Give a reason of at least 5 characters.");
    setError("");
    move(to, reason.trim(), what);
    setReason("");
  };
  const mark = (n: number, result: "passed" | "failed") => {
    // Marking an attempt also moves a profile that is waiting on its recitation.
    const to: Status = result === "passed" ? "ai_passed" : "ai_failed";
    const moves = ["submitted", "ai_pending", "ai_failed"].includes(p.status);
    update(p.id, (x) => ({
      ...x,
      attempts: x.attempts.map((a) => (a.n === n ? { ...a, result } : a)),
      ...(moves ? { status: to, updated: "Today", history: [...x.history, { when: "Just now", who: me, to }] } : {}),
    }));
    log(`Marked recitation ${result === "passed" ? "passed" : "not passed"}`, p.name, moves ? `attempt ${n} result, status → ${to}` : `attempt ${n} result`);
  };
  const row = (label: string, value?: string | number) => <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;

  return (
    <div className="oc__detail">
      <div className="oc__detailmain">
        <section className="oc__card">
          <h2>Personal</h2>
          <dl className="oc__facts">
            {row("Gender", p.gender)}{row("Date of birth", p.dob)}{row("Experience", p.experience != null ? `${p.experience} years` : undefined)}
            {row("Dharma", p.dharma)}{row("Gotra", p.gotra)}{p.source === "staff" && row("Phone entered by staff", p.phoneByStaff)}
            {row("Languages", p.languages.join(", "))}{row("Traditions", p.traditions.join(", "))}{row("Services", p.services.join(", "))}
          </dl>
          {p.about && <p className="oc__about">{p.about}</p>}
        </section>

        <section className="oc__card">
          <h2>Addresses</h2>
          <dl className="oc__facts">{row("Home address", p.address)}</dl>
        </section>

        <section className="oc__card">
          <h2>Bank, documents and recitation</h2>
          <h3>Bank</h3>
          {p.bank ? <dl className="oc__facts">{row("Type", p.bank.type)}{row("Number", p.bank.masked)}{row("IFSC", p.bank.ifsc)}{row("Holder name", p.bank.holder)}{row("Status", p.bank.status)}</dl> : <p className="oc__muted">Not added.</p>}
          <h3>Documents</h3>
          {p.documents.length ? (
            <ul className="oc__docs">
              {p.documents.map((d) => (
                <li key={d}>
                  <span>{d}</span>
                  <button type="button" className="oc__btn oc__btn--small" onClick={() => { setViewed(d); log("Viewed ID document", p.name, d); }}>View</button>
                </li>
              ))}
            </ul>
          ) : <p className="oc__muted">Nothing uploaded.</p>}
          {viewed && <p className="oc__note" role="status">Showing {viewed}. This viewing has been logged.</p>}
          <h3>Recitation attempts</h3>
          {p.attempts.length ? (
            <div className="oc__tablewrap">
              <table className="oc__table oc__table--plain">
                <thead><tr><th>Attempt</th><th>Shloka</th><th>Result</th><th>Score</th><th>Recording</th><th><span className="oc__sr">Decision</span></th></tr></thead>
                <tbody>
                  {p.attempts.map((a) => (
                    <tr key={a.n}>
                      <td>{a.n}</td><td>{a.shloka}</td>
                      <td><span className={`oc__badge is-${a.result === "passed" ? "good" : a.result === "failed" ? "attention" : "waiting"}`}>{a.result === "passed" ? "Passed" : a.result === "failed" ? "Not passed" : "Waiting"}</span></td>
                      <td>{a.score != null ? `${a.score}%` : "—"}</td>
                      <td><button type="button" className="oc__btn oc__btn--small">▶ Play</button></td>
                      <td>{a.result === "waiting" && decides && (
                        <span className="oc__row">
                          <button type="button" className="oc__btn oc__btn--small" onClick={() => mark(a.n, "passed")}>Passed</button>
                          <button type="button" className="oc__btn oc__btn--small" onClick={() => mark(a.n, "failed")}>Not passed</button>
                        </span>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="oc__muted">No attempts yet.</p>}
        </section>
      </div>

      <div className="oc__detailside">
        {p.source === "staff" && p.status === "draft" && (
          <section className="oc__card">
            <h2>Submit for review</h2>
            <p className="oc__muted">Prepared by {p.preparedBy}. Submit once the pandit has confirmed the details.</p>
            <button type="button" className="oc__btn oc__btn--primary" onClick={() => move("submitted", "", "Submitted for review")}>Submit for review</button>
          </section>
        )}

        {decides && (
          <section className="oc__card">
            <h2>Decision</h2>
            {ownWork ? <p className="oc__note">You prepared this profile, so another reviewer has to decide on it.</p> : (
              <>
                <label className="oc__field">Reason
                  <textarea className="oc__input" rows={4} maxLength={1000} value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} aria-invalid={!!error} />
                </label>
                {error && <p className="oc__error" role="alert">{error}</p>}
                <div className="oc__row">
                  <button type="button" className="oc__btn oc__btn--primary" onClick={() => decide("approved", "Approved profile")}>Approve</button>
                  <button type="button" className="oc__btn" onClick={() => decide("changes_requested", "Requested changes")}>Request changes</button>
                  <button type="button" className="oc__btn oc__btn--danger" onClick={() => decide("rejected", "Rejected profile")}>Reject</button>
                </div>
              </>
            )}
          </section>
        )}

        {can("admin") && (
          <section className="oc__card">
            <h2>{p.status === "suspended" ? "Reinstate" : "Suspend"}</h2>
            <label className="oc__field">Reason
              <input className="oc__input" maxLength={500} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
            </label>
            <button type="button" className={`oc__btn${p.status === "suspended" ? "" : " oc__btn--danger"}`} disabled={suspendReason.trim().length < 5}
              onClick={() => { move(p.status === "suspended" ? "approved" : "suspended", suspendReason.trim(), p.status === "suspended" ? "Reinstated pandit" : "Suspended pandit"); setSuspendReason(""); }}>
              {p.status === "suspended" ? "Reinstate" : "Suspend"}
            </button>
          </section>
        )}

        <section className="oc__card">
          <h2>History</h2>
          {p.history.length ? (
            <ol className="oc__history">
              {[...p.history].reverse().map((h, i) => (
                <li key={i}>
                  <Badge status={h.to} />
                  <span>{h.who} · {h.when}</span>
                  {h.reason && <p>{h.reason}</p>}
                </li>
              ))}
            </ol>
          ) : <p className="oc__muted">No status changes yet.</p>}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- onboard, users, reference data

function Onboard({ onCreate }: { onCreate: (v: { name: string; phone: string; gender: string; line: string; city: string; state: string; pin: string }) => void }) {
  const [v, setV] = useState({ phone: "", name: "", gender: "", line: "", city: "", state: "", pin: "", consent: false });
  const [tried, setTried] = useState(false);
  const [created, setCreated] = useState("");
  const bad = { phone: !/^[6-9]\d{9}$/.test(v.phone), name: v.name.trim().length < 2, gender: !v.gender, consent: !v.consent };
  const field = (key: "phone" | "name" | "line" | "city" | "state" | "pin", label: string, extra?: object) => (
    <label className="oc__field">{label}
      <input className="oc__input" value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} aria-invalid={tried && (bad as any)[key]} {...extra} />
      {tried && (bad as any)[key] && <span className="oc__error">This is needed.</span>}
    </label>
  );
  if (created)
    return (
      <section className="oc__card oc__form">
        <h2>Profile created</h2>
        <p>{created}'s profile is marked "prepared by staff" and is now in the Pandits list. When they sign in to the app with that mobile number, the profile becomes theirs.</p>
        <button type="button" className="oc__btn" onClick={() => { setCreated(""); setTried(false); setV({ phone: "", name: "", gender: "", line: "", city: "", state: "", pin: "", consent: false }); }}>Onboard another pandit</button>
      </section>
    );
  return (
    <form className="oc__card oc__form" noValidate onSubmit={(e) => { e.preventDefault(); setTried(true); if (!Object.values(bad).some(Boolean)) { onCreate({ ...v, name: v.name.trim() }); setCreated(v.name.trim()); } }}>
      <p className="oc__muted">Create a profile on a pandit's behalf. They take it over when they sign in with the same mobile number.</p>
      {field("phone", "Pandit's mobile number", { inputMode: "numeric", maxLength: 10 })}
      {field("name", "Full name", { maxLength: 120 })}
      <label className="oc__field">Gender
        <select className="oc__input" value={v.gender} onChange={(e) => setV({ ...v, gender: e.target.value })} aria-invalid={tried && bad.gender}>
          <option value="">Choose</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
        </select>
        {tried && bad.gender && <span className="oc__error">This is needed.</span>}
      </label>
      <fieldset className="oc__fieldset">
        <legend>Address</legend>
        {field("line", "House, street, area")}
        <div className="oc__grid3">{field("city", "City / town")}{field("state", "State")}{field("pin", "PIN code", { inputMode: "numeric", maxLength: 6 })}</div>
      </fieldset>
      <label className="oc__check">
        <input type="checkbox" checked={v.consent} onChange={(e) => setV({ ...v, consent: e.target.checked })} />
        <span>The pandit has agreed to have this profile created for them.</span>
      </label>
      {tried && bad.consent && <span className="oc__error">Consent is needed before creating the profile.</span>}
      <button type="submit" className="oc__btn oc__btn--primary">Create profile</button>
    </form>
  );
}

function Users({ log }: { log: (what: string, record: string, fields: string) => void }) {
  const [users, setUsers] = useState(USERS);
  const all: Role[] = ["admin", "staff", "reviewer"];
  const toggle = (id: string, r: Role) => setUsers((list) => list.map((u) => {
    if (u.id !== id) return u;
    const has = u.roles.includes(r);
    log(has ? "Removed role" : "Gave role", u.name, `roles: ${has ? "−" : "+"} ${r}`);
    return { ...u, roles: has ? u.roles.filter((x) => x !== r) : [...u.roles, r] };
  }));
  return (
    <>
      <p className="oc__muted">A removed role stops working on the person's next request.</p>
      <div className="oc__tablewrap">
        <table className="oc__table">
          <thead><tr><th>Person</th><th>Joined</th>{all.map((r) => <th key={r}>{r[0].toUpperCase() + r.slice(1)}</th>)}</tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong><br /><span className="oc__muted">{u.email}</span></td>
                <td>{u.joined}</td>
                {all.map((r) => (
                  <td key={r}>
                    <button type="button" role="switch" aria-checked={u.roles.includes(r)} aria-label={`${r} for ${u.name}`} className="oc__switch" onClick={() => toggle(u.id, r)}><i /></button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Reference({ log }: { log: (what: string, record: string, fields: string) => void }) {
  const tabs = Object.keys(REFERENCE);
  const [tab, setTab] = useState(tabs[0]);
  const [data, setData] = useState(REFERENCE);
  const [draft, setDraft] = useState({ en: "", hi: "", text: "", source: "" });
  const shlokas = tab === "Shlokas";
  const setStatus = (i: number, status: RefEntry["status"]) => {
    setData((d) => ({ ...d, [tab]: d[tab].map((e, j) => (j === i ? { ...e, status } : e)) }));
    log("Changed reference entry", `${tab}: ${data[tab][i].en}`, `status → ${status}`);
  };
  const add = () => {
    if (!draft.en.trim() || !draft.hi.trim()) return;
    if (data[tab].some((e) => e.en.toLowerCase() === draft.en.trim().toLowerCase())) return; // already in the list
    setData((d) => ({ ...d, [tab]: [...d[tab], { en: draft.en.trim(), hi: draft.hi.trim(), status: shlokas ? "pending" : "active" }] }));
    log("Added reference entry", `${tab}: ${draft.en.trim()}`, "English name, Hindi name");
    setDraft({ en: "", hi: "", text: "", source: "" });
  };
  return (
    <>
      <div className="oc__tiles oc__tiles--two">
        <div className="oc__tile"><span>PIN code directory</span><strong>19,300</strong><small>PIN codes loaded</small><button type="button" className="oc__btn oc__btn--small">Load directory</button></div>
        <div className="oc__tile"><span>Regional languages</span><strong>1,240</strong><small>translated labels loaded</small><button type="button" className="oc__btn oc__btn--small">Load labels</button></div>
      </div>
      <div className="oc__tabs" role="tablist">
        {tabs.map((x) => <button key={x} type="button" role="tab" aria-selected={x === tab} onClick={() => setTab(x)}>{x}</button>)}
      </div>
      {data[tab].length ? (
        <div className="oc__tablewrap">
          <table className="oc__table">
            <thead><tr><th>{shlokas ? "Title (English)" : "English name"}</th><th>{shlokas ? "Title (Hindi)" : "Hindi name"}</th><th>Status</th><th>Change status</th></tr></thead>
            <tbody>
              {data[tab].map((e, i) => (
                <tr key={e.en}>
                  <td>{e.en}</td><td lang="hi">{e.hi}</td>
                  <td><span className={`oc__badge is-${e.status === "active" ? "good" : e.status === "pending" ? "waiting" : "attention"}`}>{e.status}</span></td>
                  <td>
                    <select className="oc__input oc__input--small" value={e.status} aria-label={`Status of ${e.en}`} onChange={(ev) => setStatus(i, ev.target.value as RefEntry["status"])}>
                      <option value="active">active</option><option value="pending">pending</option><option value="rejected">rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="oc__empty">No entries in {tab} yet.</p>}
      <form className="oc__card oc__add" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <h2>Add {shlokas ? "a shloka" : "an entry"}</h2>
        <div className="oc__grid3">
          <label className="oc__field">{shlokas ? "Title (English)" : "English name"}<input className="oc__input" value={draft.en} onChange={(e) => setDraft({ ...draft, en: e.target.value })} /></label>
          <label className="oc__field">{shlokas ? "Title (Hindi)" : "Hindi name"}<input className="oc__input" lang="hi" value={draft.hi} onChange={(e) => setDraft({ ...draft, hi: e.target.value })} /></label>
          {shlokas && <label className="oc__field">Source<input className="oc__input" value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} /></label>}
        </div>
        {shlokas && <label className="oc__field">Text in Devanagari<textarea className="oc__input" rows={3} lang="hi" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></label>}
        {shlokas && <p className="oc__muted">New shlokas start as "pending".</p>}
        <button type="submit" className="oc__btn oc__btn--primary">Add</button>
      </form>
    </>
  );
}
