"use client";

// Ideation sketches — NOT part of the pandit app. Second pass:
//   · the logo is always shown whole, never in pieces
//   · wherever it is decoration, it keeps glowing
//   · wherever there is a progress bar, the logo rides the front of the bar and moves right
// It borrows the pandit app's styles for a matching look but changes none of its code.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import LotusMark from "../web/LotusMark";
import "../web/logo-reveal.css";
import "../pandit-app/web/pandit-app.css";
import "./ideation.css";
import "./notifications.css";
import { AllowNotifications, BellAndUpdates, NotificationSetting, OnThePhone } from "./Notifications";

type Props = { theme?: "light" | "dark"; assetBase?: string };

const SPARKS = [[-0.62, -0.3], [0.6, -0.34], [-0.44, 0.44], [0.68, 0.22], [0.06, -0.72], [-0.74, 0.06], [0.38, 0.52]];

/** The whole logo with a soft light behind it that never switches off. */
function GlowLogo({ size, assetBase, sparkles = true, children }: { size: number; assetBase: string; sparkles?: boolean; children?: ReactNode }) {
  return (
    <span className="id__logo" style={{ "--id-size": `${size}px` } as CSSProperties} aria-hidden="true">
      <img className="id__glow" src={`${assetBase}/glow.png`} alt="" />
      {children}
      <img className="id__mark" src={`${assetBase}/logo.png`} alt="" />
      {sparkles && SPARKS.map(([x, y], i) => <i key={i} style={{ "--x": x, "--y": y, "--d": `${i * 0.37}s` } as CSSProperties} />)}
    </span>
  );
}

/** A progress bar with the glowing logo riding its front edge. No number is shown. */
function RiderBar({ value, label, assetBase }: { value: number; label: string; assetBase: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="id__bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} style={{ "--id-v": v } as CSSProperties}>
      <span className="id__track"><span className="id__fill" /></span>
      <span className="id__rider"><GlowLogo size={34} assetBase={assetBase} sparkles={false} /></span>
    </div>
  );
}

/** The mandala rings turning slowly around the glowing logo: the waiting state. */
function Turning({ size, assetBase, plain }: { size: number; assetBase: string; plain?: boolean }) {
  return (
    <span className="id__turning" style={{ width: size, height: size }} aria-hidden="true">
      <i style={{ "--id-mask": `url(${assetBase}/mandala-outer.png)` } as CSSProperties} />
      <i style={{ "--id-mask": `url(${assetBase}/mandala-inner.png)` } as CSSProperties} />
      {!plain && <GlowLogo size={size * 0.46} assetBase={assetBase} sparkles={false} />}
    </span>
  );
}

const NEW_IDEAS = [
  ["bell", "Home and bell"],
  ["updates", "Updates page"],
  ["allow", "Allow notifications"],
  ["phone", "On the phone"],
  ["setting", "Setting"],
] as const;

const IDEAS = [
  ["home", "Home progress"],
  ["steps", "Step screens"],
  ["intro", "Intro slides"],
  ["signin", "Sign-in"],
  ["verify", "Get verified"],
  ["waiting", "Waiting states"],
] as const;
type Idea = (typeof IDEAS)[number][0] | (typeof NEW_IDEAS)[number][0];

const WHY: Record<Idea, string> = {
  bell: "Home no longer lists updates. The bell in the top bar counts unread ones, and both the bell and the status badge on the banner open the Updates page. A reviewer's request for changes still shows on Home because it needs action.",
  updates: "One page for everything about the review: a timeline of where the profile is, with the reviewer's message on the step it belongs to, then every update, newest first.",
  allow: "Shown once, straight after Submit for review, when the pandit has a reason to care. Our own screen comes first; the phone's question appears only if they tap Allow.",
  phone: "How a push looks on the lock screen, and the one-colour lotus the phone uses as the small icon.",
  setting: "One switch in My account. If notifications are blocked in the phone's settings, the row says so and offers to open them.",
  home: "The glowing logo sits at the front of the progress bar. Tap a section to complete it and the logo travels to the right. When the profile is verified the whole banner lights up.",
  steps: "The same bar at the top of every step: the logo moves right as the pandit goes through the screens of a section.",
  intro: "The whole logo, glowing, inside the turning mandala. The bar at the top carries the small logo across the three slides.",
  signin: "The glowing logo above the form, and a single pulse of light when the code is accepted.",
  verify: "A breathing gold ring while recording, the glowing logo inside the turning mandala while the team checks, and the full reveal when the recitation passes.",
  waiting: "Anywhere the app waits, the mandala turns slowly around the glowing logo in place of a spinner.",
};

