// ProPoojaPaath pandit app — the flow: which screen, what is valid, when to save.
// Shared by the website and the Expo app; it only uses React, never the screen.
//
//   logo reveal → 3 intro slides → sign in (mobile code or Google) → add the missing contact
//   → Home (complete-your-profile banner, status, updates, sections, profile menu)
//   → sections in small steps · availability · bank or UPI · ID document · get verified
//   Three main places: Home, Availability and Profile (`tab`). Sections open from Profile or Home and return there.
//   → submit for review → ask to allow notifications (once)
//   → the bell and the status badge open Updates: where the profile is in review, and every update

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APP_LANGUAGES, Attempt, EDITABLE, L, Lang, MAX_ATTEMPTS, MORE_SECTIONS, NotificationState, Opt, PROFILE_SECTIONS, REQUIRED_SECTIONS,
  SAMPLE_SHLOKAS, SECTIONS, STATUS_LABEL, Section, SectionId, Status, Step, UI, Update, UpdateKind, Values,
  draftOf, fill, formatWhen, sectionStatus, validateStep,
} from "./schema";

export type Account = {
  phone?: string;
  phoneVerified?: boolean;
  email?: string;
  googleVerified?: boolean;
  googleName?: string;
  googlePhoto?: string;
};

export type Place = {
  label: string;
  pin?: string;
  addressLine?: string;
  city?: string;
  district?: string;
  state?: string;
  lat?: number;
  lng?: number;
};

export type PanditAppProps = {
  /** What is already known. With both contacts verified the app opens on Home. */
  account?: Account;
  /** App language code from APP_LANGUAGES. Default "hi". */
  language?: string;
  onLanguageChange?: (code: string) => void;
  theme?: "light" | "dark";
  /** Where to open: defaults to "intro" when signed out and "home" when signed in. */
  startAt?: "intro" | "signin" | "home";

  // ---- what the server knows; pass new values whenever they change
  initialValues?: Values;
  status?: Status;
  updates?: Update[];
  /** Shown on Home when changes were requested or the profile was not approved. */
  reviewerMessage?: string;
  /** Recitation attempts so far, oldest first. Pass the same array until it really changes. */
  attempts?: Attempt[];
  staffReviewRequested?: boolean;
  bankStatus?: "pending" | "verified";
  /** Bank or UPI details already saved on the server, in masked form (e.g. "XXXXXX1234").
   *  The draft never holds the account number, so this is how a returning pandit sees it as saved. */
  savedBank?: { masked: string };
  deletionRequested?: boolean;
  /** Whether this device may show push notifications. Leave "unknown" until the pandit has been asked. */
  notifications?: NotificationState;
  /** How pandits can reach your team. Only the channels you give are shown on Help.
   *  `whatsapp` and `phone` are full numbers with country code, digits only ("919876543210"). */
  support?: { whatsapp?: string; phone?: string; email?: string; hours?: string };
  /** Names for the recitation dropdown. The shloka text is never shown. */
  shlokas?: Opt[];

  // ---- things the app asks your code to do
  signInWithGoogle: () => Promise<{ email: string; name?: string; photo?: string } | null>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  /** Open the camera or the gallery; resolve with a file uri, or null if cancelled. */
  pickImage: (source: "camera" | "gallery", kind: "avatar" | "document") => Promise<string | null>;
  /** Upload an ID photo. Throw to show "Could not upload". */
  uploadDocument?: (type: string, uri: string) => Promise<void>;
  /** Upload a recitation recording for the chosen shloka. This uses one attempt. Throw if it fails:
   *  the pandit keeps the recording and no attempt is used. */
  uploadRecitation: (shlokaId: string, recording: unknown) => Promise<void>;
  /** Address type-ahead. Without it the search fields are hidden. */
  searchAddress?: (query: string) => Promise<Place[]>;
  lookupPin?: (pin: string) => Promise<{ city?: string; district?: string; state?: string } | null>;
  /** A still map image for the service area. Without it a plain drawn map is shown. */
  mapImageUrl?: (centre: Place, km: number) => string | undefined;

  onDraftChange?: (draft: Values) => void;
  onSaveSection?: (section: SectionId, values: Values) => Promise<void> | void;
  onSubmitForReview: (values: Values) => Promise<void> | void;
  onRequestStaffReview?: () => Promise<void> | void;
  /** Called for each update when the pandit opens the Updates page. */
  onUpdateRead?: (id: string) => void;
  /** Show the phone's (or browser's) own permission question and register for push.
   *  Resolve true when allowed. Without this, the app never asks and shows no notification setting. */
  onEnableNotifications?: () => Promise<boolean>;
  /** The pandit switched notifications off, or tapped "Not now" when asked. */
  onDisableNotifications?: () => Promise<void> | void;
  /** Open this app's page in the device settings, for when notifications are blocked there. */
  onOpenNotificationSettings?: () => void;
  onRequestDeletion?: () => Promise<void> | void;
  onCancelDeletion?: () => Promise<void> | void;
  onOpenPrivacy?: () => void;
  onSignOut?: () => void;
};

