// ProPoojaPaath — pandit onboarding: what is asked, in which step, in English and Hindi.
// Shared by the website and the Expo app. Nothing here touches the screen:
// edit labels, options and steps in this file and both forms follow.

export type Lang = "en" | "hi";
export type L = { en: string; hi: string };
export type Values = Record<string, any>;
export type Opt = { value: string; label: L };

export type FieldType =
  | "text"
  | "textarea"
  | "choice" // pick one, shown as chips
  | "multi" // pick several, shown as chips
  | "select" // pick one from a long list (dropdown)
  | "date" // "YYYY-MM-DD"
  | "tags" // list of short typed entries, e.g. PIN codes
  | "image" // photo, value is a file uri
  | "location" // { lat, lng, label }
  | "week" // { mon: ["morning"], ... }
  | "dateList"; // leave ranges or changes for specific dates

export type Field = {
  id: string;
  type: FieldType;
  label: L;
  hint?: L;
  placeholder?: L;
  required?: boolean | ((v: Values) => boolean);
  /** Hide the field unless this returns true. */
  showIf?: (v: Values) => boolean;
  options?: Opt[];
  keyboard?: "default" | "number" | "email";
  capitalize?: "words" | "characters" | "none";
  maxLength?: number;
  /** Return a message when the value is wrong, or null when it is fine. */
  validate?: (value: any, v: Values) => L | null;
  /** Never written to the saved draft, and shown masked on review screens. */
  sensitive?: boolean;
  variant?: "avatar" | "document"; // image
  mode?: "range" | "change"; // dateList
};

export type Step = { id: string; title: L; intro?: L; fields: Field[] };

export type SectionId =
  | "personal"
  | "address"
  | "practice"
  | "serviceArea"
  | "bank"
  | "idDocument"
  | "availability";

export type Section = {
  id: SectionId;
  title: L;
  summary: L;
  /** "onboarding" sections are asked before the profile can be submitted; the rest are filled later. */
  phase: "onboarding" | "profile";
  steps: Step[];
  /** For sections without required fields: when do we call the section complete? */
  doneWhen?: (v: Values) => boolean;
};

const l = (en: string, hi: string): L => ({ en, hi });
const opt = (value: string, en: string, hi: string): Opt => ({ value, label: l(en, hi) });
const filled = (x: any) =>
  x != null && x !== "" && !(Array.isArray(x) && x.length === 0) && !(typeof x === "object" && !Array.isArray(x) && Object.keys(x).length === 0);

// ---------------------------------------------------------------- option lists
// These lists are a first draft. Replace them with your own.

export const GENDERS: Opt[] = [
  opt("male", "Male", "पुरुष"),
  opt("female", "Female", "महिला"),
  opt("other", "Other", "अन्य"),
  opt("undisclosed", "Prefer not to say", "बताना नहीं चाहते"),
];

export const STATES: Opt[] = [
  ["Andhra Pradesh", "आंध्र प्रदेश"], ["Arunachal Pradesh", "अरुणाचल प्रदेश"], ["Assam", "असम"], ["Bihar", "बिहार"],
  ["Chhattisgarh", "छत्तीसगढ़"], ["Goa", "गोवा"], ["Gujarat", "गुजरात"], ["Haryana", "हरियाणा"],
  ["Himachal Pradesh", "हिमाचल प्रदेश"], ["Jharkhand", "झारखंड"], ["Karnataka", "कर्नाटक"], ["Kerala", "केरल"],
  ["Madhya Pradesh", "मध्य प्रदेश"], ["Maharashtra", "महाराष्ट्र"], ["Manipur", "मणिपुर"], ["Meghalaya", "मेघालय"],
  ["Mizoram", "मिज़ोरम"], ["Nagaland", "नागालैंड"], ["Odisha", "ओडिशा"], ["Punjab", "पंजाब"],
  ["Rajasthan", "राजस्थान"], ["Sikkim", "सिक्किम"], ["Tamil Nadu", "तमिलनाडु"], ["Telangana", "तेलंगाना"],
  ["Tripura", "त्रिपुरा"], ["Uttar Pradesh", "उत्तर प्रदेश"], ["Uttarakhand", "उत्तराखंड"], ["West Bengal", "पश्चिम बंगाल"],
  ["Andaman and Nicobar Islands", "अंडमान और निकोबार द्वीपसमूह"], ["Chandigarh", "चंडीगढ़"],
  ["Dadra and Nagar Haveli and Daman and Diu", "दादरा और नगर हवेली तथा दमन और दीव"], ["Delhi", "दिल्ली"],
  ["Jammu and Kashmir", "जम्मू और कश्मीर"], ["Ladakh", "लद्दाख"], ["Lakshadweep", "लक्षद्वीप"], ["Puducherry", "पुदुच्चेरी"],
].map(([en, hi]) => opt(en, en, hi));

