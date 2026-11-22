// Motion pieces for the pandit app (website): the whole logo that keeps glowing,
// the progress bar the logo rides, and the mandala that turns while the app waits.

import type { CSSProperties } from "react";

const SPARKS = [[-0.62, -0.3], [0.6, -0.34], [-0.44, 0.44], [0.68, 0.22], [0.06, -0.72], [-0.74, 0.06], [0.38, 0.52]];

/** The whole logo with a soft light behind it. `pulse` adds one burst of light (e.g. a code was accepted). */
export function GlowLogo({ size, assetBase, sparkles = false, pulse = false, className = "" }: { size: number; assetBase: string; sparkles?: boolean; pulse?: boolean; className?: string }) {
  return (
    <span className={`po__glowlogo${pulse ? " is-pulse" : ""} ${className}`} style={{ "--po-size": `${size}px` } as CSSProperties} aria-hidden="true">
      <img className="po__glowlight" src={`${assetBase}/glow.png`} alt="" />
      <img className="po__glowmark" src={`${assetBase}/logo.png`} alt="" />
      {sparkles && SPARKS.map(([x, y], i) => <i key={i} style={{ "--x": x, "--y": y, "--d": `${i * 0.37}s` } as CSSProperties} />)}
    </span>
  );
}

/** A progress bar with the glowing logo at its front edge, moving right as progress grows. No number is shown. */
export function RiderBar({ value, label, assetBase }: { value: number; label: string; assetBase: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="po__rider" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} style={{ "--po-v": v } as CSSProperties}>
      <span className="po__ridertrack"><span /></span>
      <span className="po__riderlogo"><GlowLogo size={34} assetBase={assetBase} /></span>
    </div>
  );
}

/** The mandala rings turning slowly, around the glowing logo unless `plain`: shown wherever the app waits. */
/** An empty space the size of a logo. During the opening, the one travelling logo flies to wherever this is. */
export function LogoSlot({ size }: { size: number }) {
  return <span data-po-slot className="po__slot" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Turning({ size, assetBase, plain = false, slot = false }: { size: number; assetBase: string; plain?: boolean; slot?: boolean }) {
  return (
    <span className={`po__turning${plain ? " is-plain" : ""}`} style={{ width: size, height: size }} aria-hidden="true">
      <i style={{ "--po-mask": `url(${assetBase}/mandala-outer.png)` } as CSSProperties} />
      <i style={{ "--po-mask": `url(${assetBase}/mandala-inner.png)` } as CSSProperties} />
      {!plain && (slot ? <LogoSlot size={size * 0.46} /> : <GlowLogo size={size * 0.46} assetBase={assetBase} />)}
    </span>
  );
}
