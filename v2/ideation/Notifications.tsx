"use client";

// Ideation sketches for notifications — NOT part of the pandit app.
//   · a bell in the top bar with a count of unread updates
//   · Home without the updates list: the status badge on the banner opens the Updates page
//   · the Updates page: where the profile is in review (a timeline), then every update
//   · the screen that asks to allow notifications, how one looks on the phone, and the setting

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type P = { assetBase: string };

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

function BellIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4l1.6-2Z" />
      <path d="M10 21a2.2 2.2 0 0 0 4 0" />
      <path d="M12 3v2" />
    </svg>
  );
}

/** The one-colour lotus used wherever the phone tints the icon itself. */
function PushIcon({ size, assetBase, color = "currentColor" }: { size: number; assetBase: string; color?: string }) {
  const mask = `url(${assetBase}/push-icon.png) center / contain no-repeat`;
  return <span className="nt__pushicon" style={{ width: size, height: size, background: color, WebkitMask: mask, mask }} aria-hidden="true" />;
}

function Bell({ count, ring, onClick }: { count: number; ring: number; onClick?: () => void }) {
  const label = count ? `Updates, ${count} unread` : "Updates";
  return (
    <button type="button" className="nt__bell" onClick={onClick} aria-label={label}>
      <span key={ring} className={ring ? "nt__swing" : undefined}><BellIcon size={26} /></span>
      {count > 0 && <b key={count} aria-hidden="true">{count > 9 ? "9+" : count}</b>}
    </button>
  );
}

// ---------------------------------------------------------------- the sample review journey

type Stage = "draft" | "submitted" | "recitation_failed" | "under_review" | "changes" | "verified" | "rejected" | "suspended";

const STAGES: [Stage, string][] = [
  ["draft", "Not submitted yet"],
  ["submitted", "Submitted"],
  ["recitation_failed", "Recitation did not pass"],
  ["under_review", "Under review"],
  ["changes", "Changes requested"],
  ["verified", "Verified"],
  ["rejected", "Not approved"],
  ["suspended", "Suspended"],
];

const BADGE: Record<Stage, [string, "" | "is-waiting" | "is-attention" | "is-good"]> = {
  draft: ["Not submitted", ""],
  submitted: ["Submitted", "is-waiting"],
  recitation_failed: ["Submitted", "is-waiting"],
  under_review: ["Under review", "is-waiting"],
  changes: ["Changes requested", "is-attention"],
  verified: ["Verified", "is-good"],
  rejected: ["Not approved", "is-attention"],
  suspended: ["Suspended", "is-attention"],
};

const GUIDE: Record<Stage, string> = {
  draft: "The required details are in. Submit for review, or add more first.",
  submitted: "Your profile is with our team.",
  recitation_failed: "Your profile is with our team. Your recitation needs another try.",
  under_review: "A reviewer is looking at your profile.",
  changes: "The reviewer asked for a change before approving.",
  verified: "Your profile is verified.",
  rejected: "Your profile was not approved.",
  suspended: "Your profile is suspended.",
};

type Tone = "done" | "now" | "todo" | "attention";
type Step = { title: string; tone: Tone; when?: string; note?: string; message?: string; action?: string };
type Item = { id: string; text: string; detail?: string; when: string; attention?: boolean };

const MSG_CHANGES = "The photo on your ID is blurred. Please upload a clearer photo.";
const MSG_REJECT = "We could not confirm the details on your ID document.";
const MSG_SUSPEND = "Two yajmans reported a missed puja. Please contact our team.";

