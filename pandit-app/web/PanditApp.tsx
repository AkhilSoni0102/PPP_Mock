"use client";

// ProPoojaPaath pandit app for the website (React / Next.js).
//
//   logo reveal → 3 intro slides → sign in → add the missing contact → Home.
//   The logo of the reveal is one element that travels: into the rings of the intro slides,
//   up to the sign-in screen, and finally into the top bar. It never cuts away.
//
//   Where things live:
//     phone   three tabs at the bottom (Home, Availability, Profile); the bell top right
//     wide    one bar across the top (Home, Availability, Help), language, the bell, and the photo,
//             which opens My profile, My account and Sign out
//   Home says what the platform gives, what you can do, and your next step.
//   Profile holds every section with its Edit button; steps show only Back and the progress bar.
//   → submit for review → ask to allow notifications
//   → Updates (from the bell or the status badge): the review timeline and every update
//
// What is asked lives in ../shared/schema.ts; the flow lives in ../shared/usePanditApp.ts.
// Needs ../../web/LogoReveal.tsx, logo-reveal.css and the PNGs from assets/ in public/logo-reveal/.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import LotusMark from "../../web/LotusMark";
import { GlowLogo, LogoSlot, RiderBar, Turning } from "./Motion";
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
  /** Play the logo reveal first, then let the logo travel into the app. Default true. */
  reveal?: boolean;
  /** Demos only: when no camera is available, show a labelled sample preview and allow a pretend
   *  recording. Leave this off in the real app, where a missing camera must block recording. */
  sampleCamera?: boolean;
};