export const DHARMAS: Opt[] = [
  opt("sanatan", "Sanatan (Hindu)", "सनातन (हिन्दू)"),
  opt("jain", "Jain", "जैन"),
  opt("bauddh", "Bauddh", "बौद्ध"),
  opt("sikh", "Sikh", "सिख"),
  opt("other", "Other", "अन्य"),
];

export const TRADITIONS: Opt[] = [
  opt("shaiva", "Shaiva", "शैव"),
  opt("vaishnava", "Vaishnava", "वैष्णव"),
  opt("shakta", "Shakta", "शाक्त"),
  opt("smarta", "Smarta", "स्मार्त"),
  opt("aryasamaj", "Arya Samaj", "आर्य समाज"),
  opt("other", "Other", "अन्य"),
];

export const LANGUAGES: Opt[] = [
  opt("hi", "Hindi", "हिन्दी"), opt("sa", "Sanskrit", "संस्कृत"), opt("en", "English", "अंग्रेज़ी"),
  opt("mr", "Marathi", "मराठी"), opt("gu", "Gujarati", "गुजराती"), opt("bn", "Bengali", "बांग्ला"),
  opt("ta", "Tamil", "तमिल"), opt("te", "Telugu", "तेलुगु"), opt("kn", "Kannada", "कन्नड़"),
  opt("ml", "Malayalam", "मलयालम"), opt("or", "Odia", "ओड़िया"), opt("pa", "Punjabi", "पंजाबी"),
  opt("bho", "Bhojpuri", "भोजपुरी"), opt("mai", "Maithili", "मैथिली"),
];

export const SERVICES: Opt[] = [
  opt("griha-pravesh", "Griha Pravesh", "गृह प्रवेश"),
  opt("satyanarayan", "Satyanarayan Katha", "सत्यनारायण कथा"),
  opt("havan", "Havan", "हवन"),
  opt("rudrabhishek", "Rudrabhishek", "रुद्राभिषेक"),
  opt("vivah", "Vivah", "विवाह"),
  opt("namkaran", "Namkaran", "नामकरण"),
  opt("mundan", "Mundan", "मुंडन"),
  opt("shraddh", "Shraddh and Pitru Puja", "श्राद्ध और पितृ पूजा"),
  opt("vastu", "Vastu Shanti", "वास्तु शांति"),
  opt("navgraha", "Navgraha Shanti", "नवग्रह शांति"),
  opt("path", "Path (Sundarkand, Ramayan)", "पाठ (सुंदरकांड, रामायण)"),
  opt("jyotish", "Kundli and Jyotish", "कुंडली और ज्योतिष"),
  opt("epuja", "E-Puja", "ई-पूजा"),
];

export const RADII: Opt[] = [5, 10, 15, 25, 50].map((km) => opt(String(km), `${km} km`, `${km} किमी`));

export const DAYS: Opt[] = [
  opt("mon", "Mon", "सोम"), opt("tue", "Tue", "मंगल"), opt("wed", "Wed", "बुध"), opt("thu", "Thu", "गुरु"),
  opt("fri", "Fri", "शुक्र"), opt("sat", "Sat", "शनि"), opt("sun", "Sun", "रवि"),
];

export const SLOTS: Opt[] = [
  opt("morning", "Morning, 6 am to 12 pm", "सुबह, 6 से 12 बजे"),
  opt("afternoon", "Afternoon, 12 to 4 pm", "दोपहर, 12 से 4 बजे"),
  opt("evening", "Evening, 4 to 9 pm", "शाम, 4 से 9 बजे"),
];
export const SLOT_SHORT: Record<string, L> = {
  morning: l("Morning", "सुबह"),
  afternoon: l("Afternoon", "दोपहर"),
  evening: l("Evening", "शाम"),
};

/** Recitation check: a pandit passes at this match or above, and gets this many attempts. */
export const PASS_MARK = 80;
export const MAX_ATTEMPTS = 3;

/** Shown in the recitation dropdown when no `shlokas` prop is passed. Names only: the text is never shown. */
export const SAMPLE_SHLOKAS: Opt[] = [
  opt("gayatri", "Gayatri Mantra", "गायत्री मंत्र"),
  opt("mahamrityunjaya", "Mahamrityunjaya Mantra", "महामृत्युंजय मंत्र"),
  opt("shanti-path", "Shanti Path", "शांति पाठ"),
  opt("ganesh-vandana", "Ganesh Vandana", "गणेश वंदना"),
];

