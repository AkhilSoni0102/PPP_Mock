// ProPoojaPaath — pandit onboarding: the flow (which screen, what is valid, when to save).
// Shared by the website and the Expo app; it only uses React, never the screen.
//
//   sign in (Google + mobile code, in either order)
//   → Personal → Address → review → submit
//   → recitation check (can be skipped; the profile stays a draft until it passes)
//   → "Complete your profile": the remaining sections, in any order

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  L, Lang, Opt, Section, SectionId, Step, Values,
  MAX_ATTEMPTS, ONBOARDING, PASS_MARK, PROFILE, SAMPLE_SHLOKAS, SECTIONS, UI,
  draftOf, fill, sectionStatus, validateStep,
} from "./schema";

export type Account = {
  phone?: string;
  phoneVerified?: boolean;
  email?: string;
  googleVerified?: boolean;
  googleName?: string;
  googlePhoto?: string;
};

export type ProfileStatus = "draft" | "aiVerified" | "reviewRequested";

export type OnboardingProps = {
  /** Pass what is already known. If both mobile and Google are verified, sign-in is skipped. */
  account?: Account;
  lang?: Lang;
  onLangChange?: (lang: Lang) => void;
  theme?: "light" | "dark";
  /** A draft saved earlier, to carry on where the pandit left off. */
  initialValues?: Values;
  /** Open straight on a later part, e.g. "profile" for a pandit who has already submitted. */
  startAt?: "signin" | "form" | "recitation" | "profile";
  /** Recitation attempts already used, and the status so far. */
  initialRecitation?: { attemptsUsed?: number; status?: ProfileStatus };
  /** Names for the recitation dropdown. The shloka text is never shown. */
  shlokas?: Opt[];

  /** Run Google sign-in; resolve with the account, or null if cancelled. */
  signInWithGoogle: () => Promise<{ email: string; name?: string; photo?: string } | null>;
  /** Send a 6-digit code by SMS to this 10-digit number. Throw if it cannot be sent. */
  sendOtp: (phone: string) => Promise<void>;
  /** Resolve true when the code is right. */
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  /** Open the camera or gallery; resolve with a file uri, or null if cancelled. */
  pickImage: (kind: "avatar" | "document") => Promise<string | null>;
  /** Compare a recording with the chosen shloka; resolve with a 0–100 match score. */
  checkRecitation: (shlokaId: string, recording: unknown) => Promise<{ score: number }>;
  /** Optional: look a PIN code up so city, district and state can be filled in. */
  lookupPin?: (pin: string) => Promise<{ city?: string; district?: string; state?: string } | null>;
  /** Optional: open a map picker. Without it the map buttons are hidden. */
  pickLocation?: () => Promise<{ lat: number; lng: number; label?: string } | null>;

  /** Called a moment after any change, without bank account number or UPI ID. Store it to resume later. */
  onDraftChange?: (draft: Values) => void;
  /** Called with everything from Personal and Address when the pandit submits. Throw to show an error. */
  onSubmitProfile: (values: Values) => Promise<void> | void;
  /** Called when a later section (practice, bank, ID…) is saved. Throw to show an error. */
  onSaveSection?: (section: SectionId, values: Values) => Promise<void> | void;
  /** Called when the pandit asks for a staff review after using every attempt. */
  onRequestStaffReview?: () => Promise<void> | void;
  /** Called whenever the profile becomes draft, AI verified, or sent for review. */
  onProfileStatus?: (status: ProfileStatus) => void;
};

export type View =
  | { kind: "signin"; stage: "choose" | "phone" | "otp" | "google" }
  | { kind: "wizard"; index: number; fromReview?: boolean }
  | { kind: "review" }
  | { kind: "recitation"; from: "onboarding" | "hub" }
  | { kind: "done" }
  | { kind: "hub" }
  | { kind: "section"; id: SectionId; index: number };

export type RecitationPhase = "ready" | "checking" | "passed" | "failed" | "blocked" | "reviewRequested";

const WIZARD_STEPS: Step[] = ONBOARDING.flatMap((s) => s.steps);
const UNITS = 2 + WIZARD_STEPS.length + 2; // two sign-in steps, the form steps, review, recitation

