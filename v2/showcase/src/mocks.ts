// Stand-ins for sign-in, the camera, address search and uploads, so the showcase
// works without a phone or a server. Nothing here is real.
import type { Place } from "../../pandit-app/shared/usePanditApp";

const svg = (w: number, h: number, body: string) =>
  "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`);
const AVATAR = svg(200, 200, `<rect width="200" height="200" fill="#f3c98a"/><circle cx="100" cy="78" r="40" fill="#8a4a1c"/><path d="M28 200c6-52 38-78 72-78s66 26 72 78z" fill="#8a4a1c"/>`);
const DOC = svg(340, 210, `<rect width="340" height="210" rx="14" fill="#f4ead8" stroke="#b98b4a" stroke-width="3"/><rect x="22" y="28" width="86" height="104" rx="6" fill="#d9bd8c"/><rect x="130" y="34" width="170" height="14" rx="7" fill="#b98b4a"/><rect x="130" y="64" width="130" height="12" rx="6" fill="#d9bd8c"/><rect x="130" y="90" width="150" height="12" rx="6" fill="#d9bd8c"/><rect x="22" y="158" width="296" height="20" rx="6" fill="#d9bd8c"/><text x="170" y="200" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#8a6a3a">sample document</text>`);

const PLACES: Place[] = [
  { label: "B 21/14 Assi Ghat Road, Varanasi 221005", pin: "221005", addressLine: "B 21/14 Assi Ghat Road", city: "Varanasi", district: "Varanasi", state: "Uttar Pradesh", lat: 25.2867, lng: 83.0064 },
  { label: "Lanka, Varanasi 221005", pin: "221005", addressLine: "Lanka", city: "Varanasi", district: "Varanasi", state: "Uttar Pradesh", lat: 25.2797, lng: 82.999 },
  { label: "12 Shanti Kunj, Gomti Nagar, Lucknow 226010", pin: "226010", addressLine: "12 Shanti Kunj, Gomti Nagar", city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { label: "Sadashiv Peth, Pune 411030", pin: "411030", addressLine: "Sadashiv Peth", city: "Pune", district: "Pune", state: "Maharashtra", lat: 18.5089, lng: 73.848 },
  { label: "Girgaon, Mumbai 400004", pin: "400004", addressLine: "Girgaon", city: "Mumbai", district: "Mumbai", state: "Maharashtra", lat: 18.9536, lng: 72.8136 },
  { label: "Johari Bazar, Jaipur 302003", pin: "302003", addressLine: "Johari Bazar", city: "Jaipur", district: "Jaipur", state: "Rajasthan", lat: 26.9196, lng: 75.8235 },
];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mocks = {
  signInWithGoogle: async () => { await wait(600); return { email: "shastri.sample@gmail.com", name: "Ramesh Shastri" }; },
  sendOtp: async (_phone: string) => { await wait(500); },
  verifyOtp: async (_phone: string, code: string) => { await wait(500); return code.length === 6; }, // any 6 digits work here
  pickImage: async (_source: "camera" | "gallery", kind: "avatar" | "document") => { await wait(250); return kind === "avatar" ? AVATAR : DOC; },
  uploadDocument: async () => { await wait(900); },
  uploadRecitation: async () => { await wait(1400); },
  searchAddress: async (q: string) => { await wait(350); const k = q.toLowerCase(); return PLACES.filter((p) => p.label.toLowerCase().includes(k)); },
  lookupPin: async (pin: string) => { await wait(450); const p = PLACES.find((x) => x.pin === pin); return p ? { city: p.city, district: p.district, state: p.state } : null; },
  onSubmitForReview: async () => { await wait(700); },
  onSaveSection: async () => { await wait(350); },
  onRequestStaffReview: async () => { await wait(400); },
  onRequestDeletion: async () => { await wait(400); },
  onCancelDeletion: async () => { await wait(300); },
};

export const SIGNED_IN = { phone: "9876543210", phoneVerified: true, email: "shastri.sample@gmail.com", googleVerified: true, googleName: "Ramesh Shastri" };
export const REQUIRED_DETAILS = { fullName: "Ramesh Shastri", gender: "male", dob: "1978-11-05", pin: "221005", addressLine: "B 21/14 Assi Ghat Road", city: "Varanasi", district: "Varanasi", state: "Uttar Pradesh" };
