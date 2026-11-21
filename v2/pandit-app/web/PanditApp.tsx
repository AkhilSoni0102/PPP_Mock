"use client";

// ProPoojaPaath pandit app (v2) for the website (React / Next.js).
//
//   logo reveal → 3 intro slides → sign in → add the missing contact
//   → Home (complete-your-profile banner, status, updates, sections, profile menu)
//   → sections in small steps · availability · bank or UPI · ID document · get verified
//   → submit for review
//
// What is asked lives in ../shared/schema.ts; the flow lives in ../shared/usePanditApp.ts.
// Needs ../../web/LogoReveal.tsx, logo-reveal.css and the PNGs from assets/ in public/logo-reveal/.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import LogoReveal from "../../web/LogoReveal";
import LotusMark from "../../web/LotusMark";
import { GlowLogo, RiderBar, Turning } from "./Motion";
import "../../web/logo-reveal.css";
import "./pandit-app.css";
import {
  DAYS, ID_TYPES, INTRO, MAX_RECORDING_SECONDS, SLOTS, SLOT_SHORT, STATUS_LABEL, STATUS_TONE, UPDATE_TEXT,
  Field, L, Opt, Section, display, isDate, isRequired, mask, pad, visibleFields,
} from "../shared/schema";
import { PanditApp as App, PanditAppProps, Place, usePanditApp } from "../shared/usePanditApp";

type Props = PanditAppProps & {
  /** Folder the PNGs are served from. */
  assetBase?: string;
  /** Play the logo reveal before the intro slides. Default true. */
  reveal?: boolean;
  /** Demos only: when no camera is available, show a labelled sample preview and allow a pretend
   *  recording. Leave this off in the real app, where a missing camera must block recording. */
  sampleCamera?: boolean;
};

