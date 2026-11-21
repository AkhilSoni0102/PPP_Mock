// ProPoojaPaath design showcase, v2: the pandit app rebuilt around the functional spec.
// Website / mobile, light / dark, English / Hindi and Replay; the "Demo" row acts out
// what the server and the review team would do (status changes, recitation results).

import { useEffect, useMemo, useState, type ReactNode } from "react";
import LogoReveal from "../../web/LogoReveal";
import PageHero from "../../web/PageHero";
import { heroes, heroesHi } from "../../web/pageHeroes";
import PanditApp from "../../pandit-app/web/PanditApp";
import { APP_LANGUAGES, STATUS_LABEL, type Attempt, type Status, type Update } from "../../pandit-app/shared/schema";
import { REQUIRED_DETAILS, SIGNED_IN, mocks } from "./mocks";

const ASSETS = "assets";
const PAGES = [
  { id: "pandit", label: "Pandit app", note: "" },
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
  const [run, setRun] = useState(0);
  const lang = APP_LANGUAGES.find((x) => x.code === language)?.uses ?? "en";

  const reset = () => { setStatus("draft"); setAttempts([]); setUpdates([]); setRun((n) => n + 1); };
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const onHash = () => setPage(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (id: PageId) => { setPage(id); setRun((n) => n + 1); try { history.replaceState(null, "", "#" + id); } catch {} };

  // ---- acting out the server and the review team
  const push = (kind: Update["kind"], reason?: string) => setUpdates((u) => [{ id: `${kind}-${Date.now()}`, kind, reason }, ...u]);
  const changeStatus = (s: Status) => {
    setStatus(s);
    if (s === "under_review" || s === "approved" || s === "rejected" || s === "suspended" || s === "submitted") push(s);
    if (s === "changes_requested") push(s, REASON);
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
  else
    screen = (
      <PanditApp
        {...app}
        theme={theme}
        language={language}
        onLanguageChange={setLanguage}
        assetBase={ASSETS}
        startAt={startAt === "intro" ? "intro" : startAt === "signin" ? "signin" : "home"}
        account={startAt === "new" || startAt === "ready" ? SIGNED_IN : undefined}
        initialValues={startAt === "ready" ? REQUIRED_DETAILS : startAt === "new" ? { fullName: "Ramesh Shastri" } : undefined}
        status={status}
        updates={updates}
        attempts={attempts}
        reviewerMessage={status === "changes_requested" || status === "rejected" ? REASON : undefined}
        onOpenPrivacy={() => {}}
      />
    );

  const note = page !== "pandit"
    ? PAGES.find((p) => p.id === page)!.note
    : "Sample data throughout: any 10-digit number starting 6–9 and any 6-digit code work. Try 'assi', 'pune' or 'lucknow' in the address search. Use the Demo row to act as the review team.";

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

      <main className={`sc__stage sc__stage--${device} sc__stage--${page}${page === "pandit" ? " sc__stage--form" : ""}`}>
        <div className="sc__screen" key={`${page}-${device}-${startAt}-${run}`}>{screen}</div>
      </main>
      <p className="sc__note">{note}</p>
      <p className="sc__soon">Coming in the next batches: the Expo version of the pandit app, the ops console, the customer "Coming soon" page and the public pages.</p>
    </div>
  );
}