export default function PanditApp({ assetBase = "/logo-reveal", reveal = true, sampleCamera = false, ...props }: Props) {
  const o = usePanditApp(props);
  const { t, ui, view } = o;
  const theme = props.theme ?? "light";
  // The opening: "reveal" while the petals open, then "travel" while the one logo follows the screens
  // to its place in the top bar, then null: every screen draws its own logo again.
  const [opening, setOpening] = useState<"reveal" | "travel" | null>(reveal ? "reveal" : null);
  const root = useRef<HTMLDivElement>(null);
  const [fly, setFly] = useState<{ x: number; y: number; s: number; shown: boolean } | null>(null);
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

  useEffect(() => {
    if (opening !== "reveal") return;
    const id = setTimeout(() => setOpening("travel"), 3500);
    return () => clearTimeout(id);
  }, [opening]);
  // Aim the travelling logo at the slot of the screen that is showing.
  useLayoutEffect(() => {
    if (!opening) return;
    const place = () => {
      const box = root.current?.getBoundingClientRect();
      if (!box) return;
      const slot = opening === "travel" ? (root.current!.querySelector<HTMLElement>(".po__screen [data-po-slot]") ?? root.current!.querySelector<HTMLElement>("[data-po-slot]"))?.getBoundingClientRect() : undefined;
      const high = Math.min(box.height, window.innerHeight);
      if (opening === "reveal") setFly({ x: box.width / 2, y: high * 0.4, s: Math.min(1.35, (box.width * 0.5) / FLY), shown: true });
      else if (slot) setFly({ x: slot.left - box.left + slot.width / 2, y: slot.top - box.top + slot.height / 2, s: slot.width / FLY, shown: true });
      else setFly((f) => f && { ...f, shown: false });
    };
    place();
    const ro = new ResizeObserver(place);
    if (root.current) ro.observe(root.current);
    return () => ro.disconnect();
  }, [opening, viewKey, moment]);
  // Once the logo has settled in the top bar of a signed-in screen, the opening is over.
  const settled = opening === "travel" && o.signedIn && view.kind !== "contact";
  useEffect(() => {
    if (!settled) return;
    const id = setTimeout(() => setOpening(null), 1150);
    return () => clearTimeout(id);
  }, [settled]);
  const logo = (size: number, extra?: { sparkles?: boolean; pulse?: boolean; className?: string }) =>
    opening ? <LogoSlot size={size} /> : <GlowLogo size={size} assetBase={assetBase} {...extra} />;

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
    case "home": title = t(ui.home); break;
    case "section": title = t(o.step!.title); intro = o.step!.intro && t(o.step!.intro); break;
    case "recitation": title = t(ui.getVerified); intro = t(ui.recIntro); break;
    case "updates": title = t(ui.updates); break;
    case "notify":
      title = t(view.stage === "ask" ? ui.notifyTitle : view.stage === "on" ? ui.notifyOnTitle : ui.notifyLaterTitle);
      intro = t(view.stage === "ask" ? ui.notifyIntro : view.stage === "on" ? ui.notifyOnBody : ui.notifyLaterBody);
      break;
    case "language": title = t(ui.chooseLanguage); break;
    case "profile": title = t(ui.myProfile); break;
    case "account": title = t(ui.myAccount); break;
    case "help": title = t(ui.help); intro = o.support.hours ?? t(ui.supportHours); break;
    case "deletion": title = t(ui.deleteAccount); break;
  }

  const inFlow = view.kind === "section";
  /** A question flow: nothing on screen but Back and the progress bar. */
  const focused = inFlow && !o.tab;
  const showBack = !o.tab && view.kind !== "notify" && !(view.kind === "intro" && view.slide === 0) && !(view.kind === "signin" && view.stage === "main") && !(view.kind === "contact" && view.stage === "main");
  const sending = view.kind === "signin" || view.kind === "contact";
  /** A signed-in page that is neither a tab nor a flow: its title sits in the bar on the phone. */
  const inner = o.signedIn && !o.tab && !focused && view.kind !== "notify" && view.kind !== "contact";
  const ownHeading = view.kind === "home" || view.kind === "profile";
  const brand = (
    <>
      {logo(34, { className: "po__toplogo", pulse: pulse && view.kind === "home" })}
      <span className="po__topname">{t(ui.brand)}</span>
    </>
  );
  const langButton = <button type="button" className="po__lang" onClick={() => o.go("language")}>{o.languages.find((x) => x.code === o.language)?.name}</button>;

  return (
    <div className={`po po--${theme}${opening ? " is-opening" : ""}`} lang={o.lang} ref={root}>
      {opening && (
        <>
          <div className={`po__openbg${opening === "reveal" ? " is-on" : ""}`} aria-hidden="true">
            {opening === "reveal" && <p className="po__openname">{Array.from(t(ui.brand)).map((ch, i) => <span key={i} style={{ "--i": i } as CSSProperties}>{ch}</span>)}</p>}
          </div>
          <div className={`po__fly${fly && fly.s < 0.4 ? " is-small" : ""}`} aria-hidden="true"
            style={fly ? { transform: `translate(${fly.x - FLY / 2}px, ${fly.y - FLY / 2}px) scale(${fly.s})`, opacity: fly.shown ? 1 : 0 } : { opacity: 0 }}>
            <LotusMark assetBase={assetBase} />
          </div>
        </>
      )}
      {opening !== "reveal" && (
      <div className="po__frame">
        <main className={`po__main${o.signedIn && o.tab ? " has-tabs" : ""}`}>
          <header className={`po__top${focused ? " is-focused" : ""}${o.signedIn ? " is-app" : ""}`}>
            {focused ? (
              <>
                <button type="button" className="po__icon" onClick={o.back} aria-label={t(ui.back)}><span aria-hidden="true">←</span></button>
                <RiderBar value={o.progress} label={title} assetBase={assetBase} />
                <button type="button" className="po__link po__wide" onClick={o.exitSection}>{t(ui.saveExit)}</button>
              </>
            ) : !o.signedIn ? (
              <>
                {/* During the opening the one logo is still travelling, so the bar waits for it without a second logo. */}
                {showBack ? <button type="button" className="po__icon" onClick={o.back} aria-label={t(ui.back)}><span aria-hidden="true">←</span></button> : !opening && <GlowLogo className="po__toplogo" size={34} assetBase={assetBase} />}
                <span className="po__topname">{t(ui.brand)}</span>
                <span className="po__grow" />
                {(view.kind === "intro" || view.kind === "signin") && langButton}
              </>
            ) : (
              <>
                {inner ? (
                  <>
                    <button type="button" className="po__icon po__narrow" onClick={o.back} aria-label={t(ui.back)}><span aria-hidden="true">←</span></button>
                    <span className="po__topname po__narrow">{title}</span>
                    <button type="button" className="po__brandbtn po__wide" onClick={() => o.go("home")}>{brand}</button>
                  </>
                ) : <button type="button" className="po__brandbtn" onClick={() => o.go("home")}>{brand}</button>}
                {view.kind !== "contact" && view.kind !== "notify" && (
                  <nav className="po__topnav po__wide" aria-label={t(ui.menu)}>
                    {(["home", "availability", "help"] as const).map((k) => {
                      const on = k === "help" ? view.kind === "help" : o.tab === k;
                      return <button key={k} type="button" className={on ? "is-on" : ""} aria-current={on ? "page" : undefined} onClick={() => o.go(k)}>{t(k === "home" ? ui.home : k === "availability" ? ui.tabAvailability : ui.help)}</button>;
                    })}
                  </nav>
                )}
                <span className="po__grow" />
                {view.kind !== "contact" && <span className="po__wide">{langButton}</span>}
                {view.kind !== "updates" && view.kind !== "notify" && view.kind !== "contact" && <Bell o={o} />}
                {view.kind !== "contact" && <span className="po__wide"><Menu o={o} /></span>}
              </>
            )}
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
              {view.kind === "intro" && <div className="po__slideturn"><Turning size={230} assetBase={assetBase} slot={!!opening} /></div>}
              {(view.kind === "signin" || view.kind === "contact") && <div className="po__hero">{logo(92, { sparkles: true, pulse })}</div>}
              {inner && <button type="button" className="po__link po__backlink po__wide" onClick={o.back}><span aria-hidden="true">← </span>{t(ui.back)}</button>}
              {view.kind === "notify" && (
                <div className="po__hero">
                  <span className={`po__bigbell${view.stage === "on" ? " is-on" : ""}`}><BellIcon size={44} />{view.stage === "ask" && <GlowLogo size={30} assetBase={assetBase} />}</span>
                </div>
              )}
              {o.section && <p className="po__section">{t(o.section.title)}</p>}
              {!ownHeading && <h1 className={`po__title${inner ? " po__title--inbar" : ""}`} tabIndex={-1} ref={heading}>{title}</h1>}
              {intro && <p className={`po__intro${view.kind === "intro" ? " po__slidetext" : ""}`}>{intro}</p>}

              {view.kind === "intro" && (
                <>
                  <div className="po__dots" aria-hidden="true">{INTRO.map((_, i) => <i key={i} className={i === view.slide ? "is-on" : ""} />)}</div>
                  <button type="button" className="po__btn po__btn--primary po__btn--center" onClick={o.nextSlide}>{t(view.slide < 2 ? ui.next : ui.getStarted)}</button>
                </>
              )}
              {sending && <SignIn o={o} code={code} setCode={setCode} assetBase={assetBase} />}
              {view.kind === "home" && <Home o={o} assetBase={assetBase} heading={heading} />}
              {view.kind === "updates" && <Updates o={o} />}
              {view.kind === "notify" && (
                <>
                  {view.stage === "ask" && <ul className="po__reasons">{t(ui.notifyItems).split(" · ").map((x) => <li key={x}>{x}</li>)}</ul>}
                  <div className="po__stack">
                    {view.stage === "ask" ? (
                      <>
                        <button type="button" className="po__btn po__btn--primary" onClick={o.enableNotifications} disabled={o.busy}>{t(ui.allowNotifications)}</button>
                        <button type="button" className="po__link" onClick={o.disableNotifications} disabled={o.busy}>{t(ui.notNow)}</button>
                      </>
                    ) : <button type="button" className="po__btn po__btn--primary" onClick={() => o.go("home")}>{t(ui.goHome)}</button>}
                    {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
                  </div>
                </>
              )}
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
              {view.kind === "profile" && <Profile o={o} assetBase={assetBase} heading={heading} />}
              {view.kind === "account" && (
                <>
                  <h2 className="po__h2 po__h2--first">{t(ui.signInWith)}</h2>
                  <div className="po__rows">
                    <Row icon="phone" title={`+91 ${o.account.phone ?? ""}`} note={`${t(ui.mobile)} · ${t(ui.verified)}`} />
                    <Row icon="mail" title={o.account.email ?? ""} note={`${t(ui.gmail)} · ${t(ui.verified)}`} />
                  </div>
                  <h2 className="po__h2">{t(ui.settings)}</h2>
                  <div className="po__rows">
                    {o.notifications && (
                      <Row icon="bell" title={t(ui.notifications)} titleId="po-notif"
                        note={t(o.notifications === "blocked" ? ui.notifBlockedNote : o.notifications === "on" ? ui.notifOnNote : ui.notifOffNote)}
                        end={o.notifications === "blocked"
                          ? (o.openNotificationSettings ? <button type="button" className="po__btn po__btn--small" onClick={o.openNotificationSettings}>{t(ui.openSettings)}</button> : <span />)
                          : <button type="button" role="switch" aria-checked={o.notifications === "on"} aria-labelledby="po-notif" className="po__switch" disabled={o.busy} onClick={o.notifications === "on" ? o.disableNotifications : o.enableNotifications}><i /></button>} />
                    )}
                    <Row icon="globe" title={t(ui.language)} note={o.languages.find((x) => x.code === o.language)?.name} onClick={() => o.go("language")} />
                  </div>
                  {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
                  <div className="po__rows po__rows--apart">
                    <Row icon="out" title={t(ui.signOut)} onClick={o.signIn.signOut} end={<span />} />
                  </div>
                  <p className="po__deleterow"><button type="button" className="po__link" onClick={() => o.go("deletion")}>{t(ui.deleteAccount)}</button></p>
                </>
              )}
              {view.kind === "help" && (
                <>
                  <div className="po__rows po__rows--apart">
                    {o.support.whatsapp && <Row icon="chat" title={t(ui.whatsappUs)} note={t(ui.whatsappNote)} href={`https://wa.me/${o.support.whatsapp}`} />}
                    {o.support.phone && <Row icon="phone" title={t(ui.callUs)} note={`+${o.support.phone}`} href={`tel:+${o.support.phone}`} />}
                    {o.support.email && <Row icon="mail" title={t(ui.emailUs)} note={o.support.email} href={`mailto:${o.support.email}`} />}
                  </div>
                  {o.openPrivacy && (
                    <>
                      <h2 className="po__h2">{t(ui.more)}</h2>
                      <div className="po__rows"><Row icon="shield" title={t(ui.privacy)} onClick={o.openPrivacy} /></div>
                    </>
                  )}
                </>
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
                  {o.canSkip && !o.tab && <button type="button" className="po__btn" onClick={o.skip} disabled={o.busy}>{t(ui.skip)}</button>}
                  {o.tab
                    ? <button type="submit" className="po__btn po__btn--primary" disabled={o.busy || o.justSaved}>{o.busy && <Turning size={24} assetBase={assetBase} plain />}{t(o.busy ? ui.saving : o.justSaved ? ui.saved : ui.saveChanges)}</button>
                    : <button type="submit" className="po__btn po__btn--primary" disabled={o.busy}>{o.busy && <Turning size={24} assetBase={assetBase} plain />}{t(o.busy ? ui.saving : ui.saveContinue)}</button>}
                </div>
              </footer>
            )}
          </form>
          )}
          {o.signedIn && o.tab && !moment && (
            <nav className="po__tabs po__narrow" aria-label={t(ui.menu)}>
              {(["home", "availability", "profile"] as const).map((k) => (
                <button key={k} type="button" className={o.tab === k ? "is-on" : ""} aria-current={o.tab === k ? "page" : undefined} onClick={() => o.go(k)}>
                  <Icon name={k === "home" ? "home" : k === "availability" ? "calendar" : "user"} size={24} />
                  <span>{t(k === "home" ? ui.home : k === "availability" ? ui.tabAvailability : ui.tabProfile)}</span>
                </button>
              ))}
            </nav>
          )}
        </main>
      </div>
      )}
    </div>
  );
}

