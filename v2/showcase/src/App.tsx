// ProPoojaPaath design showcase, v2: the pandit app rebuilt around the functional spec.
// Website / mobile, light / dark, English / Hindi and Replay; the "Demo" row acts out
// what the server and the review team would do (status changes, recitation results).

import { useEffect, useMemo, useState, type ReactNode } from "react";
import LogoReveal from "../../web/LogoReveal";
import PageHero from "../../web/PageHero";
import { heroes, heroesHi } from "../../web/pageHeroes";
import PanditApp from "../../pandit-app/web/PanditApp";
import OpsConsole from "../../ops-console/OpsConsole";
import type { Role } from "../../ops-console/data";
import PublicPage from "../../web/PublicPage";
import Ideation from "../../ideation/Ideation";
import { deleteAccount, privacyPolicy } from "../../web/publicPages";
import { APP_LANGUAGES, STATUS_LABEL, type Attempt, type NotificationState, type Status, type Update } from "../../pandit-app/shared/schema";
import { REQUIRED_DETAILS, SIGNED_IN, mocks } from "./mocks";

const ASSETS = "assets";
const PAGES = [
  { id: "pandit", label: "Pandit app", note: "" },
  { id: "ops", label: "Ops console", note: "Admin portal with made-up sample data. Decisions, role switches and reference edits work on screen and add rows to the audit log; nothing is saved." },
  { id: "soon", label: "Coming soon", note: "The whole customer side for now: one page, with a pointer for pandits to their app." },
  { id: "privacy", label: "Privacy", note: "Public page. The wording is a draft for layout, written from the functional spec." },
  { id: "delete", label: "Delete account", note: "Public page. The wording is a draft for layout, written from the functional spec." },
  { id: "ideas", label: "Ideation", note: "Sketches only. The layout, Home and opening shown here are now built into the pandit app. English only." },
  { id: "logo", label: "Logo reveal", note: "The welcome animation: kalash first, then the big petals, then the small ones, sparkles and the name." },
  { id: "home", label: "Home", note: "Website home page hero." },
  { id: "about", label: "About us", note: "Website About us / Vision hero." },
] as const;
type PageId = (typeof PAGES)[number]["id"];
type Start = "intro" | "signin" | "new" | "ready";
const STATUSES = Object.keys(STATUS_LABEL) as Status[];
const REASON = "Please upload a clearer photo of your PAN card and add the pujas you perform.";

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="sc__seg" role="group" aria-label={label}>
      {options.map(([v, text]) => <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>)}
    </div>
  );
}

