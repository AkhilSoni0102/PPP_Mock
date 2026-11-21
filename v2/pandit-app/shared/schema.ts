// ProPoojaPaath pandit app (v2) — what is asked, in which step, in English and Hindi.
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
  | "image" // photo, value is a file uri
  | "search" // address type-ahead; picking a suggestion fills other fields
  | "centre" // service-area centre: a label, a still map with the travel circle, and a search to move it
  | "docs" // ID documents: { aadhaar: uri, pan: uri, dl: uri }
  | "week" // { mon: ["morning"], ... }
  | "calendar" // days off: ["2026-12-04", ...]
  | "dateList"; // leave ranges: [{ from, to }]

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
  minLength?: number;
  /** Shown as chosen until the pandit picks something else, and saved with the step. */
  defaultValue?: string;
};

export type Step = { id: string; title: L; intro?: L; fields: Field[] };

export type SectionId =
  | "personal"
  | "address"
  | "practice"
  | "serviceArea"
  | "availability"
  | "bank"
  | "idDocument";

export type Section = {
  id: SectionId;
  title: L;
  summary: L;
  /** "profile": listed under "Complete your profile". "more": listed under "More about you". */
  group: "profile" | "more";
  /** Needed before the profile can be submitted for review. */
  required?: boolean;
  /** Stays editable after the profile is submitted or approved. */
  alwaysEditable?: boolean;
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
  opt("buddhist", "Buddhist", "बौद्ध"),
  opt("sikh", "Sikh", "सिख"),
];

export const TRADITIONS: Opt[] = [
  opt("shaiva", "Shaiva", "शैव"),
  opt("shakta", "Shakta", "शाक्त"),
  opt("smarta", "Smarta", "स्मार्त"),
  opt("vaishnava", "Vaishnava", "वैष्णव"),
];

export const GOTRAS: Opt[] = [
  ["Agastya", "अगस्त्य"], ["Atri", "अत्रि"], ["Bharadwaj", "भारद्वाज"], ["Garg", "गर्ग"], ["Gautam", "गौतम"],
  ["Jamadagni", "जमदग्नि"], ["Kashyap", "कश्यप"], ["Kaushik", "कौशिक"], ["Parashar", "पराशर"], ["Shandilya", "शांडिल्य"],
  ["Vashishtha", "वशिष्ठ"], ["Vatsa", "वत्स"], ["Vishwamitra", "विश्वामित्र"],
].map(([en, hi]) => opt(en.toLowerCase(), en, hi));

export const LANGUAGES: Opt[] = [
  opt("hi", "Hindi", "हिन्दी"), opt("en", "English", "अंग्रेज़ी"), opt("sa", "Sanskrit", "संस्कृत"),
  opt("bn", "Bengali", "बांग्ला"), opt("bho", "Bhojpuri", "भोजपुरी"), opt("gu", "Gujarati", "गुजराती"),
  opt("kn", "Kannada", "कन्नड़"), opt("mai", "Maithili", "मैथिली"), opt("ml", "Malayalam", "मलयालम"),
  opt("mr", "Marathi", "मराठी"), opt("or", "Odia", "ओड़िया"), opt("pa", "Punjabi", "पंजाबी"),
  opt("ta", "Tamil", "तमिल"), opt("te", "Telugu", "तेलुगु"),
];

export const SERVICES: Opt[] = [
  opt("annaprashan", "Annaprashan", "अन्नप्राशन"),
  opt("antim-sanskar", "Antim Sanskar", "अंतिम संस्कार"),
  opt("bhagwat-katha", "Bhagwat Katha", "भागवत कथा"),
  opt("ganesh-puja", "Ganesh Puja", "गणेश पूजा"),
  opt("griha-pravesh", "Griha Pravesh", "गृह प्रवेश"),
  opt("havan", "Havan", "हवन"),
  opt("lakshmi-puja", "Lakshmi Puja", "लक्ष्मी पूजा"),
  opt("mundan", "Mundan", "मुंडन"),
  opt("namkaran", "Namkaran", "नामकरण"),
  opt("navgraha", "Navgraha Shanti", "नवग्रह शांति"),
  opt("rudrabhishek", "Rudrabhishek", "रुद्राभिषेक"),
  opt("satyanarayan", "Satyanarayan Puja", "सत्यनारायण पूजा"),
  opt("shraddh", "Shraddh / Pitru Karma", "श्राद्ध / पितृ कर्म"),
  opt("sundarkand", "Sundarkand Path", "सुंदरकांड पाठ"),
  opt("vastu", "Vastu Shanti", "वास्तु शांति"),
  opt("vivah", "Vivah (Wedding)", "विवाह"),
];

/** The app's own language, chosen from a full-screen picker. Each name is in its own script.
 *  Only Hindi and English are written so far; the others fall back to English. */
export const APP_LANGUAGES: { code: string; name: string; uses: Lang }[] = [
  { code: "hi", name: "हिन्दी", uses: "hi" },
  { code: "en", name: "English", uses: "en" },
  { code: "mr", name: "मराठी", uses: "en" },
  { code: "gu", name: "ગુજરાતી", uses: "en" },
  { code: "bn", name: "বাংলা", uses: "en" },
  { code: "ta", name: "தமிழ்", uses: "en" },
  { code: "te", name: "తెలుగు", uses: "en" },
  { code: "kn", name: "ಕನ್ನಡ", uses: "en" },
];

