"use client";

// Ideation sketches — NOT part of the pandit app. These show how the lotus, glow and
// mandala could appear along the pandit's journey, so the ideas can be judged by eye.
// It borrows the pandit app's styles for a matching look but changes none of its code.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import LotusMark from "../web/LotusMark";
import "../web/logo-reveal.css";
import "../pandit-app/web/pandit-app.css";
import "./ideation.css";

type Props = { theme?: "light" | "dark"; assetBase?: string };

// Back-to-front, as in the logo itself.
const LAYERS = ["base-left", "base-right", "side-left", "side-right", "upper-left", "upper-right", "top", "big-left", "big-right"] as const;
type Petal = (typeof LAYERS)[number];

// Each thing the pandit completes opens one petal: big petals first, like the logo reveal.
const STEPS: { id: string; title: string; summary: string; petal: Petal; required?: boolean }[] = [
  { id: "personal", title: "Personal", summary: "Name, photo, gender and date of birth", petal: "big-left", required: true },
  { id: "address", title: "Address", summary: "Where you live", petal: "big-right", required: true },
  { id: "practice", title: "Religious practice", summary: "Experience, languages, pujas and tradition", petal: "top" },
  { id: "area", title: "Service area", summary: "Where you travel for pujas", petal: "upper-left" },
  { id: "availability", title: "Your availability", summary: "The days and times you take bookings", petal: "upper-right" },
  { id: "bank", title: "Bank or UPI details", summary: "Where payments are sent", petal: "side-left" },
  { id: "id", title: "ID document", summary: "A photo of any one ID", petal: "side-right" },
  { id: "verify", title: "Get verified", summary: "Recite a shloka for the verified tick", petal: "base-left" },
];
const SUBMIT_PETAL: Petal = "base-right";

const SPARKS = [[-0.62, -0.3], [0.58, -0.36], [-0.4, 0.42], [0.66, 0.2], [0.08, -0.7], [-0.72, 0.08], [0.36, 0.5]];

/** The pandit's own lotus: the kalash is always there, and each petal opens when its step is done. */
function ProgressLotus({ open, glow, size, assetBase }: { open: Petal[]; glow?: boolean; size: number; assetBase: string }) {
  return (
    <div className={`id__lotus${glow ? " is-glowing" : ""}`} style={{ "--id-size": `${size}px` } as CSSProperties} role="img" aria-label={`${open.length} of 9 petals open`}>
      <img className="id__glow" src={`${assetBase}/glow.png`} alt="" />
      {LAYERS.map((p) => <img key={p} className={`id__petal id__petal--${p}${open.includes(p) ? " is-open" : ""}`} src={`${assetBase}/petal-${p}.png`} alt="" />)}
      <img className="id__petal id__petal--kalash is-open" src={`${assetBase}/kalash.png`} alt="" />
      {/* a few sparkles burst each time another petal opens, and stay lit once verified */}
      <span className="id__sparks" key={glow ? "glow" : open.length} aria-hidden="true">
        {(open.length > 0 || glow) && SPARKS.map(([x, y], i) => <i key={i} style={{ "--x": x, "--y": y, "--d": `${i * 60}ms` } as CSSProperties} />)}
      </span>
    </div>
  );
}

/** The mandala ring turning slowly: the waiting state, in place of a spinner. */
function Turning({ size, assetBase, children }: { size: number; assetBase: string; children?: ReactNode }) {
  return (
    <span className="id__turning" style={{ width: size, height: size }} aria-hidden="true">
      <i style={{ "--id-mask": `url(${assetBase}/mandala-outer.png)` } as CSSProperties} />
      <i style={{ "--id-mask": `url(${assetBase}/mandala-inner.png)` } as CSSProperties} />
      {children}
    </span>
  );
}

const IDEAS = [
  ["progress", "Lotus as progress"],
  ["intro", "Intro slides"],
  ["signin", "Sign-in"],
  ["verify", "Get verified"],
  ["waiting", "Waiting states"],
] as const;
type Idea = (typeof IDEAS)[number][0];

const WHY: Record<Idea, string> = {
  progress: "The pandit's own lotus replaces the plain bar. Tap a section to complete it and watch a petal open. Submitting opens the last petal with the full bloom; approval lights the glow and it stays lit.",
  intro: "The three slides become the bloom: the kalash, then the big petals, then the whole lotus. Moving through the slides is the animation.",
  signin: "A single soft pulse of light when the code is accepted. No celebration, just a clear \"that worked\".",
  verify: "A breathing gold ring while recording, the turning mandala while the team checks, and the full bloom when the recitation passes.",
  waiting: "Anywhere the app waits, the mandala turns slowly in place of a spinner.",
};

