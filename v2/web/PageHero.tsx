// ProPoojaPaath — animated page hero (React / Next.js).
// One component for every page: the words and arrangement come from props,
// with ready-made sets in pageHeroes.ts.
//
// Needs: LotusMark.tsx, logo-reveal.css, page-hero.css and the PNGs from
// assets/ in public/logo-reveal/. Server-renderable: there is no client state.

import type { CSSProperties } from "react";
import LotusMark from "./LotusMark";
import "./logo-reveal.css";
import "./page-hero.css";

export type PageHeroProps = {
  /** split: words left, lotus right · reverse: lotus left · halo: lotus above, centred ·
   *  bleed: oversized mandala off the edge · banner: short strip for a dashboard */
  layout?: "split" | "reverse" | "halo" | "bleed" | "banner";
  /** "auto" follows the visitor's light/dark setting. */
  theme?: "light" | "dark" | "auto";
  /** Headline, one entry per line. */
  title: string[];
  lede?: string;
  /** Leave out to show no button. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Small line beside the button. */
  note?: string;
  /** Folder the PNGs are served from. */
  assetBase?: string;
};

export default function PageHero({
  layout = "split",
  theme = "auto",
  title,
  lede,
  ctaLabel,
  ctaHref = "#",
  note,
  assetBase = "/logo-reveal",
}: PageHeroProps) {
  const mask = (file: string) => ({ "--hh-mask": `url(${assetBase}/${file})` } as CSSProperties);

  return (
    <section className={`hh hh--${layout} hh--${theme}`}>
      <div className="hh__inner">
        <div className="hh__copy">
          <h1 className="hh__title" aria-label={title.join(" ")}>
            {title.map((line, i) => (
              <span key={i} className="hh__line" aria-hidden="true">
                <span style={{ "--i": i } as CSSProperties}>{line}</span>
              </span>
            ))}
          </h1>
          {lede && <p className="hh__lede">{lede}</p>}
          {(ctaLabel || note) && (
            <div className="hh__actions">
              {ctaLabel && (
                <a className="hh__cta" href={ctaHref}>
                  {ctaLabel}
                </a>
              )}
              {note && <span className="hh__note">{note}</span>}
            </div>
          )}
        </div>

        <div className="hh__art" aria-hidden="true">
          <div className="hh__ring hh__ring--outer" style={mask("mandala-outer.png")} />
          <div className="hh__ring hh__ring--inner" style={mask("mandala-inner.png")} />
          <LotusMark assetBase={assetBase} />
        </div>
      </div>
    </section>
  );
}
