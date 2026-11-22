// Sample data for the ops console design. Every person and record here is made up.

import type { Status } from "../pandit-app/shared/schema";

export type Role = "admin" | "reviewer" | "staff";

export type HistoryEntry = { when: string; who: string; to: Status; reason?: string };
export type AttemptRow = { n: number; shloka: string; result: "waiting" | "passed" | "failed"; score?: number };

export type Pandit = {
  id: string;
  name: string;
  status: Status;
  source: "self" | "staff";
  preparedBy?: string;
  phoneByStaff?: string;
  submitted?: string;
  updated: string;
  percent: number;
  version: number;
  gender: string;
  dob?: string;
  experience?: number;
  dharma?: string;
  gotra?: string;
  languages: string[];
  traditions: string[];
  services: string[];
  about?: string;
  address: string;
  bank?: { type: "Bank account" | "UPI"; masked: string; ifsc?: string; holder: string; status: "Verification pending" | "Verified" };
  documents: string[];
  attempts: AttemptRow[];
  history: HistoryEntry[];
};

const p = (x: Partial<Pandit> & Pick<Pandit, "id" | "name" | "status" | "updated">): Pandit => ({
  source: "self", percent: 70, version: 3, gender: "Male", languages: ["Hindi", "Sanskrit"], traditions: ["Shaiva"],
  services: ["Havan", "Griha Pravesh", "Satyanarayan Puja"], address: "B 21/14 Assi Ghat Road, Varanasi, Uttar Pradesh 221005",
  documents: [], attempts: [], history: [], ...x,
});

export const PANDITS: Pandit[] = [
  p({ id: "p1", name: "Ramesh Shastri", status: "ai_passed", submitted: "18 Nov 2026", updated: "20 Nov 2026", percent: 100, version: 6, dob: "05 Nov 1978", experience: 18, dharma: "Sanatan (Hindu)", gotra: "Bharadwaj",
    about: "Studied at Sampurnanand Sanskrit University, Varanasi. Performs griha pravesh, havan and rudrabhishek.",
    bank: { type: "Bank account", masked: "XXXXXXXX9012", ifsc: "SBIN0001234", holder: "Ramesh Shastri", status: "Verification pending" },
    documents: ["PAN card", "Aadhaar (masked)"],
    attempts: [{ n: 1, shloka: "Gayatri Mantra", result: "failed", score: 61 }, { n: 2, shloka: "Vakratunda Mahakaya", result: "passed", score: 88 }],
    history: [{ when: "18 Nov 2026, 10:12", who: "Ramesh Shastri", to: "submitted" }, { when: "20 Nov 2026, 16:40", who: "Meera Iyer (reviewer)", to: "ai_passed" }] }),
  p({ id: "p2", name: "Suresh Dwivedi", status: "submitted", submitted: "20 Nov 2026", updated: "20 Nov 2026", percent: 80, experience: 9, dharma: "Sanatan (Hindu)", gotra: "Kashyap", address: "Sadashiv Peth, Pune, Maharashtra 411030",
    documents: ["Driving licence"], attempts: [{ n: 1, shloka: "Gayatri Mantra", result: "waiting" }],
    history: [{ when: "20 Nov 2026, 09:05", who: "Suresh Dwivedi", to: "submitted" }] }),
  p({ id: "p3", name: "Anand Trivedi", status: "under_review", submitted: "17 Nov 2026", updated: "19 Nov 2026", percent: 90, source: "staff", preparedBy: "Kavita Rao", phoneByStaff: "+91 98xxxxxx21", experience: 25, gotra: "Vashishtha", address: "Johari Bazar, Jaipur, Rajasthan 302003",
    documents: ["PAN card"], history: [{ when: "17 Nov 2026, 12:30", who: "Kavita Rao (staff)", to: "submitted" }, { when: "19 Nov 2026, 11:02", who: "Meera Iyer (reviewer)", to: "under_review" }] }),
  p({ id: "p4", name: "Mahesh Joshi", status: "changes_requested", submitted: "14 Nov 2026", updated: "16 Nov 2026", percent: 60,
    history: [{ when: "16 Nov 2026, 15:20", who: "Meera Iyer (reviewer)", to: "changes_requested", reason: "Please upload a clearer photo of your PAN card." }] }),
  p({ id: "p5", name: "Vinod Pathak", status: "approved", submitted: "02 Nov 2026", updated: "06 Nov 2026", percent: 100, experience: 31,
    history: [{ when: "06 Nov 2026, 10:00", who: "Arjun Mehta (admin)", to: "approved", reason: "All documents and recitation in order." }] }),
  p({ id: "p6", name: "Sunita Mishra", status: "approved", submitted: "04 Nov 2026", updated: "07 Nov 2026", percent: 100, gender: "Female", address: "Gomti Nagar, Lucknow, Uttar Pradesh 226010" }),
  p({ id: "p7", name: "Gopal Tiwari", status: "ai_failed", submitted: "15 Nov 2026", updated: "19 Nov 2026", percent: 75, attempts: [{ n: 1, shloka: "Gayatri Mantra", result: "failed", score: 48 }] }),
  p({ id: "p8", name: "Harish Upadhyay", status: "draft", updated: "20 Nov 2026", percent: 30, source: "staff", preparedBy: "Kavita Rao", phoneByStaff: "+91 97xxxxxx08" }),
  p({ id: "p9", name: "Dinesh Chaturvedi", status: "rejected", submitted: "08 Nov 2026", updated: "11 Nov 2026", percent: 85,
    history: [{ when: "11 Nov 2026, 13:45", who: "Meera Iyer (reviewer)", to: "rejected", reason: "ID document does not match the name on the profile." }] }),
  p({ id: "p10", name: "Prakash Bhatt", status: "suspended", submitted: "20 Oct 2026", updated: "12 Nov 2026", percent: 100,
    history: [{ when: "12 Nov 2026, 09:30", who: "Arjun Mehta (admin)", to: "suspended", reason: "Repeated complaints under investigation." }] }),
  p({ id: "p11", name: "Kailash Pandey", status: "ai_pending", submitted: "20 Nov 2026", updated: "20 Nov 2026", percent: 80, attempts: [{ n: 1, shloka: "Vakratunda Mahakaya", result: "waiting" }] }),
  p({ id: "p12", name: "Naveen Sharma", status: "draft", updated: "19 Nov 2026", percent: 10 }),
];

