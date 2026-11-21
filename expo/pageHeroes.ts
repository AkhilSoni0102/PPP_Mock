// Words and arrangement for each ProPoojaPaath screen hero (Expo).
// Use with <PageHero {...heroes.home} onPressCta={...} />
// or <PageHero {...heroes.panditWelcome("Ramesh")} onPressCta={...} />.
// Everything here is plain data: edit the wording freely.

import type { PageHeroProps } from "./PageHero";

type Preset = Omit<PageHeroProps, "theme" | "onPressCta">;

export const heroes = {
  home: {
    layout: "stack",
    title: ["Authentic Rituals", "Expertly Delivered"],
    lede: "Book verified Pandits and Acharyas for home rituals, live counsel and Vedic guidance.",
    ctaLabel: "Register for early access",
    note: "Launching Early November 2026",
  } as Preset,

  /** Shown to a pandit after sign-in. */
  panditWelcome: (name?: string): Preset => ({
    layout: "stack",
    title: [name ? `Pranam, ${name} ji` : "Pranam, Pandit ji", "Your stage is ready"],
    lede: "A secure, dignified place for a lifetime of learning. Complete your verification and devotees can find you.",
    ctaLabel: "Start verification",
  }),

  /** Shown to a customer (devotee) after sign-in. */
  customerWelcome: (name?: string): Preset => ({
    layout: "stack",
    title: [name ? `Namaste, ${name}` : "Namaste", "Which ritual shall", "we arrange?"],
    lede: "Verified Pandits and Acharyas for home rituals, live counsel and muhurat, wherever you are.",
    ctaLabel: "Book a ritual",
  }),

  /** A short strip for the top of the admin dashboard. */
  adminWelcome: (name?: string): Preset => ({
    layout: "banner",
    title: [name ? `Welcome back, ${name}` : "Welcome back"],
    lede: "Here is what needs your attention today.",
  }),

  about: {
    layout: "stack",
    title: ["A trusted stage", "for those who keep", "the rituals alive"],
    lede: "Pandits and Acharyas give a lifetime to study, yet few have security or recognition. We are building the platform that gives them both, and gives devotees guides they can trust.",
    ctaLabel: "Read our full vision",
  } as Preset,
};

/** The same pages in Hindi. Drafts: please have a Hindi speaker review them. */
export const heroesHi = {
  home: {
    layout: "stack",
    title: ["प्रामाणिक अनुष्ठान", "कुशलता से संपन्न"],
    lede: "घर पर पूजा, व्यक्तिगत परामर्श और वैदिक मार्गदर्शन के लिए सत्यापित पंडित और आचार्य बुक करें।",
    ctaLabel: "अर्ली एक्सेस के लिए पंजीकरण करें",
    note: "नवंबर 2026 की शुरुआत में लॉन्च",
  } as Preset,

  panditWelcome: (name?: string): Preset => ({
    layout: "stack",
    title: [name ? `प्रणाम, ${name} जी` : "प्रणाम, पंडित जी", "आपका मंच तैयार है"],
    lede: "जीवन भर की साधना के लिए एक सुरक्षित और सम्मानजनक स्थान। सत्यापन पूरा करें, ताकि श्रद्धालु आप तक पहुँच सकें।",
    ctaLabel: "सत्यापन शुरू करें",
  }),

  customerWelcome: (name?: string): Preset => ({
    layout: "stack",
    title: [name ? `नमस्ते, ${name}` : "नमस्ते", "कौन सा अनुष्ठान कराना है?"],
    lede: "घर पर पूजा, परामर्श और मुहूर्त के लिए सत्यापित पंडित और आचार्य, आप जहाँ भी हों।",
    ctaLabel: "पूजा बुक करें",
  }),

  adminWelcome: (name?: string): Preset => ({
    layout: "banner",
    title: [name ? `पुनः स्वागत है, ${name}` : "पुनः स्वागत है"],
    lede: "आज इन बातों पर आपका ध्यान चाहिए।",
  }),

  about: {
    layout: "stack",
    title: ["उनके लिए एक भरोसेमंद मंच", "जो परंपरा को जीवित रखते हैं"],
    lede: "पंडित और आचार्य अपना जीवन अध्ययन को देते हैं, फिर भी कम ही को सुरक्षा या पहचान मिलती है। हम वह मंच बना रहे हैं जो उन्हें दोनों दे, और श्रद्धालुओं को भरोसेमंद मार्गदर्शक।",
    ctaLabel: "हमारा पूरा दृष्टिकोण पढ़ें",
  } as Preset,
};