function journey(stage: Stage): { steps: Step[]; items: Item[] } {
  const s1: Step = { title: "Profile submitted", tone: "done", when: "12 Nov" };
  const s2: Step = { title: "Recitation checked", tone: "done", when: "13 Nov", note: "Passed" };
  const s3: Step = { title: "Under review", tone: "done", when: "14 Nov" };
  const s4: Step = { title: "Verified", tone: "todo" };
  const i1: Item = { id: "submitted", text: "Your profile was submitted.", when: "12 Nov, 10:20 am" };
  const i2: Item = { id: "rec_ok", text: "Your recitation passed.", when: "13 Nov, 4:05 pm" };
  const i3: Item = { id: "review", text: "Your profile is being reviewed.", when: "14 Nov, 11:30 am" };

  switch (stage) {
    case "draft":
      return {
        steps: [{ title: "Submit your profile", tone: "now", note: "Review starts once you submit.", action: "Submit for review" }, { title: "Recitation checked", tone: "todo" }, { title: "Under review", tone: "todo" }, s4],
        items: [],
      };
    case "submitted":
      return { steps: [s1, { title: "Recitation checked", tone: "now", note: "Your recitation is being checked." }, { title: "Under review", tone: "todo" }, s4], items: [i1] };
    case "recitation_failed":
      return {
        steps: [s1, { title: "Recitation checked", tone: "attention", when: "13 Nov", note: "It did not pass. You have 2 attempts left.", action: "Record again" }, { title: "Under review", tone: "todo" }, s4],
        items: [{ id: "rec_fail", text: "Your recitation did not pass. You can try again.", when: "13 Nov, 4:05 pm", attention: true }, i1],
      };
    case "under_review":
      return { steps: [s1, s2, { ...s3, tone: "now", note: "A reviewer is looking at your profile." }, s4], items: [i3, i2, i1] };
    case "changes":
      return {
        steps: [s1, s2, { title: "Changes requested", tone: "attention", when: "15 Nov", message: MSG_CHANGES, action: "Update my profile" }, s4],
        items: [{ id: "changes", text: "The reviewer asked for changes.", detail: MSG_CHANGES, when: "15 Nov, 9:45 am", attention: true }, i3, i2, i1],
      };
    case "verified":
      return {
        steps: [s1, s2, s3, { title: "Verified", tone: "done", when: "16 Nov", note: "Yajmans can now find and book you." }],
        items: [{ id: "approved", text: "You are verified.", when: "16 Nov, 2:15 pm" }, i3, i2, i1],
      };
    case "rejected":
      return {
        steps: [s1, s2, s3, { title: "Not approved", tone: "attention", when: "16 Nov", message: MSG_REJECT, action: "Contact our team" }],
        items: [{ id: "rejected", text: "Your profile was not approved.", detail: MSG_REJECT, when: "16 Nov, 2:15 pm", attention: true }, i3, i2, i1],
      };
    case "suspended":
      return {
        steps: [s1, s2, s3, { title: "Verified", tone: "done", when: "16 Nov" }, { title: "Suspended", tone: "attention", when: "20 Nov", message: MSG_SUSPEND, action: "Contact our team" }],
        items: [{ id: "suspended", text: "Your profile is suspended.", detail: MSG_SUSPEND, when: "20 Nov, 6:00 pm", attention: true }, { id: "approved", text: "You are verified.", when: "16 Nov, 2:15 pm" }, i3, i2, i1],
      };
  }
}

const TILES: [string, string, boolean][] = [
  ["Personal", "Name, photo, gender and date of birth", true],
  ["Address", "Where you live", true],
  ["Religious practice", "Experience, languages, pujas and tradition", true],
  ["Service area", "Where you travel for pujas", false],
];

// ---------------------------------------------------------------- 1 + 2. Home with the bell, and the Updates page

