// ProPoojaPaath — public information pages (Privacy policy, Delete your account).
// A calm reading layout in the brand's colours. The words come from publicPages.ts.

import "./public-page.css";

export type PublicPageContent = {
  title: string;
  intro: string;
  /** Shown as a notice at the top, e.g. to mark draft wording. */
  notice?: string;
  sections: { heading: string; body?: string; items?: string[] }[];
  contactLabel: string;
  contactEmail: string;
};

type Props = PublicPageContent & {
  theme?: "light" | "dark";
  assetBase?: string;
  brand?: string;
  homeHref?: string;
};

export default function PublicPage({ theme = "light", assetBase = "/logo-reveal", brand = "ProPoojaPaath", homeHref = "/", title, intro, notice, sections, contactLabel, contactEmail }: Props) {
  return (
    <div className={`pp pp--${theme}`}>
      <header className="pp__top">
        <a className="pp__brand" href={homeHref}><img src={`${assetBase}/logo.png`} alt="" /><span>{brand}</span></a>
      </header>
      <main className="pp__main">
        <h1>{title}</h1>
        <p className="pp__intro">{intro}</p>
        {notice && <p className="pp__notice">{notice}</p>}
        <nav className="pp__toc" aria-label="On this page">
          {sections.map((s, i) => <a key={i} href={`#pp-${i}`}>{s.heading}</a>)}
        </nav>
        {sections.map((s, i) => (
          <section key={i} id={`pp-${i}`}>
            <h2>{s.heading}</h2>
            {s.body && <p>{s.body}</p>}
            {s.items && <ul>{s.items.map((x) => <li key={x}>{x}</li>)}</ul>}
          </section>
        ))}
        <section className="pp__contact">
          <h2>{contactLabel}</h2>
          <p><a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
        </section>
      </main>
    </div>
  );
}