/** The size the travelling logo is drawn at; it is scaled to fit each slot. */
const FLY = 150;

// ---------------------------------------------------------------- icons and rows

const PATHS = {
  home: <><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 10v9.5h11V10" /><path d="M10 19.5v-5h4v5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" /></>,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4l1.6-2Z" /><path d="M10 21a2.2 2.2 0 0 0 4 0" /><path d="M12 3v2" /></>,
  chat: <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-7l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5Z" />,
  phone: <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.600 1.500C11 18.600 5.400 13 5 5.600A1.500 1.500 0 0 1 6.500 4Z" />,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  camera: <><path d="M4.5 8h3L9 5.5h6L16.5 8h3A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.500v-8A1.500 1.500 0 0 1 4.500 8Z" /><circle cx="12" cy="13.2" r="3.3" /></>,
  pin: <><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17" /></>,
  shield: <path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.500 7-4.500 7-9V6l-7-2.500Z" />,
  out: <path d="M10 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h4M14.5 8l4 4-4 4M18.5 12H9.5" />,
} as const;
type IconName = keyof typeof PATHS;
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>;
}

/** One line of a settings-style list: an icon, a title, a note, and either a control or an arrow. */
function Row({ icon, title, titleId, note, end, onClick, href }: { icon: IconName; title: string; titleId?: string; note?: string; end?: ReactNode; onClick?: () => void; href?: string }) {
  const inner = (
    <>
      <span className="po__rowicon"><Icon name={icon} /></span>
      <span className="po__tiletext"><strong id={titleId}>{title}</strong>{note && <small>{note}</small>}</span>
      {end ?? (onClick || href ? <span className="po__chev" aria-hidden="true">›</span> : null)}
    </>
  );
  if (href) return <a className="po__row" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{inner}</a>;
  return onClick ? <button type="button" className="po__row" onClick={onClick}>{inner}</button> : <div className="po__row">{inner}</div>;
}