export const RADII: Opt[] = [2, 5, 10, 15, 25, 50, 100].map((km) => opt(String(km), `${km} km`, `${km} किमी`));

export const DAYS: Opt[] = [
  opt("mon", "Mon", "सोम"), opt("tue", "Tue", "मंगल"), opt("wed", "Wed", "बुध"), opt("thu", "Thu", "गुरु"),
  opt("fri", "Fri", "शुक्र"), opt("sat", "Sat", "शनि"), opt("sun", "Sun", "रवि"),
];

export const SLOTS: Opt[] = [
  opt("morning", "Morning, 6 to 10 am", "सुबह, 6 से 10 बजे"),
  opt("afternoon", "Afternoon, 12 to 4 pm", "दोपहर, 12 से 4 बजे"),
  opt("evening", "Evening, 5 to 9 pm", "शाम, 5 से 9 बजे"),
];
export const SLOT_SHORT: Record<string, L> = {
  morning: l("Morning", "सुबह"),
  afternoon: l("Afternoon", "दोपहर"),
  evening: l("Evening", "शाम"),
};

/** Recitation: how many attempts a pandit gets, and the longest recording in seconds. */
export const MAX_ATTEMPTS = 3;
export const MAX_RECORDING_SECONDS = 60;

/** Shown in the recitation dropdown when no `shlokas` prop is passed. Names only: the text is never shown. */
export const SAMPLE_SHLOKAS: Opt[] = [
  opt("gayatri", "Gayatri Mantra", "गायत्री मंत्र"),
  opt("vakratunda", "Vakratunda Mahakaya", "वक्रतुंड महाकाय"),
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
    /^\d{1,2}$/.test(x) && +x <= 90 ? null : l("Enter a number of years, for example 12.", "वर्षों की संख्या लिखें, जैसे 12।"),
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

const pinList = (x: string) =>
  x.split(",").map((p) => p.trim()).filter(Boolean).every((p) => /^[1-9]\d{5}$/.test(p))
    ? null
    : l("Use 6-digit PIN codes separated by commas.", "6 अंकों के पिन कोड अल्पविराम से अलग करके लिखें।");
const sameAccount = (x: string, v: Values) =>
  x === v.accountNumber ? null : l("The two account numbers do not match.", "दोनों खाता संख्याएँ एक जैसी नहीं हैं।");

const isBank = (v: Values) => v.payoutMethod === "bank";
const isUpi = (v: Values) => v.payoutMethod === "upi";

// ---------------------------------------------------------------- sections and steps

export const SECTIONS: Section[] = [
  {
    id: "personal",
    group: "profile",
    required: true,
    title: l("Personal", "व्यक्तिगत"),
    summary: l("Your name, photo, gender and date of birth", "आपका नाम, फ़ोटो, लिंग और जन्म तिथि"),
    steps: [
      {
        id: "personal",
        title: l("Tell us about yourself", "अपने बारे में बताएं"),
        intro: l("This is how yajmans will see you.", "यजमान आपको इसी रूप में देखेंगे।"),
        fields: [
          { id: "photo", type: "image", label: l("Profile photo", "प्रोफ़ाइल फ़ोटो"), hint: l("Optional. A clear photo of your face.", "वैकल्पिक। चेहरे की साफ़ फ़ोटो।") },
          { id: "fullName", type: "text", required: true, capitalize: "words", minLength: 2, maxLength: 120, label: l("Full name", "पूरा नाम"), hint: l("As written on your ID.", "जैसा आपके पहचान पत्र पर लिखा है।") },
          { id: "gender", type: "choice", required: true, options: GENDERS, label: l("Gender", "लिंग") },
          { id: "dob", type: "date", required: true, validate: checks.dob, label: l("Date of birth", "जन्म तिथि") },
        ],
      },
    ],
  },
  {
    id: "address",
    group: "profile",
    required: true,
    title: l("Address", "पता"),
    summary: l("Where you live", "आप कहाँ रहते हैं"),
    steps: [
      {
        id: "address-home",
        title: l("Where do you live?", "आप कहाँ रहते हैं?"),
        intro: l("Search for your address, or start with your PIN code.", "अपना पता खोजें, या पिन कोड से शुरू करें।"),
        fields: [
          { id: "addressSearch", type: "search", label: l("Search your address", "अपना पता खोजें"), placeholder: l("Type 3 letters or more", "3 या अधिक अक्षर लिखें") },
          { id: "pin", type: "text", required: true, keyboard: "number", maxLength: 6, validate: checks.pin, label: l("PIN code", "पिन कोड") },
          { id: "addressLine", type: "text", required: true, minLength: 3, maxLength: 200, label: l("House, street, area", "मकान, गली, मोहल्ला") },
        ],
      },
      {
        id: "address-area",
        title: l("Your city and state", "आपका शहर और राज्य"),
        intro: l("Check these and correct anything that is wrong.", "इन्हें जाँच लें और जो ग़लत हो उसे ठीक करें।"),
        fields: [
          { id: "city", type: "text", required: true, capitalize: "words", maxLength: 60, label: l("City or town", "शहर या कस्बा") },
          { id: "state", type: "select", required: true, options: STATES, label: l("State", "राज्य") },
        ],
      },
    ],
  },
  {
    id: "practice",
    group: "profile",
    title: l("Religious practice", "धार्मिक साधना"),
    summary: l("Experience, languages, pujas and tradition", "अनुभव, भाषाएँ, पूजाएँ और परंपरा"),
    doneWhen: (v) => filled(v.services) && filled(v.languages),
    steps: [
      {
        id: "practice-experience",
        title: l("Your experience", "आपका अनुभव"),
        fields: [
          { id: "experienceYears", type: "text", keyboard: "number", maxLength: 2, validate: checks.years, label: l("Years of experience", "अनुभव (वर्ष)") },
          { id: "about", type: "textarea", maxLength: 2000, label: l("About your practice", "अपनी साधना के बारे में"), placeholder: l("Where you studied, what you specialise in…", "आपने कहाँ अध्ययन किया, किसमें विशेषज्ञता है…") },
        ],
      },
      {
        id: "practice-languages",
        title: l("Languages you speak", "आप कौन सी भाषाएँ बोलते हैं"),
        intro: l("Choose all that apply.", "जो भी लागू हों, सब चुनें।"),
        fields: [{ id: "languages", type: "multi", options: LANGUAGES, label: l("Languages", "भाषाएँ") }],
      },
      {
        id: "practice-services",
        title: l("Pujas and services you perform", "आप कौन सी पूजाएँ और सेवाएँ कराते हैं"),
        intro: l("Choose all that apply.", "जो भी लागू हों, सब चुनें।"),
        fields: [{ id: "services", type: "multi", options: SERVICES, label: l("Pujas and services", "पूजाएँ और सेवाएँ") }],
      },
      {
        id: "practice-tradition",
        title: l("Your tradition", "आपकी परंपरा"),
        fields: [
          { id: "dharma", type: "select", options: DHARMAS, label: l("Dharma", "धर्म") },
          { id: "traditions", type: "multi", options: TRADITIONS, label: l("Traditions you follow", "परंपराएँ जिनका आप पालन करते हैं") },
          { id: "gotra", type: "select", options: GOTRAS, label: l("Gotra", "गोत्र") },
        ],
      },
    ],
  },
  {
    id: "serviceArea",
    group: "profile",
    title: l("Service area", "सेवा क्षेत्र"),
    summary: l("Where you travel for pujas", "पूजा के लिए आप कहाँ तक जाते हैं"),
    doneWhen: (v) => filled(v.radiusKm),
    steps: [
      {
        id: "service-area",
        title: l("Where do you travel for pujas?", "पूजा के लिए आप कहाँ तक जाते हैं?"),
        fields: [
          { id: "serviceCentre", type: "centre", label: l("Centre of your service area", "आपके सेवा क्षेत्र का केंद्र") },
          { id: "radiusKm", type: "choice", defaultValue: "10", options: RADII, label: l("How far do you travel?", "आप कितनी दूर तक जाते हैं?") },
          { id: "servicePins", type: "text", keyboard: "default", maxLength: 200, validate: pinList, label: l("PIN codes you also serve", "अन्य पिन कोड जहाँ आप सेवा देते हैं"), hint: l("Optional. Separate them with commas.", "वैकल्पिक। अल्पविराम से अलग करें।"), placeholder: l("221005, 221010", "221005, 221010") },
        ],
      },
    ],
  },
  {
    id: "availability",
    group: "more",
    alwaysEditable: true,
    title: l("Your availability", "आपकी उपलब्धता"),
    summary: l("The days and times you take bookings", "आप किन दिनों और समय पर बुकिंग लेते हैं"),
    doneWhen: (v) => Object.values(v.week || {}).some((s: any) => s && s.length > 0),
    steps: [
      {
        id: "availability",
        title: l("When are you free?", "आप कब उपलब्ध हैं?"),
        intro: l("You decide which days you work. You can change this at any time.", "आप तय करते हैं कि किन दिनों काम करेंगे। इसे कभी भी बदल सकते हैं।"),
        fields: [
          { id: "week", type: "week", label: l("Weekly times", "साप्ताहिक समय"), hint: l("These repeat every week.", "ये हर सप्ताह दोहराए जाते हैं।") },
          { id: "daysOff", type: "calendar", label: l("This month", "इस महीने"), hint: l("Tap a date to mark or clear a day off.", "छुट्टी लगाने या हटाने के लिए तारीख़ पर टैप करें।") },
          { id: "leave", type: "dateList", label: l("Plan leave", "छुट्टी की योजना") },
        ],
      },
    ],
  },
  {
    id: "bank",
    group: "more",
    title: l("Bank or UPI details", "बैंक या UPI विवरण"),
    summary: l("Where payments for your pujas are sent", "आपकी पूजाओं का भुगतान कहाँ भेजा जाए"),
    doneWhen: (v) => (isUpi(v) && filled(v.upiId)) || (isBank(v) && filled(v.accountNumber) && filled(v.ifsc)),
    steps: [
      {
        id: "bank",
        title: l("How should we pay you?", "हम आपको भुगतान कैसे करें?"),
        intro: l("Payments for your pujas will be sent here. We keep only the last 4 digits.", "आपकी पूजाओं का भुगतान यहाँ भेजा जाएगा। हम केवल आख़िरी 4 अंक रखते हैं।"),
        fields: [
          { id: "payoutMethod", type: "choice", options: [opt("bank", "Bank account", "बैंक खाता"), opt("upi", "UPI ID", "UPI ID")], label: l("Pay me by", "भुगतान का तरीका") },
          { id: "accountHolder", type: "text", showIf: (v) => isBank(v) || isUpi(v), required: (v) => isBank(v) || isUpi(v), capitalize: "words", maxLength: 80, label: l("Account holder name", "खाताधारक का नाम") },
          { id: "accountNumber", type: "text", sensitive: true, showIf: isBank, required: isBank, keyboard: "number", maxLength: 18, validate: checks.account, label: l("Account number", "खाता संख्या") },
          { id: "accountNumberAgain", type: "text", sensitive: true, showIf: isBank, required: isBank, keyboard: "number", maxLength: 18, validate: sameAccount, label: l("Account number again", "खाता संख्या दोबारा") },
          { id: "ifsc", type: "text", showIf: isBank, required: isBank, capitalize: "characters", maxLength: 11, validate: checks.ifsc, label: l("IFSC code", "IFSC कोड") },
          { id: "upiId", type: "text", sensitive: true, showIf: isUpi, required: isUpi, keyboard: "email", capitalize: "none", maxLength: 60, validate: checks.upi, label: l("UPI ID", "UPI ID"), hint: l("For example: name@bank", "उदाहरण: name@bank") },
        ],
      },
    ],
  },
  {
    id: "idDocument",
    group: "more",
    title: l("ID document", "पहचान पत्र"),
    summary: l("A photo of any one ID", "किसी एक पहचान पत्र की फ़ोटो"),
    doneWhen: (v) => Object.values(v.idDocs || {}).some(Boolean),
    steps: [
      {
        id: "id",
        title: l("Add an ID document", "पहचान पत्र जोड़ें"),
        intro: l("Upload a clear photo. Only our review team can see it.", "साफ़ फ़ोटो अपलोड करें। इसे केवल हमारी समीक्षा टीम देख सकती है।"),
        fields: [{ id: "idDocs", type: "docs", label: l("Which document?", "कौन सा दस्तावेज़?") }],
      },
    ],
  },
];

export const ID_TYPES: (Opt & { warning?: L })[] = [
  { ...opt("aadhaar", "Aadhaar (masked)", "आधार (मास्क्ड)"), warning: l("Use a masked Aadhaar only: the first 8 digits must be hidden.", "केवल मास्क्ड आधार दें: पहले 8 अंक छिपे होने चाहिए।") },
  opt("pan", "PAN card", "पैन कार्ड"),
  opt("dl", "Driving licence", "ड्राइविंग लाइसेंस"),
];

export const PROFILE_SECTIONS = SECTIONS.filter((s) => s.group === "profile");
export const MORE_SECTIONS = SECTIONS.filter((s) => s.group === "more");
export const REQUIRED_SECTIONS = SECTIONS.filter((s) => s.required);

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
      const bad = (x as any[]).some((r) => !isDate(r.from) || !isDate(r.to) || r.to < r.from);
      if (bad) errors[f.id] = l("Complete both dates; the end must be on or after the start.", "दोनों तारीख़ें भरें; अंत की तारीख़ शुरुआत के बाद या उसी दिन होनी चाहिए।");
      continue;
    }
    if (f.minLength && String(x).trim().length < f.minLength) {
      errors[f.id] = l("This is too short.", "यह बहुत छोटा है।");
      continue;
    }
    if (f.validate) {
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
    case "calendar":
      return (x || []).map(showDate).join(", ");
    case "docs":
      return ID_TYPES.filter((d) => x?.[d.value]).map((d) => d.label[lang]).join(", ");
    case "centre":
    case "search":
      return x?.label ?? "";
    case "date":
      return showDate(x);
    case "image":
      return x ? (lang === "hi" ? "जोड़ दी गई" : "Added") : "";
    case "week":
      return DAYS.filter((d) => x?.[d.value]?.length)
        .map((d) => `${d.label[lang]}: ${x[d.value].map((s: string) => SLOT_SHORT[s][lang]).join(", ")}`)
        .join(" · ");
    case "dateList":
      return (x || [])
        .map((r: any) => `${showDate(r.from)} – ${showDate(r.to)}`)
        .join(", ");
    default:
      return f.sensitive ? mask(String(x || "")) : String(x ?? "");
  }
}