export const USERS = [
  { id: "u1", name: "Arjun Mehta", email: "arjun@example.com", joined: "02 Sep 2026", roles: ["admin"] as Role[] },
  { id: "u2", name: "Meera Iyer", email: "meera@example.com", joined: "15 Sep 2026", roles: ["reviewer"] as Role[] },
  { id: "u3", name: "Kavita Rao", email: "kavita@example.com", joined: "01 Oct 2026", roles: ["staff"] as Role[] },
  { id: "u4", name: "Rohit Nair", email: "rohit@example.com", joined: "20 Oct 2026", roles: ["staff", "reviewer"] as Role[] },
];

export type RefEntry = { en: string; hi: string; status: "active" | "pending" | "rejected" };
const active = (en: string, hi: string): RefEntry => ({ en, hi, status: "active" });
export const REFERENCE: Record<string, RefEntry[]> = {
  Services: [active("Griha Pravesh", "गृह प्रवेश"), active("Havan", "हवन"), active("Satyanarayan Puja", "सत्यनारायण पूजा"), active("Rudrabhishek", "रुद्राभिषेक"), active("Vivah (Wedding)", "विवाह"), { en: "Kaal Sarp Dosh Puja", hi: "काल सर्प दोष पूजा", status: "pending" }],
  Languages: [active("Hindi", "हिन्दी"), active("Sanskrit", "संस्कृत"), active("English", "अंग्रेज़ी"), active("Marathi", "मराठी")],
  Traditions: [active("Shaiva", "शैव"), active("Shakta", "शाक्त"), active("Smarta", "स्मार्त"), active("Vaishnava", "वैष्णव")],
  Gotras: [active("Bharadwaj", "भारद्वाज"), active("Kashyap", "कश्यप"), active("Vashishtha", "वशिष्ठ"), { en: "Mudgal", hi: "मुद्गल", status: "pending" }],
  Dharmas: [active("Sanatan (Hindu)", "सनातन (हिन्दू)"), active("Jain", "जैन"), active("Buddhist", "बौद्ध"), active("Sikh", "सिख")],
  Jatis: [],
  Shlokas: [active("Gayatri Mantra", "गायत्री मंत्र"), active("Vakratunda Mahakaya", "वक्रतुंड महाकाय"), { en: "Shanti Path", hi: "शांति पाठ", status: "pending" }],
};

export const AUDIT = [
  { when: "20 Nov 2026, 16:40", who: "Meera Iyer", what: "Marked recitation passed", record: "Ramesh Shastri", fields: "attempt 2 result" },
  { when: "20 Nov 2026, 16:38", who: "Meera Iyer", what: "Viewed ID document", record: "Ramesh Shastri", fields: "PAN card" },
  { when: "20 Nov 2026, 11:15", who: "Kavita Rao", what: "Created profile for a pandit", record: "Harish Upadhyay", fields: "name, gender, address, consent" },
  { when: "19 Nov 2026, 11:02", who: "Meera Iyer", what: "Changed status", record: "Anand Trivedi", fields: "status: submitted → under_review" },
  { when: "16 Nov 2026, 15:20", who: "Meera Iyer", what: "Requested changes", record: "Mahesh Joshi", fields: "status, reason" },
  { when: "12 Nov 2026, 09:30", who: "Arjun Mehta", what: "Suspended pandit", record: "Prakash Bhatt", fields: "status, reason" },
  { when: "10 Nov 2026, 14:05", who: "Arjun Mehta", what: "Gave role", record: "Rohit Nair", fields: "roles: + reviewer" },
];

export const DELETION_REQUESTS = [
  { contact: "+91 96xxxxxx44", requested: "17 Nov 2026" },
  { contact: "sample.pandit@gmail.com", requested: "19 Nov 2026" },
];