// ---------------------------------------------------------------- checks

const today = () => new Date().toISOString().slice(0, 10);

export const isDate = (s: any) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const checks = {
  pin: (x: string) => (/^[1-9]\d{5}$/.test(x) ? null : l("Enter a 6-digit PIN code.", "6 अंकों का पिन कोड लिखें।")),
  dob: (x: string) =>
    !isDate(x) || x >= today() || x < "1900-01-01"
      ? l("Enter a valid date of birth.", "सही जन्म तिथि लिखें।")
      : null,
  years: (x: string) =>
    /^\d{1,2}$/.test(x) && +x <= 80 ? null : l("Enter a number of years, for example 12.", "वर्षों की संख्या लिखें, जैसे 12।"),
  upi: (x: string) =>
    /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(x) ? null : l("Enter a UPI ID like name@bank.", "name@bank जैसी UPI ID लिखें।"),
  account: (x: string) =>
    /^\d{9,18}$/.test(x) ? null : l("Enter the account number, 9 to 18 digits.", "खाता संख्या लिखें, 9 से 18 अंक।"),
  ifsc: (x: string) =>
    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(x.toUpperCase())
      ? null
      : l("Enter the 11-character IFSC code, like SBIN0001234.", "11 अक्षरों का IFSC कोड लिखें, जैसे SBIN0001234।"),
};

/** "XXXXXX1234" style display for account numbers; "na••@bank" for UPI IDs. */
export const mask = (x: string) => {
  if (!x) return "";
  if (x.includes("@")) {
    const [name, bank] = x.split("@");
    return `${name.slice(0, 2)}••••@${bank}`;
  }
  return "•".repeat(Math.max(0, x.length - 4)) + x.slice(-4);
};

const isBank = (v: Values) => v.payoutMethod === "bank";
const isUpi = (v: Values) => v.payoutMethod === "upi";

// ---------------------------------------------------------------- sections and steps