export function BellAndUpdates({ assetBase, start }: P & { start: "home" | "updates" }) {
  const [stage, setStage] = useState<Stage>(start === "home" ? "changes" : "under_review");
  const [screen, setScreen] = useState<"home" | "updates">(start);
  const [read, setRead] = useState<string[]>(start === "home" ? ["submitted"] : ["submitted", "rec_ok", "review"]);
  // unread when the page was opened, so the gold dots stay while you look
  const [seen, setSeen] = useState<string[]>(start === "home" ? [] : ["rec_ok", "review"]);
  const [ring, setRing] = useState(0);
  const { steps, items } = journey(stage);
  const unread = items.filter((i) => !read.includes(i.id));

  const openUpdates = () => { setSeen(unread.map((i) => i.id)); setRead([...read, ...unread.map((i) => i.id)]); setScreen("updates"); };
  const change = (s: Stage) => {
    setStage(s);
    setRing((n) => n + 1);
    if (screen !== "updates") return;
    const fresh = journey(s).items.filter((i) => !read.includes(i.id)).map((i) => i.id);
    setSeen(fresh);
    setRead([...read, ...fresh]);
  };
  const [badge, tone] = BADGE[stage];
  const reviewer = steps.find((s) => s.message);

  return (
    <>
      <div className="nt__demo">
        <label htmlFor="nt-stage">Demo: the profile is</label>
        <select id="nt-stage" className="po__input" value={stage} onChange={(e) => change(e.target.value as Stage)}>
          {STAGES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>

      <div className="nt__phone">
        <header className="nt__top">
          {screen === "home"
            ? <GlowLogo size={34} assetBase={assetBase} />
            : <button type="button" className="po__icon" onClick={() => setScreen("home")} aria-label="Back"><span aria-hidden="true">←</span></button>}
          <span className="po__topname">{screen === "home" ? "ProPoojaPaath" : "Updates"}</span>
          {screen === "home" && <Bell count={unread.length} ring={ring} onClick={openUpdates} />}
          <span className="nt__avatar" aria-hidden="true">R</span>
        </header>

        {screen === "home" ? (
          <div className="nt__screen" key="home">
            <h1 className="po__title">Namaste, Ramesh{stage === "verified" && <span className="po__tick"> ✔</span>}</h1>
            <section className={`po__banner id__banner${stage === "verified" ? " is-verified" : ""}`}>
              <div className="po__bannerhead">
                <h2>{stage === "draft" ? "Complete your profile" : "Your profile"}</h2>
                <button type="button" className={`po__pill nt__badge ${tone}`} onClick={openUpdates} aria-label={`${badge}. See updates`}>
                  {badge}<span aria-hidden="true">›</span>
                </button>
              </div>
              <RiderBar value={stage === "draft" ? 0.55 : 1} label="Profile progress" assetBase={assetBase} />
              <p>{GUIDE[stage]}</p>
            </section>

            {reviewer && (
              <section className="po__notice po__notice--attention nt__reviewer">
                <strong>Message from the reviewer</strong>
                <p>{reviewer.message}</p>
                <div className="nt__row">
                  <button type="button" className="po__btn po__btn--primary po__btn--small">{reviewer.action}</button>
                  <button type="button" className="po__link" onClick={openUpdates}>See all updates</button>
                </div>
              </section>
            )}

            <h2 className="po__h2">Your profile</h2>
            <ul className="po__hub">
              {TILES.map(([title, summary, done]) => (
                <li key={title}>
                  <div className={`po__tile is-${done ? "done" : "empty"}`}>
                    <span className="po__dot" aria-hidden="true" />
                    <span className="po__tiletext"><strong>{title}</strong><small>{summary}</small></span>
                    <span className="po__status">{done ? "Done" : "Optional"}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="nt__screen" key="updates">
            <h2 className="po__h2 nt__first">Where your profile is</h2>
            <ol className="nt__line">
              {steps.map((s, i) => (
                <li key={s.title} className={`nt__step is-${s.tone}`} aria-current={s.tone === "now" || s.tone === "attention" ? "step" : undefined}>
                  <span className="nt__node" aria-hidden="true">{s.tone === "done" ? "✓" : s.tone === "attention" ? "!" : ""}</span>
                  <div className="nt__steptext" style={{ "--nt-i": i } as CSSProperties}>
                    <p className="nt__steptitle"><strong>{s.title}</strong>{s.when && <time>{s.when}</time>}</p>
                    {s.note && <p className="nt__note">{s.note}</p>}
                    {s.message && <p className="nt__message">{s.message}</p>}
                    {s.action && <button type="button" className={`po__btn po__btn--small${s.tone === "attention" || stage === "draft" ? " po__btn--primary" : ""}`}>{s.action}</button>}
                  </div>
                </li>
              ))}
            </ol>

            <h2 className="po__h2">All updates</h2>
            {items.length === 0 ? (
              <p className="nt__empty">Nothing yet. After you submit your profile, every update about it appears here.</p>
            ) : (
              <ul className="nt__list">
                {items.map((u) => (
                  <li key={u.id} className={`${seen.includes(u.id) ? "is-new" : ""}${u.attention ? " is-attention" : ""}`}>
                    <span className="nt__newdot" aria-hidden="true" />
                    <div>
                      <strong>{u.text}</strong>
                      {u.detail && <p>{u.detail}</p>}
                      <time>{u.when}{seen.includes(u.id) && <em> · New</em>}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 3. asking to allow notifications

export function AllowNotifications({ assetBase }: P) {
  const [state, setState] = useState<"ask" | "system" | "on" | "later">("ask");
  if (state === "on" || state === "later")
    return (
      <div className="id__center nt__ask">
        <span className={`nt__bigbell${state === "on" ? " is-on" : ""}`}><BellIcon size={44} /></span>
        <h1 className="po__title">{state === "on" ? "Notifications are on" : "No problem"}</h1>
        <p className="po__intro">{state === "on" ? "We will tell you as soon as your profile is reviewed." : "You can turn them on any time in My account. Your updates are always under the bell."}</p>
        <div className="id__actions"><button type="button" className="po__btn" onClick={() => setState("ask")}>Play again</button></div>
      </div>
    );
  return (
    <div className="id__center nt__ask">
      <span className="nt__bigbell"><BellIcon size={44} /><GlowLogo size={30} assetBase={assetBase} /></span>
      <h1 className="po__title">Know the moment you are verified</h1>
      <p className="po__intro">Your profile is with our team. Allow notifications and we will tell you when:</p>
      <ul className="nt__reasons">
        <li>your profile is approved</li>
        <li>the reviewer asks for a change</li>
        <li>your recitation is checked</li>
      </ul>
      <div className="nt__stack">
        <button type="button" className="po__btn po__btn--primary" onClick={() => setState("system")}>Allow notifications</button>
        <button type="button" className="po__link" onClick={() => setState("later")}>Not now</button>
      </div>
      {state === "system" && (
        <div className="nt__scrim" role="dialog" aria-modal="true" aria-label="The phone's own question">
          <div className="nt__system">
            <p className="nt__systemtag">The phone's own question appears next</p>
            <strong>Allow ProPoojaPaath to send you notifications?</strong>
            <div>
              <button type="button" onClick={() => setState("later")}>Don't allow</button>
              <button type="button" onClick={() => setState("on")}>Allow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 4. how it looks on the phone

const PUSHES: [string, string, string][] = [
  ["You are verified", "Yajmans can now find and book you.", "now"],
  ["The reviewer asked for a change", "Open the app to see what to update.", "2 h ago"],
  ["Your recitation passed", "One more step done towards your verified tick.", "Yesterday"],
];

export function OnThePhone({ assetBase }: P) {
  const [n, setN] = useState(1);
  return (
    <>
      <div className="nt__lock">
        <div className="nt__statusbar"><span>9:41</span><PushIcon size={16} assetBase={assetBase} color="#fff" /><i /></div>
        <p className="nt__clock">9:41</p>
        <p className="nt__date">Saturday, 21 November</p>
        <ul className="nt__pushes">
          {PUSHES.slice(0, n).map(([title, body, when]) => (
            <li key={title}>
              <span className="nt__pushbadge"><PushIcon size={20} assetBase={assetBase} color="#2a0f0a" /></span>
              <div>
                <p className="nt__pushmeta"><span>ProPoojaPaath</span><time>{when}</time></p>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="id__actions">
        <button type="button" className="po__btn po__btn--primary" onClick={() => setN(n < PUSHES.length ? n + 1 : 1)}>{n < PUSHES.length ? "Demo: another one arrives" : "Start again"}</button>
      </div>

      <h2 className="po__h2">The small icon</h2>
      <p className="po__hint">Phones draw this icon in one colour, so the lotus is simplified to a flat shape. Full-colour logo stays as the app icon.</p>
      <div className="nt__icons">
        <Swatch label="Status bar" bg="#111"><PushIcon size={24} assetBase={assetBase} color="#fff" /></Swatch>
        <Swatch label="Light bar" bg="#f4f4f4"><PushIcon size={24} assetBase={assetBase} color="#333" /></Swatch>
        <Swatch label="In the notification" bg="#f0b040"><PushIcon size={36} assetBase={assetBase} color="#2a0f0a" /></Swatch>
        <Swatch label="Large" bg="#2c120c"><PushIcon size={72} assetBase={assetBase} color="#f0b040" /></Swatch>
        <Swatch label="App icon (unchanged)" bg="#2c120c"><img src={`${assetBase}/logo.png`} width={72} height={72} alt="" /></Swatch>
      </div>
    </>
  );
}

function Swatch({ label, bg, children }: { label: string; bg: string; children: ReactNode }) {
  return <figure className="nt__swatch"><span style={{ background: bg }}>{children}</span><figcaption>{label}</figcaption></figure>;
}

// ---------------------------------------------------------------- 5. the setting

export function NotificationSetting() {
  const [on, setOn] = useState(true);
  const [blocked, setBlocked] = useState(false);
  return (
    <>
      <h1 className="po__title">My account</h1>
      <ul className="nt__settings">
        <li>
          <span className="nt__settingicon"><BellIcon size={22} /></span>
          <span className="po__tiletext">
            <strong id="nt-switch-label">Notifications</strong>
            <small>{blocked ? "Turned off in your phone's settings" : on ? "We tell you when your profile status changes" : "Off. Your updates are still under the bell"}</small>
          </span>
          {blocked
            ? <button type="button" className="po__btn po__btn--small" onClick={() => { setBlocked(false); setOn(true); }}>Open settings</button>
            : <button type="button" role="switch" aria-checked={on} aria-labelledby="nt-switch-label" className="nt__switch" onClick={() => setOn(!on)}><i /></button>}
        </li>
        <li><span className="nt__settingicon" aria-hidden="true">文</span><span className="po__tiletext"><strong>Language</strong><small>English</small></span><span className="po__status">›</span></li>
        <li><span className="nt__settingicon" aria-hidden="true">?</span><span className="po__tiletext"><strong>Help and contact</strong></span><span className="po__status">›</span></li>
      </ul>
      <div className="id__actions">
        <button type="button" className="po__btn" onClick={() => setBlocked(!blocked)}>{blocked ? "Demo: allowed on the phone again" : "Demo: blocked in the phone's settings"}</button>
      </div>
    </>
  );
}