export function useOnboarding(props: OnboardingProps) {
  const { lookupPin, onDraftChange, onSubmitProfile, onSaveSection } = props;

  const [lang, setLangState] = useState<Lang>(props.lang ?? "en");
  useEffect(() => { if (props.lang) setLangState(props.lang); }, [props.lang]);
  const setLang = useCallback((next: Lang) => { setLangState(next); props.onLangChange?.(next); }, [props.onLangChange]);

  const [account, setAccount] = useState<Account>(props.account ?? {});
  const signedIn = !!account.phoneVerified && !!account.googleVerified;

  const [values, setValues] = useState<Values>(() => ({
    fullName: props.account?.googleName ?? "",
    photo: props.account?.googlePhoto ?? "",
    ...props.initialValues,
  }));
  const [errors, setErrors] = useState<Record<string, L>>({});
  const [view, setView] = useState<View>(() => {
    const at = props.startAt ?? (signedIn ? "form" : "signin");
    if (at === "profile") return { kind: "hub" };
    if (at === "recitation") return { kind: "recitation", from: "onboarding" };
    if (at === "form") return { kind: "wizard", index: 0 };
    return { kind: "signin", stage: "choose" };
  });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pinState, setPinState] = useState<{ status: "idle" | "looking" | "found" | "notFound"; place?: string }>({ status: "idle" });

  const run = async (work: () => Promise<void> | void, then?: () => void) => {
    setBusy(true);
    setFailed(false);
    try { await work(); then?.(); } catch { setFailed(true); } finally { setBusy(false); }
  };

  // ------------------------------------------------------------ sign-in

  const [phone, setPhoneRaw] = useState(props.account?.phone ?? "");
  const [signInError, setSignInError] = useState<L | null>(null);
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  /** After one half of sign-in succeeds, go to the other half, or on to the form. */
  const afterSignIn = (a: Account) => {
    if (!a.phoneVerified) setView({ kind: "signin", stage: "phone" });
    else if (!a.googleVerified) setView({ kind: "signin", stage: "google" });
    else setView({ kind: "wizard", index: 0 });
  };

  const signInGoogle = useCallback(() => {
    if (busy) return;
    run(async () => {
      const g = await props.signInWithGoogle();
      if (!g) return;
      const next: Account = { ...account, email: g.email, googleName: g.name, googlePhoto: g.photo, googleVerified: true };
      setAccount(next);
      setValues((v) => ({ ...v, fullName: v.fullName || g.name || "", photo: v.photo || g.photo || "" }));
      afterSignIn(next);
    });
  }, [busy, account, props.signInWithGoogle]);

  const sendCode = useCallback(() => {
    if (busy) return;
    if (!/^[6-9]\d{9}$/.test(phone)) return setSignInError(UI.phoneError);
    setSignInError(null);
    run(() => props.sendOtp(phone), () => { setResendIn(30); setView({ kind: "signin", stage: "otp" }); });
  }, [busy, phone, props.sendOtp]);

  const verifyCode = useCallback((code: string) => {
    if (busy) return;
    if (!/^\d{6}$/.test(code)) return setSignInError(UI.otpError);
    setSignInError(null);
    run(async () => {
      if (!(await props.verifyOtp(phone, code))) return setSignInError(UI.otpError);
      const next: Account = { ...account, phone, phoneVerified: true };
      setAccount(next);
      afterSignIn(next);
    });
  }, [busy, phone, account, props.verifyOtp]);

  // ------------------------------------------------------------ the form

  const setValue = useCallback((id: string, value: any) => {
    setValues((v: Values) => ({ ...v, [id]: value }));
    setErrors((e: Record<string, L>) => { if (!e[id]) return e; const { [id]: _, ...rest } = e; return rest; });
    setFailed(false);
  }, []);

  // Save a draft shortly after the last change.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!onDraftChange) return;
    const id = setTimeout(() => onDraftChange(draftOf(values)), 600);
    return () => clearTimeout(id);
  }, [values]);

  // Fill city, district and state from the PIN code.
  const lastPin = useRef<string>(props.initialValues?.pin ?? "");
  useEffect(() => {
    const pin: string = values.pin ?? "";
    if (!lookupPin || !/^[1-9]\d{5}$/.test(pin) || pin === lastPin.current) return;
    lastPin.current = pin;
    let cancelled = false;
    setPinState({ status: "looking" });
    lookupPin(pin)
      .then((r) => {
        if (cancelled) return;
        if (!r) return setPinState({ status: "notFound" });
        setValues((v: Values) => ({ ...v, city: r.city ?? v.city, district: r.district ?? v.district, state: r.state ?? v.state }));
        setPinState({ status: "found", place: [r.city, r.state].filter(Boolean).join(", ") });
      })
      .catch(() => !cancelled && setPinState({ status: "notFound" }));
    return () => { cancelled = true; };
  }, [values.pin]);

  const section: Section | null = view.kind === "section" ? SECTIONS.find((s) => s.id === view.id)! : null;
  const steps: Step[] = view.kind === "wizard" ? WIZARD_STEPS : section ? section.steps : [];
  const step: Step | null = view.kind === "wizard" || view.kind === "section" ? steps[view.index] : null;

  const next = useCallback(() => {
    if (!step || busy) return;
    const found = validateStep(step, values);
    setErrors(found);
    if (Object.keys(found).length) return;

    if (view.kind === "wizard") {
      if (view.fromReview || view.index === WIZARD_STEPS.length - 1) setView({ kind: "review" });
      else setView({ kind: "wizard", index: view.index + 1 });
    } else if (view.kind === "section") {
      if (view.index < steps.length - 1) setView({ ...view, index: view.index + 1 });
      else run(() => onSaveSection?.(view.id, values), () => setView({ kind: "hub" }));
    }
  }, [step, busy, values, view, steps.length, onSaveSection]);

  const back = useCallback(() => {
    setErrors({});
    setFailed(false);
    setSignInError(null);
    if (view.kind === "signin") setView({ kind: "signin", stage: view.stage === "otp" ? "phone" : "choose" });
    else if (view.kind === "wizard") {
      if (view.fromReview) setView({ kind: "review" });
      else if (view.index > 0) setView({ kind: "wizard", index: view.index - 1 });
    } else if (view.kind === "review") setView({ kind: "wizard", index: WIZARD_STEPS.length - 1 });
    else if (view.kind === "section") setView(view.index > 0 ? { ...view, index: view.index - 1 } : { kind: "hub" });
    else if (view.kind === "recitation" && view.from === "hub") setView({ kind: "hub" });
  }, [view]);

  // ------------------------------------------------------------ recitation check

  const [status, setStatus] = useState<ProfileStatus>(props.initialRecitation?.status ?? "draft");
  const [submitted, setSubmitted] = useState(props.startAt === "recitation" || props.startAt === "profile");
  const [shlokaId, setShlokaId] = useState("");
  const [attemptsUsed, setAttemptsUsed] = useState(props.initialRecitation?.attemptsUsed ?? 0);
  const [score, setScore] = useState<number | null>(null);
  const [phase, setPhase] = useState<RecitationPhase>(() =>
    status === "aiVerified" ? "passed" : status === "reviewRequested" ? "reviewRequested" : (props.initialRecitation?.attemptsUsed ?? 0) >= MAX_ATTEMPTS ? "blocked" : "ready"
  );

  const changeStatus = (s: ProfileStatus) => { setStatus(s); props.onProfileStatus?.(s); };

  const submit = useCallback(() => {
    if (busy) return;
    const firstBad = WIZARD_STEPS.findIndex((s) => Object.keys(validateStep(s, values)).length > 0);
    if (firstBad >= 0) {
      setErrors(validateStep(WIZARD_STEPS[firstBad], values));
      return setView({ kind: "wizard", index: firstBad, fromReview: true });
    }
    run(() => onSubmitProfile(values), () => {
      setSubmitted(true);
      props.onProfileStatus?.(status);
      setView({ kind: "recitation", from: "onboarding" });
    });
  }, [busy, values, status, onSubmitProfile]);

  const submitRecording = useCallback(async (recording: unknown) => {
    if (!shlokaId || phase === "checking") return;
    setPhase("checking");
    setFailed(false);
    try {
      const r = await props.checkRecitation(shlokaId, recording);
      const used = attemptsUsed + 1;
      setAttemptsUsed(used);
      setScore(r.score);
      if (r.score >= PASS_MARK) { setPhase("passed"); changeStatus("aiVerified"); }
      else setPhase(used >= MAX_ATTEMPTS ? "blocked" : "failed");
    } catch {
      setFailed(true); // the check itself did not run, so no attempt is used
      setPhase("ready");
    }
  }, [shlokaId, phase, attemptsUsed, props.checkRecitation]);

  const requestReview = useCallback(() => {
    if (busy) return;
    run(() => props.onRequestStaffReview?.(), () => { setPhase("reviewRequested"); changeStatus("reviewRequested"); });
  }, [busy, props.onRequestStaffReview]);

  /** "Skip for now" and "Continue" both leave the recitation screen. */
  const leaveRecitation = useCallback(() => {
    setFailed(false);
    setView(view.kind === "recitation" && view.from === "hub" ? { kind: "hub" } : { kind: "done" });
  }, [view]);

  // ------------------------------------------------------------ progress

  /** 0 to 1, for the bar at the top. No number is ever shown. */
  const progress = useMemo(() => {
    const at = (unit: number) => (unit + 0.5) / UNITS;
    switch (view.kind) {
      case "signin": return at(Number(!!account.phoneVerified) + Number(!!account.googleVerified));
      case "wizard": return at(2 + view.index);
      case "review": return at(2 + WIZARD_STEPS.length);
      case "recitation": return view.from === "hub" ? 0.5 : at(UNITS - 1);
      case "done": return 1;
      case "section": return (view.index + 0.5) / steps.length;
      default:
        return (PROFILE.filter((s) => sectionStatus(s, values) === "done").length + Number(status === "aiVerified")) / (PROFILE.length + 1);
    }
  }, [view, values, steps.length, account, status]);

  const t = useCallback((x: L, vars?: Record<string, string | number>) => (vars ? fill(x[lang], vars) : x[lang]), [lang]);

  return {
    lang, setLang, t, ui: UI,
    account, signedIn,
    values, setValue, errors,
    view, step, steps, section, progress,
    busy, failed, pinState,
    canGoBack:
      (view.kind === "signin" && view.stage !== "choose" && !account.phoneVerified && !account.googleVerified) ||
      (view.kind === "signin" && view.stage === "otp") ||
      view.kind === "review" || view.kind === "section" ||
      (view.kind === "wizard" && (view.index > 0 || !!view.fromReview)) ||
      (view.kind === "recitation" && view.from === "hub"),
    next, back, submit,
    editStep: (stepId: string) => { setErrors({}); setView({ kind: "wizard", index: WIZARD_STEPS.findIndex((s) => s.id === stepId), fromReview: true }); },
    openHub: () => setView({ kind: "hub" }),
    openSection: (id: SectionId) => { setErrors({}); setFailed(false); setView({ kind: "section", id, index: 0 }); },
    openRecitation: () => { setFailed(false); setView({ kind: "recitation", from: "hub" }); },
    statusOf: (s: Section) => sectionStatus(s, values),
    wizardSteps: WIZARD_STEPS,
    onboardingSections: ONBOARDING,
    profileSections: PROFILE,
    firstName: (values.fullName || "").trim().split(/\s+/)[0] || "",

    signIn: {
      phone,
      setPhone: (x: string) => { setPhoneRaw(x.replace(/\D/g, "").slice(0, 10)); setSignInError(null); },
      error: signInError,
      clearError: () => setSignInError(null),
      resendIn,
      choosePhone: () => { setSignInError(null); setView({ kind: "signin", stage: "phone" }); },
      google: signInGoogle,
      sendCode,
      verifyCode,
    },

    recitation: {
      shlokas: props.shlokas ?? SAMPLE_SHLOKAS,
      shlokaId, setShlokaId,
      phase, score,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - attemptsUsed),
      maxAttempts: MAX_ATTEMPTS,
      submit: submitRecording,
      retry: () => setPhase("ready"),
      requestReview,
      leave: leaveRecitation,
    },
    profileStatus: status,
    submitted,
  };
}

export type Onboarding = ReturnType<typeof useOnboarding>;