// ---------------------------------------------------------------- statuses and updates

export type Status =
  | "draft" | "submitted" | "ai_pending" | "ai_passed" | "ai_failed"
  | "under_review" | "changes_requested" | "approved" | "rejected" | "suspended";

export const STATUS_LABEL: Record<Status, L> = {
  draft: l("Not submitted", "जमा नहीं हुई"),
  submitted: l("Submitted", "जमा हो गई"),
  ai_pending: l("Checking recitation", "पाठ की जाँच हो रही है"),
  ai_passed: l("Recitation passed", "पाठ सफल रहा"),
  ai_failed: l("Recitation not passed", "पाठ सफल नहीं रहा"),
  under_review: l("Under review", "समीक्षा में"),
  changes_requested: l("Changes requested", "बदलाव माँगे गए"),
  approved: l("Verified", "सत्यापित"),
  rejected: l("Not approved", "स्वीकृत नहीं"),
  suspended: l("Suspended", "निलंबित"),
};
/** good / waiting / attention / neutral: drives the badge colour. */
export const STATUS_TONE: Record<Status, "good" | "waiting" | "attention" | "neutral"> = {
  draft: "neutral", submitted: "waiting", ai_pending: "waiting", ai_passed: "good", ai_failed: "attention",
  under_review: "waiting", changes_requested: "attention", approved: "good", rejected: "attention", suspended: "attention",
};
/** The pandit can edit the profile only in these statuses (availability is always editable). */
export const EDITABLE: Status[] = ["draft", "changes_requested"];

