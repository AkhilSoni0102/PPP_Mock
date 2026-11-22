"use client";

// Ideation sketch of a reworked layout — NOT part of the pandit app.
// One small prototype you can click through. It follows where popular apps keep things:
//   · phone: three tabs at the bottom (Home, Availability, Profile), the bell top right
//   · website: one bar across the top (Home, Availability, Help), the bell, and the photo, which holds the profile
//   · Home is not the profile editor: it says what the platform gives, what you can do, and your next step
//   · steps are focused: only Back and the progress bar; inner pages on the phone hide the tabs
//   · one main button per screen, account and rare actions tucked under Profile / the photo menu

import { useState, type CSSProperties, type ReactNode } from "react";

export type ReviewScreen = "home" | "step" | "profile" | "avail" | "verify" | "area" | "help" | "account" | "updates";
type P = { assetBase: string; start: ReviewScreen };
type Go = (s: ReviewScreen) => void;

// ---------------------------------------------------------------- small shared pieces

function GlowLogo({ size, assetBase }: { size: number; assetBase: string }) {
  return (
    <span className="id__logo" style={{ "--id-size": `${size}px` } as CSSProperties} aria-hidden="true">
      <img className="id__glow" src={`${assetBase}/glow.png`} alt="" />
      <img className="id__mark" src={`${assetBase}/logo.png`} alt="" />
    </span>
  );
}

function RiderBar({ value, label, assetBase }: { value: number; label: string; assetBase: string }) {
  return (
    <div className="id__bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} style={{ "--id-v": value } as CSSProperties}>
      <span className="id__track"><span className="id__fill" /></span>
      <span className="id__rider"><GlowLogo size={34} assetBase={assetBase} /></span>
    </div>
  );
}