export const SECTIONS: Section[] = [
  {
    id: "personal",
    phase: "onboarding",
    title: l("Personal", "व्यक्तिगत"),
    summary: l("Your name, gender and date of birth", "आपका नाम, लिंग और जन्म तिथि"),
    steps: [
      {
        id: "personal",
        title: l("Tell us about yourself", "अपने बारे में बताएं"),
        intro: l("This is how devotees will see you.", "श्रद्धालु आपको इसी रूप में देखेंगे।"),
        fields: [
          { id: "photo", type: "image", variant: "avatar", label: l("Profile photo", "प्रोफ़ाइल फ़ोटो"), hint: l("Optional. A clear photo of your face.", "वैकल्पिक। चेहरे की साफ़ फ़ोटो।") },
          { id: "fullName", type: "text", required: true, capitalize: "words", maxLength: 80, label: l("Full name", "पूरा नाम") },
          { id: "gender", type: "choice", required: true, options: GENDERS, label: l("Gender", "लिंग") },
          { id: "dob", type: "date", required: true, validate: checks.dob, label: l("Date of birth", "जन्म तिथि") },
        ],
      },
    ],
  },
  {
    id: "address",
    phase: "onboarding",
    title: l("Address", "पता"),
    summary: l("Where you live", "आप कहाँ रहते हैं"),
    steps: [
      {
        id: "address-home",
        title: l("Where do you live?", "आप कहाँ रहते हैं?"),
        intro: l("Start with your PIN code and we will fill in what we can.", "पिन कोड से शुरू करें, बाकी हम भरने की कोशिश करेंगे।"),
        fields: [
          { id: "pin", type: "text", required: true, keyboard: "number", maxLength: 6, validate: checks.pin, label: l("PIN code", "पिन कोड") },
          { id: "addressLine", type: "text", required: true, maxLength: 160, label: l("House, street, area", "मकान, गली, मोहल्ला") },
        ],
      },
      {
        id: "address-area",
        title: l("Your city and state", "आपका शहर और राज्य"),
        intro: l("Check these and correct anything that is wrong.", "इन्हें जाँच लें और जो ग़लत हो उसे ठीक करें।"),
        fields: [
          { id: "city", type: "text", required: true, capitalize: "words", maxLength: 60, label: l("City or town", "शहर या कस्बा") },
          { id: "district", type: "text", capitalize: "words", maxLength: 60, label: l("District", "ज़िला"), hint: l("Optional", "वैकल्पिक") },
          { id: "state", type: "select", required: true, options: STATES, label: l("State", "राज्य") },
          { id: "mapPosition", type: "location", label: l("Position on the map", "नक्शे पर स्थान"), hint: l("Optional. Taken from your PIN code unless you set it.", "वैकल्पिक। आप न चुनें तो पिन कोड से लिया जाएगा।") },
        ],
      },
    ],
  },
  {
    id: "practice",
    phase: "profile",
    title: l("Religious practice", "धार्मिक साधना"),
    summary: l("Tradition, experience, languages and pujas", "परंपरा, अनुभव, भाषाएँ और पूजाएँ"),
    doneWhen: (v) => filled(v.services) && filled(v.languages),
    steps: [
      {
        id: "practice-tradition",
        title: l("Your tradition", "आपकी परंपरा"),
        fields: [
          { id: "dharma", type: "select", options: DHARMAS, label: l("Dharma", "धर्म") },
          { id: "gotra", type: "text", capitalize: "words", maxLength: 40, label: l("Gotra", "गोत्र") },
          { id: "traditions", type: "multi", options: TRADITIONS, label: l("Traditions followed", "परंपराएँ जिनका आप पालन करते हैं") },
          { id: "experienceYears", type: "text", keyboard: "number", maxLength: 2, validate: checks.years, label: l("Years of experience", "अनुभव (वर्ष)") },
        ],
      },
      {
        id: "practice-services",
        title: l("What you perform", "आप क्या कराते हैं"),
        intro: l("Choose all that apply.", "जो भी लागू हों, सब चुनें।"),
        fields: [
          { id: "languages", type: "multi", options: LANGUAGES, label: l("Languages spoken", "बोली जाने वाली भाषाएँ") },
          { id: "services", type: "multi", options: SERVICES, label: l("Pujas and services performed", "पूजाएँ और सेवाएँ") },
        ],
      },
      {
        id: "practice-about",
        title: l("About your practice", "अपनी साधना के बारे में"),
        intro: l("A few lines in your own words. You can leave this for later.", "अपने शब्दों में कुछ पंक्तियाँ। इसे बाद में भी भर सकते हैं।"),
        fields: [
          { id: "about", type: "textarea", maxLength: 600, label: l("About your practice", "अपनी साधना के बारे में"), placeholder: l("Where you studied, what you specialise in…", "आपने कहाँ अध्ययन किया, किसमें विशेषज्ञता है…") },
        ],
      },
    ],
  },
  {
    id: "serviceArea",
    phase: "profile",
    title: l("Service area", "सेवा क्षेत्र"),
    summary: l("How far you travel for a puja", "पूजा के लिए आप कितनी दूर जाते हैं"),
    doneWhen: (v) => filled(v.radiusKm) || filled(v.servicePins),
    steps: [
      {
        id: "service-radius",
        title: l("How far do you travel?", "आप कितनी दूर तक जाते हैं?"),
        fields: [
          { id: "serviceCentre", type: "location", label: l("Centre point", "केंद्र बिंदु"), hint: l("Your home address unless you set another place.", "आप कोई और जगह न चुनें तो आपका घर का पता।") },
          { id: "radiusKm", type: "choice", options: RADII, label: l("Travel distance", "यात्रा की दूरी") },
        ],
      },
      {
        id: "service-pins",
        title: l("PIN codes you serve", "जिन पिन कोड में आप सेवा देते हैं"),
        intro: l("Optional. Add any PIN codes you want to be sure are covered.", "वैकल्पिक। वे पिन कोड जोड़ें जहाँ आप ज़रूर सेवा देना चाहते हैं।"),
        fields: [
          { id: "servicePins", type: "tags", keyboard: "number", maxLength: 6, validate: checks.pin, label: l("PIN codes served", "सेवा वाले पिन कोड"), placeholder: l("Type a PIN code and press Add", "पिन कोड लिखें और जोड़ें दबाएँ") },
        ],
      },
    ],
  },
  {
    id: "bank",
    phase: "profile",
    title: l("Bank or UPI", "बैंक या UPI"),
    summary: l("Where we send your dakshina", "आपकी दक्षिणा कहाँ भेजें"),
    doneWhen: (v) => (isUpi(v) && filled(v.upiId)) || (isBank(v) && filled(v.accountNumber) && filled(v.ifsc)),
    steps: [
      {
        id: "bank",
        title: l("How should we pay you?", "हम आपको भुगतान कैसे करें?"),
        intro: l("We store only a masked form, such as the last four digits.", "हम केवल छिपा हुआ रूप रखते हैं, जैसे आख़िरी चार अंक।"),
        fields: [
          { id: "payoutMethod", type: "choice", options: [opt("upi", "UPI ID", "UPI ID"), opt("bank", "Bank account", "बैंक खाता")], label: l("Pay me by", "भुगतान का तरीका") },
          { id: "upiId", type: "text", sensitive: true, showIf: isUpi, required: isUpi, keyboard: "email", capitalize: "none", maxLength: 60, validate: checks.upi, label: l("UPI ID", "UPI ID"), placeholder: l("name@bank", "name@bank") },
          { id: "accountNumber", type: "text", sensitive: true, showIf: isBank, required: isBank, keyboard: "number", maxLength: 18, validate: checks.account, label: l("Account number", "खाता संख्या") },
          { id: "ifsc", type: "text", showIf: isBank, required: isBank, capitalize: "characters", maxLength: 11, validate: checks.ifsc, label: l("IFSC code", "IFSC कोड") },
          { id: "accountHolder", type: "text", showIf: (v) => isBank(v) || isUpi(v), required: (v) => isBank(v) || isUpi(v), capitalize: "words", maxLength: 80, label: l("Account holder name", "खाताधारक का नाम") },
        ],
      },
    ],
  },
  {
    id: "idDocument",
    phase: "profile",
    title: l("ID document", "पहचान पत्र"),
    summary: l("A photo of any one ID", "किसी एक पहचान पत्र की फ़ोटो"),
    doneWhen: (v) => filled(v.idType) && filled(v.idPhoto),
    steps: [
      {
        id: "id",
        title: l("Add one ID document", "एक पहचान पत्र जोड़ें"),
        intro: l("Only our verification team can see it.", "इसे केवल हमारी सत्यापन टीम देख सकती है।"),
        fields: [
          { id: "idType", type: "choice", options: [opt("aadhaar", "Masked Aadhaar", "मास्क्ड आधार"), opt("pan", "PAN", "पैन"), opt("dl", "Driving licence", "ड्राइविंग लाइसेंस")], label: l("Which document?", "कौन सा दस्तावेज़?") },
          {
            id: "idPhoto", type: "image", variant: "document", showIf: (v) => filled(v.idType), required: (v) => filled(v.idType),
            label: l("Photo of the document", "दस्तावेज़ की फ़ोटो"),
            hint: l("All four corners visible. For Aadhaar, use the masked version that hides the first 8 digits.", "चारों कोने दिखने चाहिए। आधार के लिए मास्क्ड प्रति दें, जिसमें पहले 8 अंक छिपे हों।"),
          },
        ],
      },
    ],
  },
  {
    id: "availability",
    phase: "profile",
    title: l("Availability", "उपलब्धता"),
    summary: l("The days and times you take bookings", "आप किन दिनों और समय पर बुकिंग लेते हैं"),
    doneWhen: (v) => Object.values(v.week || {}).some((s: any) => s && s.length > 0),
    steps: [
      {
        id: "availability-week",
        title: l("Your usual week", "आपका सामान्य सप्ताह"),
        intro: l("Tap the times you are usually free on each day.", "हर दिन के वे समय चुनें जब आप आम तौर पर उपलब्ध रहते हैं।"),
        fields: [{ id: "week", type: "week", label: l("Working days and times", "काम के दिन और समय") }],
      },
      {
        id: "availability-dates",
        title: l("Changes for specific dates", "ख़ास तारीख़ों के बदलाव"),
        intro: l("Optional. A day off or different times on a particular date.", "वैकल्पिक। किसी ख़ास तारीख़ पर छुट्टी या अलग समय।"),
        fields: [{ id: "dateChanges", type: "dateList", mode: "change", label: l("Date changes", "तारीख़ के बदलाव") }],
      },
      {
        id: "availability-leave",
        title: l("Planned leave", "पहले से तय छुट्टी"),
        intro: l("Optional. Dates when you will not take any bookings.", "वैकल्पिक। वे तारीख़ें जब आप कोई बुकिंग नहीं लेंगे।"),
        fields: [{ id: "leave", type: "dateList", mode: "range", label: l("Leave", "छुट्टी") }],
      },
    ],
  },
];

