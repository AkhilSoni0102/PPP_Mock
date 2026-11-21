"use client";

// ProPoojaPaath — pandit onboarding for the website (React / Next.js).
//
//   sign in (Google + mobile code, in either order)
//   → Personal → Address → review → submit
//   → recitation check (can be skipped; the profile stays a draft until it passes)
//   → "Complete your profile": the remaining sections in small steps, in any order
//
// What is asked lives in ../shared/schema.ts; the flow lives in ../shared/useOnboarding.ts.
// Needs: ../../web/LotusMark.tsx and logo-reveal.css (for the lotus on the
// "submitted" screen) and the PNGs from assets/ in public/logo-reveal/.

import { useEffect, useRef, useState, type ReactNode } from "react";
import LotusMark from "../../web/LotusMark";
import "../../web/logo-reveal.css";
import "./pandit-onboarding.css";
import { DAYS, SLOTS, SLOT_SHORT, Field, L, Opt, display, isDate, isRequired, pad, visibleFields } from "../shared/schema";
import { Onboarding, OnboardingProps, useOnboarding } from "../shared/useOnboarding";

type Props = OnboardingProps & {
  /** Folder the PNGs are served from. */
  assetBase?: string;
};

export default function PanditOnboarding({ assetBase = "/logo-reveal", ...props }: Props) {
  const o = useOnboarding(props);
  const { t, ui, view } = o;
  const theme = props.theme ?? "light";
  const [code, setCode] = useState("");
  const viewKey = view.kind + ("stage" in view ? view.stage : "") + ("index" in view ? view.index : "") + ("id" in view ? view.id : "");

  // Move focus to the new screen's heading so keyboard and screen-reader users follow along.
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    heading.current?.focus();
    setCode("");
  }, [viewKey]);

  let title = "";
  let intro: string | undefined;
  if (view.kind === "signin") {
    const afterGoogle = !!o.account.googleVerified;
    const pair: [L, L] =
      view.stage === "choose" ? [ui.signInTitle, ui.signInIntro]
      : view.stage === "google" ? [ui.googleTitle, ui.googleIntro]
      : view.stage === "otp" ? [ui.otpTitle, ui.otpIntro]
      : afterGoogle ? [ui.phoneNextTitle, ui.phoneNextIntro] : [ui.phoneTitle, ui.phoneIntro];
    title = t(pair[0]);
    intro = t(pair[1], { phone: o.signIn.phone, email: o.account.email ?? "" });
  } else if (o.step) {
    title = t(o.step.title);
    intro = o.step.intro && t(o.step.intro);
  } else if (view.kind === "review") {
    title = t(ui.reviewTitle); intro = t(ui.reviewIntro);
  } else if (view.kind === "recitation") {
    title = t(ui.recTitle); intro = t(ui.recIntro);
  } else if (view.kind === "hub") {
    title = t(ui.hubTitle); intro = t(o.progress === 1 ? ui.hubAllDone : ui.hubIntro);
  } else {
    title = t(ui.submittedTitle, { name: o.firstName });
    intro = t(o.profileStatus === "aiVerified" ? ui.doneVerified : o.profileStatus === "reviewRequested" ? ui.doneReview : ui.doneDraft);
  }

  // The one main button under the screen, when the screen has one.
  const primary: { label: L; busyLabel?: L; act: () => void } | null =
    view.kind === "signin" && view.stage === "phone" ? { label: ui.sendCode, busyLabel: ui.sending, act: o.signIn.sendCode }
    : view.kind === "signin" && view.stage === "otp" ? { label: ui.verify, busyLabel: ui.verifying, act: () => o.signIn.verifyCode(code) }
    : view.kind === "review" ? { label: ui.submit, busyLabel: ui.submitting, act: o.submit }
    : view.kind === "section" && view.index === o.steps.length - 1 ? { label: ui.save, busyLabel: ui.saving, act: o.next }
    : view.kind === "wizard" && (view.fromReview || view.index === o.steps.length - 1) ? { label: ui.review, act: o.next }
    : o.step ? { label: ui.next, act: o.next }
    : null;

  const inProfile = view.kind === "hub" || view.kind === "section" || (view.kind === "recitation" && view.from === "hub");
  const recStatus = o.profileStatus === "aiVerified" ? "done" : o.submitted && view.kind === "recitation" ? "started" : "empty";
  const path = inProfile
    ? [
        { id: "recitation", title: ui.recitation, summary: ui.recitationSummary, status: recStatus, current: view.kind === "recitation" },
        ...o.profileSections.map((s) => ({ id: s.id, title: s.title, summary: s.summary, status: o.statusOf(s), current: o.section?.id === s.id })),
      ]
    : [
        { id: "signin", title: ui.signIn, summary: ui.signInSummary, status: o.signedIn ? "done" : "started", current: view.kind === "signin" },
        ...o.onboardingSections.map((s) => ({
          id: s.id, title: s.title, summary: s.summary,
          status: o.submitted ? "done" : o.statusOf(s),
          current: view.kind === "wizard" && s.steps.includes(o.step!),
        })),
        { id: "recitation", title: ui.recitation, summary: ui.recitationSummary, status: recStatus, current: view.kind === "recitation" },
      ];

  return (
    <div className={`po po--${theme}`} lang={o.lang}>
      <div className="po__frame">
        <aside className="po__side">
          <div className="po__brand">
            <img src={`${assetBase}/logo.png`} alt="" />
            <span>{t(ui.brand)}</span>
          </div>
          <ol className="po__path">
            {path.map((p) => (
              <li key={p.id} className={`po__pathitem is-${p.status}${p.current ? " is-current" : ""}`} aria-current={p.current ? "step" : undefined}>
                <span className="po__dot" aria-hidden="true" />
                <span>
                  <strong>{t(p.title)}</strong>
                  <small>{t(p.summary)}</small>
                </span>
              </li>
            ))}
          </ol>
          {(o.account.phoneVerified || o.account.googleVerified) && (
            <dl className="po__account">
              {o.account.phoneVerified && <div><dt>{t(ui.mobile)}</dt><dd>+91 {o.account.phone} <span>{t(ui.verified)}</span></dd></div>}
              {o.account.googleVerified && <div><dt>{t(ui.gmail)}</dt><dd>{o.account.email} <span>{t(ui.verified)}</span></dd></div>}
            </dl>
          )}
        </aside>

        <main className="po__main">
          <header className="po__top">
            <img className="po__toplogo" src={`${assetBase}/logo.png`} alt="" />
            <div className="po__bar" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(o.progress * 100)}>
              <span style={{ transform: `scaleX(${o.progress})` }} />
            </div>
            <button type="button" className="po__lang" onClick={() => o.setLang(o.lang === "en" ? "hi" : "en")} lang={o.lang === "en" ? "hi" : "en"}>
              {t(ui.language)}
            </button>
          </header>

          <form className="po__body" noValidate onSubmit={(e) => { e.preventDefault(); primary?.act(); }}>
            <div className="po__screen" key={viewKey}>
              {view.kind === "done" && (
                <div className="po__lotus" aria-hidden="true">
                  <LotusMark assetBase={assetBase} />
                </div>
              )}
              {o.section && <p className="po__section">{t(o.section.title)}</p>}
              <h1 className="po__title" tabIndex={-1} ref={heading}>{title}</h1>
              {intro && <p className="po__intro">{intro}</p>}

              {view.kind === "signin" && <SignIn o={o} code={code} setCode={setCode} />}

              {o.step && (
                <div className="po__fields">
                  {visibleFields(o.step, o.values).map((f) => (
                    <FieldRow key={f.id} f={f} o={o} props={props} />
                  ))}
                </div>
              )}

              {view.kind === "review" && <Review o={o} />}
              {view.kind === "recitation" && <Recitation o={o} />}
              {view.kind === "hub" && <Hub o={o} />}
              {view.kind === "done" && (
                <>
                  <p className="po__pill-row"><StatusPill o={o} /></p>
                  <button type="button" className="po__btn po__btn--primary po__btn--center" onClick={o.openHub}>
                    {t(ui.submittedCta)}
                  </button>
                </>
              )}
            </div>

            {primary && (
              <footer className="po__foot">
                {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
                <div className="po__actions">
                  {o.canGoBack && (
                    <button type="button" className="po__btn" onClick={o.back} disabled={o.busy}>{t(ui.back)}</button>
                  )}
                  <button type="submit" className="po__btn po__btn--primary" disabled={o.busy}>
                    {t(o.busy && primary.busyLabel ? primary.busyLabel : primary.label)}
                  </button>
                </div>
              </footer>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}

function StatusPill({ o }: { o: Onboarding }) {
  const { t, ui } = o;
  const s = o.profileStatus;
  return (
    <span className={`po__pill is-${s}`}>
      <span className="po__sr">{t(ui.profileStatus)}: </span>
      {t(s === "aiVerified" ? ui.statusVerified : s === "reviewRequested" ? ui.statusReview : ui.statusDraft)}
    </span>
  );
}

// ---------------------------------------------------------------- sign-in

function SignIn({ o, code, setCode }: { o: Onboarding; code: string; setCode: (x: string) => void }) {
  const { t, ui, view, signIn } = o;
  if (view.kind !== "signin") return null;
  const google = (
    <button type="button" className="po__btn po__btn--wide" onClick={signIn.google} disabled={o.busy}>
      <span className="po__glyph" aria-hidden="true">G</span>
      {t(ui.withGoogle)}
    </button>
  );

  if (view.stage === "choose")
    return (
      <div className="po__fields">
        {google}
        <button type="button" className="po__btn po__btn--wide" onClick={signIn.choosePhone} disabled={o.busy}>
          <span className="po__glyph" aria-hidden="true">#</span>
          {t(ui.withPhone)}
        </button>
        {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
      </div>
    );

  if (view.stage === "google")
    return (
      <div className="po__fields">
        {google}
        {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
      </div>
    );

  if (view.stage === "phone")
    return (
      <div className="po__fields">
        <div className={`po__field${signIn.error ? " has-error" : ""}`}>
          <label className="po__label" htmlFor="po-phone">{t(ui.phoneLabel)}</label>
          <div className="po__phone">
            <span aria-hidden="true">+91</span>
            <input
              id="po-phone"
              className="po__input"
              inputMode="numeric"
              autoComplete="tel-national"
              value={signIn.phone}
              aria-invalid={!!signIn.error}
              onChange={(e) => signIn.setPhone(e.target.value)}
            />
          </div>
          {signIn.error && <p className="po__error" role="alert">{t(signIn.error)}</p>}
        </div>
      </div>
    );

  return (
    <div className="po__fields">
      <div className={`po__field${signIn.error ? " has-error" : ""}`}>
        <label className="po__label" htmlFor="po-otp">{t(ui.otpLabel)}</label>
        <input
          id="po-otp"
          className="po__input po__input--otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          aria-invalid={!!signIn.error}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); signIn.clearError(); }}
        />
        {signIn.error && <p className="po__error" role="alert">{t(signIn.error)}</p>}
      </div>
      <button type="button" className="po__link" onClick={signIn.sendCode} disabled={signIn.resendIn > 0 || o.busy}>
        {signIn.resendIn > 0 ? t(ui.resendIn, { n: signIn.resendIn }) : t(ui.resend)}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- recitation check

/** Camera and recorder. Falls back to a labelled sample preview where no camera is available. */
function useRecorder() {
  const [mode, setMode] = useState<"off" | "live" | "recording" | "recorded">("off");
  const [sample, setSample] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const live = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const blob = useRef<Blob | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  const attach = () => { if (live.current && stream.current) live.current.srcObject = stream.current; };
  useEffect(attach, [mode]);

  const stop = () => {
    stopTimer();
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    setMode("recorded");
  };
  const record = () => {
    blob.current = null;
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setSeconds(0);
    if (stream.current && typeof MediaRecorder !== "undefined") {
      const chunks: BlobPart[] = [];
      const r = new MediaRecorder(stream.current);
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        if (recorder.current !== r) return; // a restart replaced this recording
        blob.current = new Blob(chunks, { type: r.mimeType });
        setUrl(URL.createObjectURL(blob.current));
      };
      recorder.current = r;
      r.start();
    }
    stopTimer();
    timer.current = setInterval(() => setSeconds((n) => (n >= 59 ? (stop(), 60) : n + 1)), 1000);
    setMode("recording");
  };
  const start = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      setSample(false);
    } catch {
      setSample(true); // no camera, or permission refused
    }
    setMode("live");
  };
  const restart = () => {
    const r = recorder.current;
    recorder.current = null;
    if (r && r.state !== "inactive") r.stop();
    record();
  };
  const off = () => {
    stopTimer();
    recorder.current = null;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
  };
  useEffect(() => off, []);

  return { mode, sample, seconds, url, live, start, record, stop, restart, recording: () => blob.current, toLive: () => setMode("live") };
}

function Recitation({ o }: { o: Onboarding }) {
  const { t, ui, view } = o;
  const r = o.recitation;
  const cam = useRecorder();
  const left = t(ui.attemptsLeft, { n: r.attemptsLeft, max: r.maxAttempts });
  const fromHub = view.kind === "recitation" && view.from === "hub";
  const leaveLink = fromHub ? (
    <button type="button" className="po__link po__link--center" onClick={o.back}>{t(ui.back)}</button>
  ) : (
    <div className="po__skip">
      <button type="button" className="po__link" onClick={r.leave}>{t(ui.skip)}</button>
      <p className="po__hint">{t(ui.skipNote)}</p>
    </div>
  );

  if (r.phase === "passed" || r.phase === "reviewRequested")
    return (
      <div className="po__result is-good" role="status">
        <strong>{t(r.phase === "passed" ? ui.passedTitle : ui.statusReview)}</strong>
        <p>{t(r.phase === "passed" ? ui.passedBody : ui.reviewRequested)}</p>
        {r.phase === "passed" && r.score != null && <p className="po__score">{t(ui.match, { n: Math.round(r.score) })}</p>}
        <button type="button" className="po__btn po__btn--primary po__btn--center" onClick={r.leave}>{t(ui.continue)}</button>
      </div>
    );

  if (r.phase === "blocked")
    return (
      <>
        <div className="po__result is-bad" role="status">
          <strong>{t(ui.blockedTitle)}</strong>
          <p>{t(ui.blockedBody, { max: r.maxAttempts })}</p>
          {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
          <button type="button" className="po__btn po__btn--primary po__btn--center" onClick={r.requestReview} disabled={o.busy}>{t(ui.requestReview)}</button>
        </div>
        {leaveLink}
      </>
    );

  if (r.phase === "failed")
    return (
      <>
        <div className="po__result is-bad" role="status">
          <strong>{t(ui.failedTitle)}</strong>
          <p>{t(ui.failedBody)}</p>
          {r.score != null && <p className="po__score">{t(ui.match, { n: Math.round(r.score) })} · {left}</p>}
          <button type="button" className="po__btn po__btn--primary po__btn--center" onClick={() => { r.retry(); cam.toLive(); }}>{t(ui.tryAgain)}</button>
        </div>
        {leaveLink}
      </>
    );

  const checking = r.phase === "checking";
  return (
    <div className="po__fields">
      <div className="po__field">
        <label className="po__label" htmlFor="po-shloka">{t(ui.shloka)}</label>
        <select id="po-shloka" className="po__input" value={r.shlokaId} disabled={checking || cam.mode === "recording"} onChange={(e) => r.setShlokaId(e.target.value)}>
          <option value="">{t(ui.chooseShloka)}</option>
          {r.shlokas.map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
        </select>
      </div>

      <div className={`po__camera is-${cam.mode}${checking ? " is-checking" : ""}`}>
        {cam.mode === "off" && <p>{t(ui.cameraOff)}</p>}
        {cam.mode !== "off" && !cam.sample && (cam.mode === "recorded" && cam.url
          ? <video key="playback" src={cam.url} controls playsInline />
          : <video key="live" ref={cam.live} autoPlay muted playsInline />)}
        {cam.mode !== "off" && cam.sample && (
          <div className="po__camsample">
            <span aria-hidden="true" />
            <p>{t(ui.cameraSample)}</p>
          </div>
        )}
        {cam.mode === "recording" && <span className="po__rec" role="status"><i aria-hidden="true" />{t(ui.recording)} · {t(ui.seconds, { n: cam.seconds })}</span>}
        {cam.mode === "recorded" && !checking && <span className="po__rec is-ready" role="status">{t(ui.recorded)} · {t(ui.seconds, { n: cam.seconds })}</span>}
        {checking && <div className="po__checking" role="status"><i aria-hidden="true" />{t(ui.checking)}</div>}
      </div>

      {!checking && (
        <div className="po__actions">
          {cam.mode === "off" && <button type="button" className="po__btn po__btn--primary" onClick={cam.start} disabled={!r.shlokaId}>{t(ui.startCamera)}</button>}
          {cam.mode === "live" && <button type="button" className="po__btn po__btn--primary" onClick={cam.record} disabled={!r.shlokaId}><span className="po__recdot" aria-hidden="true" />{t(ui.startRecording)}</button>}
          {cam.mode === "recording" && (
            <>
              <button type="button" className="po__btn" onClick={cam.restart}>{t(ui.restart)}</button>
              <button type="button" className="po__btn po__btn--primary" onClick={cam.stop}>{t(ui.stop)}</button>
            </>
          )}
          {cam.mode === "recorded" && (
            <>
              <button type="button" className="po__btn" onClick={cam.restart}>{t(ui.restart)}</button>
              <button type="button" className="po__btn po__btn--primary" onClick={() => r.submit(cam.recording())}>{t(ui.submitRecording)}</button>
            </>
          )}
        </div>
      )}
      {!r.shlokaId && <p className="po__hint">{t(ui.chooseFirst)}</p>}
      {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
      <p className="po__hint">{left}</p>
      {!checking && cam.mode !== "recording" && leaveLink}
    </div>
  );
}

// ---------------------------------------------------------------- review and profile screens

function Review({ o }: { o: Onboarding }) {
  const { t, ui } = o;
  return (
    <div className="po__review">
      <section className="po__card">
        <dl>
          <div><dt>{t(ui.mobile)}</dt><dd>+91 {o.account.phone} · {t(ui.verified)}</dd></div>
          <div><dt>{t(ui.gmail)}</dt><dd>{o.account.email} · {t(ui.verified)}</dd></div>
        </dl>
      </section>
      {o.wizardSteps.map((step) => (
        <section key={step.id} className="po__card">
          <dl>
            {visibleFields(step, o.values).map((f) => (
              <div key={f.id}>
                <dt>{t(f.label)}</dt>
                <dd>{display(f, o.values, o.lang) || "—"}</dd>
              </div>
            ))}
          </dl>
          <button type="button" className="po__link" onClick={() => o.editStep(step.id)}>
            {t(ui.edit)}<span className="po__sr"> {t(step.title)}</span>
          </button>
        </section>
      ))}
    </div>
  );
}

function Hub({ o }: { o: Onboarding }) {
  const { t, ui } = o;
  const rec = o.profileStatus === "aiVerified" ? "done" : o.profileStatus === "reviewRequested" ? "started" : "empty";
  const tile = (key: string, status: string, title: L, summary: L, statusText: string, open: () => void) => (
    <li key={key}>
      <button type="button" className={`po__tile is-${status}`} onClick={open}>
        <span className="po__dot" aria-hidden="true" />
        <span className="po__tiletext">
          <strong>{t(title)}</strong>
          <small>{t(summary)}</small>
          <small className="po__status">{statusText}</small>
        </span>
      </button>
    </li>
  );
  return (
    <>
      <p className="po__pill-row po__pill-row--left"><StatusPill o={o} /></p>
      <ul className="po__hub">
        {tile("recitation", rec, ui.recitation, ui.recitationSummary,
          t(rec === "done" ? ui.statusVerified : rec === "started" ? ui.statusReview : ui.empty), o.openRecitation)}
        {o.profileSections.map((s) => {
          const status = o.statusOf(s);
          return tile(s.id, status, s.title, s.summary, t(ui[status]), () => o.openSection(s.id));
        })}
      </ul>
    </>
  );
}

// ---------------------------------------------------------------- one field

function FieldRow({ f, o, props }: { f: Field; o: Onboarding; props: OnboardingProps }) {
  const { t, ui, values, setValue } = o;
  const value = values[f.id];
  const error = o.errors[f.id];
  const id = `po-${f.id}`;
  const describedBy = [f.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const set = (x: any) => setValue(f.id, x);
  const options: Opt[] = f.options ?? [];
  const grouped = !["text", "textarea", "select"].includes(f.type);

  let control: ReactNode = null;

  if (f.type === "text") {
    control = (
      <input
        id={id}
        className="po__input"
        value={value ?? ""}
        maxLength={f.maxLength}
        inputMode={f.keyboard === "number" ? "numeric" : f.keyboard === "email" ? "email" : undefined}
        autoCapitalize={f.capitalize ?? "sentences"}
        autoComplete={f.sensitive ? "off" : undefined}
        placeholder={f.placeholder && t(f.placeholder)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => {
          let x = e.target.value;
          if (f.keyboard === "number") x = x.replace(/\D/g, "");
          if (f.capitalize === "characters") x = x.toUpperCase();
          set(x);
        }}
      />
    );
  } else if (f.type === "textarea") {
    control = (
      <>
        <textarea
          id={id}
          className="po__input po__input--area"
          rows={5}
          value={value ?? ""}
          maxLength={f.maxLength}
          placeholder={f.placeholder && t(f.placeholder)}
          aria-describedby={describedBy}
          onChange={(e) => set(e.target.value)}
        />
        {f.maxLength && <p className="po__count">{t(ui.left, { n: f.maxLength - (value?.length ?? 0) })}</p>}
      </>
    );
  } else if (f.type === "select") {
    control = (
      <select id={id} className="po__input" value={value ?? ""} aria-invalid={!!error} aria-describedby={describedBy} onChange={(e) => set(e.target.value)}>
        <option value="">{t(ui.choose)}</option>
        {options.map((op) => <option key={op.value} value={op.value}>{t(op.label)}</option>)}
      </select>
    );
  } else if (f.type === "choice" || f.type === "multi") {
    const many = f.type === "multi";
    const list: string[] = many ? value ?? [] : [];
    control = (
      <div className="po__chips">
        {options.map((op) => {
          const on = many ? list.includes(op.value) : value === op.value;
          return (
            <button
              key={op.value}
              type="button"
              className={`po__chip${on ? " is-on" : ""}`}
              aria-pressed={on}
              onClick={() => set(many ? (on ? list.filter((x) => x !== op.value) : [...list, op.value]) : op.value)}
            >
              {t(op.label)}
            </button>
          );
        })}
      </div>
    );
  } else if (f.type === "date") {
    control = <DateInput id={id} value={value} onChange={set} o={o} invalid={!!error} />;
  } else if (f.type === "tags") {
    control = <Tags f={f} id={id} value={value ?? []} onChange={set} o={o} />;
  } else if (f.type === "image") {
    const pick = async () => { const uri = await props.pickImage(f.variant ?? "document"); if (uri) set(uri); };
    control =
      f.variant === "avatar" ? (
        <div className="po__avatar">
          <span className="po__avatarimg">{value ? <img src={value} alt="" /> : <span aria-hidden="true">{(values.fullName || "?").trim().charAt(0)}</span>}</span>
          <button type="button" className="po__btn po__btn--small" onClick={pick}>{t(value ? ui.changePhoto : ui.addPhoto)}</button>
        </div>
      ) : (
        <button type="button" className={`po__drop${value ? " has-image" : ""}`} onClick={pick} aria-describedby={describedBy}>
          {value && <img src={value} alt="" />}
          <span>{t(value ? ui.retake : ui.takePhoto)}</span>
        </button>
      );
  } else if (f.type === "location") {
    const fallback = f.id === "serviceCentre" ? t(ui.fromAddress) : values.pin ? t(ui.fromPin, { pin: values.pin }) : t(ui.notSet);
    const pick = async () => { const p = await props.pickLocation?.(); if (p) set(p); };
    control = (
      <div className="po__place">
        <span>{value ? display(f, values, o.lang) : fallback}</span>
        {props.pickLocation && (
          <button type="button" className="po__btn po__btn--small" onClick={pick}>{t(value ? ui.changeOnMap : ui.setOnMap)}</button>
        )}
      </div>
    );
  } else if (f.type === "week") {
    const week: Record<string, string[]> = value ?? {};
    control = (
      <div className="po__week">
        {DAYS.map((d) => (
          <div key={d.value} className="po__weekrow" role="group" aria-label={t(d.label)}>
            <span>{t(d.label)}</span>
            {SLOTS.map((s) => {
              const list = week[d.value] ?? [];
              const on = list.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  className={`po__chip${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  title={t(s.label)}
                  onClick={() => set({ ...week, [d.value]: on ? list.filter((x) => x !== s.value) : [...list, s.value] })}
                >
                  {t(SLOT_SHORT[s.value])}
                </button>
              );
            })}
          </div>
        ))}
        <p className="po__hint">{SLOTS.map((s) => t(s.label)).join(" · ")}</p>
      </div>
    );
  } else if (f.type === "dateList") {
    control = <DateList f={f} id={id} value={value ?? []} onChange={set} o={o} />;
  }

  const label = (
    <>
      {t(f.label)}
      {o.view.kind === "wizard" && !isRequired(f, values) && !f.hint && <span className="po__optional"> ({t(ui.optional)})</span>}
    </>
  );

  return (
    <div className={`po__field po__field--${f.type}${error ? " has-error" : ""}`} role={grouped ? "group" : undefined} aria-labelledby={grouped ? `${id}-label` : undefined}>
      {grouped ? <span className="po__label" id={`${id}-label`}>{label}</span> : <label className="po__label" htmlFor={id}>{label}</label>}
      {f.hint && <p className="po__hint" id={`${id}-hint`}>{t(f.hint)}</p>}
      {control}
      {f.id === "pin" && o.pinState.status !== "idle" && !error && (
        <p className="po__hint" role="status">
          {o.pinState.status === "looking" ? t(ui.pinLooking) : o.pinState.status === "found" ? t(ui.pinFound, { place: o.pinState.place ?? "" }) : t(ui.pinNotFound)}
        </p>
      )}
      {error && <p className="po__error" id={`${id}-error`} role="alert">{t(error)}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- date, tags, date lists

function DateInput({ id, value, onChange, o, invalid }: { id: string; value?: string; onChange: (x: string) => void; o: Onboarding; invalid?: boolean }) {
  const { t, ui } = o;
  const [parts, setParts] = useState(() => {
    const m = /^(\d*)-(\d*)-(\d*)$/.exec(value ?? "");
    return { d: m?.[3] ?? "", m: m?.[2] ?? "", y: m?.[1] ?? "" };
  });
  const refs = { d: useRef<HTMLInputElement>(null), m: useRef<HTMLInputElement>(null), y: useRef<HTMLInputElement>(null) };
  const update = (key: "d" | "m" | "y", raw: string) => {
    const x = raw.replace(/\D/g, "").slice(0, key === "y" ? 4 : 2);
    const next = { ...parts, [key]: x };
    setParts(next);
    onChange(next.d || next.m || next.y ? `${next.y}-${next.m && pad(next.m)}-${next.d && pad(next.d)}` : "");
    if (key === "d" && x.length === 2) refs.m.current?.focus();
    if (key === "m" && x.length === 2) refs.y.current?.focus();
  };
  const box = (key: "d" | "m" | "y", label: L) => (
    <input
      ref={refs[key]}
      id={key === "d" ? id : undefined}
      className={`po__input po__input--${key === "y" ? "year" : "day"}`}
      inputMode="numeric"
      value={parts[key]}
      placeholder={t(label)}
      aria-label={t(label)}
      aria-invalid={invalid}
      onChange={(e) => update(key, e.target.value)}
    />
  );
  return <div className="po__date">{box("d", ui.day)}{box("m", ui.month)}{box("y", ui.year)}</div>;
}

function Tags({ f, id, value, onChange, o }: { f: Field; id: string; value: string[]; onChange: (x: string[]) => void; o: Onboarding }) {
  const { t, ui } = o;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<L | null>(null);
  const add = () => {
    const x = draft.trim();
    if (!x) return;
    const e = f.validate?.(x, o.values) ?? null;
    setError(e);
    if (e) return;
    if (!value.includes(x)) onChange([...value, x]);
    setDraft("");
  };
  return (
    <>
      <div className="po__tagadd">
        <input
          id={id}
          className="po__input"
          value={draft}
          maxLength={f.maxLength}
          inputMode={f.keyboard === "number" ? "numeric" : undefined}
          placeholder={f.placeholder && t(f.placeholder)}
          aria-label={t(f.label)}
          onChange={(e) => { setDraft(f.keyboard === "number" ? e.target.value.replace(/\D/g, "") : e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button type="button" className="po__btn po__btn--small" onClick={add}>{t(ui.add)}</button>
      </div>
      {error && <p className="po__error" role="alert">{t(error)}</p>}
      {value.length > 0 && (
        <ul className="po__chips">
          {value.map((x) => (
            <li key={x} className="po__chip is-on po__chip--tag">
              {x}
              <button type="button" aria-label={`${t(ui.remove)} ${x}`} onClick={() => onChange(value.filter((y) => y !== x))}>×</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DateList({ f, id, value, onChange, o }: { f: Field; id: string; value: any[]; onChange: (x: any[]) => void; o: Onboarding }) {
  const { t, ui } = o;
  const range = f.mode === "range";
  const patch = (i: number, p: any) => onChange(value.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const keys = useRef<number[]>([]);
  while (keys.current.length < value.length) keys.current.push(Math.random());
  const remove = (i: number) => { keys.current.splice(i, 1); onChange(value.filter((_, j) => j !== i)); };
  return (
    <div className="po__rows">
      {value.map((r, i) => (
        <div key={keys.current[i]} className="po__row">
          {range ? (
            <>
              <label><span>{t(ui.from)}</span><DateInput id={`${id}-${i}-from`} value={r.from} onChange={(x) => patch(i, { from: x })} o={o} invalid={!!r.from && !isDate(r.from)} /></label>
              <label><span>{t(ui.to)}</span><DateInput id={`${id}-${i}-to`} value={r.to} onChange={(x) => patch(i, { to: x })} o={o} invalid={!!r.to && !isDate(r.to)} /></label>
            </>
          ) : (
            <>
              <DateInput id={`${id}-${i}`} value={r.date} onChange={(x) => patch(i, { date: x })} o={o} invalid={!!r.date && !isDate(r.date)} />
              <div className="po__chips">
                <button type="button" className={`po__chip${r.off ? " is-on" : ""}`} aria-pressed={!!r.off} onClick={() => patch(i, { off: !r.off, slots: [] })}>{t(ui.dayOff)}</button>
                {SLOTS.map((s) => {
                  const on = !r.off && (r.slots ?? []).includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      className={`po__chip${on ? " is-on" : ""}`}
                      aria-pressed={on}
                      onClick={() => patch(i, { off: false, slots: on ? r.slots.filter((x: string) => x !== s.value) : [...(r.slots ?? []), s.value] })}
                    >
                      {t(SLOT_SHORT[s.value])}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <button type="button" className="po__link" onClick={() => remove(i)}>{t(ui.remove)}</button>
        </div>
      ))}
      <button type="button" className="po__btn po__btn--small" onClick={() => onChange([...value, range ? { from: "", to: "" } : { date: "", off: true, slots: [] }])}>
        {t(range ? ui.addLeave : ui.addDate)}
      </button>
    </div>
  );
}