export default function Ideation({ theme = "dark", assetBase = "/logo-reveal" }: Props) {
  const [idea, setIdea] = useState<Idea>("progress");
  return (
    <div className={`po po--${theme} id`}>
      <div className="id__head">
        <p className="id__tag">Ideation sketch · not in the app</p>
        <div className="po__chips" role="tablist">
          {IDEAS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={k === idea} className={`po__chip${k === idea ? " is-on" : ""}`} onClick={() => setIdea(k)}>{label}</button>)}
        </div>
        <p className="po__hint">{WHY[idea]}</p>
      </div>
      <div className="id__body" key={idea}>
        {idea === "progress" && <Progress assetBase={assetBase} />}
        {idea === "intro" && <Intro assetBase={assetBase} />}
        {idea === "signin" && <SignIn assetBase={assetBase} />}
        {idea === "verify" && <Verify assetBase={assetBase} />}
        {idea === "waiting" && <Waiting assetBase={assetBase} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 1. the lotus as progress

function Progress({ assetBase }: { assetBase: string }) {
  const [done, setDone] = useState<string[]>([]);
  const [stage, setStage] = useState<"editing" | "blooming" | "submitted" | "verified">("editing");
  const open: Petal[] = [...STEPS.filter((s) => done.includes(s.id)).map((s) => s.petal), ...(stage === "editing" ? [] : [SUBMIT_PETAL])];
  const ready = STEPS.filter((s) => s.required).every((s) => done.includes(s.id));
  useEffect(() => {
    if (stage !== "blooming") return;
    const id = setTimeout(() => setStage("submitted"), 3400);
    return () => clearTimeout(id);
  }, [stage]);

  if (stage === "blooming")
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
        <ProgressLotus open={stage === "editing" ? open : [...LAYERS]} glow={stage === "verified"} size={104} assetBase={assetBase} />
        <div>
          <div className="po__bannerhead">
            <h2>{stage === "editing" ? "Complete your profile" : "Your profile"}</h2>
            <span className={`po__pill${stage === "verified" ? " is-good" : ""}`}>{stage === "verified" ? "Verified" : stage === "submitted" ? "Submitted" : "Not submitted"}</span>
          </div>
          <p>
            {stage === "verified" ? "Your profile is verified. Your lotus stays lit."
              : stage === "submitted" ? "Your profile is with our team."
              : ready ? "The required details are in. Submit for review, or add more first."
              : "Each section you complete opens a petal."}
          </p>
        </div>
      </section>

      {stage === "editing" ? (
        <>
          <h2 className="po__h2">Tap a section to complete it</h2>
          <ul className="po__hub">
            {STEPS.map((s) => {
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
            <button type="button" className="po__btn po__btn--primary" disabled={!ready} onClick={() => setStage("blooming")}>Submit for review</button>
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

// ---------------------------------------------------------------- 2. intro slides

const SLIDES = [
  { title: "More yajmans, closer to home", body: "Families near you find verified pandits for their pujas.", open: [] as Petal[] },
  { title: "Your time, your calendar", body: "Tell us when you are free. You decide which days you work.", open: ["big-left", "big-right", "top"] as Petal[] },
  { title: "A verified badge builds trust", body: "Complete your profile, recite a shloka, and get the verified tick.", open: [...LAYERS] as Petal[] },
];

function Intro({ assetBase }: { assetBase: string }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  return (
    <div className="id__center">
      <ProgressLotus open={s.open} glow={i === 2} size={210} assetBase={assetBase} />
      <h1 className="po__title">{s.title}</h1>
      <p className="po__intro">{s.body}</p>
      <div className="po__dots" aria-hidden="true">{SLIDES.map((_, k) => <i key={k} className={k === i ? "is-on" : ""} />)}</div>
      <div className="id__actions">
        {i > 0 && <button type="button" className="po__btn" onClick={() => setI(i - 1)}>Back</button>}
        <button type="button" className="po__btn po__btn--primary" onClick={() => setI(i < 2 ? i + 1 : 0)}>{i < 2 ? "Next" : "Start again"}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 3. sign-in

function SignIn({ assetBase }: { assetBase: string }) {
  const [state, setState] = useState<"typing" | "checking" | "ok">("typing");
  useEffect(() => {
    if (state !== "checking") return;
    const id = setTimeout(() => setState("ok"), 900);
    return () => clearTimeout(id);
  }, [state]);
  return (
    <>
      <div className={`id__pulse${state === "ok" ? " is-on" : ""}`}><img src={`${assetBase}/logo.png`} alt="" /></div>
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

// ---------------------------------------------------------------- 4. get verified

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
            <div className="po__checking id__checking" role="status">
              <Turning size={120} assetBase={assetBase}><img src={`${assetBase}/kalash.png`} alt="" /></Turning>
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

// ---------------------------------------------------------------- 5. waiting states

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
        <Turning size={150} assetBase={assetBase}><img src={`${assetBase}/kalash.png`} alt="" /></Turning>
        <p className="po__intro" role="status">Loading your profile…</p>
      </div>
      <h2 className="po__h2">In a button</h2>
      <div className="id__actions">
        <button type="button" className="po__btn po__btn--primary" disabled={saving} onClick={() => setSaving(true)}>
          {saving && <Turning size={26} assetBase={assetBase} />}
          {saving ? "Saving…" : "Save and continue"}
        </button>
      </div>
      <h2 className="po__h2">In a list row</h2>
      <ul className="po__hub">
        <li>
          <div className="po__tile">
            <Turning size={26} assetBase={assetBase} />
            <span className="po__tiletext"><strong>ID document</strong><small>Uploading your photo…</small></span>
          </div>
        </li>
      </ul>
    </>
  );
}