export const ONBOARDING = SECTIONS.filter((s) => s.phase === "onboarding");
export const PROFILE = SECTIONS.filter((s) => s.phase === "profile");

// ---------------------------------------------------------------- helpers used by both forms

export const isFilled = filled;
export const isRequired = (f: Field, v: Values) => (typeof f.required === "function" ? f.required(v) : !!f.required);
export const visibleFields = (step: Step, v: Values) => step.fields.filter((f) => !f.showIf || f.showIf(v));

const REQUIRED = l("This is needed to continue.", "आगे बढ़ने के लिए यह ज़रूरी है।");

/** Messages for one step, keyed by field id. Empty object means the step is fine. */
export function validateStep(step: Step, v: Values): Record<string, L> {
  const errors: Record<string, L> = {};
  for (const f of visibleFields(step, v)) {
    const x = v[f.id];
    if (!filled(x)) {
      if (isRequired(f, v)) errors[f.id] = REQUIRED;
      continue;
    }
    if (f.type === "dateList") {
      const bad = (x as any[]).some((r) => (f.mode === "range" ? !isDate(r.from) || !isDate(r.to) || r.to < r.from : !isDate(r.date)));
      if (bad) errors[f.id] = l("Complete every date, or remove the row.", "हर तारीख़ पूरी भरें, या वह पंक्ति हटा दें।");
      continue;
    }
    if (f.validate && f.type !== "tags") {
      const e = f.validate(x, v);
      if (e) errors[f.id] = e;
    }
  }
  return errors;
}