const PATHS: Record<string, ReactNode> = {
  home: <><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 10v9.5h11V10" /><path d="M10 19.5v-5h4v5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.700 2 7.500 6" /></>,
  bell: <><path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.600 2H4.400l1.600-2Z" /><path d="M10 21a2.200 2.200 0 0 0 4 0" /><path d="M12 3v2" /></>,
  chat: <><path d="M5 5.500h14a1.500 1.500 0 0 1 1.500 1.500v8.500A1.500 1.500 0 0 1 19 17h-7l-4.500 3.500V17H5a1.500 1.500 0 0 1-1.500-1.500V7A1.500 1.500 0 0 1 5 5.500Z" /></>,
  phone: <><path d="M6.500 4h3l1.500 4-2 1.500a11 11 0 0 0 5.500 5.500l1.500-2 4 1.500v3a1.500 1.500 0 0 1-1.600 1.500C11 18.600 5.400 13 5 5.600A1.500 1.500 0 0 1 6.500 4Z" /></>,
  mail: <><rect x="3.500" y="5.500" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  camera: <><path d="M4.500 8h3l1.500-2.500h6L16.500 8h3A1.500 1.500 0 0 1 21 9.500v8A1.500 1.500 0 0 1 19.500 19h-15A1.500 1.500 0 0 1 3 17.500v-8A1.500 1.500 0 0 1 4.500 8Z" /><circle cx="12" cy="13.200" r="3.300" /></>,
  pin: <><path d="M12 21s6.500-6 6.500-11a6.500 6.500 0 0 0-13 0c0 5 6.500 11 6.500 11Z" /><circle cx="12" cy="10" r="2.300" /></>,
  globe: <><circle cx="12" cy="12" r="8.500" /><path d="M3.500 12h17M12 3.500c2.500 2.500 2.500 14.500 0 17M12 3.500c-2.500 2.500-2.500 14.500 0 17" /></>,
  shield: <><path d="M12 3.500 5 6v5.500c0 4.500 3 7.500 7 9 4-1.500 7-4.500 7-9V6l-7-2.500Z" /></>,
  out: <><path d="M10 4.500H6A1.500 1.500 0 0 0 4.500 6v12A1.500 1.500 0 0 0 6 19.500h4M14.500 8l4 4-4 4M18.500 12H9.500" /></>,
};
function Icon({ name, size = 22 }: { name: keyof typeof PATHS; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.700" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>;
}

function Row({ icon, title, note, end, onClick, danger }: { icon: keyof typeof PATHS; title: string; note?: string; end?: ReactNode; onClick?: () => void; danger?: boolean }) {
  const inner = (
    <>
      <span className="rv__rowicon"><Icon name={icon} /></span>
      <span className="po__tiletext"><strong>{title}</strong>{note && <small>{note}</small>}</span>
      {end ?? (onClick ? <span className="rv__chev" aria-hidden="true">›</span> : null)}
    </>
  );
  return onClick
    ? <button type="button" className={`rv__row${danger ? " is-danger" : ""}`} onClick={onClick}>{inner}</button>
    : <div className="rv__row">{inner}</div>;
}

type Stage = "new" | "ready" | "changes" | "verified";
const STAGES: [Stage, string][] = [["new", "New profile"], ["ready", "Required details are in"], ["changes", "Changes requested"], ["verified", "Verified"]];
const TABS: [ReviewScreen, string, keyof typeof PATHS][] = [["home", "Home", "home"], ["avail", "Availability", "calendar"], ["profile", "Profile", "user"]];
const WIDE_NAV: [ReviewScreen, string][] = [["home", "Home"], ["avail", "Availability"], ["help", "Help"]];
const TITLES: Partial<Record<ReviewScreen, string>> = { verify: "Get verified", area: "Service area", help: "Help and contact", account: "My account", updates: "Updates" };

// ---------------------------------------------------------------- the prototype

export default function Review({ assetBase, start }: P) {
  const [screen, setScreen] = useState<ReviewScreen>(start);
  const [stage, setStage] = useState<Stage>(start === "home" ? "ready" : "verified");
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(2);
  const go: Go = (s) => { setMenu(false); if (s === "updates") setUnread(0); setScreen(s); };

  const focused = screen === "step" || screen === "area"; // a question flow: nothing but Back and the bar
  const tab = TABS.find(([k]) => k === screen)?.[0];
  const back: ReviewScreen = screen === "account" || screen === "help" ? "profile" : "home";

  return (
    <>
      {(screen === "home" || screen === "profile") && (
        <div className="nt__demo">
          <label htmlFor="rv-stage">Demo: the profile is</label>
          <select id="rv-stage" className="po__input" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
      )}

      <div className="rv">
        <header className={`rv__top${focused ? " is-focused" : ""}`}>
          {focused ? (
            <>
              <button type="button" className="po__icon" onClick={() => go("home")} aria-label="Back"><span aria-hidden="true">←</span></button>
              <RiderBar value={screen === "step" ? 0.35 : 0.7} label="Progress" assetBase={assetBase} />
              <button type="button" className="po__link rv__wide" onClick={() => go("home")}>Save and exit</button>
            </>
          ) : (
            <>
              {tab ? (
                <button type="button" className="rv__brand" onClick={() => go("home")}><GlowLogo size={34} assetBase={assetBase} /><span>ProPoojaPaath</span></button>
              ) : (
                <>
                  <button type="button" className="po__icon rv__narrow" onClick={() => go(back)} aria-label="Back"><span aria-hidden="true">←</span></button>
                  <span className="rv__pagetitle rv__narrow">{TITLES[screen]}</span>
                  <button type="button" className="rv__brand rv__wide" onClick={() => go("home")}><GlowLogo size={34} assetBase={assetBase} /><span>ProPoojaPaath</span></button>
                </>
              )}
              <nav className="rv__nav rv__wide" aria-label="Main">
                {WIDE_NAV.map(([k, label]) => <button key={k} type="button" className={k === screen ? "is-on" : ""} aria-current={k === screen ? "page" : undefined} onClick={() => go(k)}>{label}</button>)}
              </nav>
              <span className="rv__spacer" />
              <button type="button" className="po__lang rv__wide">English</button>
              <button type="button" className="nt__bell" onClick={() => go("updates")} aria-label={unread ? `Updates, ${unread} unread` : "Updates"}>
                <Icon name="bell" size={26} />{unread > 0 && <b aria-hidden="true">{unread}</b>}
              </button>
              <div className="rv__wide rv__menuwrap">
                <button type="button" className="nt__avatar rv__avatarbtn" aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu" onClick={() => setMenu(!menu)}>R</button>
                {menu && (
                  <div className="rv__menu" role="menu">
                    <p><strong>Ramesh Shastri</strong><small>+91 98765 43210</small></p>
                    <button type="button" role="menuitem" onClick={() => go("profile")}>My profile</button>
                    <button type="button" role="menuitem" onClick={() => go("account")}>My account</button>
                    <button type="button" role="menuitem" onClick={() => setMenu(false)}>Sign out</button>
                  </div>
                )}
              </div>
            </>
          )}
        </header>

        <main className={`rv__main rv__main--${screen}`} key={screen}>
          {!tab && !focused && <h1 className="po__title rv__wide rv__h1">{TITLES[screen]}</h1>}
          {screen === "home" && <Home assetBase={assetBase} stage={stage} go={go} />}
          {screen === "step" && <Step go={go} />}
          {screen === "profile" && <Profile assetBase={assetBase} stage={stage} go={go} />}
          {screen === "avail" && <Availability />}
          {screen === "verify" && <Verify />}
          {screen === "area" && <Area go={go} />}
          {screen === "help" && <Help />}
          {screen === "account" && <Account />}
          {screen === "updates" && <UpdatesLite />}
        </main>

        {tab && (
          <nav className="rv__tabs rv__narrow" aria-label="Main">
            {TABS.map(([k, label, icon]) => (
              <button key={k} type="button" className={k === tab ? "is-on" : ""} aria-current={k === tab ? "page" : undefined} onClick={() => go(k)}>
                <Icon name={icon} size={24} /><span>{label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Home: what you get, what you can do, your next step

const BENEFITS: [keyof typeof PATHS, string, string][] = [
  ["pin", "Yajmans near you", "Families looking for a pandit in your area find you here."],
  ["shield", "A profile they trust", "The verified tick tells yajmans who you are and what you do."],
  ["calendar", "Your days, your timings", "You decide when you are free, and change it whenever you like."],
  ["home", "Everything in one place", "Your profile, timings and updates, on your phone or computer."],
];
const HOW: [string, string][] = [
  ["Complete your profile", "Tell yajmans about your experience and the pujas you perform."],
  ["We verify you", "Recite one shloka. Our team checks your profile."],
  ["Yajmans find you", "Your verified profile is shown to families near you. Bookings open soon."],
];

function Home({ assetBase, stage, go }: { assetBase: string; stage: Stage; go: Go }) {
  const badge: Record<Stage, [string, string]> = { new: ["Not submitted", ""], ready: ["Not submitted", ""], changes: ["Changes requested", "is-attention"], verified: ["Verified", "is-good"] };
  const guide: Record<Stage, string> = {
    new: "Add your name, gender, date of birth and address to get started.",
    ready: "The required details are in. You can submit now and add the rest later.",
    changes: "The reviewer asked for one change before approving.",
    verified: "Yajmans can now find you.",
  };
  const profileDone = stage !== "new";
  const ACTIONS: [keyof typeof PATHS, string, string, ReviewScreen, boolean][] = [
    ["user", "Your profile", profileDone ? "See or edit your details" : "Add your details", profileDone ? "profile" : "step", profileDone],
    ["calendar", "Availability", "Set the days and times you are free", "avail", stage === "verified"],
    ["shield", "Get verified", "Recite one shloka for the tick", "verify", stage === "verified"],
    ["pin", "Service area", "Choose how far you travel", "area", stage === "verified"],
  ];
  return (
    <>
      <section className="rv__hero">
        <div className="rv__herotext">
          <p className="rv__hello">Namaste, Ramesh{stage === "verified" && <span className="po__tick"> ✔</span>}</p>
          <h1 className="po__title rv__headline">Your knowledge, found by the families who need it</h1>
          <p className="po__intro rv__wide">ProPoojaPaath brings yajmans to verified pandits. Build your profile once, choose your timings, and let families near you find you.</p>
        </div>
        <section className={`po__banner id__banner rv__next${stage === "verified" ? " is-verified" : ""}`}>
          <div className="po__bannerhead">
            <h2>{stage === "verified" || stage === "changes" ? "Your profile" : "Your next step"}</h2>
            <button type="button" className={`po__pill nt__badge ${badge[stage][1]}`} onClick={() => go("updates")}>{badge[stage][0]}<span aria-hidden="true">›</span></button>
          </div>
          <RiderBar value={stage === "new" ? 0.12 : stage === "ready" ? 0.5 : 1} label="Profile progress" assetBase={assetBase} />
          <p>{guide[stage]}</p>
          {stage === "new" && <button type="button" className="po__btn po__btn--primary rv__cta" onClick={() => go("step")}>Continue your profile</button>}
          {stage === "ready" && <button type="button" className="po__btn po__btn--primary rv__cta">Submit for review</button>}
          {stage === "changes" && <button type="button" className="po__btn po__btn--primary rv__cta" onClick={() => go("updates")}>See what to fix</button>}
          {stage === "verified" && <button type="button" className="po__btn rv__cta rv__cta--onDark" onClick={() => go("avail")}>Update your availability</button>}
        </section>
      </section>

      <h2 className="po__h2">What you can do here</h2>
      <ul className="rv__actionsgrid">
        {ACTIONS.map(([icon, title, note, target, done]) => (
          <li key={title}>
            <button type="button" className="rv__action" onClick={() => go(target)}>
              <span className="rv__rowicon"><Icon name={icon} /></span>
              <strong>{title}{done && <span className="po__tick"> ✔</span>}</strong>
              <small>{note}</small>
            </button>
          </li>
        ))}
      </ul>

      <h2 className="po__h2">What you get with ProPoojaPaath</h2>
      <ul className="rv__benefits">
        {BENEFITS.map(([icon, title, text]) => (
          <li key={title}><span className="rv__benefiticon"><Icon name={icon} size={26} /></span><strong>{title}</strong><p>{text}</p></li>
        ))}
      </ul>

      <h2 className="po__h2">How it works</h2>
      <ol className="rv__howworks">
        {HOW.map(([title, text], i) => <li key={title}><b>{i + 1}</b><div><strong>{title}</strong><p>{text}</p></div></li>)}
      </ol>
    </>
  );
}

// ---------------------------------------------------------------- a step: nothing on screen but the question

function Step({ go }: { go: Go }) {
  const [gender, setGender] = useState("Male");
  return (
    <div className="rv__focus">
      <p className="po__section">Personal</p>
      <h1 className="po__title">Tell us about yourself</h1>
      <p className="po__intro">This is how yajmans will see you.</p>
      <div className="rv__field">
        <span className="po__label">Profile photo</span>
        <div className="rv__photo">
          <span className="rv__bigavatar">R</span>
          <button type="button" className="po__btn po__btn--small"><Icon name="camera" size={20} /> Add a photo</button>
        </div>
      </div>
      <div className="rv__field">
        <label className="po__label" htmlFor="rv-name">Full name</label>
        <input id="rv-name" className="po__input" defaultValue="Ramesh Shastri" />
      </div>
      <div className="rv__field">
        <span className="po__label">Gender</span>
        <div className="po__chips">
          {["Male", "Female", "Other", "Prefer not to say"].map((g) => <button key={g} type="button" className={`po__chip${g === gender ? " is-on" : ""}`} aria-pressed={g === gender} onClick={() => setGender(g)}>{g}</button>)}
        </div>
      </div>
      <div className="rv__actions">
        <button type="button" className="po__btn po__btn--primary" onClick={() => go("home")}>Save and continue</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Profile: who you are on top, sections with a clear Edit, account below

const DETAILS: [string, [string, string][]][] = [
  ["Personal", [["Full name", "Ramesh Shastri"], ["Gender", "Male"], ["Date of birth", "5 Nov 1978"]]],
  ["Address", [["House, street, area", "B 21/14 Assi Ghat Road"], ["City", "Varanasi, Uttar Pradesh 221005"]]],
  ["Religious practice", [["Experience", "22 years"], ["Languages", "Hindi, Sanskrit, English"], ["Pujas", "Satyanarayan Katha, Griha Pravesh, Rudrabhishek"]]],
  ["Service area", [["Travels", "Up to 10 km from Varanasi 221005"]]],
];

function Profile({ assetBase, stage, go }: { assetBase: string; stage: Stage; go: Go }) {
  const verified = stage === "verified";
  return (
    <div className="rv__cols rv__cols--profile">
      <div className="rv__col">
        <section className="rv__idcard">
          <span className="rv__bigavatar">R<button type="button" className="rv__camera" aria-label="Change photo"><Icon name="camera" size={18} /></button></span>
          <h1 className="po__title">Ramesh Shastri{verified && <span className="po__tick"> ✔</span>}</h1>
          <p className="po__intro">Varanasi · 22 years of experience</p>
          <button type="button" className={`po__pill nt__badge ${verified ? "is-good" : stage === "changes" ? "is-attention" : ""}`} onClick={() => go("updates")}>
            {verified ? "Verified" : stage === "changes" ? "Changes requested" : "Not submitted"}<span aria-hidden="true">›</span>
          </button>
          {!verified && <div className="rv__idbar"><RiderBar value={stage === "new" ? 0.12 : 0.5} label="Profile progress" assetBase={assetBase} /></div>}
        </section>

        <div className="rv__narrow">
          <h2 className="po__h2">Account and settings</h2>
          <div className="rv__rows">
            <Row icon="user" title="My account" note="Sign-in details and notifications" onClick={() => go("account")} />
            <Row icon="globe" title="Language" note="English" onClick={() => undefined} />
            <Row icon="chat" title="Help and contact" onClick={() => go("help")} />
            <Row icon="out" title="Sign out" onClick={() => undefined} end={<span />} />
          </div>
        </div>
      </div>

      <div className="rv__col rv__col--first">
        {DETAILS.map(([title, rows]) => (
          <section className="po__card rv__detail" key={title}>
            <div className="rv__detailhead">
              <h2>{title}</h2>
              <button type="button" className="po__btn po__btn--small" onClick={() => go(title === "Service area" ? "area" : "step")}>Edit</button>
            </div>
            <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </section>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Availability: its own place, with shortcuts

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: [string, string][] = [["Morning", "6 to 10 am"], ["Afternoon", "12 to 4 pm"], ["Evening", "5 to 9 pm"]];

function Availability() {
  const [on, setOn] = useState<string[]>(DAYS.flatMap((d) => [`${d}-0`, `${d}-2`]));
  const [dirty, setDirty] = useState(false);
  const flip = (ids: string[], make?: boolean) => {
    const all = ids.every((i) => on.includes(i));
    const next = make ?? !all;
    setOn(next ? Array.from(new Set([...on, ...ids])) : on.filter((i) => !ids.includes(i)));
    setDirty(true);
  };
  return (
    <div className="rv__focus rv__focus--wide">
      <h1 className="po__title">When are you free?</h1>
      <p className="po__intro">These times repeat every week. You can change them whenever you like.</p>

      <table className="rv__week">
        <thead>
          <tr>
            <th scope="col"><span className="rv__sr">Day</span></th>
            {SLOTS.map(([s, hours], c) => {
              const col = DAYS.map((d) => `${d}-${c}`);
              const all = col.every((i) => on.includes(i));
              return (
                <th key={s} scope="col">
                  <button type="button" className="rv__colhead" aria-pressed={all} onClick={() => flip(col)} aria-label={`${s}, every day`}>
                    <strong>{s}</strong><small>{hours}</small><em>{all ? "Every day ✓" : "Every day"}</em>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((d) => (
            <tr key={d}>
              <th scope="row">{d}</th>
              {SLOTS.map(([s], c) => {
                const id = `${d}-${c}`;
                const sel = on.includes(id);
                return <td key={s}><button type="button" className={`rv__cell${sel ? " is-on" : ""}`} aria-pressed={sel} aria-label={`${d} ${s}`} onClick={() => flip([id])}>{sel ? "✓" : ""}</button></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rv__rows" style={{ marginTop: 18 }}>
        <Row icon="calendar" title="Days off" note="No days off planned" onClick={() => undefined} end={<span className="po__status">Add ›</span>} />
      </div>
      <div className="rv__actions">
        <button type="button" className="po__btn po__btn--primary" disabled={!dirty} onClick={() => setDirty(false)}>{dirty ? "Save changes" : "Saved"}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Get verified: the button is always in view

function Verify() {
  const [shloka, setShloka] = useState("");
  const [cam, setCam] = useState(false);
  return (
    <div className="rv__focus">
      <p className="po__intro rv__lead">Choose a shloka you know by heart and recite it to the camera. Our team checks it and you get the verified tick.</p>
      <ol className="rv__how">
        <li><b>1</b>Choose a shloka</li>
        <li><b>2</b>Recite it to the camera</li>
        <li><b>3</b>We check it</li>
      </ol>
      <div className="rv__field">
        <label className="po__label" htmlFor="rv-shloka">Which shloka will you recite?</label>
        <select id="rv-shloka" className="po__input" value={shloka} onChange={(e) => setShloka(e.target.value)}>
          <option value="">Choose a shloka</option>
          <option>Gayatri Mantra</option><option>Mahamrityunjaya Mantra</option><option>Shanti Mantra</option>
        </select>
      </div>
      {cam ? (
        <div className="rv__camera-on" role="img" aria-label="Camera preview"><span>Camera preview</span></div>
      ) : (
        <div className="rv__camera-off">
          <span className="rv__rowicon"><Icon name="camera" /></span>
          <span className="po__tiletext"><strong>The camera is off</strong><small>It turns on when you tap Record. Find a quiet, well-lit place.</small></span>
        </div>
      )}
      <div className="rv__actions">
        <button type="button" className="po__btn po__btn--primary" disabled={!shloka} onClick={() => setCam(!cam)}>
          <span className="rv__recdot" aria-hidden="true" />{cam ? "Stop" : "Record"}
        </button>
      </div>
      <p className="po__hint rv__centerhint">{shloka ? "You have 3 attempts." : "Choose a shloka first. You have 3 attempts."}</p>
    </div>
  );
}

// ---------------------------------------------------------------- Service area: one address, one Change

function Area({ go }: { go: Go }) {
  const [km, setKm] = useState("10");
  const [edit, setEdit] = useState(false);
  return (
    <div className="rv__focus">
      <p className="po__section">Service area</p>
      <h1 className="po__title">Where do you travel for pujas?</h1>
      <div className="rv__field">
        <span className="po__label">Centre of your service area</span>
        {edit ? (
          <input className="po__input" autoFocus placeholder="Search an area or PIN code" onBlur={() => setEdit(false)} />
        ) : (
          <div className="rv__place">
            <span className="rv__rowicon"><Icon name="pin" /></span>
            <span className="po__tiletext"><strong>Assi Ghat, Varanasi 221005</strong><small>Your home address</small></span>
            <button type="button" className="po__link" onClick={() => setEdit(true)}>Change</button>
          </div>
        )}
      </div>
      <div className="rv__map" aria-hidden="true"><i style={{ "--rv-r": `${28 + Math.min(Number(km), 50) * 1.3}%` } as CSSProperties} /><b /></div>
      <div className="rv__field">
        <span className="po__label">How far do you travel?</span>
        <div className="po__chips">
          {["2", "5", "10", "15", "25", "50"].map((k) => <button key={k} type="button" className={`po__chip${k === km ? " is-on" : ""}`} aria-pressed={k === km} onClick={() => setKm(k)}>{k} km</button>)}
        </div>
      </div>
      <div className="rv__actions">
        <button type="button" className="po__btn" onClick={() => go("home")}>Skip for now</button>
        <button type="button" className="po__btn po__btn--primary" onClick={() => go("home")}>Save and continue</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Help, Account, Updates

function Help() {
  return (
    <div className="rv__focus">
      <p className="po__intro rv__lead">Our team is here from 9 am to 7 pm, every day.</p>
      <div className="rv__rows">
        <Row icon="chat" title="WhatsApp us" note="Usually the fastest. Replies in Hindi or English" onClick={() => undefined} />
        <Row icon="phone" title="Call us" note="Number to be added" onClick={() => undefined} />
        <Row icon="mail" title="Email us" note="propoojapaath@gmail.com" onClick={() => undefined} />
      </div>
      <h2 className="po__h2">More</h2>
      <div className="rv__rows">
        <Row icon="shield" title="Privacy policy" onClick={() => undefined} />
      </div>
    </div>
  );
}

function Account() {
  const [on, setOn] = useState(true);
  return (
    <div className="rv__focus">
      <h2 className="po__h2 rv__flush">You sign in with</h2>
      <div className="rv__rows">
        <Row icon="phone" title="+91 98765 43210" note="Mobile · Verified" />
        <Row icon="mail" title="shastri.sample@gmail.com" note="Gmail · Verified" />
      </div>
      <h2 className="po__h2">Settings</h2>
      <div className="rv__rows">
        <Row icon="bell" title="Notifications" note={on ? "We tell you when your profile status changes" : "Off. Your updates are still under the bell"}
          end={<button type="button" role="switch" aria-checked={on} aria-label="Notifications" className="nt__switch" onClick={() => setOn(!on)}><i /></button>} />
        <Row icon="globe" title="Language" note="English" onClick={() => undefined} />
      </div>
      <div className="rv__rows" style={{ marginTop: 26 }}>
        <Row icon="out" title="Sign out" onClick={() => undefined} end={<span />} />
      </div>
      <p className="rv__delete"><button type="button" className="po__link">Delete my account</button></p>
    </div>
  );
}

function UpdatesLite() {
  const steps: [string, string, string, string?][] = [["Profile submitted", "done", "12 Nov"], ["Recitation checked", "done", "13 Nov", "Passed"], ["Under review", "now", "14 Nov", "A reviewer is looking at your profile."], ["Verified", "todo", ""]];
  return (
    <div className="rv__focus">
      <h2 className="po__h2 rv__flush">Where your profile is</h2>
      <ol className="po__line">
        {steps.map(([title, tone, when, note]) => (
          <li key={title} className={`po__step is-${tone}`}>
            <span className="po__node" aria-hidden="true">{tone === "done" ? "✓" : ""}</span>
            <div className="po__steptext">
              <p className="po__steptitle"><strong>{title}</strong>{when && <time>{when}</time>}</p>
              {note && <p className="po__stepnote">{note}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="po__hint" style={{ marginTop: 18 }}>Unchanged from the page that is already in the app.</p>
    </div>
  );
}
