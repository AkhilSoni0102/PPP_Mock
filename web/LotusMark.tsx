// The lotus that opens petal by petal, with its glow and sparkles.
// Styled by logo-reveal.css; the parent must set the --lr-* variables
// (HomeHero does this through home-hero.css).

import type { CSSProperties } from "react";

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

export default function LotusMark({ assetBase = "/logo-reveal" }: { assetBase?: string }) {
  return (
    <div className="lr__mark" style={{ "--lr-logo": `url(${assetBase}/logo.png)` } as CSSProperties}>
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
  );
}
