"use client";

// Ideation sketch — NOT part of the pandit app.
// The opening as one continuous movement: the logo that is revealed petal by petal is the SAME logo
// that then shrinks into the next screen's logo, and the next, until it rests in the top bar.
// One logo element flies between "slots"; each screen fades in underneath while it travels.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import LotusMark from "../web/LotusMark";

type Stage = "reveal" | "intro" | "signin" | "home";
const BASE = 150; // the size LotusMark is drawn at; the flying wrapper scales it

const SLIDES: [string, string][] = [
  ["Welcome to ProPoojaPaath", "A place where yajmans find pandits they can trust."],
  ["Show who you are", "Add your experience, the pujas you perform and where you travel."],
  ["Get the verified tick", "Recite one shloka and our team verifies your profile."],
];

export default function Opening({ assetBase }: { assetBase: string }) {
  const [run, setRun] = useState(0);
  const [stage, setStage] = useState<Stage>("reveal");
  const [prev, setPrev] = useState<{ stage: Stage; slide: number } | null>(null);
  const [slide, setSlide] = useState(0);
  const [smooth, setSmooth] = useState(true);
  const [pos, setPos] = useState<{ x: number; y: number; s: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLDivElement>(null);

  const to = (next: Stage, nextSlide = 0) => {
    setPrev({ stage, slide });
    setStage(next);
    setSlide(nextSlide);
    window.setTimeout(() => setPrev(null), 450);
  };
  const replay = () => { setPrev(null); setStage("reveal"); setSlide(0); setRun((n) => n + 1); };

  // After the petals have opened, move on by itself.
  useEffect(() => {
    if (stage !== "reveal") return;
    const id = window.setTimeout(() => to("intro"), 3500);
    return () => window.clearTimeout(id);
  }, [stage, run]);

  // Fly the logo to the slot of the screen that is showing now.
  useLayoutEffect(() => {
    const place = () => {
      const box = root.current?.getBoundingClientRect();
      if (!box) return;
      const slot = current.current?.querySelector<HTMLElement>("[data-slot]")?.getBoundingClientRect();
      if (stage === "reveal" || !slot) setPos({ x: box.width / 2, y: box.height * 0.42, s: Math.min(1.35, (box.width * 0.5) / BASE) });
      else setPos({ x: slot.left - box.left + slot.width / 2, y: slot.top - box.top + slot.height / 2, s: slot.width / BASE });
    };
    place();
    const ro = new ResizeObserver(place);
    if (root.current) ro.observe(root.current);
    return () => ro.disconnect();
  }, [stage, slide, run]);

  const Slot = ({ size }: { size: number }) => <span data-slot className="op__slot" style={{ width: size, height: size }} />;

  const screen = (st: Stage, sl: number): ReactNode => {
    if (st === "intro")
      return (
        <div className="op__center">
          <span className="op__mandala">
            <i style={{ "--id-mask": `url(${assetBase}/mandala-outer.png)` } as CSSProperties} />
            <i style={{ "--id-mask": `url(${assetBase}/mandala-inner.png)` } as CSSProperties} />
            <Slot size={96} />
          </span>
          <div className="op__copy" key={sl}>
            <h1 className="po__title">{SLIDES[sl][0]}</h1>
            <p className="po__intro">{SLIDES[sl][1]}</p>
          </div>
          <p className="op__dots" aria-label={`Slide ${sl + 1} of 3`}>{SLIDES.map((_, i) => <i key={i} className={i === sl ? "is-on" : ""} />)}</p>
          <button type="button" className="po__btn po__btn--primary op__btn" onClick={() => (sl < 2 ? setSlide(sl + 1) : to("signin"))}>{sl < 2 ? "Next" : "Get started"}</button>
          {sl < 2 && <button type="button" className="po__link" onClick={() => to("signin")}>Skip</button>}
        </div>
      );
    if (st === "signin")
      return (
        <div className="op__center op__center--top">
          <Slot size={84} />
          <h1 className="po__title" style={{ marginTop: 14 }}>Sign in</h1>
          <p className="po__intro">Use your mobile number or your Google account.</p>
          <div className="op__form">
            <label className="po__label" htmlFor="op-phone">Mobile number</label>
            <input id="op-phone" className="po__input" inputMode="numeric" defaultValue="98765 43210" />
            <button type="button" className="po__btn po__btn--primary op__btn" onClick={() => to("home")}>Send code</button>
          </div>
        </div>
      );
    if (st === "home")
      return (
        <div className="op__home">
          <header className="op__bar"><Slot size={34} /><span>ProPoojaPaath</span></header>
          <div className="op__homebody">
            <h1 className="po__title">Namaste, Ramesh</h1>
            <section className="po__banner"><h2>Complete your profile</h2><p>Add your name, gender, date of birth and address to get started.</p></section>
            <p className="po__hint" style={{ marginTop: 18 }}>The logo has travelled from the opening to its place in the bar without ever leaving the screen.</p>
          </div>
        </div>
      );
    return (
      <div className="op__revealcopy">
        <p className="op__name" aria-label="ProPoojaPaath">{"ProPoojaPaath".split("").map((ch, i) => <span key={i} style={{ "--i": i } as CSSProperties}>{ch}</span>)}</p>
      </div>
    );
  };

  return (
    <>
      <div className="nt__demo">
        <button type="button" className="po__btn po__btn--small" onClick={replay}>Replay from the start</button>
        <label className="op__toggle"><input type="checkbox" checked={!smooth} onChange={(e) => setSmooth(!e.target.checked)} /> Compare: how it is today (sudden cut)</label>
      </div>

      <div className={`op${smooth ? "" : " op--abrupt"} is-${stage}`} ref={root}>
        <div className="op__glowbg" />
        {prev && <div className="op__screen is-leaving" key={`leave-${prev.stage}`} aria-hidden="true">{screen(prev.stage, prev.slide)}</div>}
        <div className="op__screen" key={`${stage}-${run}`} ref={current}>{screen(stage, slide)}</div>
        <div
          className={`op__fly${pos && pos.s < 0.4 ? " is-small" : ""}`}
          style={pos ? ({ transform: `translate(${pos.x - BASE / 2}px, ${pos.y - BASE / 2}px) scale(${pos.s})` } as CSSProperties) : { opacity: 0 }}
          aria-hidden="true"
        >
          <LotusMark key={run} assetBase={assetBase} />
        </div>
      </div>
    </>
  );
}