export default function Ideation({ theme = "dark", assetBase = "/logo-reveal" }: Props) {
  const [idea, setIdea] = useState<Idea>("bell");
  return (
    <div className={`po po--${theme} id`}>
      <div className="id__head">
        <p className="id__tag">Ideation sketch · not in the app</p>
        <div className="id__group">
          <span>Notifications (now built into the app)</span>
          <div className="po__chips" role="tablist" aria-label="New: notifications">
            {NEW_IDEAS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={k === idea} className={`po__chip${k === idea ? " is-on" : ""}`} onClick={() => setIdea(k)}>{label}</button>)}
          </div>
        </div>
        <details className="id__group id__older" open={IDEAS.some(([k]) => k === idea)}>
          <summary>Earlier sketches, already in the app</summary>
          <div className="po__chips" role="tablist" aria-label="Earlier sketches">
            {IDEAS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={k === idea} className={`po__chip${k === idea ? " is-on" : ""}`} onClick={() => setIdea(k)}>{label}</button>)}
          </div>
        </details>
        <p className="po__hint">{WHY[idea]}</p>
      </div>
      <div className="id__body" key={idea}>
        {idea === "bell" && <BellAndUpdates assetBase={assetBase} start="home" />}
        {idea === "updates" && <BellAndUpdates assetBase={assetBase} start="updates" />}
        {idea === "allow" && <AllowNotifications assetBase={assetBase} />}
        {idea === "phone" && <OnThePhone assetBase={assetBase} />}
        {idea === "setting" && <NotificationSetting />}
        {idea === "home" && <Home assetBase={assetBase} />}
        {idea === "steps" && <Steps assetBase={assetBase} />}
        {idea === "intro" && <Intro assetBase={assetBase} />}
        {idea === "signin" && <SignIn assetBase={assetBase} />}
        {idea === "verify" && <Verify assetBase={assetBase} />}
        {idea === "waiting" && <Waiting assetBase={assetBase} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 1. Home: the logo rides the progress bar

const SECTIONS: { id: string; title: string; summary: string; required?: boolean }[] = [
  { id: "personal", title: "Personal", summary: "Name, photo, gender and date of birth", required: true },
  { id: "address", title: "Address", summary: "Where you live", required: true },
  { id: "practice", title: "Religious practice", summary: "Experience, languages, pujas and tradition" },
  { id: "area", title: "Service area", summary: "Where you travel for pujas" },
  { id: "availability", title: "Your availability", summary: "The days and times you take bookings" },
  { id: "bank", title: "Bank or UPI details", summary: "Where payments are sent" },
  { id: "id", title: "ID document", summary: "A photo of any one ID" },
  { id: "verify", title: "Get verified", summary: "Recite a shloka for the verified tick" },
];

function Home({ assetBase }: { assetBase: string }) {
  const [done, setDone] = useState<string[]>([]);
  const [stage, setStage] = useState<"editing" | "moment" | "submitted" | "verified">("editing");
  const ready = SECTIONS.filter((s) => s.required).every((s) => done.includes(s.id));
  const progress = stage === "editing" ? 0.08 + 0.84 * (done.length / SECTIONS.length) : 1;
  useEffect(() => {
    if (stage !== "moment") return;
    const id = setTimeout(() => setStage("submitted"), 3400);
    return () => clearTimeout(id);
  }, [stage]);

  if (stage === "moment")
    return (
      <div className="id__moment" role="status">
        <LotusMark assetBase={assetBase} />
        <h2 className="po__title">Your profile was submitted</h2>
        <p className="po__intro">Our team will review it and let you know.</p>
      </div>
    );

  return (
    <>
      <h1 className="po__title">Namaste, Ramesh{stage === "verified" && <span className="po__tick"> ✔</span>}</h1>
      <section className={`po__banner id__banner${stage === "verified" ? " is-verified" : ""}`}>
        <div className="po__bannerhead">
          <h2>{stage === "editing" ? "Complete your profile" : "Your profile"}</h2>
          <span className={`po__pill${stage === "verified" ? " is-good" : ""}`}>{stage === "verified" ? "Verified" : stage === "submitted" ? "Submitted" : "Not submitted"}</span>
        </div>
        <RiderBar value={progress} label="Profile progress" assetBase={assetBase} />
        <p>
          {stage === "verified" ? "Your profile is verified."
            : stage === "submitted" ? "Your profile is with our team."
            : ready ? "The required details are in. Submit for review, or add more first."
            : "Name, gender, date of birth and address are needed before you can submit."}
        </p>
      </section>

      {stage === "editing" ? (
        <>
          <h2 className="po__h2">Tap a section to complete it</h2>
          <ul className="po__hub">
            {SECTIONS.map((s) => {
              const on = done.includes(s.id);
              return (
                <li key={s.id}>
                  <button type="button" className={`po__tile is-${on ? "done" : "empty"}`} aria-pressed={on} onClick={() => setDone(on ? done.filter((x) => x !== s.id) : [...done, s.id])}>
                    <span className="po__dot" aria-hidden="true" />
                    <span className="po__tiletext"><strong>{s.title}</strong><small>{s.summary}</small></span>
                    <span className="po__status">{on ? "Done" : s.required ? "Required" : "Optional"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="id__actions">
            <button type="button" className="po__btn po__btn--primary" disabled={!ready} onClick={() => setStage("moment")}>Submit for review</button>
          </div>
        </>
      ) : (
        <div className="id__actions">
          {stage === "submitted" && <button type="button" className="po__btn po__btn--primary" onClick={() => setStage("verified")}>Demo: review team approves</button>}
          <button type="button" className="po__btn" onClick={() => { setDone([]); setStage("editing"); }}>Start again</button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- 2. step screens

const STEP_SCREENS = [
  { title: "Your experience", fields: ["Years of experience", "About your practice"] },
  { title: "Languages you speak", fields: ["Languages"] },
  { title: "Pujas and services you perform", fields: ["Pujas and services"] },
  { title: "Your tradition", fields: ["Dharma", "Traditions you follow", "Gotra"] },
];

function Steps({ assetBase }: { assetBase: string }) {
  const [i, setI] = useState(0);
  const s = STEP_SCREENS[i];
  return (
    <>
      <div className="id__stephead">
        <button type="button" className="po__icon" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Back"><span aria-hidden="true">←</span></button>
        <RiderBar value={(i + 1) / STEP_SCREENS.length} label={s.title} assetBase={assetBase} />
      </div>
      <p className="po__section">Religious practice</p>
      <h1 className="po__title">{s.title}</h1>
      <div className="po__fields">
        {s.fields.map((f) => (
          <div className="po__field" key={f}>
            <span className="po__label">{f}</span>
            <span className="po__input id__blank" aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="id__actions">
        <button type="button" className="po__btn po__btn--primary" onClick={() => setI(i < STEP_SCREENS.length - 1 ? i + 1 : 0)}>{i < STEP_SCREENS.length - 1 ? "Save and continue" : "Start again"}</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 3. intro slides

const SLIDES = [
  { title: "More yajmans, closer to home", body: "Families near you find verified pandits for their pujas." },
  { title: "Your time, your calendar", body: "Tell us when you are free. You decide which days you work." },
  { title: "A verified badge builds trust", body: "Complete your profile, recite a shloka, and get the verified tick." },
];

function Intro({ assetBase }: { assetBase: string }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  return (
    <>
      <RiderBar value={(i + 1) / SLIDES.length} label="Introduction" assetBase={assetBase} />
      <div className="id__center id__slide">
        <Turning size={230} assetBase={assetBase} />
        <h1 className="po__title" key={i}>{s.title}</h1>
        <p className="po__intro">{s.body}</p>
        <div className="id__actions">
          {i > 0 && <button type="button" className="po__btn" onClick={() => setI(i - 1)}>Back</button>}
          <button type="button" className="po__btn po__btn--primary" onClick={() => setI(i < 2 ? i + 1 : 0)}>{i < 2 ? "Next" : "Start again"}</button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 4. sign-in

function SignIn({ assetBase }: { assetBase: string }) {
  const [state, setState] = useState<"typing" | "checking" | "ok">("typing");
  useEffect(() => {
    if (state !== "checking") return;
    const id = setTimeout(() => setState("ok"), 900);
    return () => clearTimeout(id);
  }, [state]);
  return (
    <>
      <div className={`id__pulse${state === "ok" ? " is-on" : ""}`}><GlowLogo size={92} assetBase={assetBase} /></div>
      <h1 className="po__title">{state === "ok" ? "Mobile number verified" : "Enter the code"}</h1>
      <p className="po__intro">{state === "ok" ? "One more step: add your email." : "Sent to +91 9876543210."}</p>
      <div className="po__fields">
        {state !== "ok" && (
          <div className="po__field">
            <label className="po__label" htmlFor="id-otp">6-digit code</label>
            <input id="id-otp" className="po__input po__input--otp" defaultValue="123456" inputMode="numeric" maxLength={6} />
          </div>
        )}
        {state === "ok"
          ? <button type="button" className="po__btn" onClick={() => setState("typing")}>Play again</button>
          : <button type="button" className="po__btn po__btn--primary" disabled={state === "checking"} onClick={() => setState("checking")}>{state === "checking" ? "Verifying…" : "Verify"}</button>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 5. get verified

function Verify({ assetBase }: { assetBase: string }) {
  const [state, setState] = useState<"ready" | "recording" | "checking" | "passed">("ready");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (state !== "recording") return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  if (state === "passed")
    return (
      <div className="id__moment" role="status">
        <LotusMark assetBase={assetBase} />
        <h2 className="po__title">Your recitation passed</h2>
        <p className="po__intro">You now have the verified tick.</p>
        <div className="id__actions"><button type="button" className="po__btn" onClick={() => setState("ready")}>Start again</button></div>
      </div>
    );

  return (
    <>
      <h1 className="po__title">Get verified</h1>
      <p className="po__intro">Gayatri Mantra</p>
      <div className="po__fields">
        <div className={`po__camera id__camera is-${state}`}>
          <div className="po__camsample"><span aria-hidden="true" /></div>
          {state === "recording" && <span className="po__rec" role="status"><i aria-hidden="true" />Recording · {seconds} s</span>}
          {state === "checking" && (
            <div className="id__checking" role="status">
              <Turning size={150} assetBase={assetBase} />
              Your recitation is being checked
            </div>
          )}
        </div>
        <div className="id__actions">
          {state === "ready" && <button type="button" className="po__btn po__btn--primary" onClick={() => setState("recording")}><span className="po__recdot" aria-hidden="true" />Start recording</button>}
          {state === "recording" && <button type="button" className="po__btn po__btn--primary" onClick={() => setState("checking")}>Stop and submit</button>}
          {state === "checking" && <button type="button" className="po__btn po__btn--primary" onClick={() => setState("passed")}>Demo: reviewer marks it passed</button>}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 6. waiting states

function Waiting({ assetBase }: { assetBase: string }) {
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!saving) return;
    const id = setTimeout(() => setSaving(false), 2600);
    return () => clearTimeout(id);
  }, [saving]);
  return (
    <>
      <div className="id__center id__loading">
        <Turning size={190} assetBase={assetBase} />
        <p className="po__intro" role="status">Loading your profile…</p>
      </div>
      <h2 className="po__h2">In a button</h2>
      <div className="id__actions">
        <button type="button" className="po__btn po__btn--primary" disabled={saving} onClick={() => setSaving(true)}>
          {saving && <Turning size={26} assetBase={assetBase} plain />}
          {saving ? "Saving…" : "Save and continue"}
        </button>
      </div>
      <h2 className="po__h2">In a list row</h2>
      <ul className="po__hub">
        <li>
          <div className="po__tile">
            <Turning size={40} assetBase={assetBase} />
            <span className="po__tiletext"><strong>ID document</strong><small>Uploading your photo…</small></span>
          </div>
        </li>
      </ul>
    </>
  );
}