// ---------------------------------------------------------------- the photo menu (wide screens)

const MENU = ["profile", "account"] as const;
const menuLabel = (o: App, k: (typeof MENU)[number]) => o.t(k === "profile" ? o.ui.myProfile : o.ui.myAccount);

function Avatar({ o }: { o: App }) {
  return (
    <span className="po__avatarimg po__avatarimg--small">
      {o.values.photo ? <img src={o.values.photo} alt="" /> : <span aria-hidden="true">{(o.values.fullName || o.account.email || "?").trim().charAt(0).toUpperCase()}</span>}
    </span>
  );
}

/** The status as a badge. With `open`, it is a button that goes to the Updates page. */
function StatusBadge({ o, open }: { o: App; open?: boolean }) {
  const label = o.t(STATUS_LABEL[o.status]);
  if (!open) return <span className={`po__pill is-${STATUS_TONE[o.status]}`}>{label}</span>;
  return (
    <button type="button" className={`po__pill po__pill--open is-${STATUS_TONE[o.status]}`} onClick={() => o.go("updates")} aria-label={o.t(o.ui.badgeHint, { status: label })}>
      {label}<span aria-hidden="true">›</span>
    </button>
  );
}

function BellIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4l1.6-2Z" />
      <path d="M10 21a2.2 2.2 0 0 0 4 0" />
      <path d="M12 3v2" />
    </svg>
  );
}