export default function PanditApp({ assetBase = "/logo-reveal", reveal = true, sampleCamera = false, ...props }: Props) {
  const o = usePanditApp(props);
  const { t, ui, view } = o;
  const theme = props.theme ?? "light";
  const [revealing, setRevealing] = useState(reveal && view.kind === "intro");
  const [code, setCode] = useState("");
  const viewKey = view.kind + ("stage" in view ? view.stage : "") + ("need" in view ? view.need : "") + ("index" in view ? view.index : "") + ("id" in view ? view.id : "") + ("slide" in view ? view.slide : "");

  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    heading.current?.focus();
    setCode("");
  }, [viewKey]);

  // One pulse of light on the logo when a mobile number or Gmail is verified.
  const [pulse, setPulse] = useState(false);
  const contacts = Number(!!o.account.phoneVerified) + Number(!!o.account.googleVerified);
  const lastContacts = useRef(contacts);
  useEffect(() => {
    const grew = contacts > lastContacts.current;
    lastContacts.current = contacts;
    if (!grew) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 1500);
    return () => clearTimeout(id);
  }, [contacts]);

  // Milestones play the full reveal once: the profile is submitted, or the recitation passes.
  const [moment, setMoment] = useState<"submitted" | "passed" | null>(null);
  const lastStatus = useRef(o.status);
  const lastRecitation = useRef(o.recitation.state);
  useEffect(() => {
    const was = lastStatus.current, wasRec = lastRecitation.current;
    lastStatus.current = o.status;
    lastRecitation.current = o.recitation.state;
    const next = o.status === "submitted" && (was === "draft" || was === "changes_requested") ? "submitted"
      : o.recitation.state === "passed" && wasRec !== "passed" ? "passed" : null;
    if (!next) return;
    setMoment(next);
    const id = setTimeout(() => setMoment(null), 3600);
    return () => clearTimeout(id);
  }, [o.status, o.recitation.state]);

  if (revealing)
    return (
      <div className={`po po--${theme}`}>
        <LogoReveal layout="stack" theme={theme} assetBase={assetBase} onComplete={() => setRevealing(false)} />
      </div>
    );

  const phoneStage = (view.kind === "signin" || view.kind === "contact") && view.stage === "otp";
  let title = "";
  let intro: string | undefined;
  switch (view.kind) {
    case "intro": title = t(INTRO[view.slide].title); intro = t(INTRO[view.slide].body); break;
    case "signin": title = t(phoneStage ? ui.otpTitle : ui.signInTitle); intro = phoneStage ? t(ui.otpIntro, { phone: o.signIn.phone }) : t(ui.signInIntro); break;
    case "contact":
      title = t(phoneStage ? ui.otpTitle : view.need === "phone" ? ui.addPhoneTitle : ui.addEmailTitle);
      intro = phoneStage ? t(ui.otpIntro, { phone: o.signIn.phone }) : t(view.need === "phone" ? ui.addPhoneIntro : ui.addEmailIntro, { email: o.account.email ?? "" });
      break;
    case "home": title = o.firstName ? t(ui.namaste, { name: o.firstName }) : t(ui.namasteNoName); break;
    case "section": title = t(o.step!.title); intro = o.step!.intro && t(o.step!.intro); break;
    case "recitation": title = t(ui.getVerified); intro = t(ui.recIntro); break;
    case "language": title = t(ui.chooseLanguage); break;
    case "profile": title = t(ui.myProfile); intro = t(ui.myProfileIntro); break;
    case "account": title = t(ui.myAccount); intro = t(ui.myAccountIntro); break;
    case "help": title = t(ui.help); intro = t(ui.helpIntro); break;
    case "deletion": title = t(ui.deleteAccount); break;
  }

  const inFlow = view.kind === "section";
  const showBack = view.kind !== "home" && !(view.kind === "intro" && view.slide === 0) && !(view.kind === "signin" && view.stage === "main") && !(view.kind === "contact" && view.stage === "main");
  const sending = view.kind === "signin" || view.kind === "contact";

  return (
    <div className={`po po--${theme}`} lang={o.lang}>
      <div className="po__frame">
        {o.signedIn && <Side o={o} assetBase={assetBase} />}

        <main className="po__main">
          <header className="po__top">
            {showBack
              ? <button type="button" className="po__icon" onClick={o.back} aria-label={t(ui.back)}><span aria-hidden="true">←</span></button>
              : <GlowLogo className="po__toplogo" size={34} assetBase={assetBase} pulse={pulse && view.kind === "home"} />}
            {inFlow
              ? <RiderBar value={o.progress} label={title} assetBase={assetBase} />
              : <span className="po__topname">{t(ui.brand)}</span>}
            {(view.kind === "intro" || view.kind === "signin" || view.kind === "home") && (
              <button type="button" className="po__lang" onClick={() => o.go("language")}>{o.languages.find((x) => x.code === o.language)?.name}</button>
            )}
            {o.signedIn && <Menu o={o} />}
          </header>

          {moment ? (
            <div className="po__moment" role="status">
              <LotusMark assetBase={assetBase} />
              <h1 className="po__title">{t(moment === "submitted" ? UPDATE_TEXT.submitted : ui.recPassed)}</h1>
              {moment === "submitted" && <p className="po__intro">{t(ui.bannerLocked)}</p>}
            </div>
          ) : (
          <form className="po__body" noValidate onSubmit={(e) => {
            e.preventDefault();
            if (view.kind === "section") o.save();
            else if (sending) phoneStage ? o.signIn.verifyCode(code) : o.signIn.sendCode();
          }}>
            <div className={`po__screen po__screen--${view.kind}`} key={viewKey}>
              {view.kind === "intro" && <div className="po__slideturn"><Turning size={230} assetBase={assetBase} /></div>}
              {(view.kind === "signin" || view.kind === "contact") && <div className="po__hero"><GlowLogo size={92} assetBase={assetBase} sparkles pulse={pulse} /></div>}
              {o.section && <p className="po__section">{t(o.section.title)}</p>}
              <h1 className="po__title" tabIndex={-1} ref={heading}>
                {title}
                {view.kind === "home" && o.status === "approved" && <span className="po__tick" title={t(ui.verified)}> ✔<span className="po__sr">{t(ui.verified)}</span></span>}
              </h1>
              {intro && <p className="po__intro">{intro}</p>}

              {view.kind === "intro" && (
                <>
                  <div className="po__dots" aria-hidden="true">{INTRO.map((_, i) => <i key={i} className={i === view.slide ? "is-on" : ""} />)}</div>
                  <button type="button" className="po__btn po__btn--primary po__btn--center" onClick={o.nextSlide}>{t(view.slide < 2 ? ui.next : ui.getStarted)}</button>
                </>
              )}
              {sending && <SignIn o={o} code={code} setCode={setCode} assetBase={assetBase} />}
              {view.kind === "home" && <Home o={o} assetBase={assetBase} />}
              {view.kind === "section" && (
                <div className="po__fields">
                  {o.section!.id === "bank" && o.statusOf(o.section!) === "done" && (
                    <p className="po__saved" role="status">
                      {t(ui.savedAs, { masked: o.values.payoutMethod ? mask(o.values.payoutMethod === "upi" ? o.values.upiId : o.values.accountNumber) : o.savedBank?.masked ?? "" })}
                      <span>{t(o.bankStatus === "verified" ? ui.bankVerified : ui.pending)}</span>
                    </p>
                  )}
                  {visibleFields(o.step!, o.values).map((f) => <FieldRow key={f.id} f={f} o={o} props={props} assetBase={assetBase} />)}
                </div>
              )}
              {view.kind === "recitation" && <Recitation o={o} assetBase={assetBase} sampleCamera={sampleCamera} />}
              {view.kind === "language" && (
                <div className="po__list" role="radiogroup" aria-label={t(ui.chooseLanguage)}>
                  {o.languages.map((x) => (
                    <button key={x.code} type="button" role="radio" aria-checked={x.code === o.language} className={`po__row-btn${x.code === o.language ? " is-on" : ""}`} lang={x.code} onClick={() => { o.setLanguage(x.code); o.back(); }}>
                      <span className="po__radio" aria-hidden="true" />{x.name}
                    </button>
                  ))}
                </div>
              )}
              {view.kind === "profile" && <Profile o={o} />}
              {view.kind === "account" && (
                <div className="po__review">
                  <section className="po__card"><dl>
                    <div><dt>{t(ui.mobile)}</dt><dd>+91 {o.account.phone} · {t(ui.verified)}</dd></div>
                    <div><dt>{t(ui.gmail)}</dt><dd>{o.account.email} · {t(ui.verified)}</dd></div>
                  </dl></section>
                  <button type="button" className="po__btn" onClick={o.signIn.signOut}>{t(ui.signOut)}</button>
                  <button type="button" className="po__link" onClick={() => o.go("deletion")}>{t(ui.deleteAccount)}</button>
                </div>
              )}
              {view.kind === "help" && (
                <div className="po__review">
                  <section className="po__card"><dl><div><dt>Email</dt><dd><a className="po__link" href="mailto:propoojapaath@gmail.com">propoojapaath@gmail.com</a></dd></div></dl></section>
                  {o.openPrivacy && <button type="button" className="po__link" onClick={o.openPrivacy}>{t(ui.privacy)}</button>}
                </div>
              )}
              {view.kind === "deletion" && (
                <div className="po__review">
                  {o.deletionRequested ? (
                    <>
                      <p className="po__notice" role="status">{t(ui.deletionRequested)}</p>
                      <button type="button" className="po__btn" onClick={o.cancelDeletion} disabled={o.busy}>{t(ui.cancelRequest)}</button>
                    </>
                  ) : (
                    <>
                      <section className="po__card">
                        <p className="po__label">{t(ui.deleteIntro)}</p>
                        <ul className="po__bullets">{t(ui.deleteItems).split(" · ").map((x) => <li key={x}>{x}</li>)}</ul>
                        <p className="po__hint">{t(ui.deleteNote)}</p>
                      </section>
                      <button type="button" className="po__btn po__btn--danger" onClick={o.requestDeletion} disabled={o.busy}>{t(ui.requestDeletion)}</button>
                    </>
                  )}
                  {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
                </div>
              )}
            </div>

            {view.kind === "section" && (
              <footer className="po__foot">
                {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
                <div className="po__actions">
                  {o.canSkip && <button type="button" className="po__btn" onClick={o.skip} disabled={o.busy}>{t(ui.skip)}</button>}
                  <button type="submit" className="po__btn po__btn--primary" disabled={o.busy}>{o.busy && <Turning size={24} assetBase={assetBase} plain />}{t(o.busy ? ui.saving : ui.saveContinue)}</button>
                </div>
              </footer>
            )}
            {view.kind === "home" && o.editable && (
              <footer className="po__foot">
                {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
                <div className="po__actions">
                  <button type="button" className="po__btn" onClick={o.continueProfile}>{t(ui.continueProfile)}</button>
                  <button type="button" className="po__btn po__btn--primary" onClick={o.submitForReview} disabled={!o.requiredDone || o.busy}>{o.busy && <Turning size={24} assetBase={assetBase} plain />}{t(o.busy ? ui.submitting : ui.submitForReview)}</button>
                </div>
              </footer>
            )}
          </form>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- side panel (wide screens) and profile menu

const MENU = ["home", "profile", "account", "language", "help", "deletion"] as const;
const menuLabel = (o: App, k: (typeof MENU)[number]) =>
  o.t(k === "home" ? o.ui.home : k === "profile" ? o.ui.myProfile : k === "account" ? o.ui.myAccount : k === "language" ? o.ui.language : k === "help" ? o.ui.help : o.ui.deleteAccount);

function Avatar({ o }: { o: App }) {
  return (
    <span className="po__avatarimg po__avatarimg--small">
      {o.values.photo ? <img src={o.values.photo} alt="" /> : <span aria-hidden="true">{(o.values.fullName || o.account.email || "?").trim().charAt(0).toUpperCase()}</span>}
    </span>
  );
}

function StatusBadge({ o }: { o: App }) {
  return <span className={`po__pill is-${STATUS_TONE[o.status]}`}>{o.t(STATUS_LABEL[o.status])}</span>;
}

function Side({ o, assetBase }: { o: App; assetBase: string }) {
  const { t, ui } = o;
  return (
    <aside className="po__side">
      <div className="po__brand"><img src={`${assetBase}/logo.png`} alt="" /><span>{t(ui.brand)}</span></div>
      <div className="po__who">
        <Avatar o={o} />
        <span><strong>{o.values.fullName || t(ui.namasteNoName)}</strong><StatusBadge o={o} /></span>
      </div>
      <nav className="po__nav" aria-label={t(ui.menu)}>
        {MENU.map((k) => (
          <button key={k} type="button" className={o.view.kind === k ? "is-current" : ""} aria-current={o.view.kind === k ? "page" : undefined} onClick={() => o.go(k)}>{menuLabel(o, k)}</button>
        ))}
        <button type="button" onClick={o.signIn.signOut}>{t(ui.signOut)}</button>
      </nav>
    </aside>
  );
}

function Menu({ o }: { o: App }) {
  const { t, ui } = o;
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!o.menuOpen) return;
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) o.setMenuOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [o.menuOpen]);
  return (
    <div className="po__menu" ref={box}>
      <button type="button" className="po__menubtn" aria-haspopup="menu" aria-expanded={o.menuOpen} aria-label={t(ui.menu)} onClick={() => o.setMenuOpen(!o.menuOpen)}>
        <Avatar o={o} />
      </button>
      {o.menuOpen && (
        <div className="po__menulist" role="menu">
          <div className="po__menuhead">
            <strong>{o.values.fullName || t(ui.namasteNoName)}</strong>
            <small>+91 {o.account.phone}</small>
          </div>
          {MENU.map((k) => <button key={k} type="button" role="menuitem" onClick={() => o.go(k)}>{menuLabel(o, k)}</button>)}
          <button type="button" role="menuitem" onClick={o.signIn.signOut}>{t(ui.signOut)}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- sign-in and contact

function SignIn({ o, code, setCode, assetBase }: { o: App; code: string; setCode: (x: string) => void; assetBase: string }) {
  const { t, ui, view, signIn } = o;
  if (view.kind !== "signin" && view.kind !== "contact") return null;
  const failed = o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>;
  const signOut = view.kind === "contact" && <button type="button" className="po__link po__link--center" onClick={signIn.signOut}>{t(ui.signOut)}</button>;
  const googleBtn = (label: L) => (
    <button type="button" className="po__btn po__btn--wide" onClick={signIn.google} disabled={o.busy}>
      <span className="po__glyph" aria-hidden="true">G</span>{t(label)}
    </button>
  );

  if (view.stage === "otp")
    return (
      <div className="po__fields">
        <div className={`po__field${signIn.error ? " has-error" : ""}`}>
          <label className="po__label" htmlFor="po-otp">{t(ui.otpLabel)}</label>
          <input id="po-otp" className="po__input po__input--otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} aria-invalid={!!signIn.error}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); signIn.clearError(); }} />
          {signIn.error && <p className="po__error" role="alert">{t(signIn.error)}</p>}
        </div>
        <button type="submit" className="po__btn po__btn--primary" disabled={o.busy}>{o.busy && <Turning size={24} assetBase={assetBase} plain />}{t(o.busy ? ui.verifying : ui.verify)}</button>
        <div className="po__inline">
          <button type="button" className="po__link" onClick={signIn.sendCode} disabled={signIn.resendIn > 0 || o.busy}>
            {signIn.resendIn > 0 ? t(ui.sendAgainIn, { n: signIn.resendIn }) : t(ui.sendAgain)}
          </button>
          <button type="button" className="po__link" onClick={o.back}>{t(ui.changeNumber)}</button>
        </div>
        {failed}
      </div>
    );

  if (view.kind === "contact" && view.need === "google")
    return <div className="po__fields">{googleBtn(ui.verifyWithGoogle)}{failed}{signOut}</div>;

  return (
    <div className="po__fields">
      <div className={`po__field${signIn.error ? " has-error" : ""}`}>
        <label className="po__label" htmlFor="po-phone">{t(ui.phoneLabel)}</label>
        <div className="po__phone">
          <span aria-hidden="true">+91</span>
          <input id="po-phone" className="po__input" inputMode="numeric" autoComplete="tel-national" value={signIn.phone} aria-invalid={!!signIn.error} onChange={(e) => signIn.setPhone(e.target.value)} />
        </div>
        {signIn.error && <p className="po__error" role="alert">{t(signIn.error)}</p>}
      </div>
      <button type="submit" className="po__btn po__btn--primary" disabled={o.busy}>{o.busy && <Turning size={24} assetBase={assetBase} plain />}{t(o.busy ? ui.sending : ui.sendCode)}</button>
      {view.kind === "signin" && (
        <>
          <p className="po__or"><span>{t(ui.or)}</span></p>
          {googleBtn(ui.withGoogle)}
          {o.openPrivacy && <button type="button" className="po__link po__link--center" onClick={o.openPrivacy}>{t(ui.privacy)}</button>}
        </>
      )}
      {failed}
      {signOut}
    </div>
  );
}

// ---------------------------------------------------------------- Home

function Home({ o, assetBase }: { o: App; assetBase: string }) {
  const { t, ui } = o;
  const unread = o.updates.filter((u) => !u.read);
  const r = o.recitation;
  const docs = Object.values(o.values.idDocs ?? {}).filter(Boolean).length;
  const note = (s: Section): string => {
    const st = o.statusOf(s);
    if (s.id === "bank" && st === "done") return t(o.bankStatus === "verified" ? ui.bankVerified : ui.bankPending);
    if (s.id === "idDocument" && docs) return t(ui.uploadedCount, { n: docs });
    if (s.group === "profile") return t(st === "done" ? ui.done : s.required ? ui.required : ui.optional);
    return t(ui[st]);
  };
  const row = (key: string, state: string, title: string, summary: string, text: string, open: () => void) => (
    <li key={key}>
      <button type="button" className={`po__tile is-${state}`} onClick={open}>
        <span className="po__dot" aria-hidden="true" />
        <span className="po__tiletext"><strong>{title}</strong><small>{summary}</small></span>
        <span className="po__status">{text}</span>
      </button>
    </li>
  );
  const recNote = r.state === "passed" ? t(ui.passedShort) : r.state === "checking" ? t(ui.beingCheckedShort) : r.reviewRequested ? t(ui.reviewAsked) : t(ui.attemptsLeft, { n: r.attemptsLeft });

  return (
    <>
      <section className={`po__banner${o.status === "approved" ? " is-verified" : ""}`}>
        <div className="po__bannerhead">
          <h2>{t(o.editable ? ui.bannerTitle : ui.yourProfile)}</h2>
          <StatusBadge o={o} />
        </div>
        <RiderBar value={o.profileProgress} label={t(ui.bannerTitle)} assetBase={assetBase} />
        <p>{t(o.status === "approved" ? ui.bannerVerified : !o.editable ? ui.bannerLocked : o.requiredDone ? ui.bannerReady : ui.bannerNeeds)}</p>
      </section>

      {o.reviewerMessage && (
        <section className="po__notice po__notice--attention">
          <strong>{t(ui.reviewerMessage)}</strong>
          <p>{o.reviewerMessage}</p>
        </section>
      )}

      {unread.length > 0 && (
        <section>
          <h2 className="po__h2">{t(ui.updates)}</h2>
          <ul className="po__hub">
            {unread.map((u) => (
              <li key={u.id}>
                <button type="button" className="po__tile po__tile--update" onClick={() => o.markRead(u.id)} aria-label={`${t(UPDATE_TEXT[u.kind])} ${t(ui.markRead)}`}>
                  <span className="po__dot po__dot--new" aria-hidden="true" />
                  <span className="po__tiletext"><strong>{t(UPDATE_TEXT[u.kind])}</strong>{u.reason && <small>{u.reason}</small>}</span>
                  <span className="po__status">{t(ui.markRead)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="po__h2">{t(ui.yourProfile)}</h2>
      <ul className="po__hub">
        {o.profileSections.map((s) => row(s.id, o.statusOf(s), t(s.title), t(s.summary), note(s), () => o.openSection(s.id)))}
      </ul>

      <h2 className="po__h2">{t(ui.moreAboutYou)}</h2>
      <ul className="po__hub">
        {o.moreSections.map((s) => row(s.id, o.statusOf(s), t(s.title), t(s.summary), note(s), () => o.openSection(s.id)))}
        {row("recitation", r.state === "passed" ? "done" : r.state === "none" ? "empty" : "started", t(ui.getVerified), t(ui.getVerifiedSummary), recNote, () => o.go("recitation"))}
      </ul>
    </>
  );
}

function Profile({ o }: { o: App }) {
  const { t, ui } = o;
  return (
    <div className="po__review">
      {o.allSections.map((s) => (
        <section key={s.id} className="po__card">
          <h2 className="po__cardtitle">{t(s.title)}</h2>
          <dl>
            {s.steps.flatMap((st) => visibleFields(st, o.values)).filter((f) => f.type !== "search" && f.id !== "accountNumberAgain").map((f) => (
              <div key={f.id}><dt>{t(f.label)}</dt><dd>{(f.id === "serviceCentre" ? o.centre?.label : display(f, o.values, o.lang)) || t(ui.notAdded)}</dd></div>
            ))}
          </dl>
          {o.canEdit(s) && <button type="button" className="po__link" onClick={() => o.openSection(s.id)}>{t(ui.edit)}<span className="po__sr"> {t(s.title)}</span></button>}
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- get verified

/** Camera and recorder. Falls back to a labelled sample preview where no camera is available. */
function useRecorder(allowSample: boolean) {
  const [mode, setMode] = useState<"off" | "denied" | "live" | "recording" | "recorded">("off");
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
    timer.current = setInterval(() => setSeconds((n) => n + 1), 1000);
    setMode("recording");
  };
  const start = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      setSample(false);
    } catch {
      // no camera, or permission refused
      if (!allowSample) return setMode("denied");
      setSample(true);
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
  // Recording stops by itself at the limit.
  useEffect(() => { if (mode === "recording" && seconds >= MAX_RECORDING_SECONDS) stop(); }, [mode, seconds]);
  // Free the recording when the screen goes away.
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const cancel = () => { off(); if (url) URL.revokeObjectURL(url); setUrl(null); setMode("off"); };

  return { mode, sample, seconds, url, live, start, record, stop, restart, cancel, recording: () => blob.current };
}

function Recitation({ o, assetBase, sampleCamera }: { o: App; assetBase: string; sampleCamera: boolean }) {
  const { t, ui } = o;
  const r = o.recitation;
  const cam = useRecorder(sampleCamera);
  const [accepted, setAccepted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const name = (id: string) => { const s = r.shlokas.find((x) => x.value === id); return s ? t(s.label) : id; };
  const lastFailed = [...r.attempts].reverse().find((a) => a.result === "failed");

  const history = r.attempts.length > 0 && (
    <section>
      <h2 className="po__h2">{t(ui.history)}</h2>
      <ul className="po__history">
        {r.attempts.map((a) => (
          <li key={a.n} className={`is-${a.result}`}>
            <span>{t(ui.attemptN, { n: a.n })} · {name(a.shlokaId)}</span>
            <strong>{t(a.result === "passed" ? ui.resultPassed : a.result === "failed" ? ui.resultFailed : ui.resultChecking)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );

  if (r.state === "passed" || r.state === "checking" || r.state === "blocked")
    return (
      <>
        {r.state === "checking" && <div className="po__waiting"><Turning size={150} assetBase={assetBase} /></div>}
        <div className={`po__result is-${r.state === "passed" ? "good" : r.state === "blocked" ? "bad" : "wait"}`} role="status">
          <strong>{t(r.state === "passed" ? ui.recPassed : r.state === "checking" ? ui.beingChecked : ui.noAttempts)}</strong>
          {r.state === "blocked" && (r.reviewRequested
            ? <p>{t(ui.reviewRequested)}</p>
            : <>
                <p>{t(ui.noAttemptsBody)}</p>
                {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
                <button type="button" className="po__btn po__btn--primary po__btn--center" onClick={r.requestReview} disabled={o.busy}>{t(ui.requestReview)}</button>
              </>)}
        </div>
        {r.state !== "passed" && <p className="po__hint">{t(ui.attemptsLeft, { n: r.attemptsLeft })}</p>}
        {history}
      </>
    );

  const reset = () => { setAccepted(false); setConfirming(false); };
  return (
    <div className="po__fields">
      {lastFailed && <p className="po__notice po__notice--attention" role="status">{t(ui.attemptFailed, { n: lastFailed.n })}</p>}
      <div className="po__field">
        <label className="po__label" htmlFor="po-shloka">{t(ui.whichShloka)}</label>
        <select id="po-shloka" className="po__input" value={r.shlokaId} disabled={r.uploading || cam.mode === "recording"} onChange={(e) => r.setShlokaId(e.target.value)}>
          <option value="">{t(ui.chooseShloka)}</option>
          {r.shlokas.map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
        </select>
      </div>

      <div className={`po__camera is-${cam.mode}${r.uploading ? " is-checking" : ""}`}>
        {(cam.mode === "off" || cam.mode === "denied") && <p>{t(cam.mode === "denied" ? ui.cameraDenied : ui.cameraOff)}</p>}
        {cam.mode !== "off" && cam.mode !== "denied" && !cam.sample && (cam.mode === "recorded" && cam.url
          ? <video key="playback" src={cam.url} controls playsInline />
          : <video key="live" ref={cam.live} autoPlay muted playsInline />)}
        {cam.mode !== "off" && cam.mode !== "denied" && cam.sample && <div className="po__camsample"><span aria-hidden="true" /><p>{t(ui.cameraSample)}</p></div>}
        {cam.mode === "recording" && <span className="po__rec" role="status"><i aria-hidden="true" />{t(ui.recording)} · {t(ui.seconds, { n: cam.seconds })}</span>}
        {cam.mode === "recorded" && accepted && !r.uploading && <span className="po__rec is-ready" role="status">{t(ui.recordingReady)} · {t(ui.seconds, { n: cam.seconds })}</span>}
        {r.uploading && <div className="po__checking" role="status"><Turning size={110} assetBase={assetBase} />{t(ui.uploadingRec)}</div>}
      </div>

      {confirming ? (
        <div className="po__confirm" role="alertdialog" aria-labelledby="po-confirm">
          <p id="po-confirm">{t(ui.confirmAttempt)}</p>
          <div className="po__actions">
            <button type="button" className="po__btn" onClick={() => setConfirming(false)}>{t(ui.notYet)}</button>
            <button type="button" className="po__btn po__btn--primary" onClick={() => { setConfirming(false); r.submit(cam.recording()).then((ok) => { if (ok) { cam.cancel(); reset(); } }); }}>{t(ui.yesSubmit)}</button>
          </div>
        </div>
      ) : !r.uploading && (
        <div className="po__actions">
          {(cam.mode === "off" || cam.mode === "denied") && <button type="button" className="po__btn po__btn--primary" onClick={cam.start} disabled={!r.shlokaId}><span className="po__recdot" aria-hidden="true" />{t(ui.record)}</button>}
          {cam.mode === "live" && (
            <>
              <button type="button" className="po__btn" onClick={() => { cam.cancel(); reset(); }}>{t(ui.cancel)}</button>
              <button type="button" className="po__btn po__btn--primary" onClick={cam.record}><span className="po__recdot" aria-hidden="true" />{t(ui.startRecording)}</button>
            </>
          )}
          {cam.mode === "recording" && <button type="button" className="po__btn po__btn--primary" onClick={cam.stop}>{t(ui.stop)}</button>}
          {cam.mode === "recorded" && (
            <>
              <button type="button" className="po__btn" onClick={() => { reset(); cam.restart(); }}>{t(ui.recordAgain)}</button>
              {accepted
                ? <button type="button" className="po__btn po__btn--primary" onClick={() => setConfirming(true)}>{t(ui.submitVerification)}</button>
                : <button type="button" className="po__btn po__btn--primary" onClick={() => setAccepted(true)}>{t(ui.useThis)}</button>}
            </>
          )}
        </div>
      )}
      {!r.shlokaId && <p className="po__hint">{t(ui.chooseFirst)}</p>}
      {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
      <p className="po__hint">{t(ui.attemptsLeft, { n: r.attemptsLeft })}</p>
      {history}
    </div>
  );
}

// ---------------------------------------------------------------- one field

function FieldRow({ f, o, props, assetBase }: { f: Field; o: App; props: PanditAppProps; assetBase: string }) {
  const { t, ui, values, setValue } = o;
  if (f.type === "search" && !o.search) return null;
  const value = values[f.id] ?? f.defaultValue;
  const error = o.errors[f.id];
  const id = `po-${f.id}`;
  const describedBy = [f.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const set = (x: any) => setValue(f.id, x);
  const options: Opt[] = f.options ?? [];
  const grouped = !["text", "textarea", "select", "search"].includes(f.type);
  let control: ReactNode = null;

  if (f.type === "text") {
    control = (
      <input id={id} className="po__input" value={value ?? ""} maxLength={f.maxLength}
        inputMode={f.keyboard === "number" ? "numeric" : f.keyboard === "email" ? "email" : undefined}
        autoCapitalize={f.capitalize ?? "sentences"} autoComplete={f.sensitive ? "off" : undefined}
        placeholder={f.placeholder && t(f.placeholder)} aria-invalid={!!error} aria-describedby={describedBy}
        onChange={(e) => {
          let x = e.target.value;
          if (f.keyboard === "number") x = x.replace(/\D/g, "");
          if (f.capitalize === "characters") x = x.toUpperCase();
          set(x);
        }} />
    );
  } else if (f.type === "textarea") {
    control = (
      <>
        <textarea id={id} className="po__input po__input--area" rows={5} value={value ?? ""} maxLength={f.maxLength} placeholder={f.placeholder && t(f.placeholder)} aria-describedby={describedBy} onChange={(e) => set(e.target.value)} />
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
      <div className={`po__chips${options.length > 12 ? " po__chips--many" : ""}`}>
        {options.map((op) => {
          const on = many ? list.includes(op.value) : value === op.value;
          return (
            <button key={op.value} type="button" className={`po__chip${on ? " is-on" : ""}`} aria-pressed={on}
              onClick={() => set(many ? (on ? list.filter((x) => x !== op.value) : [...list, op.value]) : op.value)}>
              {many && <span className="po__check" aria-hidden="true">{on ? "✓" : "+"}</span>}{t(op.label)}
            </button>
          );
        })}
      </div>
    );
  } else if (f.type === "date") {
    control = <DateInput id={id} value={value} onChange={set} o={o} invalid={!!error} />;
  } else if (f.type === "image") {
    const pick = async (source: "camera" | "gallery") => { const uri = await props.pickImage(source, "avatar"); if (uri) set(uri); };
    control = (
      <div className="po__avatar">
        <span className="po__avatarimg">{value ? <img src={value} alt="" /> : <span aria-hidden="true">{(values.fullName || "?").trim().charAt(0)}</span>}</span>
        <div className="po__chips">
          <button type="button" className="po__btn po__btn--small" onClick={() => pick("camera")}>{t(ui.takePhoto)}</button>
          <button type="button" className="po__btn po__btn--small" onClick={() => pick("gallery")}>{t(ui.fromGallery)}</button>
        </div>
      </div>
    );
  } else if (f.type === "search") {
    control = <Search id={id} o={o} placeholder={f.placeholder ? t(f.placeholder) : ""} onPick={o.applyPlace} />;
  } else if (f.type === "centre") {
    control = <Centre id={id} o={o} />;
  } else if (f.type === "docs") {
    control = <Docs o={o} assetBase={assetBase} />;
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
                <button key={s.value} type="button" className={`po__chip${on ? " is-on" : ""}`} aria-pressed={on} title={t(s.label)}
                  onClick={() => set({ ...week, [d.value]: on ? list.filter((x) => x !== s.value) : [...list, s.value] })}>
                  {t(SLOT_SHORT[s.value])}
                </button>
              );
            })}
          </div>
        ))}
        <p className="po__hint">{SLOTS.map((s) => t(s.label)).join(" · ")}</p>
      </div>
    );
  } else if (f.type === "calendar") {
    control = <Calendar o={o} value={value ?? []} onChange={set} />;
  } else if (f.type === "dateList") {
    control = <Leave id={id} value={value ?? []} onChange={set} o={o} />;
  }

  return (
    <div className={`po__field po__field--${f.type}${error ? " has-error" : ""}`} role={grouped ? "group" : undefined} aria-labelledby={grouped ? `${id}-label` : undefined}>
      {grouped ? <span className="po__label" id={`${id}-label`}>{t(f.label)}</span> : <label className="po__label" htmlFor={id}>{t(f.label)}</label>}
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

// ---------------------------------------------------------------- address search, service area, documents

/** Type-ahead: after 3 characters, up to 5 suggestions appear below the field. */
function Search({ id, o, placeholder, onPick }: { id: string; o: App; placeholder: string; onPick: (p: Place) => void }) {
  const { t, ui } = o;
  const [q, setQ] = useState("");
  const [state, setState] = useState<{ status: "idle" | "searching" | "done"; results: Place[] }>({ status: "idle", results: [] });
  useEffect(() => {
    if (q.trim().length < 3 || !o.search) return setState({ status: "idle", results: [] });
    let cancelled = false;
    setState((s) => ({ ...s, status: "searching" }));
    const timer = setTimeout(() => {
      o.search!(q.trim())
        .then((r) => !cancelled && setState({ status: "done", results: r.slice(0, 5) }))
        .catch(() => !cancelled && setState({ status: "done", results: [] }));
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q]);
  return (
    <div className="po__search">
      <input id={id} className="po__input" value={q} placeholder={placeholder} autoComplete="off" role="combobox" aria-expanded={state.results.length > 0} aria-controls={`${id}-list`} onChange={(e) => setQ(e.target.value)} />
      {state.status === "searching" && <p className="po__hint" role="status">{t(ui.searching)}</p>}
      {state.status === "done" && state.results.length === 0 && <p className="po__hint" role="status">{t(ui.noResults)}</p>}
      {state.results.length > 0 && (
        <ul className="po__suggest" id={`${id}-list`} role="listbox">
          {state.results.map((p) => (
            <li key={p.label} role="option" aria-selected="false">
              <button type="button" onClick={() => { onPick(p); setQ(""); setState({ status: "idle", results: [] }); }}>{p.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CIRCLE: Record<string, number> = { "2": 14, "5": 20, "10": 27, "15": 32, "25": 38, "50": 44, "100": 48 };

function Centre({ id, o }: { id: string; o: App }) {
  const { t, ui } = o;
  const km = String(o.values.radiusKm ?? "10");
  const c = o.centre;
  const image = c && o.mapImageUrl?.(c, Number(km));
  return (
    <>
      {c ? <p className="po__place"><span>{c.label}</span></p> : <p className="po__notice">{t(ui.noCentre)}</p>}
      {c && (
        <div className="po__map" role="img" aria-label={t(ui.mapAlt, { place: c.label, km })}>
          {image ? <img src={image} alt="" /> : (
            <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="320" height="240" className="po__mapland" />
              <path d="M-10 190 C60 150 120 210 190 170 S300 120 340 150 V260 H-10Z" className="po__mapwater" />
              <path d="M0 70 H320 M0 130 H320 M70 0 V240 M150 0 V240 M240 0 V240 M0 20 L320 200 M40 240 L300 0" className="po__maproad" />
            </svg>
          )}
          <span className="po__mapcircle" style={{ width: `${CIRCLE[km] * 2}%` }} aria-hidden="true"><i /></span>
        </div>
      )}
      {o.search && (
        <div className="po__field">
          <label className="po__label po__label--light" htmlFor={`${id}-search`}>{t(ui.differentCentre)}</label>
          <Search id={`${id}-search`} o={o} placeholder="" onPick={o.setCentre} />
        </div>
      )}
    </>
  );
}

function Docs({ o, assetBase }: { o: App; assetBase: string }) {
  const { t, ui } = o;
  const docs: Record<string, string> = o.values.idDocs ?? {};
  const [type, setType] = useState<string>(() => ID_TYPES.find((d) => docs[d.value])?.value ?? "");
  const chosen = ID_TYPES.find((d) => d.value === type);
  const state = o.docState[type];
  return (
    <>
      <div className="po__chips">
        {ID_TYPES.map((d) => (
          <button key={d.value} type="button" className={`po__chip${type === d.value ? " is-on" : ""}`} aria-pressed={type === d.value} onClick={() => setType(d.value)}>
            {docs[d.value] && <span className="po__check" aria-hidden="true">✓</span>}{t(d.label)}
            {docs[d.value] && <span className="po__sr"> ({t(ui.uploaded)})</span>}
          </button>
        ))}
      </div>
      {chosen?.warning && <p className="po__notice po__notice--attention">{t(chosen.warning)}</p>}
      {chosen && (
        <>
          {docs[type] && <div className="po__drop has-image"><img src={docs[type]} alt="" /></div>}
          <div className="po__actions">
            <button type="button" className="po__btn" onClick={() => o.addDocument(type, "camera")} disabled={state === "uploading"}>{t(ui.takePhoto)}</button>
            <button type="button" className="po__btn" onClick={() => o.addDocument(type, "gallery")} disabled={state === "uploading"}>{t(ui.fromGallery)}</button>
          </div>
          {state && <p className={`po__busyline ${state === "failed" ? "po__error" : "po__hint"}`} role="status">{state === "uploading" && <Turning size={26} assetBase={assetBase} plain />}{t(state === "uploading" ? ui.uploading : state === "uploaded" ? ui.uploaded : ui.uploadFailed)}</p>}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- availability: month calendar and leave

function Calendar({ o, value, onChange }: { o: App; value: string[]; onChange: (x: string[]) => void }) {
  const { t, ui } = o;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const week: Record<string, string[]> = o.values.week ?? {};
  const leave: { from: string; to: string }[] = o.values.leave ?? [];
  const kind = (date: string, weekday: number) => {
    if (leave.some((r) => isDate(r.from) && isDate(r.to) && date >= r.from && date <= r.to)) return "leave";
    if (value.includes(date)) return "off";
    const n = (week[DAYS[weekday].value] ?? []).length;
    return n === SLOTS.length ? "available" : n ? "partly" : "notset";
  };
  const label: Record<string, L> = { available: ui.legendAvailable, partly: ui.legendPartly, off: ui.legendOff, leave: ui.legendLeave, notset: ui.legendNotSet };
  return (
    <div className="po__cal">
      <p className="po__calmonth">{new Intl.DateTimeFormat(o.lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" }).format(now)}</p>
      <div className="po__calgrid">
        {DAYS.map((d) => <span key={d.value} className="po__calhead" aria-hidden="true">{t(d.label)}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`x${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = `${y}-${pad(m + 1)}-${pad(i + 1)}`;
          const k = kind(date, (lead + i) % 7);
          return (
            <button key={date} type="button" className={`po__calday is-${k}`} disabled={k === "leave"} aria-pressed={k === "off"} aria-label={`${i + 1}, ${t(label[k])}`}
              onClick={() => onChange(value.includes(date) ? value.filter((x) => x !== date) : [...value, date])}>
              {i + 1}
            </button>
          );
        })}
      </div>
      <ul className="po__legend">
        {Object.keys(label).map((k) => <li key={k}><i className={`is-${k}`} aria-hidden="true" />{t(label[k])}</li>)}
      </ul>
    </div>
  );
}

function DateInput({ id, value, onChange, o, invalid }: { id: string; value?: string; onChange: (x: string) => void; o: App; invalid?: boolean }) {
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

function Leave({ id, value, onChange, o }: { id: string; value: any[]; onChange: (x: any[]) => void; o: App }) {
  const { t, ui } = o;
  const patch = (i: number, p: any) => onChange(value.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const keys = useRef<number[]>([]);
  while (keys.current.length < value.length) keys.current.push(Math.random());
  const remove = (i: number) => { keys.current.splice(i, 1); onChange(value.filter((_, j) => j !== i)); };
  return (
    <div className="po__rows">
      {value.map((r, i) => (
        <div key={keys.current[i]} className="po__row">
          <label><span>{t(ui.from)}</span><DateInput id={`${id}-${i}-from`} value={r.from} onChange={(x) => patch(i, { from: x })} o={o} invalid={!!r.from && !isDate(r.from)} /></label>
          <label><span>{t(ui.to)}</span><DateInput id={`${id}-${i}-to`} value={r.to} onChange={(x) => patch(i, { to: x })} o={o} invalid={!!r.to && !isDate(r.to)} /></label>
          <button type="button" className="po__link" onClick={() => remove(i)}>{t(ui.remove)}</button>
        </div>
      ))}
      <button type="button" className="po__btn po__btn--small" onClick={() => onChange([...value, { from: "", to: "" }])}>{t(ui.addLeave)}</button>
    </div>
  );
}