export type View =
  | { kind: "intro"; slide: number }
  | { kind: "signin"; stage: "main" | "otp" }
  | { kind: "contact"; need: "phone" | "google"; stage: "main" | "otp" }
  | { kind: "home" }
  | { kind: "updates" }
  | { kind: "notify"; stage: "ask" | "on" | "later" }
  | { kind: "section"; id: SectionId; index: number }
  | { kind: "recitation" }
  | { kind: "language" }
  | { kind: "profile" }
  | { kind: "account" }
  | { kind: "help" }
  | { kind: "deletion" };

/** One step of the review timeline on the Updates page. */
export type TimelineStep = {
  id: "submit" | "recitation" | "review" | "result" | "suspended";
  title: string;
  tone: "done" | "now" | "todo" | "attention";
  when?: string;
  note?: string;
  /** The reviewer's own words. */
  message?: string;
  action?: { label: string; primary?: boolean; run: () => void };
};

const NO_UPDATES: Update[] = [];
const NO_ATTEMPTS: Attempt[] = [];

/** Keep a local copy of something the server owns, and follow the prop when it changes. */
function useServer<T>(value: T) {
  const state = useState<T>(value);
  useEffect(() => { state[1](value); }, [value]);
  return state;
}

export function usePanditApp(props: PanditAppProps) {
  const [language, setLanguageState] = useState(props.language ?? "hi");
  useEffect(() => { if (props.language) setLanguageState(props.language); }, [props.language]);
  const lang: Lang = APP_LANGUAGES.find((x) => x.code === language)?.uses ?? "en";
  const t = useCallback((x: L, vars?: Record<string, string | number>) => (vars ? fill(x[lang], vars) : x[lang]), [lang]);

  const [account, setAccount] = useState<Account>(props.account ?? {});
  const signedIn = !!account.phoneVerified && !!account.googleVerified;
  const [values, setValues] = useState<Values>(() => ({ ...props.initialValues }));
  const [errors, setErrors] = useState<Record<string, L>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [status, setStatus] = useServer<Status>(props.status ?? "draft");
  const [updates, setUpdates] = useServer<Update[]>(props.updates ?? NO_UPDATES);
  const [attempts, setAttempts] = useServer<Attempt[]>(props.attempts ?? NO_ATTEMPTS);
  const [reviewRequested, setReviewRequested] = useServer(!!props.staffReviewRequested);
  const [deletionRequested, setDeletionRequested] = useServer(!!props.deletionRequested);
  const [notifications, setNotifications] = useServer<NotificationState>(props.notifications ?? "unknown");
  const canNotify = !!props.onEnableNotifications;

  const [view, setViewRaw] = useState<View>(() => {
    const at = props.startAt ?? (signedIn ? "home" : "intro");
    return at === "home" ? { kind: "home" } : at === "signin" ? { kind: "signin", stage: "main" } : { kind: "intro", slide: 0 };
  });
  const cameFrom = useRef<View | null>(null); // where the language picker was opened from
  const setView = (v: View) => { setErrors({}); setFailed(false); setMenuOpen(false); setViewRaw(v); };

  const run = async (work: () => Promise<void> | void, then?: () => void) => {
    setBusy(true);
    setFailed(false);
    try { await work(); then?.(); } catch { setFailed(true); } finally { setBusy(false); }
  };

  // ------------------------------------------------------------ sign-in and contact

  const [phone, setPhoneRaw] = useState(props.account?.phone ?? "");
  const [signInError, setSignInError] = useState<L | null>(null);
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n: number) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  /** Every pandit needs both contacts: after one, ask for the other, then go Home. */
  const afterContact = (a: Account) => {
    if (!a.phoneVerified) setView({ kind: "contact", need: "phone", stage: "main" });
    else if (!a.googleVerified) setView({ kind: "contact", need: "google", stage: "main" });
    else setView({ kind: "home" });
  };

  const google = useCallback(() => {
    if (busy) return;
    run(async () => {
      const g = await props.signInWithGoogle();
      if (!g) return;
      const next: Account = { ...account, email: g.email, googleName: g.name, googlePhoto: g.photo, googleVerified: true };
      setAccount(next);
      setValues((v: Values) => ({ ...v, fullName: v.fullName || g.name || "", photo: v.photo || g.photo || "" }));
      afterContact(next);
    });
  }, [busy, account, props.signInWithGoogle]);

  const sendCode = useCallback(() => {
    if (busy) return;
    if (!/^[6-9]\d{9}$/.test(phone)) return setSignInError(UI.phoneError);
    setSignInError(null);
    run(() => props.sendOtp(phone), () => {
      setResendIn(30);
      setViewRaw((v: View) => (v.kind === "contact" ? { ...v, stage: "otp" } : { kind: "signin", stage: "otp" }));
    });
  }, [busy, phone, props.sendOtp]);

  const verifyCode = useCallback((code: string) => {
    if (busy) return;
    if (!/^\d{6}$/.test(code)) return setSignInError(UI.otpError);
    setSignInError(null);
    run(async () => {
      if (!(await props.verifyOtp(phone, code))) return setSignInError(UI.otpError);
      const next: Account = { ...account, phone, phoneVerified: true };
      setAccount(next);
      afterContact(next);
    });
  }, [busy, phone, account, props.verifyOtp]);

  const signOut = useCallback(() => {
    props.onSignOut?.();
    setAccount({});
    setPhoneRaw("");
    setView({ kind: "signin", stage: "main" });
  }, [props.onSignOut]);

  // ------------------------------------------------------------ the profile

  const setValue = useCallback((id: string, value: any) => {
    setValues((v: Values) => ({ ...v, [id]: value }));
    setErrors((e: Record<string, L>) => { if (!e[id]) return e; const { [id]: _, ...rest } = e; return rest; });
    setFailed(false);
    setJustSaved(false);
  }, []);

  // Half-filled answers are saved as a draft shortly after the last change.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!props.onDraftChange) return;
    const id = setTimeout(() => props.onDraftChange!(draftOf(values)), 600);
    return () => clearTimeout(id);
  }, [values]);

  // Typing a PIN fills city, district and state.
  const [pinState, setPinState] = useState<{ status: "idle" | "looking" | "found" | "notFound"; place?: string }>({ status: "idle" });
  const lastPin = useRef<string>(props.initialValues?.pin ?? "");
  useEffect(() => {
    const pin: string = values.pin ?? "";
    if (!props.lookupPin || !/^[1-9]\d{5}$/.test(pin) || pin === lastPin.current) return;
    lastPin.current = pin;
    let cancelled = false;
    setPinState({ status: "looking" });
    props.lookupPin(pin)
      .then((r) => {
        if (cancelled) return;
        if (!r) return setPinState({ status: "notFound" });
        setValues((v: Values) => ({ ...v, city: r.city ?? v.city, district: r.district ?? v.district, state: r.state ?? v.state }));
        setPinState({ status: "found", place: [r.district, r.state].filter(Boolean).join(", ") });
      })
      .catch(() => !cancelled && setPinState({ status: "notFound" }));
    return () => { cancelled = true; };
  }, [values.pin]);

  /** Picking an address suggestion fills the address fields and the map position. */
  const applyPlace = useCallback((p: Place) => {
    if (p.pin) lastPin.current = p.pin;
    setValues((v: Values) => ({
      ...v,
      pin: p.pin ?? v.pin, addressLine: p.addressLine ?? v.addressLine, city: p.city ?? v.city,
      district: p.district ?? v.district, state: p.state ?? v.state,
      mapPosition: p.lat != null ? { lat: p.lat, lng: p.lng } : v.mapPosition,
    }));
    setErrors({});
    if (p.pin) setPinState({ status: "found", place: [p.district, p.state].filter(Boolean).join(", ") });
  }, []);

  /** The centre of the service area: what was picked, otherwise the home address. */
  const centre: Place | null = values.serviceCentre
    ?? (values.city && values.pin ? { label: `${values.city} ${values.pin}`, ...(values.mapPosition ?? {}) } : null);

  const editable = EDITABLE.includes(status);
  const canEdit = (s: Section) => editable || !!s.alwaysEditable;

  const section: Section | null = view.kind === "section" ? SECTIONS.find((s) => s.id === view.id)! : null;
  const steps: Step[] = section ? section.steps : [];
  const step: Step | null = view.kind === "section" ? steps[view.index] : null;

  const recitationState: "none" | "checking" | "passed" | "failed" | "blocked" =
    attempts.some((a) => a.result === "passed") ? "passed"
    : attempts.some((a) => a.result === "checking") ? "checking"
    : attempts.length >= MAX_ATTEMPTS ? "blocked"
    : attempts.length ? "failed" : "none";

  const statusOf = (s: Section) => {
    const st = sectionStatus(s, values);
    // Saved on the server and not being edited now: the masked number is all we hold.
    return s.id === "bank" && st === "empty" && props.savedBank ? "done" : st;
  };
  const requiredDone = REQUIRED_SECTIONS.every((s) => statusOf(s) === "done");

  /** Where a section was opened from, so that saving or leaving returns there. */
  const sectionFrom = useRef<"home" | "profile">("home");
  const [justSaved, setJustSaved] = useState(false);
  const openSection = useCallback((id: SectionId) => {
    const s = SECTIONS.find((x) => x.id === id)!;
    sectionFrom.current = view.kind === "profile" ? "profile" : "home";
    setJustSaved(false);
    setView(canEdit(s) ? { kind: "section", id, index: 0 } : { kind: "profile" });
  }, [status, view.kind]);
  const leaveSection = () => setView({ kind: sectionFrom.current });

  /** Leave a step: on to the next step, or save the section and return Home. */
  const advance = (validate: boolean) => {
    if (!step || !section || busy || view.kind !== "section") return;
    if (validate) {
      const found = validateStep(step, values);
      setErrors(found);
      if (Object.keys(found).length) return;
    }
    // Defaults the pandit left untouched (e.g. 10 km) are saved as their answer.
    const withDefaults = { ...values };
    if (validate) for (const f of step.fields) if (f.defaultValue != null && withDefaults[f.id] == null) withDefaults[f.id] = f.defaultValue;
    if (validate) setValues(withDefaults);
    if (view.index < steps.length - 1) return setView({ ...view, index: view.index + 1 });
    if (!validate) return leaveSection();
    // The Availability tab stays where it is and says "Saved"; every other section returns to where it was opened.
    run(() => props.onSaveSection?.(section.id, withDefaults), () => (section.id === "availability" ? setJustSaved(true) : leaveSection()));
  };

  const back = useCallback(() => {
    if (view.kind === "intro" && view.slide > 0) setView({ kind: "intro", slide: view.slide - 1 });
    else if (view.kind === "signin" && view.stage === "otp") setView({ kind: "signin", stage: "main" });
    else if (view.kind === "contact" && view.stage === "otp") setView({ ...view, stage: "main" });
    else if (view.kind === "section" && view.index > 0) setView({ ...view, index: view.index - 1 });
    else if (view.kind === "language" && cameFrom.current) setView(cameFrom.current);
    else if (view.kind === "section" && view.id !== "availability") setView({ kind: sectionFrom.current });
    else if ((view.kind === "account" || view.kind === "help" || view.kind === "deletion") && signedIn) setView({ kind: view.kind === "deletion" ? "account" : "profile" });
    else if (signedIn) setView({ kind: "home" });
    setSignInError(null);
  }, [view, signedIn]);

  /** "Continue your profile": the next thing that is not finished, required sections first. */
  const continueProfile = useCallback(() => {
    const order = [...REQUIRED_SECTIONS, ...PROFILE_SECTIONS, ...MORE_SECTIONS];
    const next = order.find((s) => statusOf(s) !== "done");
    if (next) openSection(next.id);
    else setView({ kind: "recitation" });
  }, [values, status]);

  const submitForReview = useCallback(() => {
    if (busy || !requiredDone || !editable) return;
    run(() => props.onSubmitForReview(values), () => {
      setStatus("submitted");
      setUpdates((u: Update[]) => [{ id: `local-${Date.now()}`, kind: "submitted", at: new Date().toISOString(), read: true }, ...u]);
      // The one moment the pandit has a reason to want notifications: ask now, and only once.
      if (canNotify && notifications === "unknown") setView({ kind: "notify", stage: "ask" });
    });
  }, [busy, requiredDone, editable, values, notifications, canNotify, props.onSubmitForReview]);

  // ------------------------------------------------------------ updates and notifications

  const unreadCount = updates.filter((u) => !u.read).length;
  /** Updates that were unread when the page was opened: they keep their "New" mark while it is open. */
  const [fresh, setFresh] = useState<string[]>([]);
  useEffect(() => {
    if (view.kind !== "updates") return;
    const ids = updates.filter((u) => !u.read).map((u) => u.id);
    if (!ids.length) return;
    setFresh((f: string[]) => [...f, ...ids]);
    setUpdates((u: Update[]) => u.map((x) => (ids.includes(x.id) ? { ...x, read: true } : x)));
    ids.forEach((id) => props.onUpdateRead?.(id));
  }, [view.kind, updates]);

  const enableNotifications = useCallback(() => {
    if (busy || !props.onEnableNotifications) return;
    run(async () => {
      const ok = await props.onEnableNotifications!();
      setNotifications(ok ? "on" : "off");
      setViewRaw((v: View) => (v.kind === "notify" ? { kind: "notify", stage: ok ? "on" : "later" } : v));
    });
  }, [busy, props.onEnableNotifications]);

  const disableNotifications = useCallback(() => {
    if (busy) return;
    run(() => props.onDisableNotifications?.(), () => {
      setNotifications("off");
      setViewRaw((v: View) => (v.kind === "notify" ? { kind: "notify", stage: "later" } : v));
    });
  }, [busy, props.onDisableNotifications]);


  // ------------------------------------------------------------ ID documents

  const [docState, setDocState] = useState<Record<string, "uploading" | "uploaded" | "failed">>({});
  const addDocument = useCallback(async (type: string, source: "camera" | "gallery") => {
    const uri = await props.pickImage(source, "document");
    if (!uri) return;
    setDocState((d) => ({ ...d, [type]: "uploading" }));
    try {
      await props.uploadDocument?.(type, uri);
      setValues((v: Values) => ({ ...v, idDocs: { ...(v.idDocs ?? {}), [type]: uri } }));
      setDocState((d) => ({ ...d, [type]: "uploaded" }));
    } catch {
      setDocState((d) => ({ ...d, [type]: "failed" }));
    }
  }, [props.pickImage, props.uploadDocument]);

  // ------------------------------------------------------------ get verified

  const [shlokaId, setShlokaId] = useState("");
  const [uploading, setUploading] = useState(false);
  const submitRecording = useCallback(async (recording: unknown) => {
    if (!shlokaId || uploading || attempts.length >= MAX_ATTEMPTS) return false;
    setUploading(true);
    setFailed(false);
    try {
      await props.uploadRecitation(shlokaId, recording);
      // If the server list already shows the new attempt, do not add it twice.
      setAttempts((a: Attempt[]) => (a.some((x) => x.result === "checking") ? a : [...a, { n: a.length + 1, shlokaId, result: "checking" }]));
      return true;
    } catch {
      setFailed(true); // nothing was uploaded, so no attempt is used
      return false;
    } finally {
      setUploading(false);
    }
  }, [shlokaId, uploading, attempts.length, props.uploadRecitation]);

  const requestReview = useCallback(() => {
    if (busy) return;
    run(() => props.onRequestStaffReview?.(), () => setReviewRequested(true));
  }, [busy, props.onRequestStaffReview]);

  // ------------------------------------------------------------ progress

  /** 0 to 1 for the bar. It starts a little filled, and no number is ever shown. */
  const profileProgress = useMemo(() => {
    const done = SECTIONS.filter((s) => statusOf(s) === "done").length + Number(recitationState === "passed");
    return 0.1 + 0.9 * (done / (SECTIONS.length + 1));
  }, [values, recitationState]);
  // ------------------------------------------------------------ where the profile is in review

  const go = (kind: "home" | "availability" | "updates" | "recitation" | "language" | "profile" | "account" | "help" | "deletion") => {
    if (kind === "language") cameFrom.current = view.kind === "language" ? cameFrom.current : view;
    if (kind === "updates" && view.kind !== "updates") setFresh([]);
    setJustSaved(false);
    // Availability is a place of its own (a tab), not a step in a flow.
    setView(kind === "availability" ? { kind: "section", id: "availability", index: 0 } : ({ kind } as View));
  };
  /** Which main place is showing, or null on inner screens. */
  const tab: "home" | "availability" | "profile" | null =
    view.kind === "home" ? "home" : view.kind === "profile" ? "profile" : view.kind === "section" && view.id === "availability" ? "availability" : null;

  const whenOf = (kind: UpdateKind) => formatWhen(updates.find((u) => u.kind === kind)?.at, lang);
  const reasonOf = (kind: UpdateKind) => updates.find((u) => u.kind === kind)?.reason;
  const timeline: TimelineStep[] = (() => {
    const out: TimelineStep[] = [];
    const sent = status !== "draft";
    const decided = status === "approved" || status === "rejected" || status === "suspended";
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts.length);

    out.push(sent
      ? { id: "submit", title: t(UI.stepSubmitted), tone: "done", when: whenOf("submitted") }
      : {
          id: "submit", title: t(UI.stepSubmit), tone: "now", note: t(requiredDone ? UI.stepSubmitNote : UI.bannerNeeds),
          action: requiredDone ? { label: t(UI.submitForReview), primary: true, run: submitForReview } : { label: t(UI.continueProfile), primary: true, run: continueProfile },
        });

    const record = (label: L, primary?: boolean) => ({ label: t(label), primary, run: () => go("recitation") });
    const rec: TimelineStep = { id: "recitation", title: t(UI.stepRecitation), tone: "todo" };
    if (recitationState === "passed") Object.assign(rec, { tone: "done", note: t(UI.passedShort), when: whenOf("recitation_passed") });
    else if (recitationState === "checking") Object.assign(rec, { tone: sent ? "now" : "todo", note: t(UI.recChecking) });
    else if (recitationState === "failed") Object.assign(rec, { tone: "attention", note: t(UI.recFailedNote, { n: attemptsLeft }), when: whenOf("recitation_failed"), action: record(UI.recordAgain, true) });
    else if (recitationState === "blocked") Object.assign(rec, { tone: "attention", note: t(reviewRequested ? UI.reviewAsked : UI.recBlockedNote), when: whenOf("recitation_failed"), action: reviewRequested ? undefined : record(UI.getVerified) });
    else if (!decided) Object.assign(rec, { note: t(UI.recNotRecorded), action: record(UI.getVerified) });
    out.push(rec);

    if (status === "changes_requested")
      out.push({ id: "review", title: t(STATUS_LABEL.changes_requested), tone: "attention", when: whenOf("changes_requested"), message: props.reviewerMessage ?? reasonOf("changes_requested"), action: { label: t(UI.updateProfile), primary: true, run: () => go("profile") } });
    else if (decided) out.push({ id: "review", title: t(STATUS_LABEL.under_review), tone: "done", when: whenOf("under_review") });
    else if (status === "under_review") out.push({ id: "review", title: t(STATUS_LABEL.under_review), tone: "now", when: whenOf("under_review"), note: t(UI.reviewNow) });
    else out.push({ id: "review", title: t(STATUS_LABEL.under_review), tone: sent && recitationState !== "checking" ? "now" : "todo", note: sent && recitationState !== "checking" ? t(UI.reviewWaiting) : undefined });

    const contact = { label: t(UI.contactTeam), run: () => go("help") };
    if (status === "rejected")
      out.push({ id: "result", title: t(STATUS_LABEL.rejected), tone: "attention", when: whenOf("rejected"), message: props.reviewerMessage ?? reasonOf("rejected"), action: contact });
    else if (status === "approved" || status === "suspended")
      out.push({ id: "result", title: t(STATUS_LABEL.approved), tone: "done", when: whenOf("approved"), note: status === "approved" ? t(UI.verifiedNote) : undefined });
    else out.push({ id: "result", title: t(STATUS_LABEL.approved), tone: "todo" });

    if (status === "suspended")
      out.push({ id: "suspended", title: t(STATUS_LABEL.suspended), tone: "attention", when: whenOf("suspended"), message: reasonOf("suspended"), action: contact });
    return out;
  })();

  const progress =
    view.kind === "section" ? (view.index + 0.5) / steps.length
    : view.kind === "intro" ? (view.slide + 1) / 3
    : profileProgress;

  return {
    lang, t, ui: UI,
    language, languages: APP_LANGUAGES,
    setLanguage: (code: string) => { setLanguageState(code); props.onLanguageChange?.(code); },
    account, signedIn,
    values, setValue, errors, busy, failed, pinState,
    view, section, step, steps, progress, profileProgress,
    menuOpen, setMenuOpen,
    tab,
    /** True right after the Availability tab was saved, until something changes. */
    justSaved,
    /** Leave a step without finishing it. What was typed is kept as a draft. */
    exitSection: leaveSection,
    support: { email: "propoojapaath@gmail.com", ...props.support },
    go,
    back,
    nextSlide: () => (view.kind === "intro" && view.slide < 2 ? setView({ kind: "intro", slide: view.slide + 1 }) : setView({ kind: "signin", stage: "main" })),

    signIn: {
      phone,
      setPhone: (x: string) => { setPhoneRaw(x.replace(/\D/g, "").slice(0, 10)); setSignInError(null); },
      error: signInError,
      clearError: () => setSignInError(null),
      resendIn, google, sendCode, verifyCode, signOut,
    },

    status, editable, canEdit, requiredDone,
    updates, unreadCount,
    /** Ids to mark "New" on the Updates page. */
    freshUpdates: fresh,
    timeline,
    whenOf: (u: Update) => formatWhen(u.at, lang, true),
    /** Hidden when the host cannot ask for the permission. */
    notifications: canNotify ? notifications : null,
    enableNotifications, disableNotifications,
    openNotificationSettings: props.onOpenNotificationSettings,
    reviewerMessage: status === "changes_requested" || status === "rejected" ? props.reviewerMessage : undefined,
    profileSections: PROFILE_SECTIONS, moreSections: MORE_SECTIONS, allSections: SECTIONS,
    statusOf, openSection, continueProfile, submitForReview,
    save: () => advance(true),
    skip: () => advance(false),
    /** A step can be skipped when nothing on it is required. */
    canSkip: !!step && !!section && !section.required,
    applyPlace, centre,
    setCentre: (p: Place) => setValue("serviceCentre", p),
    search: props.searchAddress,
    mapImageUrl: props.mapImageUrl,

    docState, addDocument,
    bankStatus: props.bankStatus ?? "pending",
    savedBank: props.savedBank,

    recitation: {
      shlokas: props.shlokas ?? SAMPLE_SHLOKAS,
      shlokaId, setShlokaId,
      state: recitationState, attempts, uploading,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts.length),
      maxAttempts: MAX_ATTEMPTS,
      submit: submitRecording,
      reviewRequested, requestReview,
    },

    deletionRequested,
    requestDeletion: () => run(() => props.onRequestDeletion?.(), () => setDeletionRequested(true)),
    cancelDeletion: () => run(() => props.onCancelDeletion?.(), () => setDeletionRequested(false)),
    openPrivacy: props.onOpenPrivacy,
    firstName: (values.fullName || "").trim().split(/\s+/)[0] || "",
  };
}

export type PanditApp = ReturnType<typeof usePanditApp>;
