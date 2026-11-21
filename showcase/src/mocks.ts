// Stand-ins for the camera, PIN lookup and map so the preview works without a phone or a server.
const svg = (w: number, h: number, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`);
const AVATAR = svg(200, 200, `<rect width="200" height="200" fill="#f3c98a"/><circle cx="100" cy="78" r="40" fill="#8a4a1c"/><path d="M28 200c6-52 38-78 72-78s66 26 72 78z" fill="#8a4a1c"/>`);
const DOC = svg(340, 210, `<rect width="340" height="210" rx="14" fill="#f4ead8" stroke="#b98b4a" stroke-width="3"/><rect x="22" y="28" width="86" height="104" rx="6" fill="#d9bd8c"/><rect x="130" y="34" width="170" height="14" rx="7" fill="#b98b4a"/><rect x="130" y="64" width="130" height="12" rx="6" fill="#d9bd8c"/><rect x="130" y="90" width="150" height="12" rx="6" fill="#d9bd8c"/><rect x="22" y="158" width="296" height="20" rx="6" fill="#d9bd8c"/><text x="170" y="200" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#8a6a3a">sample document</text>`);
const PINS: Record<string, { city: string; district: string; state: string }> = {
  "226010": { city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh" },
  "221001": { city: "Varanasi", district: "Varanasi", state: "Uttar Pradesh" },
  "110001": { city: "New Delhi", district: "New Delhi", state: "Delhi" },
  "400001": { city: "Mumbai", district: "Mumbai", state: "Maharashtra" },
  "411001": { city: "Pune", district: "Pune", state: "Maharashtra" },
  "302001": { city: "Jaipur", district: "Jaipur", state: "Rajasthan" },
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Preview only: set `demo.pass` to choose whether the next recitation matches. */
export const demo = { pass: false };
export const mocks = {
  signInWithGoogle: async () => { await wait(600); return { email: "shastri.sample@gmail.com", name: "Ramesh Shastri" }; },
  sendOtp: async (_phone: string) => { await wait(500); },
  verifyOtp: async (_phone: string, code: string) => { await wait(500); return code.length === 6; }, // any 6 digits work in the preview
  pickImage: async (kind: "avatar" | "document") => { await wait(250); return kind === "avatar" ? AVATAR : DOC; },
  checkRecitation: async () => { await wait(1600); return { score: demo.pass ? 91 : 64 }; },
  lookupPin: async (pin: string) => { await wait(500); return PINS[pin] ?? null; },
  pickLocation: async () => { await wait(300); return { lat: 26.8467, lng: 80.9462, label: "Gomti Nagar, Lucknow" }; },
  onSubmitProfile: async () => { await wait(700); },
  onSaveSection: async () => { await wait(400); },
  onRequestStaffReview: async () => { await wait(400); },
};