export function sectionStatus(s: Section, v: Values): "done" | "started" | "empty" {
  const fields = s.steps.flatMap((st) => st.fields);
  const anyFilled = fields.some((f) => filled(v[f.id]));
  const valid = s.steps.every((st) => Object.keys(validateStep(st, v)).length === 0);
  const done = valid && (s.doneWhen ? s.doneWhen(v) : fields.filter((f) => isRequired(f, v)).every((f) => filled(v[f.id])));
  return done ? "done" : anyFilled ? "started" : "empty";
}

/** The saved draft never contains sensitive entries (bank account number, UPI ID). */
export function draftOf(v: Values): Values {
  const out: Values = { ...v };
  for (const s of SECTIONS) for (const st of s.steps) for (const f of st.fields) if (f.sensitive) delete out[f.id];
  return out;
}

export const pad = (n: number | string) => String(n).padStart(2, "0");
export const showDate = (s: string) => (isDate(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "");

/** One-line text for review screens. */
export function display(f: Field, v: Values, lang: Lang): string {
  const x = v[f.id];
  const name = (list: Opt[] | undefined, val: string) => list?.find((o) => o.value === val)?.label[lang] ?? val;
  const opts = f.options;
  switch (f.type) {
    case "choice":
    case "select":
      return x ? name(opts, x) : "";
    case "multi":
      return (x || []).map((val: string) => name(opts, val)).join(", ");
    case "tags":
      return (x || []).join(", ");
    case "date":
      return showDate(x);
    case "image":
      return x ? (lang === "hi" ? "जोड़ दी गई" : "Added") : "";
    case "location":
      return x ? x.label || `${Number(x.lat).toFixed(4)}, ${Number(x.lng).toFixed(4)}` : "";
    case "week":
      return DAYS.filter((d) => x?.[d.value]?.length)
        .map((d) => `${d.label[lang]}: ${x[d.value].map((s: string) => SLOT_SHORT[s][lang]).join(", ")}`)
        .join(" · ");
    case "dateList":
      return (x || [])
        .map((r: any) => (f.mode === "range" ? `${showDate(r.from)} – ${showDate(r.to)}` : `${showDate(r.date)}${r.off ? (lang === "hi" ? " (छुट्टी)" : " (off)") : ""}`))
        .join(", ");
    default:
      return f.sensitive ? mask(String(x || "")) : String(x ?? "");
  }
}

// ---------------------------------------------------------------- interface wording

export const UI = {
  brand: l("ProPoojaPaath", "ProPoojaPaath"),
  next: l("Continue", "आगे बढ़ें"),
  back: l("Back", "पीछे"),
  review: l("Review", "जाँचें"),
  reviewTitle: l("Check your details", "अपना विवरण जाँच लें"),
  reviewIntro: l("You can change anything before you submit.", "जमा करने से पहले आप कुछ भी बदल सकते हैं।"),
  edit: l("Change", "बदलें"),
  submit: l("Submit profile", "प्रोफ़ाइल जमा करें"),
  submitting: l("Submitting…", "जमा हो रहा है…"),
  saving: l("Saving…", "सहेजा जा रहा है…"),
  save: l("Save", "सहेजें"),
  failed: l("That did not go through. Check your connection and try again.", "यह पूरा नहीं हो पाया। इंटरनेट जाँचें और दोबारा कोशिश करें।"),
  signedInAs: l("Signed in", "साइन इन"),
  verified: l("Verified", "सत्यापित"),
  mobile: l("Mobile", "मोबाइल"),
  gmail: l("Gmail", "जीमेल"),
  submittedTitle: l("Pranam, {name} ji", "प्रणाम, {name} जी"),
  submittedCta: l("Complete the rest of your profile", "बाकी प्रोफ़ाइल पूरी करें"),
  hubTitle: l("Complete your profile", "अपनी प्रोफ़ाइल पूरी करें"),
  hubIntro: l("Take these in any order. Each one takes a minute or two.", "इन्हें किसी भी क्रम में भरें। हर एक में एक-दो मिनट लगते हैं।"),
  hubAllDone: l("Every section is complete. Thank you.", "सभी भाग पूरे हो गए। धन्यवाद।"),
  done: l("Done", "पूरा"),
  started: l("In progress", "अधूरा"),
  empty: l("Not started", "शुरू नहीं हुआ"),
  optional: l("Optional", "वैकल्पिक"),
  choose: l("Choose", "चुनें"),
  close: l("Close", "बंद करें"),
  add: l("Add", "जोड़ें"),
  remove: l("Remove", "हटाएँ"),
  day: l("DD", "दिन"),
  month: l("MM", "माह"),
  year: l("YYYY", "वर्ष"),
  addPhoto: l("Add photo", "फ़ोटो जोड़ें"),
  changePhoto: l("Change photo", "फ़ोटो बदलें"),
  takePhoto: l("Take or choose a photo", "फ़ोटो लें या चुनें"),
  retake: l("Replace photo", "फ़ोटो बदलें"),
  // sign-in
  signIn: l("Sign in", "साइन इन"),
  signInSummary: l("Mobile number and Gmail", "मोबाइल नंबर और जीमेल"),
  profileStatus: l("Profile status", "प्रोफ़ाइल की स्थिति"),
  seconds: l("{n} s", "{n} से."),
  match: l("{n}% match", "{n}% मिलान"),
  chooseFirst: l("Choose a shloka first.", "पहले एक श्लोक चुनें।"),
  signInTitle: l("Pranam. Let us sign you in", "प्रणाम। आइए साइन इन करें"),
  signInIntro: l("Every pandit needs both a mobile number and a Gmail address. Start with either one.", "हर पंडित के लिए मोबाइल नंबर और जीमेल, दोनों ज़रूरी हैं। किसी एक से शुरू करें।"),
  withGoogle: l("Continue with Google", "Google से आगे बढ़ें"),
  withPhone: l("Continue with mobile number", "मोबाइल नंबर से आगे बढ़ें"),
  phoneTitle: l("Your mobile number", "आपका मोबाइल नंबर"),
  phoneIntro: l("We will send a 6-digit code by SMS.", "हम SMS से 6 अंकों का कोड भेजेंगे।"),
  phoneLabel: l("Mobile number", "मोबाइल नंबर"),
  phoneError: l("Enter a 10-digit mobile number.", "10 अंकों का मोबाइल नंबर लिखें।"),
  sendCode: l("Send code", "कोड भेजें"),
  sending: l("Sending…", "भेजा जा रहा है…"),
  otpTitle: l("Enter the code", "कोड लिखें"),
  otpIntro: l("Sent to +91 {phone}.", "+91 {phone} पर भेजा गया।"),
  otpLabel: l("6-digit code", "6 अंकों का कोड"),
  otpError: l("That code is not right. Check the SMS and try again.", "यह कोड सही नहीं है। SMS देखकर दोबारा लिखें।"),
  verify: l("Verify", "सत्यापित करें"),
  verifying: l("Verifying…", "सत्यापन हो रहा है…"),
  resend: l("Send a new code", "नया कोड भेजें"),
  resendIn: l("New code in {n}s", "{n} सेकंड में नया कोड"),
  changeNumber: l("Change number", "नंबर बदलें"),
  googleTitle: l("Now connect your Gmail", "अब अपना जीमेल जोड़ें"),
  googleIntro: l("Your mobile number is verified. Sign in with Google to finish.", "आपका मोबाइल नंबर सत्यापित हो गया। पूरा करने के लिए Google से साइन इन करें।"),
  phoneNextTitle: l("Now verify your mobile number", "अब अपना मोबाइल नंबर सत्यापित करें"),
  phoneNextIntro: l("Signed in as {email}. One more step.", "{email} से साइन इन हो गया। एक चरण और।"),
  // recitation
  recTitle: l("Recite a shloka", "एक श्लोक का पाठ करें"),
  recIntro: l("Choose a shloka and recite it aloud from memory. A close match marks your profile as AI verified.", "एक श्लोक चुनें और उसे याद से, ऊँची आवाज़ में सुनाएँ। अच्छा मिलान होने पर आपकी प्रोफ़ाइल AI सत्यापित हो जाएगी।"),
  shloka: l("Shloka", "श्लोक"),
  chooseShloka: l("Choose a shloka", "श्लोक चुनें"),
  startCamera: l("Start camera", "कैमरा चालू करें"),
  cameraOff: l("The camera is off", "कैमरा बंद है"),
  cameraSample: l("Sample preview. No camera is available here.", "नमूना दृश्य। यहाँ कैमरा उपलब्ध नहीं है।"),
  startRecording: l("Start recording", "रिकॉर्डिंग शुरू करें"),
  stop: l("Stop", "रोकें"),
  restart: l("Restart", "फिर से शुरू करें"),
  recording: l("Recording", "रिकॉर्ड हो रहा है"),
  recorded: l("Recording ready", "रिकॉर्डिंग तैयार है"),
  submitRecording: l("Submit recording", "रिकॉर्डिंग जमा करें"),
  checking: l("Matching your recitation…", "आपके पाठ का मिलान हो रहा है…"),
  attemptsLeft: l("{n} of {max} attempts left", "{max} में से {n} प्रयास शेष"),
  passedTitle: l("AI verified", "AI सत्यापित"),
  passedBody: l("Your recitation matched. Your profile is marked AI verified.", "आपका पाठ मेल खा गया। आपकी प्रोफ़ाइल AI सत्यापित हो गई है।"),
  failedTitle: l("Not a close enough match", "मिलान पर्याप्त नहीं रहा"),
  failedBody: l("Recite a little slower and clearer, in a quiet place, then try again.", "शांत जगह पर थोड़ा धीरे और साफ़ बोलकर दोबारा कोशिश करें।"),
  tryAgain: l("Try again", "दोबारा कोशिश करें"),
  blockedTitle: l("No attempts left", "कोई प्रयास शेष नहीं"),
  blockedBody: l("You have used all {max} attempts. You can ask our team to review your recitation.", "आपने सभी {max} प्रयास कर लिए हैं। आप हमारी टीम से अपने पाठ की समीक्षा का अनुरोध कर सकते हैं।"),
  requestReview: l("Request staff review", "टीम से समीक्षा का अनुरोध करें"),
  reviewRequested: l("Review requested. Our team will check your recitation and let you know.", "अनुरोध भेज दिया गया। हमारी टीम आपका पाठ देखकर आपको सूचित करेगी।"),
  skip: l("Skip for now", "अभी छोड़ें"),
  skipNote: l("Your profile stays a draft until this is done.", "यह पूरा होने तक आपकी प्रोफ़ाइल ड्राफ़्ट रहेगी।"),
  statusDraft: l("Draft", "ड्राफ़्ट"),
  statusVerified: l("AI verified", "AI सत्यापित"),
  statusReview: l("With our team for review", "टीम की समीक्षा में"),
  doneDraft: l("Your details are saved as a draft. Complete the recitation to be verified.", "आपका विवरण ड्राफ़्ट के रूप में सहेजा गया है। सत्यापन के लिए पाठ पूरा करें।"),
  doneVerified: l("Your profile is submitted and AI verified.", "आपकी प्रोफ़ाइल जमा हो गई है और AI सत्यापित है।"),
  doneReview: l("Your profile is submitted. Our team will review your recitation.", "आपकी प्रोफ़ाइल जमा हो गई है। हमारी टीम आपके पाठ की समीक्षा करेगी।"),
  recitation: l("Recitation", "पाठ"),
  recitationSummary: l("Recite a shloka to become AI verified", "AI सत्यापन के लिए एक श्लोक सुनाएँ"),
  continue: l("Continue", "आगे बढ़ें"),
  setOnMap: l("Set on map", "नक्शे पर चुनें"),
  changeOnMap: l("Change on map", "नक्शे पर बदलें"),
  fromPin: l("From PIN code {pin}", "पिन कोड {pin} से"),
  fromAddress: l("Your home address", "आपका घर का पता"),
  notSet: l("Not set yet", "अभी तय नहीं"),
  pinLooking: l("Looking up this PIN code…", "यह पिन कोड खोजा जा रहा है…"),
  pinFound: l("Found: {place}", "मिल गया: {place}"),
  pinNotFound: l("We could not find this PIN code. Fill in the next step by hand.", "यह पिन कोड नहीं मिला। अगला चरण स्वयं भरें।"),
  dayOff: l("Day off", "छुट्टी"),
  addDate: l("Add a date", "तारीख़ जोड़ें"),
  addLeave: l("Add leave", "छुट्टी जोड़ें"),
  from: l("From", "से"),
  to: l("To", "तक"),
  left: l("{n} characters left", "{n} अक्षर शेष"),
  language: l("हिन्दी", "English"), // the toggle shows the language you would switch to
};

export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