export default function App() {
  const fromHash = (): PageId => (PAGES.find((p) => p.id === location.hash.slice(1))?.id ?? "pandit");
  const [page, setPage] = useState<PageId>(fromHash);
  const [device, setDevice] = useState<"website" | "mobile">(() => (window.innerWidth < 720 ? "mobile" : "website"));
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState("hi");
  const [startAt, setStartAt] = useState<Start>("intro");
  const [status, setStatus] = useState<Status>("draft");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [notifications, setNotifications] = useState<NotificationState>("unknown");
  const [run, setRun] = useState(0);
  const [role, setRole] = useState<"admin" | "reviewer" | "staff" | "none" | "signin">("admin");
  const lang = APP_LANGUAGES.find((x) => x.code === language)?.uses ?? "en";

  const reset = () => { setStatus("draft"); setAttempts([]); setUpdates([]); setNotifications("unknown"); setRun((n) => n + 1); };
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const onHash = () => setPage(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (id: PageId) => { setPage(id); setRun((n) => n + 1); try { history.replaceState(null, "", "#" + id); } catch {} };

  // ---- acting out the server and the review team
  const push = (kind: Update["kind"], reason?: string) => setUpdates((u) => [{ id: `${kind}-${Date.now()}`, kind, reason, at: new Date().toISOString(), read: kind === "submitted" }, ...u]);
  const changeStatus = (s: Status) => {
    setStatus(s);
    if (s === "under_review" || s === "approved" || s === "submitted") push(s);
    if (s === "changes_requested" || s === "rejected") push(s, REASON);
    if (s === "suspended") push(s, "Two yajmans reported a missed puja. Please contact our team.");
  };
  const markRecitation = (result: "passed" | "failed") => {
    setAttempts((a) => a.map((x) => (x.result === "checking" ? { ...x, result } : x)));
    push(result === "passed" ? "recitation_passed" : "recitation_failed");
  };
  const checking = attempts.some((a) => a.result === "checking");

  const app = useMemo(() => ({
    ...mocks,
    uploadRecitation: async (shlokaId: string) => {
      await mocks.uploadRecitation();
      setAttempts((a) => [...a, { n: a.length + 1, shlokaId, result: "checking" as const }]);
    },
    onSubmitForReview: async () => { await mocks.onSubmitForReview(); setStatus("submitted"); push("submitted"); },
  }), []);

  const h = lang === "hi" ? heroesHi : heroes;
  let screen: ReactNode;
  if (page === "logo") screen = <LogoReveal layout={device === "website" ? "row" : "stack"} theme={theme} assetBase={ASSETS} />;
  else if (page === "home") screen = <PageHero {...h.home} ctaHref="#home" theme={theme} assetBase={ASSETS} />;
  else if (page === "about") screen = <PageHero {...h.about} ctaHref="#about" theme={theme} assetBase={ASSETS} />;
  else if (page === "soon") screen = <PageHero {...h.comingSoon} ctaHref="#pandit" theme={theme} assetBase={ASSETS} />;
  else if (page === "privacy") screen = <PublicPage {...privacyPolicy} theme={theme} assetBase={ASSETS} homeHref="#home" />;
  else if (page === "delete") screen = <PublicPage {...deleteAccount} theme={theme} assetBase={ASSETS} homeHref="#home" />;
  else if (page === "ideas") screen = <Ideation theme={theme} assetBase={ASSETS} />;
  else if (page === "ops")
    screen = (
      <OpsConsole
        theme={theme}
        assetBase={ASSETS}
        signedOut={role === "signin"}
        roles={role === "none" || role === "signin" ? [] : [role as Role]}
        userName={role === "staff" ? "Kavita Rao" : role === "reviewer" ? "Meera Iyer" : "Arjun Mehta"}
      />
    );
  else
    screen = (
      <PanditApp
        {...app}
        theme={theme}
        language={language}
        onLanguageChange={setLanguage}
        assetBase={ASSETS}
        reveal={startAt === "intro"}
        // Sample contact details for the demo only: replace with the real ones.
        support={{ whatsapp: "919876543210", phone: "919876543210", hours: language === "hi" ? "हमारी टीम हर दिन सुबह 9 से शाम 7 बजे तक उपलब्ध है।" : "Our team is here from 9 am to 7 pm, every day." }}
        startAt={startAt === "intro" ? "intro" : startAt === "signin" ? "signin" : "home"}
        account={startAt === "new" || startAt === "ready" ? SIGNED_IN : undefined}
        initialValues={startAt === "ready" ? REQUIRED_DETAILS : startAt === "new" ? { fullName: "Ramesh Shastri" } : undefined}
        status={status}
        updates={updates}
        attempts={attempts}
        reviewerMessage={status === "changes_requested" || status === "rejected" ? REASON : undefined}
        onOpenPrivacy={() => {}}
        notifications={notifications}
        onEnableNotifications={async () => { await new Promise((r) => setTimeout(r, 500)); setNotifications("on"); return true; }}
        onDisableNotifications={() => setNotifications("off")}
        onOpenNotificationSettings={() => setNotifications("on")}
        onUpdateRead={(id) => setUpdates((u) => u.map((x) => (x.id === id ? { ...x, read: true } : x)))}
        sampleCamera
      />
    );

  const note = page !== "pandit"
    ? PAGES.find((p) => p.id === page)!.note
    : "Sample data throughout: any 10-digit number starting 6–9 and any 6-digit code work. Try 'assi', 'pune' or 'lucknow' in the address search. Use the Demo row to act as the review team: each status change sends an update to the bell.";

  return (
    <div className="sc">
      <header className="sc__bar">
        <a className="sc__brand" href="#pandit" onClick={() => go("pandit")}>
          <img src={`${ASSETS}/logo.png`} alt="" />
          <span>ProPoojaPaath <small>design v2</small></span>
        </a>
        <nav className="sc__seg sc__seg--nav" aria-label="Pages">
          {PAGES.map((p) => <button key={p.id} type="button" aria-pressed={p.id === page} onClick={() => go(p.id)}>{p.label}</button>)}
        </nav>
        <div className="sc__controls">
          <Seg label="View" value={device} options={[["website", "Website"], ["mobile", "Mobile"]]} onChange={(v) => { setDevice(v); setRun((n) => n + 1); }} />
          <Seg label="Theme" value={theme} options={[["light", "Light"], ["dark", "Dark"]]} onChange={setTheme} />
          <Seg label="Language" value={lang} options={[["en", "English"], ["hi", "हिन्दी"]]} onChange={setLanguage} />
          <button type="button" className="sc__replay" onClick={reset}>Replay</button>
        </div>
      </header>

      {page === "pandit" && (
        <div className="sc__sub">
          <label>Open at
            <Seg label="Open at" value={startAt} options={[["intro", "Start"], ["signin", "Sign in"], ["new", "Home, new"], ["ready", "Home, details in"]]} onChange={(v) => { setStartAt(v); reset(); }} />
          </label>
          <label>Demo: status
            <select value={status} onChange={(e) => changeStatus(e.target.value as Status)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s].en}</option>)}
            </select>
          </label>
          <label>Demo: reviewer marks recitation
            <Seg label="Recitation result" value={"" as string} options={[["passed", "Passed"], ["failed", "Not passed"]]} onChange={(v) => checking && markRecitation(v as "passed" | "failed")} />
          </label>
          {!checking && <span className="sc__soon">(submit a recording first)</span>}
        </div>
      )}

      {page === "ops" && (
        <div className="sc__sub">
          <label>Signed in as
            <Seg label="Role" value={role} options={[["admin", "Admin"], ["reviewer", "Reviewer"], ["staff", "Staff"], ["none", "No role"], ["signin", "Signed out"]]} onChange={(v) => { setRole(v); setRun((n) => n + 1); }} />
          </label>
          <span className="sc__soon">English only, as in the spec</span>
        </div>
      )}

      <main className={`sc__stage sc__stage--${device} sc__stage--${page}${page === "pandit" || page === "ops" || page === "privacy" || page === "delete" || page === "ideas" ? " sc__stage--form" : ""}`}>
        <div className="sc__screen" key={`${page}-${device}-${startAt}-${role}-${run}`}>{screen}</div>
      </main>
      <p className="sc__note">{note}</p>
    </div>
  );
}
