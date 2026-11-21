// ProPoojaPaath design showcase: every piece of the kit in one place, with
// website / mobile, light / dark and English / Hindi switches and a Replay button.
// Sign-in, the SMS code and the recitation match are acted out with sample data (see mocks.ts).

import { useEffect, useState, type ReactNode } from "react";
import LogoReveal from "../../web/LogoReveal";
import PageHero from "../../web/PageHero";
import { heroes, heroesHi } from "../../web/pageHeroes";
import PanditOnboarding from "../../onboarding/web/PanditOnboarding";
import type { Lang } from "../../onboarding/shared/schema";
import { demo, mocks } from "./mocks";

const ASSETS = "assets";
const PAGES = [
  { id: "logo", label: "Logo reveal", note: "The welcome animation: kalash first, then the big petals, then the small ones, sparkles and the name." },
  { id: "home", label: "Home", note: "Home page hero: the rings settle, the lotus opens and the headline rises beside it." },
  { id: "about", label: "About us", note: "About us / Vision: an oversized mandala running off the edge behind the statement." },
  { id: "pandit", label: "Pandit", note: "" },
  { id: "customer", label: "Customer", note: "Customer welcome after sign-in. The name comes from the account; this one is a sample." },
  { id: "admin", label: "Admin", note: "Admin welcome: a short strip for the top of the dashboard, so it does not push the work down the page." },
] as const;
type PageId = (typeof PAGES)[number]["id"];
type Start = "signin" | "form" | "recitation" | "profile";

const SAMPLE = { en: { pandit: "Shastri", customer: "Meera", admin: "Rohan" }, hi: { pandit: "शास्त्री", customer: "मीरा", admin: "रोहन" } };
const SIGNED_IN = { phone: "9876543210", phoneVerified: true, email: "shastri.sample@gmail.com", googleVerified: true, googleName: "Ramesh Shastri" };
const DETAILS = { fullName: "Ramesh Shastri", gender: "male", dob: "1978-11-05", pin: "226010", addressLine: "12 Shanti Kunj, Gomti Nagar", city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh" };

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="sc__seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

export default function App() {
  const fromHash = (): PageId => (PAGES.find((p) => p.id === location.hash.slice(1))?.id ?? "home");
  const [page, setPage] = useState<PageId>(fromHash);
  const [device, setDevice] = useState<"website" | "mobile">(() => (window.innerWidth < 720 ? "mobile" : "website"));
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [lang, setLang] = useState<Lang>("en");
  const [panditView, setPanditView] = useState<"welcome" | "onboarding">("onboarding");
  const [startAt, setStartAt] = useState<Start>("signin");
  const [passes, setPasses] = useState(true);
  const [run, setRun] = useState(0);
  const replay = () => setRun((n) => n + 1);

  useEffect(() => { demo.pass = passes; }, [passes]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const onHash = () => setPage(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (id: PageId) => { setPage(id); replay(); try { history.replaceState(null, "", "#" + id); } catch {} };

  const h = lang === "hi" ? heroesHi : heroes;
  const names = SAMPLE[lang];
  const onboarding = page === "pandit" && panditView === "onboarding";

  let screen: ReactNode;
  if (page === "logo") screen = <LogoReveal layout={device === "website" ? "row" : "stack"} theme={theme} assetBase={ASSETS} />;
  else if (page === "home") screen = <PageHero {...h.home} ctaHref="#home" theme={theme} assetBase={ASSETS} />;
  else if (page === "about") screen = <PageHero {...h.about} ctaHref="#about" theme={theme} assetBase={ASSETS} />;
  else if (page === "customer") screen = <PageHero {...h.customerWelcome(names.customer)} ctaHref="#customer" theme={theme} assetBase={ASSETS} />;
  else if (page === "admin")
    screen = (
      <>
        <PageHero {...h.adminWelcome(names.admin)} theme={theme} assetBase={ASSETS} />
        <div className="sc__placeholder">The admin dashboard goes here</div>
      </>
    );
  else if (!onboarding) screen = <PageHero {...h.panditWelcome(names.pandit)} ctaHref="#pandit" theme={theme} assetBase={ASSETS} />;
  else
    screen = (
      <PanditOnboarding
        {...mocks}
        theme={theme}
        lang={lang}
        onLangChange={setLang}
        assetBase={ASSETS}
        startAt={startAt}
        account={startAt === "signin" ? undefined : SIGNED_IN}
        initialValues={startAt === "signin" || startAt === "form" ? undefined : DETAILS}
      />
    );

  const note = page !== "pandit"
    ? PAGES.find((p) => p.id === page)!.note
    : onboarding
      ? "Pandit onboarding with sample data: any 10-digit number starting 6–9 and any 6-digit code work. The camera is real where the browser allows it; the match score is acted out."
      : "Pandit welcome after sign-in. The name comes from the account; this one is a sample.";

  return (
    <div className="sc">
      <header className="sc__bar">
        <a className="sc__brand" href="#home" onClick={() => go("home")}>
          <img src={`${ASSETS}/logo.png`} alt="" />
          <span>ProPoojaPaath <small>design</small></span>
        </a>
        <nav className="sc__seg sc__seg--nav" aria-label="Pages">
          {PAGES.map((p) => (
            <button key={p.id} type="button" aria-pressed={p.id === page} onClick={() => go(p.id)}>{p.label}</button>
          ))}
        </nav>
        <div className="sc__controls">
          <Seg label="View" value={device} options={[["website", "Website"], ["mobile", "Mobile"]]} onChange={(v) => { setDevice(v); replay(); }} />
          <Seg label="Theme" value={theme} options={[["light", "Light"], ["dark", "Dark"]]} onChange={setTheme} />
          <Seg label="Language" value={lang} options={[["en", "English"], ["hi", "हिन्दी"]]} onChange={setLang} />
          <button type="button" className="sc__replay" onClick={replay}>Replay</button>
        </div>
      </header>

      {page === "pandit" && (
        <div className="sc__sub">
          <Seg label="Pandit view" value={panditView} options={[["onboarding", "Onboarding"], ["welcome", "Welcome"]]} onChange={(v) => { setPanditView(v); replay(); }} />
          {onboarding && (
            <>
              <label>Open at
                <Seg label="Open at" value={startAt} options={[["signin", "Sign in"], ["form", "Details"], ["recitation", "Recitation"], ["profile", "Profile"]]} onChange={(v) => { setStartAt(v); replay(); }} />
              </label>
              <label>Recitation
                <Seg label="Recitation result" value={passes ? "pass" : "fail"} options={[["pass", "Matches"], ["fail", "Does not match"]]} onChange={(v) => setPasses(v === "pass")} />
              </label>
            </>
          )}
        </div>
      )}

      <main className={`sc__stage sc__stage--${device} sc__stage--${page}${onboarding ? " sc__stage--form" : ""}`}>
        <div className="sc__screen" key={`${page}-${device}-${panditView}-${startAt}-${run}`}>{screen}</div>
      </main>
      <p className="sc__note">{note}</p>
    </div>
  );
}
