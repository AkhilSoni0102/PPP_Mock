"use client";

// ProPoojaPaath — logo reveal for the website (React / Next.js).
// Copy the PNGs from assets/ into public/logo-reveal/ and keep
// logo-reveal.css next to this file.

import { useEffect, type CSSProperties } from "react";
import "./logo-reveal.css";

type Props = {
  /** "row": logo slides left and the name appears beside it (website).
   *  "stack": name appears under the logo (narrow screens). */
  layout?: "row" | "stack";
  /** "auto" follows the visitor's light/dark setting. */
  theme?: "light" | "dark" | "auto";
  /** Brand name written next to the logo. */
  name?: string;
  /** Folder the PNGs are served from. */
  assetBase?: string;
  /** Cover the whole viewport (position: fixed). Otherwise it fills its parent. */
  fixed?: boolean;
  /** Called when the reveal has finished. The glow and sparkles keep running
   *  until you unmount the component. */
  onComplete?: () => void;
};

// Back-to-front: later images sit on top, so small petals emerge from behind big ones.
const PIECES = [
  "base-left",
  "base-right",
  "side-left",
  "side-right",
  "upper-left",
  "upper-right",
  "top",
  "big-left",
  "big-right",
] as const;

// [dx, dy, size px, delay s, twinkle s] — dx/dy are fractions of the logo size
const SPARKLES: number[][] = /*SPARKLES*/ [
  [-0.805, 0.202, 5, 1.8, 2.01],
  [-0.546, -0.272, 3, 1.81, 2.18],
  [0.305, 0.586, 2, 1.24, 2.5],
  [-0.196, -0.43, 3, 2.55, 2.25],
  [-0.467, -0.338, 2, 2.35, 1.3],
  [0.99, 0.184, 3, 1.15, 1.94],
  [-0.926, 0.296, 3, 1.45, 1.67],
  [0.586, 0.014, 4, 1.52, 2.8],
  [0.993, -0.022, 4, 1.48, 2.41],
  [-0.554, -0.037, 3, 2.25, 1.84],
  [0.427, -0.501, 2, 2.37, 1.2],
  [0.258, 0.814, 3, 1.66, 2.33],
  [-0.741, 0.333, 2, 2.27, 1.63],
  [0.614, 0.305, 3, 2.24, 1.39],
  [0.013, 0.484, 2, 1.8, 1.98],
  [-0.266, -0.476, 3, 1.39, 2.37],
  [0.604, 0.53, 2, 1.69, 2.78],
  [1.007, 0.002, 5, 1.99, 2.8],
  [0.636, 0.064, 5, 2.0, 2.12],
  [0.597, 0.132, 3, 1.49, 2.44],
  [-0.333, 0.502, 2, 1.21, 1.53],
  [-0.359, -0.338, 3, 1.66, 1.93],
  [0.775, -0.166, 3, 1.3, 1.82],
  [-0.493, -0.414, 2, 2.33, 1.6],
  [0.347, 0.711, 3, 1.39, 2.72],
  [0.639, -0.476, 3, 1.17, 1.37],
];

const REVEAL_MS = { row: 4000, stack: 3700 };

export default function LogoReveal({
  layout = "row",
  theme = "auto",
  name = "ProPoojaPaath",
  assetBase = "/logo-reveal",
  fixed = false,
  onComplete,
}: Props) {
  useEffect(() => {
    if (!onComplete) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(onComplete, reduce ? 800 : REVEAL_MS[layout]);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`lr lr--${layout} lr--${theme}${fixed ? " lr--fixed" : ""}`}
      style={{ "--lr-logo": `url(${assetBase}/logo.png)` } as CSSProperties}
      role="img"
      aria-label={name}
    >
      <div className="lr__lockup" aria-hidden="true">
        <div className="lr__mark">
          <div className="lr__glow">
            <img src={`${assetBase}/glow.png`} alt="" />
          </div>
          {PIECES.map((p) => (
            <img key={p} className={`lr__p lr__p--${p}`} src={`${assetBase}/petal-${p}.png`} alt="" />
          ))}
          <img className="lr__p lr__p--kalash" src={`${assetBase}/kalash.png`} alt="" />
          <div className="lr__shine" />
          <div className="lr__sparkles">
            {SPARKLES.map(([dx, dy, z, t, w], i) => (
              <i
                key={i}
                style={{ "--dx": dx, "--dy": dy, "--z": `${z}px`, "--t": `${t}s`, "--w": `${w}s` } as CSSProperties}
              />
            ))}
          </div>
        </div>
        <div className="lr__namewrap">
          <div>
            <p className="lr__name">
              {Array.from(name).map((ch, i) => (
                <span key={i} style={{ "--i": i } as CSSProperties}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
            </p>
            <div className="lr__rule" />
          </div>
        </div>
      </div>
    </div>
  );
}