/** The bell in the top bar: a gold count of unread updates, and one swing when a new one arrives. */
function Bell({ o }: { o: App }) {
  const n = o.unreadCount;
  const [ring, setRing] = useState(0);
  const last = useRef(n);
  useEffect(() => {
    if (n > last.current) setRing((x) => x + 1);
    last.current = n;
  }, [n]);
  return (
    <button type="button" className="po__bell" onClick={() => o.go("updates")} aria-label={n ? o.t(o.ui.updatesUnread, { n }) : o.t(o.ui.updates)}>
      <span key={ring} className={ring ? "po__swing" : undefined}><BellIcon /></span>
      {n > 0 && <b key={n} aria-hidden="true">{n > 9 ? "9+" : n}</b>}
    </button>
  );
}

// ---------------------------------------------------------------- updates: the review timeline, then every update

function Updates({ o }: { o: App }) {
  const { t, ui } = o;
  return (
    <>
      <h2 className="po__h2 po__h2--first">{t(ui.whereProfile)}</h2>
      <ol className="po__line">
        {o.timeline.map((s, i) => (
          <li key={s.id} className={`po__step is-${s.tone}`} aria-current={s.tone === "now" || s.tone === "attention" ? "step" : undefined}>
            <span className="po__node" aria-hidden="true">{s.tone === "done" ? "✓" : s.tone === "attention" ? "!" : ""}</span>
            <div className="po__steptext" style={{ "--po-i": i } as CSSProperties}>
              <p className="po__steptitle"><strong>{s.title}</strong>{s.when && <time>{s.when}</time>}</p>
              {s.note && <p className="po__stepnote">{s.note}</p>}
              {s.message && <p className="po__stepmsg">{s.message}</p>}
              {s.action && <button type="button" className={`po__btn po__btn--small${s.action.primary ? " po__btn--primary" : ""}`} onClick={s.action.run} disabled={o.busy}>{s.action.label}</button>}
            </div>
          </li>
        ))}
      </ol>
      {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}

      <h2 className="po__h2">{t(ui.allUpdates)}</h2>
      {o.updates.length === 0 ? <p className="po__empty">{t(ui.noUpdates)}</p> : (
        <ul className="po__news">
          {o.updates.map((u) => {
            const fresh = o.freshUpdates.includes(u.id);
            const attention = u.kind === "changes_requested" || u.kind === "rejected" || u.kind === "suspended" || u.kind === "recitation_failed";
            const when = o.whenOf(u);
            return (
              <li key={u.id} className={`${fresh ? "is-new" : ""}${attention ? " is-attention" : ""}`}>
                <span className="po__newdot" aria-hidden="true" />
                <div>
                  <strong>{t(UPDATE_TEXT[u.kind])}</strong>
                  {u.reason && <p>{u.reason}</p>}
                  {(when || fresh) && <time>{when}{fresh && <em>{when ? " · " : ""}{t(ui.newLabel)}</em>}</time>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
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
          {MENU.map((k) => <button key={k} type="button" role="menuitem" onClick={() => { o.setMenuOpen(false); o.go(k); }}>{menuLabel(o, k)}</button>)}
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

// ---------------------------------------------------------------- Home: what you get, what you can do, your next step

function Home({ o, assetBase, heading }: { o: App; assetBase: string; heading: RefObject<HTMLHeadingElement> }) {
  const { t, ui } = o;
  const done = (id: string) => { const s = o.allSections.find((x) => x.id === id); return !!s && o.statusOf(s) === "done"; };
  const actions: [IconName, string, string, boolean, () => void][] = [
    ["user", t(ui.yourProfile), t(o.requiredDone ? ui.actProfileSee : ui.actProfileAdd), o.requiredDone, () => (o.requiredDone || !o.editable ? o.go("profile") : o.continueProfile())],
    ["calendar", t(ui.tabAvailability), t(ui.actAvailability), done("availability"), () => o.go("availability")],
    ["shield", t(ui.getVerified), t(ui.actVerify), o.recitation.state === "passed", () => o.go("recitation")],
    ["pin", t(o.allSections.find((x) => x.id === "serviceArea")!.title), t(ui.actArea), done("serviceArea"), () => o.openSection("serviceArea")],
  ];
  const benefits: [IconName, string, string][] = [
    ["pin", t(ui.benefit1), t(ui.benefit1Body)], ["shield", t(ui.benefit2), t(ui.benefit2Body)],
    ["calendar", t(ui.benefit3), t(ui.benefit3Body)], ["home", t(ui.benefit4), t(ui.benefit4Body)],
  ];
  const how = [[t(ui.how1), t(ui.how1Body)], [t(ui.how2), t(ui.how2Body)], [t(ui.how3), t(ui.how3Body)]];

  return (
    <>
      <section className="po__homehero">
        <div>
          <p className="po__hello">
            {o.firstName ? t(ui.namaste, { name: o.firstName }) : t(ui.namasteNoName)}
            {o.status === "approved" && <span className="po__tick" title={t(ui.verified)}> ✔<span className="po__sr">{t(ui.verified)}</span></span>}
          </p>
          <h1 className="po__title po__headline" tabIndex={-1} ref={heading}>{t(ui.headline)}</h1>
          <p className="po__intro po__wide">{t(ui.heroBody)}</p>
        </div>
        <section className={`po__banner${o.status === "approved" ? " is-verified" : ""}`}>
          <div className="po__bannerhead">
            <h2>{t(o.editable ? ui.nextStep : ui.yourProfile)}</h2>
            <StatusBadge o={o} open />
          </div>
          <RiderBar value={o.profileProgress} label={t(ui.bannerTitle)} assetBase={assetBase} />
          <p>{t(o.status === "approved" ? ui.bannerVerified : !o.editable ? ui.bannerLocked : o.requiredDone ? ui.bannerReady : ui.bannerNeeds)}</p>
          {/* One main button, chosen by where the profile stands. */}
          {o.editable && !o.requiredDone && <button type="button" className="po__btn po__btn--primary po__cta" onClick={o.continueProfile}>{t(ui.continueProfile)}</button>}
          {o.editable && o.requiredDone && (
            <button type="button" className="po__btn po__btn--primary po__cta" onClick={o.submitForReview} disabled={o.busy}>
              {o.busy && <Turning size={24} assetBase={assetBase} plain />}{t(o.busy ? ui.submitting : ui.submitForReview)}
            </button>
          )}
          {o.status === "approved" && <button type="button" className="po__btn po__cta po__cta--onDark" onClick={() => o.go("availability")}>{t(ui.updateAvailability)}</button>}
          {o.failed && <p className="po__error" role="alert">{t(ui.failed)}</p>}
        </section>
      </section>

      {o.reviewerMessage && (
        <section className="po__notice po__notice--attention">
          <strong>{t(ui.reviewerMessage)}</strong>
          <p>{o.reviewerMessage}</p>
          <div className="po__noticerow">
            {o.status === "changes_requested" && <button type="button" className="po__btn po__btn--primary po__btn--small" onClick={() => o.go("profile")}>{t(ui.updateProfile)}</button>}
            <button type="button" className="po__link" onClick={() => o.go("updates")}>{t(ui.seeUpdates)}</button>
          </div>
        </section>
      )}

      <h2 className="po__h2">{t(ui.whatYouCanDo)}</h2>
      <ul className="po__actiongrid">
        {actions.map(([icon, title, note, ok, run]) => (
          <li key={title}>
            <button type="button" className="po__action" onClick={run}>
              <span className="po__rowicon"><Icon name={icon} /></span>
              <strong>{title}{ok && <span className="po__tick"> ✔<span className="po__sr">{t(ui.done)}</span></span>}</strong>
              <small>{note}</small>
            </button>
          </li>
        ))}
      </ul>

      <h2 className="po__h2">{t(ui.whatYouGet)}</h2>
      <ul className="po__benefits">
        {benefits.map(([icon, title, text]) => <li key={title}><span className="po__benefiticon"><Icon name={icon} size={26} /></span><strong>{title}</strong><p>{text}</p></li>)}
      </ul>

      <h2 className="po__h2">{t(ui.howItWorks)}</h2>
      <ol className="po__howworks">
        {how.map(([title, text], i) => <li key={title}><b aria-hidden="true">{i + 1}</b><div><strong>{title}</strong><p>{text}</p></div></li>)}
      </ol>
    </>
  );
}

// ---------------------------------------------------------------- Profile: who you are, every section with its Edit, then the account

function Profile({ o, assetBase, heading }: { o: App; assetBase: string; heading: RefObject<HTMLHeadingElement> }) {
  const { t, ui } = o;
  const r = o.recitation;
  const personal = o.allSections.find((s) => s.id === "personal")!;
  const years = o.values.experienceYears;
  const recNote = r.state === "passed" ? t(ui.passedShort) : r.state === "checking" ? t(ui.beingCheckedShort) : r.reviewRequested ? t(ui.reviewAsked) : t(ui.attemptsLeft, { n: r.attemptsLeft });
  return (
    <div className="po__cols">
      <div className="po__col">
        <section className="po__idcard">
          <span className="po__idphoto">
            <span className="po__avatarimg">{o.values.photo ? <img src={o.values.photo} alt="" /> : <span aria-hidden="true">{(o.values.fullName || o.account.email || "?").trim().charAt(0).toUpperCase()}</span>}</span>
            {o.canEdit(personal) && <button type="button" className="po__idcamera" onClick={() => o.openSection("personal")} aria-label={t(ui.changePhoto)}><Icon name="camera" size={18} /></button>}
          </span>
          <h1 className="po__title" tabIndex={-1} ref={heading}>
            {o.values.fullName || t(ui.myProfile)}
            {o.status === "approved" && <span className="po__tick" title={t(ui.verified)}> ✔<span className="po__sr">{t(ui.verified)}</span></span>}
          </h1>
          {(o.values.city || years) && <p className="po__intro">{[o.values.city, years && `${t(o.allSections.flatMap((s) => s.steps).flatMap((st) => st.fields).find((f) => f.id === "experienceYears")!.label)}: ${years}`].filter(Boolean).join(" · ")}</p>}
          <StatusBadge o={o} open />
          {o.status !== "approved" && <div className="po__idbar"><RiderBar value={o.profileProgress} label={t(ui.bannerTitle)} assetBase={assetBase} /></div>}
        </section>

        <div className="po__narrow">
          <h2 className="po__h2">{t(ui.accountSettings)}</h2>
          <div className="po__rows">
            <Row icon="user" title={t(ui.myAccount)} note={t(ui.accountNote)} onClick={() => o.go("account")} />
            <Row icon="globe" title={t(ui.language)} note={o.languages.find((x) => x.code === o.language)?.name} onClick={() => o.go("language")} />
            <Row icon="chat" title={t(ui.help)} onClick={() => o.go("help")} />
            <Row icon="out" title={t(ui.signOut)} onClick={o.signIn.signOut} end={<span />} />
          </div>
        </div>
      </div>

      <div className="po__col po__col--main">
        {o.allSections.map((s) => {
          const st = o.statusOf(s);
          return (
            <section key={s.id} className="po__card po__detail">
              <div className="po__detailhead">
                <h2 className="po__cardtitle">{t(s.title)}</h2>
                {o.canEdit(s) && <button type="button" className="po__btn po__btn--small" onClick={() => (s.id === "availability" ? o.go("availability") : o.openSection(s.id))}>{t(st === "empty" ? ui.add : ui.editSection)}<span className="po__sr"> {t(s.title)}</span></button>}
              </div>
              {st === "empty" ? <p className="po__hint">{t(s.summary)}</p> : (
                <dl>
                  {s.steps.flatMap((x) => visibleFields(x, o.values)).filter((f) => f.type !== "search" && f.id !== "accountNumberAgain" && f.id !== "photo").map((f) => (
                    <div key={f.id}><dt>{t(f.label)}</dt><dd>{(f.id === "serviceCentre" ? o.centre?.label : display(f, o.values, o.lang)) || t(ui.notAdded)}</dd></div>
                  ))}
                </dl>
              )}
            </section>
          );
        })}
        <section className="po__card po__detail">
          <div className="po__detailhead">
            <h2 className="po__cardtitle">{t(ui.getVerified)}{r.state === "passed" && <span className="po__tick"> ✔</span>}</h2>
            {r.state !== "passed" && <button type="button" className="po__btn po__btn--small" onClick={() => o.go("recitation")}>{t(r.state === "none" ? ui.record : ui.open)}</button>}
          </div>
          <p className="po__hint">{r.state === "none" ? t(ui.getVerifiedSummary) : recNote}</p>
        </section>
      </div>
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
  const camOff = cam.mode === "off" || cam.mode === "denied";
  return (
    <div className="po__fields">
      <ol className="po__recsteps">
        {[ui.recStep1, ui.recStep2, ui.recStep3].map((x, i) => <li key={i}><b aria-hidden="true">{i + 1}</b>{t(x)}</li>)}
      </ol>
      {lastFailed && <p className="po__notice po__notice--attention" role="status">{t(ui.attemptFailed, { n: lastFailed.n })}</p>}
      <div className="po__field">
        <label className="po__label" htmlFor="po-shloka">{t(ui.whichShloka)}</label>
        <select id="po-shloka" className="po__input" value={r.shlokaId} disabled={r.uploading || cam.mode === "recording"} onChange={(e) => r.setShlokaId(e.target.value)}>
          <option value="">{t(ui.chooseShloka)}</option>
          {r.shlokas.map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
        </select>
      </div>

      {/* While the camera is off it is one line, so the Record button stays in view. */}
      {camOff && !r.uploading && (
        <div className="po__camoff">
          <span className="po__rowicon"><Icon name="camera" /></span>
          <span className="po__tiletext"><strong>{t(cam.mode === "denied" ? ui.cameraDenied : ui.cameraOff)}</strong>{cam.mode === "off" && <small>{t(ui.cameraOffNote)}</small>}</span>
        </div>
      )}
      <div className={`po__camera is-${cam.mode}${r.uploading ? " is-checking" : ""}`} hidden={camOff && !r.uploading}>
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
      <table className="po__weektable">
        <thead>
          <tr>
            <th scope="col"><span className="po__sr">{t(f.label)}</span></th>
            {SLOTS.map((sl) => {
              const all = DAYS.every((d) => (week[d.value] ?? []).includes(sl.value));
              const [name, hours] = t(sl.label).split(", ");
              return (
                <th key={sl.value} scope="col">
                  {/* Tap a time of day to switch it on or off for the whole week. */}
                  <button type="button" className="po__colhead" aria-pressed={all} aria-label={t(ui.everyDayHint, { slot: name })}
                    onClick={() => set(Object.fromEntries(DAYS.map((d) => { const list: string[] = week[d.value] ?? []; return [d.value, all ? list.filter((x) => x !== sl.value) : list.includes(sl.value) ? list : [...list, sl.value]]; })))}>
                    <strong>{name}</strong>{hours && <small>{hours}</small>}<em>{t(ui.everyDay)}{all ? " ✓" : ""}</em>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((d) => (
            <tr key={d.value}>
              <th scope="row">{t(d.label)}</th>
              {SLOTS.map((sl) => {
                const list: string[] = week[d.value] ?? [];
                const on = list.includes(sl.value);
                return (
                  <td key={sl.value}>
                    <button type="button" className={`po__cell${on ? " is-on" : ""}`} aria-pressed={on} aria-label={`${t(d.label)}, ${t(sl.label)}`}
                      onClick={() => set({ ...week, [d.value]: on ? list.filter((x) => x !== sl.value) : [...list, sl.value] })}>{on ? "✓" : ""}</button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
  // One address with a Change link; the search box appears only when asked for, or when there is no address yet.
  const [changing, setChanging] = useState(false);
  const searching = !!o.search && (changing || !c);
  return (
    <>
      {searching ? (
        <div className="po__field">
          <label className="po__sr" htmlFor={`${id}-search`}>{t(ui.differentCentre)}</label>
          <Search id={`${id}-search`} o={o} placeholder={t(ui.differentCentre)} onPick={(p) => { o.setCentre(p); setChanging(false); }} />
          {c && <button type="button" className="po__link" onClick={() => setChanging(false)}>{t(ui.cancel)}</button>}
        </div>
      ) : c ? (
        <div className="po__placerow">
          <span className="po__rowicon"><Icon name="pin" /></span>
          <span className="po__tiletext"><strong>{c.label}</strong></span>
          {o.search && <button type="button" className="po__link" onClick={() => setChanging(true)}>{t(ui.changeCentre)}</button>}
        </div>
      ) : <p className="po__notice">{t(ui.noCentre)}</p>}
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