export type UpdateKind =
  | "submitted" | "under_review" | "changes_requested" | "approved" | "rejected" | "suspended"
  | "recitation_passed" | "recitation_failed";
/** `at` is when it happened, as an ISO date-time ("2026-11-15T09:45:00+05:30"). It is shown on the Updates page. */
export type Update = { id: string; kind: UpdateKind; reason?: string; read?: boolean; at?: string };

const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
};
/** "15 Nov" or, with the time, "15 Nov, 9:45 am". Empty when the date is missing or unreadable. */
export function formatWhen(at: string | undefined, lang: Lang, withTime = false): string {
  if (!at) return "";
  const d = new Date(at);
  if (isNaN(d.getTime())) return "";
  const day = `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
  if (!withTime) return day;
  const h = d.getHours();
  return `${day}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** Whether this device may show push notifications. "unknown": the pandit has not been asked yet. */
export type NotificationState = "unknown" | "on" | "off" | "blocked";

export const UPDATE_TEXT: Record<UpdateKind, L> = {
  submitted: l("Your profile was submitted.", "आपकी प्रोफ़ाइल जमा हो गई।"),
  under_review: l("Your profile is being reviewed.", "आपकी प्रोफ़ाइल की समीक्षा हो रही है।"),
  changes_requested: l("The reviewer asked for changes.", "समीक्षक ने कुछ बदलाव माँगे हैं।"),
  approved: l("You are verified.", "आप सत्यापित हो गए हैं।"),
  rejected: l("Your profile was not approved.", "आपकी प्रोफ़ाइल स्वीकृत नहीं हुई।"),
  suspended: l("Your profile is suspended.", "आपकी प्रोफ़ाइल निलंबित है।"),
  recitation_passed: l("Your recitation passed.", "आपका पाठ सफल रहा।"),
  recitation_failed: l("Your recitation did not pass. You can try again.", "आपका पाठ सफल नहीं रहा। आप दोबारा कोशिश कर सकते हैं।"),
};

export type Attempt = { n: number; shlokaId: string; result: "checking" | "passed" | "failed" };

// ---------------------------------------------------------------- interface wording

export const INTRO: { title: L; body: L }[] = [
  { title: l("More yajmans, closer to home", "अधिक यजमान, घर के पास"), body: l("Families near you find verified pandits for their pujas.", "आपके आसपास के परिवार अपनी पूजाओं के लिए सत्यापित पंडित खोजते हैं।") },
  { title: l("Your time, your calendar", "आपका समय, आपका कैलेंडर"), body: l("Tell us when you are free. You decide which days you work.", "हमें बताएं कि आप कब उपलब्ध हैं। किन दिनों काम करना है, यह आप तय करते हैं।") },
  { title: l("A verified badge builds trust", "सत्यापित बैज से भरोसा बढ़ता है"), body: l("Complete your profile, recite a shloka, and get the verified tick.", "प्रोफ़ाइल पूरी करें, एक श्लोक सुनाएँ, और सत्यापित चिह्न पाएँ।") },
];

export const UI = {
  brand: l("ProPoojaPaath", "ProPoojaPaath"),
  next: l("Next", "आगे"),
  getStarted: l("Get started", "शुरू करें"),
  back: l("Back", "पीछे"),
  close: l("Close", "बंद करें"),
  cancel: l("Cancel", "रद्द करें"),
  save: l("Save", "सहेजें"),
  saveContinue: l("Save and continue", "सहेजें और आगे बढ़ें"),
  saving: l("Saving…", "सहेजा जा रहा है…"),
  skip: l("Skip for now", "अभी छोड़ें"),
  tryAgain: l("Try again", "दोबारा कोशिश करें"),
  failed: l("That did not go through. Check your connection and try again.", "यह पूरा नहीं हो पाया। इंटरनेट जाँचें और दोबारा कोशिश करें।"),
  required: l("Required", "ज़रूरी"),
  optional: l("Optional", "वैकल्पिक"),
  done: l("Done", "पूरा"),
  started: l("In progress", "अधूरा"),
  empty: l("Not started", "शुरू नहीं हुआ"),
  choose: l("Choose", "चुनें"),
  add: l("Add", "जोड़ें"),
  remove: l("Remove", "हटाएँ"),
  edit: l("Change", "बदलें"),
  verified: l("Verified", "सत्यापित"),
  mobile: l("Mobile", "मोबाइल"),
  gmail: l("Gmail", "जीमेल"),
  day: l("DD", "दिन"),
  month: l("MM", "माह"),
  year: l("YYYY", "वर्ष"),
  left: l("{n} characters left", "{n} अक्षर शेष"),
  language: l("Language", "भाषा"),
  chooseLanguage: l("Choose your language", "अपनी भाषा चुनें"),

  // sign-in
  signInTitle: l("Sign in", "साइन इन करें"),
  signInIntro: l("Use your mobile number or your Google account. You will need both before you start.", "अपने मोबाइल नंबर या Google खाते से साइन इन करें। शुरू करने से पहले दोनों की ज़रूरत होगी।"),
  phoneLabel: l("Mobile number", "मोबाइल नंबर"),
  phoneError: l("Enter a 10-digit mobile number.", "10 अंकों का मोबाइल नंबर लिखें।"),
  sendCode: l("Send code", "कोड भेजें"),
  sending: l("Sending…", "भेजा जा रहा है…"),
  or: l("or", "या"),
  withGoogle: l("Continue with Google", "Google से आगे बढ़ें"),
  privacy: l("Privacy policy", "गोपनीयता नीति"),
  otpTitle: l("Enter the code", "कोड लिखें"),
  otpIntro: l("Sent to +91 {phone}.", "+91 {phone} पर भेजा गया।"),
  otpLabel: l("6-digit code", "6 अंकों का कोड"),
  otpError: l("That code is not right. Check the SMS and try again.", "यह कोड सही नहीं है। SMS देखकर दोबारा लिखें।"),
  verify: l("Verify", "सत्यापित करें"),
  verifying: l("Verifying…", "सत्यापन हो रहा है…"),
  sendAgain: l("Send again", "दोबारा भेजें"),
  sendAgainIn: l("Send again in {n}s", "{n} सेकंड में दोबारा भेजें"),
  changeNumber: l("Change number", "नंबर बदलें"),
  addPhoneTitle: l("Add your mobile number", "अपना मोबाइल नंबर जोड़ें"),
  addPhoneIntro: l("Signed in as {email}. Every pandit also needs a verified mobile number.", "{email} से साइन इन हो गया। हर पंडित के लिए सत्यापित मोबाइल नंबर भी ज़रूरी है।"),
  addEmailTitle: l("Add your email", "अपना ईमेल जोड़ें"),
  addEmailIntro: l("Your mobile number is verified. Sign in to your Google account once and we will attach that Gmail.", "आपका मोबाइल नंबर सत्यापित हो गया। एक बार अपने Google खाते में साइन इन करें, हम वह जीमेल जोड़ देंगे।"),
  verifyWithGoogle: l("Verify with Google", "Google से सत्यापित करें"),
  signOut: l("Sign out", "साइन आउट"),

  // home
  namaste: l("Namaste, {name}", "नमस्ते, {name}"),
  namasteNoName: l("Namaste", "नमस्ते"),
  bannerTitle: l("Complete your profile", "अपनी प्रोफ़ाइल पूरी करें"),
  bannerNeeds: l("Name, gender, date of birth and address are needed before you can submit.", "जमा करने से पहले नाम, लिंग, जन्म तिथि और पता ज़रूरी हैं।"),
  bannerReady: l("The required details are in. Submit for review, or add more first.", "ज़रूरी विवरण भर गए हैं। समीक्षा के लिए जमा करें, या पहले और जानकारी जोड़ें।"),
  bannerLocked: l("Your profile is with our team. You can still change your availability.", "आपकी प्रोफ़ाइल हमारी टीम के पास है। आप अपनी उपलब्धता अब भी बदल सकते हैं।"),
  bannerVerified: l("Your profile is verified. You can still change your availability.", "आपकी प्रोफ़ाइल सत्यापित है। आप अपनी उपलब्धता अब भी बदल सकते हैं।"),
  continueProfile: l("Continue your profile", "प्रोफ़ाइल जारी रखें"),
  submitForReview: l("Submit for review", "समीक्षा के लिए जमा करें"),
  submitting: l("Submitting…", "जमा हो रहा है…"),
  updates: l("Updates", "सूचनाएँ"),
  markRead: l("Mark as read", "पढ़ा हुआ करें"),
  updatesUnread: l("Updates, {n} unread", "सूचनाएँ, {n} बिना पढ़ी"),
  seeUpdates: l("See all updates", "सभी सूचनाएँ देखें"),
  badgeHint: l("{status}. See updates", "{status}। सूचनाएँ देखें"),
  whereProfile: l("Where your profile is", "आपकी प्रोफ़ाइल कहाँ तक पहुँची"),
  allUpdates: l("All updates", "सभी सूचनाएँ"),
  noUpdates: l("Nothing yet. After you submit your profile, every update about it appears here.", "अभी कुछ नहीं। प्रोफ़ाइल जमा करने के बाद उससे जुड़ी हर सूचना यहाँ दिखेगी।"),
  newLabel: l("New", "नई"),
  stepSubmit: l("Submit your profile", "अपनी प्रोफ़ाइल जमा करें"),
  stepSubmitNote: l("Review starts once you submit.", "जमा करने के बाद समीक्षा शुरू होती है।"),
  stepSubmitted: l("Profile submitted", "प्रोफ़ाइल जमा हुई"),
  stepRecitation: l("Recitation checked", "पाठ की जाँच"),
  recNotRecorded: l("Not recorded yet.", "अभी रिकॉर्ड नहीं हुआ।"),
  recChecking: l("Your recitation is being checked.", "आपके पाठ की जाँच हो रही है।"),
  recFailedNote: l("It did not pass. Attempts left: {n}.", "यह सफल नहीं रहा। शेष प्रयास: {n}।"),
  recBlockedNote: l("It did not pass and no attempts are left.", "यह सफल नहीं रहा और कोई प्रयास शेष नहीं है।"),
  reviewWaiting: l("Waiting for a reviewer.", "समीक्षक की प्रतीक्षा है।"),
  reviewNow: l("A reviewer is looking at your profile.", "एक समीक्षक आपकी प्रोफ़ाइल देख रहे हैं।"),
  verifiedNote: l("Yajmans can now find and book you.", "अब यजमान आपको खोजकर बुक कर सकते हैं।"),
  updateProfile: l("Update my profile", "मेरी प्रोफ़ाइल अपडेट करें"),
  contactTeam: l("Contact our team", "हमारी टीम से संपर्क करें"),

  // notifications
  notifyTitle: l("Know the moment you are verified", "सत्यापित होते ही जानें"),
  notifyIntro: l("Your profile is with our team. Allow notifications and we will tell you when:", "आपकी प्रोफ़ाइल हमारी टीम के पास है। नोटिफ़िकेशन चालू करें, हम आपको बताएँगे जब:"),
  notifyItems: l("your profile is approved · the reviewer asks for a change · your recitation is checked", "आपकी प्रोफ़ाइल स्वीकृत हो · समीक्षक कोई बदलाव माँगें · आपके पाठ की जाँच हो जाए"),
  allowNotifications: l("Allow notifications", "नोटिफ़िकेशन चालू करें"),
  notNow: l("Not now", "अभी नहीं"),
  notifyOnTitle: l("Notifications are on", "नोटिफ़िकेशन चालू हैं"),
  notifyOnBody: l("We will tell you as soon as your profile is reviewed.", "प्रोफ़ाइल की समीक्षा होते ही हम आपको बताएँगे।"),
  notifyLaterTitle: l("No problem", "कोई बात नहीं"),
  notifyLaterBody: l("You can turn them on any time in My account. Your updates are always under the bell.", "आप इन्हें कभी भी मेरा खाता में चालू कर सकते हैं। आपकी सूचनाएँ हमेशा घंटी के नीचे मिलेंगी।"),
  goHome: l("Go to Home", "होम पर जाएँ"),
  notifications: l("Notifications", "नोटिफ़िकेशन"),
  notifOnNote: l("We tell you when your profile status changes", "प्रोफ़ाइल की स्थिति बदलने पर हम आपको बताते हैं"),
  notifOffNote: l("Off. Your updates are still under the bell", "बंद हैं। आपकी सूचनाएँ घंटी के नीचे मिलती रहेंगी"),
  notifBlockedNote: l("Turned off in this device's settings", "इस डिवाइस की सेटिंग्स में बंद हैं"),
  openSettings: l("Open settings", "सेटिंग्स खोलें"),
  reviewerMessage: l("Message from the reviewer", "समीक्षक का संदेश"),
  yourProfile: l("Your profile", "आपकी प्रोफ़ाइल"),
  moreAboutYou: l("More about you", "आपके बारे में और"),
  getVerified: l("Get verified", "सत्यापित हों"),
  getVerifiedSummary: l("Recite a shloka for the verified tick", "सत्यापित चिह्न के लिए एक श्लोक सुनाएँ"),
  bankPending: l("Saved, verification pending", "सहेजा गया, सत्यापन बाकी"),
  bankVerified: l("Verified", "सत्यापित"),
  uploadedCount: l("{n} uploaded", "{n} अपलोड हुए"),
  attemptsLeft: l("Attempts left: {n}", "शेष प्रयास: {n}"),
  beingCheckedShort: l("Being checked", "जाँच हो रही है"),
  passedShort: l("Passed", "सफल"),
  reviewAsked: l("Staff review requested", "टीम से समीक्षा माँगी गई"),

  // menu
  menu: l("Menu", "मेनू"),
  myProfile: l("My profile", "मेरी प्रोफ़ाइल"),
  myProfileIntro: l("Everything you have told us so far.", "अब तक आपने जो कुछ बताया है।"),
  myAccount: l("My account", "मेरा खाता"),
  myAccountIntro: l("The contact details you sign in with.", "वे संपर्क विवरण जिनसे आप साइन इन करते हैं।"),
  settings: l("Settings", "सेटिंग्स"),
  help: l("Help and contact", "सहायता और संपर्क"),
  helpIntro: l("Write to us and we will reply by email.", "हमें लिखें, हम ईमेल से उत्तर देंगे।"),
  deleteAccount: l("Delete my account", "मेरा खाता हटाएँ"),
  home: l("Home", "होम"),
  notAdded: l("Not added yet", "अभी नहीं जोड़ा"),

  // address and service area
  searching: l("Searching…", "खोज रहे हैं…"),
  noResults: l("No matches. Fill in the fields below by hand.", "कोई मेल नहीं मिला। नीचे के खाने स्वयं भरें।"),
  pinLooking: l("Looking up this PIN code…", "यह पिन कोड खोजा जा रहा है…"),
  pinFound: l("{place}", "{place}"),
  pinNotFound: l("We could not find this PIN code. Fill in the next step by hand.", "यह पिन कोड नहीं मिला। अगला चरण स्वयं भरें।"),
  noCentre: l("Add your home address first, or search for a place below to set the centre.", "पहले अपना घर का पता जोड़ें, या केंद्र तय करने के लिए नीचे कोई जगह खोजें।"),
  differentCentre: l("Use a different centre", "कोई और केंद्र चुनें"),
  mapAlt: l("Map of {place} with a {km} km circle", "{place} का नक्शा, {km} किमी के घेरे के साथ"),

  // availability
  legendAvailable: l("Available", "उपलब्ध"),
  legendPartly: l("Partly", "आंशिक"),
  legendOff: l("Day off", "छुट्टी"),
  legendLeave: l("Leave", "अवकाश"),
  legendNotSet: l("Not set", "तय नहीं"),
  from: l("From", "से"),
  to: l("To", "तक"),
  addLeave: l("Add leave", "छुट्टी जोड़ें"),

  // bank and ID
  savedAs: l("Saved: {masked}", "सहेजा गया: {masked}"),
  pending: l("Verification pending", "सत्यापन बाकी"),
  addPhoto: l("Add photo", "फ़ोटो जोड़ें"),
  changePhoto: l("Change photo", "फ़ोटो बदलें"),
  takePhoto: l("Take photo", "फ़ोटो लें"),
  fromGallery: l("Choose from gallery", "गैलरी से चुनें"),
  uploading: l("Uploading…", "अपलोड हो रहा है…"),
  uploaded: l("Uploaded", "अपलोड हो गया"),
  uploadFailed: l("Could not upload. Try again.", "अपलोड नहीं हो पाया। दोबारा कोशिश करें।"),

  // get verified
  recIntro: l("Choose a shloka you know by heart and recite it to the camera. Our team checks it and you get the verified tick.", "कोई ऐसा श्लोक चुनें जो आपको कंठस्थ हो और उसे कैमरे के सामने सुनाएँ। हमारी टीम इसे जाँचेगी और आपको सत्यापित चिह्न मिलेगा।"),
  whichShloka: l("Which shloka will you recite?", "आप कौन सा श्लोक सुनाएँगे?"),
  chooseShloka: l("Choose a shloka", "श्लोक चुनें"),
  chooseFirst: l("Choose a shloka first.", "पहले एक श्लोक चुनें।"),
  record: l("Record", "रिकॉर्ड करें"),
  cameraOff: l("The camera is off", "कैमरा बंद है"),
  cameraSample: l("Sample preview. No camera is available here.", "नमूना दृश्य। यहाँ कैमरा उपलब्ध नहीं है।"),
  cameraDenied: l("Camera permission is needed to record.", "रिकॉर्ड करने के लिए कैमरे की अनुमति ज़रूरी है।"),
  startRecording: l("Start recording", "रिकॉर्डिंग शुरू करें"),
  stop: l("Stop", "रोकें"),
  recordAgain: l("Record again", "दोबारा रिकॉर्ड करें"),
  useThis: l("Use this", "यही रखें"),
  recording: l("Recording", "रिकॉर्ड हो रहा है"),
  seconds: l("{n} s", "{n} से."),
  recordingReady: l("Recording ready", "रिकॉर्डिंग तैयार है"),
  submitVerification: l("Submit for verification", "सत्यापन के लिए जमा करें"),
  confirmAttempt: l("This uses one attempt and cannot be replaced.", "इसमें एक प्रयास खर्च होगा और इसे बदला नहीं जा सकता।"),
  yesSubmit: l("Yes, submit", "हाँ, जमा करें"),
  notYet: l("Not yet", "अभी नहीं"),
  uploadingRec: l("Uploading your recording…", "आपकी रिकॉर्डिंग अपलोड हो रही है…"),
  beingChecked: l("Your recitation is being checked. We will tell you the result.", "आपके पाठ की जाँच हो रही है। परिणाम हम आपको बताएँगे।"),
  recPassed: l("Your recitation passed.", "आपका पाठ सफल रहा।"),
  attemptFailed: l("Attempt {n} did not pass.", "प्रयास {n} सफल नहीं रहा।"),
  noAttempts: l("No attempts left.", "कोई प्रयास शेष नहीं।"),
  noAttemptsBody: l("You can ask our team to review your recitations.", "आप हमारी टीम से अपने पाठ की समीक्षा का अनुरोध कर सकते हैं।"),
  requestReview: l("Request staff review", "टीम से समीक्षा का अनुरोध करें"),
  reviewRequested: l("Review requested. Our team will check and let you know.", "अनुरोध भेज दिया गया। हमारी टीम देखकर आपको सूचित करेगी।"),
  history: l("Your attempts", "आपके प्रयास"),
  attemptN: l("Attempt {n}", "प्रयास {n}"),
  resultChecking: l("Being checked", "जाँच हो रही है"),
  resultPassed: l("Passed", "सफल"),
  resultFailed: l("Did not pass", "सफल नहीं"),

  // delete my account
  deleteIntro: l("Deleting your account removes:", "खाता हटाने पर ये सब हट जाएगा:"),
  deleteItems: l("Your profile and addresses · Bank or UPI details · Availability · ID photos · Recitation recordings", "आपकी प्रोफ़ाइल और पते · बैंक या UPI विवरण · उपलब्धता · पहचान पत्र की फ़ोटो · पाठ की रिकॉर्डिंग"),
  deleteNote: l("This happens within 30 days and cannot be undone. We may keep records the law requires.", "यह 30 दिनों के भीतर होता है और इसे वापस नहीं किया जा सकता। कानूनन ज़रूरी रिकॉर्ड हम रख सकते हैं।"),
  requestDeletion: l("Request deletion", "हटाने का अनुरोध करें"),
  deletionRequested: l("Your deletion request has been received. Your account will be deleted within 30 days.", "हटाने का आपका अनुरोध मिल गया है। आपका खाता 30 दिनों के भीतर हटा दिया जाएगा।"),
  cancelRequest: l("Cancel the request", "अनुरोध रद्द करें"),
};

export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
