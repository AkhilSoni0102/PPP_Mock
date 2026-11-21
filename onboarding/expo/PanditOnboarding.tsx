// ProPoojaPaath — pandit onboarding for the Expo app.
//
//   sign in (Google + mobile code, in either order)
//   → Personal → Address → review → submit
//   → recitation check (can be skipped; the profile stays a draft until it passes)
//   → "Complete your profile": the remaining sections in small steps, in any order
//
// What is asked lives in ../shared/schema.ts; the flow lives in ../shared/useOnboarding.ts.
// Needs: ../../expo/LotusMark.tsx, the PNGs in assets/logo-reveal/, and expo-camera
// (npx expo install expo-camera) for the recitation recorder.

import React, { useEffect, useRef, useState } from "react";
import {
  Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import LotusMark from "../../expo/LotusMark";
import { DAYS, SLOTS, SLOT_SHORT, Field, L, Opt, display, isDate, isRequired, pad, visibleFields } from "../shared/schema";
import { Onboarding, OnboardingProps, useOnboarding } from "../shared/useOnboarding";

const LOGO = require("../../assets/logo-reveal/logo.png");

const COLORS = {
  light: {
    bg: "#FFF8EC", surface: "#FFFFFF", field: "#FFFDF8", ink: "#3D1708", muted: "#7B563A", line: "#E6D0B1",
    gold: "#E8961E", goldSoft: "#FCEBCB", onGold: "#2A0F0A", done: "#2E7D4F", error: "#B3261E",
  },
  dark: {
    bg: "#1D0A08", surface: "#2A120D", field: "#24100B", ink: "#F8E6C4", muted: "#CDAB88", line: "#53301F",
    gold: "#F0B040", goldSoft: "#3D2411", onGold: "#2A0F0A", done: "#7FD1A0", error: "#FFA094",
  },
};
type Palette = typeof COLORS.light;

// Swap these for your brand fonts once loaded with expo-font (Marcellus / Mukta on the website).
const DISPLAY_FONT = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

type Ctx = { o: Onboarding; c: Palette; s: ReturnType<typeof makeStyles>; props: OnboardingProps };

export default function PanditOnboarding(props: OnboardingProps) {
  const o = useOnboarding(props);
  const { t, ui, view } = o;
  const scheme = useColorScheme();
  const mode = props.theme ?? (scheme === "dark" ? "dark" : "light");
  const c = COLORS[mode];
  const s = React.useMemo(() => makeStyles(c), [mode]);
  const ctx: Ctx = { o, c, s, props };
  const [code, setCode] = useState("");
  const viewKey = view.kind + ("stage" in view ? view.stage : "") + ("index" in view ? view.index : "") + ("id" in view ? view.id : "");

  // The bar fills smoothly; each new screen fades up.
  const bar = useRef(new Animated.Value(o.progress)).current;
  useEffect(() => {
    Animated.timing(bar, { toValue: o.progress, duration: 600, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: false }).start();
  }, [o.progress]);
  const enter = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    setCode("");
    scroll.current?.scrollTo({ y: 0, animated: false });
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 450, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [viewKey]);

  let title = "";
  let intro: string | undefined;
  if (view.kind === "signin") {
    const pair: [L, L] =
      view.stage === "choose" ? [ui.signInTitle, ui.signInIntro]
      : view.stage === "google" ? [ui.googleTitle, ui.googleIntro]
      : view.stage === "otp" ? [ui.otpTitle, ui.otpIntro]
      : o.account.googleVerified ? [ui.phoneNextTitle, ui.phoneNextIntro] : [ui.phoneTitle, ui.phoneIntro];
    title = t(pair[0]);
    intro = t(pair[1], { phone: o.signIn.phone, email: o.account.email ?? "" });
  } else if (o.step) {
    title = t(o.step.title);
    intro = o.step.intro && t(o.step.intro);
  } else if (view.kind === "review") {
    title = t(ui.reviewTitle); intro = t(ui.reviewIntro);
  } else if (view.kind === "recitation") {
    title = t(ui.recTitle); intro = t(ui.recIntro);
  } else if (view.kind === "hub") {
    title = t(ui.hubTitle); intro = t(o.progress === 1 ? ui.hubAllDone : ui.hubIntro);
  } else {
    title = t(ui.submittedTitle, { name: o.firstName });
    intro = t(o.profileStatus === "aiVerified" ? ui.doneVerified : o.profileStatus === "reviewRequested" ? ui.doneReview : ui.doneDraft);
  }

  // The one main button under the screen, when the screen has one.
  const primary: { label: L; busyLabel?: L; act: () => void } | null =
    view.kind === "signin" && view.stage === "phone" ? { label: ui.sendCode, busyLabel: ui.sending, act: o.signIn.sendCode }
    : view.kind === "signin" && view.stage === "otp" ? { label: ui.verify, busyLabel: ui.verifying, act: () => o.signIn.verifyCode(code) }
    : view.kind === "review" ? { label: ui.submit, busyLabel: ui.submitting, act: o.submit }
    : view.kind === "section" && view.index === o.steps.length - 1 ? { label: ui.save, busyLabel: ui.saving, act: o.next }
    : view.kind === "wizard" && (view.fromReview || view.index === o.steps.length - 1) ? { label: ui.review, act: o.next }
    : o.step ? { label: ui.next, act: o.next }
    : null;

  const centered = view.kind === "done";

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.top}>
        <Image source={LOGO} style={s.logo} />
        <View style={s.bar} accessibilityRole="progressbar" accessibilityLabel={title} accessibilityValue={{ min: 0, max: 100, now: Math.round(o.progress * 100) }}>
          <Animated.View style={[s.barFill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
        </View>
        <Pressable style={s.lang} onPress={() => o.setLang(o.lang === "en" ? "hi" : "en")} accessibilityRole="button">
          <Text style={s.langText}>{t(ui.language)}</Text>
        </Pressable>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          {view.kind === "done" && (
            <View style={s.lotus}>
              <LotusMark key={viewKey} size={150} theme={mode} />
            </View>
          )}
          {!!o.section && <Text style={s.section}>{t(o.section.title)}</Text>}
          <Text style={[s.title, centered && s.center]} accessibilityRole="header">{title}</Text>
          {!!intro && <Text style={[s.intro, centered && s.center]}>{intro}</Text>}

          {view.kind === "signin" && <SignIn {...ctx} code={code} setCode={setCode} />}
          {!!o.step && (
            <View style={s.fields}>
              {visibleFields(o.step, o.values).map((f) => <FieldRow key={f.id} f={f} {...ctx} />)}
            </View>
          )}
          {view.kind === "review" && <Review {...ctx} />}
          {view.kind === "recitation" && <Recitation {...ctx} />}
          {view.kind === "hub" && <Hub {...ctx} />}
          {view.kind === "done" && (
            <>
              <View style={s.pillRowCenter}><StatusPill {...ctx} /></View>
              <Btn {...ctx} primary label={t(ui.submittedCta)} onPress={o.openHub} style={{ marginTop: 28 }} />
            </>
          )}
        </Animated.View>
      </ScrollView>

      {!!primary && (
        <View style={s.foot}>
          {o.failed && <Text style={[s.error, { marginBottom: 10 }]} accessibilityRole="alert">{t(ui.failed)}</Text>}
          <View style={s.actions}>
            {o.canGoBack && <Btn {...ctx} label={t(ui.back)} onPress={o.back} disabled={o.busy} />}
            <Btn {...ctx} primary grow label={t(o.busy && primary.busyLabel ? primary.busyLabel : primary.label)} onPress={primary.act} disabled={o.busy} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------- small pieces

function Btn({ s, label, onPress, primary, grow, small, disabled, style, dot }: Ctx & {
  label: string; onPress: () => void; primary?: boolean; grow?: boolean; small?: boolean; disabled?: boolean; style?: any; dot?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, primary && s.btnPrimary, grow && { flex: 1 }, small && s.btnSmall, disabled && { opacity: 0.6 }, pressed && { opacity: 0.85 }, style]}
    >
      {dot && <View style={s.recDot} />}
      <Text style={[s.btnText, primary && s.btnPrimaryText, small && { fontSize: 16 }]}>{label}</Text>
    </Pressable>
  );
}

function Chip({ s, label, on, onPress, compact }: Ctx & { label: string; on: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.chip, on && s.chipOn, compact && s.chipCompact]}>
      <Text style={[s.chipText, on && { fontWeight: "600" }, compact && { fontSize: 14 }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function LinkBtn({ s, label, onPress, disabled, center }: Ctx & { label: string; onPress: () => void; disabled?: boolean; center?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={[s.link, center && { alignSelf: "center" }]}>
      <Text style={[s.linkText, disabled && s.linkDisabled]}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ o, s, c }: Ctx) {
  const st = o.profileStatus;
  const color = st === "aiVerified" ? c.done : st === "reviewRequested" ? c.gold : c.line;
  return (
    <View style={[s.pill, { borderColor: color }]} accessibilityLabel={`${o.t(o.ui.profileStatus)}: ${o.t(st === "aiVerified" ? o.ui.statusVerified : st === "reviewRequested" ? o.ui.statusReview : o.ui.statusDraft)}`}>
      <Text style={[s.pillText, st === "aiVerified" && { color: c.done }]}>
        {o.t(st === "aiVerified" ? o.ui.statusVerified : st === "reviewRequested" ? o.ui.statusReview : o.ui.statusDraft)}
      </Text>
    </View>
  );
}

/** A dropdown: a field that opens a list in a sheet. */
function Select({ o, s, c, value, options, placeholder, onChange, disabled, label }: Ctx & {
  value: string; options: Opt[]; placeholder: string; onChange: (x: string) => void; disabled?: boolean; label: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((op) => op.value === value);
  return (
    <>
      <Pressable style={[s.input, s.select, disabled && { opacity: 0.6 }]} onPress={() => setOpen(true)} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${label}: ${current ? o.t(current.label) : placeholder}`}>
        <Text style={[s.inputText, !current && { color: c.muted }]} numberOfLines={1}>{current ? o.t(current.label) : placeholder}</Text>
        <Text style={s.caret}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} accessibilityLabel={o.t(o.ui.close)} />
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>{label}</Text>
          <ScrollView>
            {options.map((op) => (
              <Pressable key={op.value} style={[s.option, op.value === value && s.optionOn]} onPress={() => { onChange(op.value); setOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: op.value === value }}>
                <Text style={[s.inputText, op.value === value && { fontWeight: "600" }]}>{o.t(op.label)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function DateInput({ o, s, c, value, onChange, invalid }: Ctx & { value?: string; onChange: (x: string) => void; invalid?: boolean }) {
  const [parts, setParts] = useState(() => {
    const m = /^(\d*)-(\d*)-(\d*)$/.exec(value ?? "");
    return { d: m?.[3] ?? "", m: m?.[2] ?? "", y: m?.[1] ?? "" };
  });
  const refs = { d: useRef<TextInput>(null), m: useRef<TextInput>(null), y: useRef<TextInput>(null) };
  const update = (key: "d" | "m" | "y", raw: string) => {
    const x = raw.replace(/\D/g, "").slice(0, key === "y" ? 4 : 2);
    const next = { ...parts, [key]: x };
    setParts(next);
    onChange(next.d || next.m || next.y ? `${next.y}-${next.m && pad(next.m)}-${next.d && pad(next.d)}` : "");
    if (key === "d" && x.length === 2) refs.m.current?.focus();
    if (key === "m" && x.length === 2) refs.y.current?.focus();
  };
  const box = (key: "d" | "m" | "y", label: L) => (
    <TextInput
      ref={refs[key]}
      style={[s.input, s.inputText, key === "y" ? s.year : s.day, invalid && { borderColor: c.error }]}
      keyboardType="number-pad"
      maxLength={key === "y" ? 4 : 2}
      value={parts[key]}
      placeholder={o.t(label)}
      placeholderTextColor={c.muted}
      accessibilityLabel={o.t(label)}
      onChangeText={(x) => update(key, x)}
    />
  );
  return <View style={s.row}>{box("d", o.ui.day)}{box("m", o.ui.month)}{box("y", o.ui.year)}</View>;
}

// ---------------------------------------------------------------- sign-in

function SignIn(ctx: Ctx & { code: string; setCode: (x: string) => void }) {
  const { o, s, c, code, setCode } = ctx;
  const { t, ui, view, signIn } = o;
  if (view.kind !== "signin") return null;
  const wide = (glyph: string, label: string, onPress: () => void) => (
    <Pressable style={({ pressed }) => [s.btn, s.btnWide, pressed && { opacity: 0.85 }]} onPress={onPress} disabled={o.busy} accessibilityRole="button">
      <View style={s.glyph}><Text style={s.glyphText}>{glyph}</Text></View>
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
  const failed = o.failed && <Text style={s.error} accessibilityRole="alert">{t(ui.failed)}</Text>;

  if (view.stage === "choose")
    return <View style={s.fields}>{wide("G", t(ui.withGoogle), signIn.google)}{wide("#", t(ui.withPhone), signIn.choosePhone)}{failed}</View>;
  if (view.stage === "google")
    return <View style={s.fields}>{wide("G", t(ui.withGoogle), signIn.google)}{failed}</View>;

  if (view.stage === "phone")
    return (
      <View style={s.fields}>
        <View style={s.field}>
          <Text style={s.label}>{t(ui.phoneLabel)}</Text>
          <View style={[s.row, { alignItems: "center" }]}>
            <Text style={s.label}>+91</Text>
            <TextInput
              style={[s.input, s.inputText, { flex: 1 }, !!signIn.error && { borderColor: c.error }]}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              maxLength={10}
              value={signIn.phone}
              onChangeText={signIn.setPhone}
              accessibilityLabel={t(ui.phoneLabel)}
            />
          </View>
          {!!signIn.error && <Text style={s.error} accessibilityRole="alert">{t(signIn.error)}</Text>}
        </View>
      </View>
    );

  return (
    <View style={s.fields}>
      <View style={s.field}>
        <Text style={s.label}>{t(ui.otpLabel)}</Text>
        <TextInput
          style={[s.input, s.inputText, s.otp, !!signIn.error && { borderColor: c.error }]}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          value={code}
          onChangeText={(x) => { setCode(x.replace(/\D/g, "")); signIn.clearError(); }}
          accessibilityLabel={t(ui.otpLabel)}
        />
        {!!signIn.error && <Text style={s.error} accessibilityRole="alert">{t(signIn.error)}</Text>}
      </View>
      <LinkBtn {...ctx} label={signIn.resendIn > 0 ? t(ui.resendIn, { n: signIn.resendIn }) : t(ui.resend)} onPress={signIn.sendCode} disabled={signIn.resendIn > 0 || o.busy} />
    </View>
  );
}

// ---------------------------------------------------------------- recitation check

function Recitation(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui, view } = o;
  const r = o.recitation;
  const cam = useRef<CameraView>(null);
  const [camPerm, askCam] = useCameraPermissions();
  const [micPerm, askMic] = useMicrophonePermissions();
  const [mode, setMode] = useState<"off" | "live" | "recording" | "recorded">("off");
  const [seconds, setSeconds] = useState(0);
  const uri = useRef<string | null>(null);
  const take = useRef(0); // lets a restart discard the recording it replaced
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => stopTimer, []);

  const start = async () => {
    const a = camPerm?.granted ? camPerm : await askCam();
    const b = micPerm?.granted ? micPerm : await askMic();
    if (a.granted && b.granted) setMode("live");
  };
  const record = () => {
    const mine = ++take.current;
    uri.current = null;
    setSeconds(0);
    setMode("recording");
    stopTimer();
    timer.current = setInterval(() => setSeconds((n) => n + 1), 1000);
    cam.current
      ?.recordAsync({ maxDuration: 60 })
      .then((v) => {
        if (take.current !== mine) return;
        stopTimer();
        uri.current = v?.uri ?? null;
        setMode("recorded");
      })
      .catch(() => { if (take.current === mine) { stopTimer(); setMode("live"); } });
  };
  const stop = () => cam.current?.stopRecording();
  const restart = () => {
    take.current++;
    cam.current?.stopRecording();
    setTimeout(record, 250);
  };

  const left = t(ui.attemptsLeft, { n: r.attemptsLeft, max: r.maxAttempts });
  const fromHub = view.kind === "recitation" && view.from === "hub";
  const leave = fromHub ? (
    <LinkBtn {...ctx} center label={t(ui.back)} onPress={o.back} />
  ) : (
    <View style={s.skip}>
      <LinkBtn {...ctx} center label={t(ui.skip)} onPress={r.leave} />
      <Text style={[s.hint, s.center]}>{t(ui.skipNote)}</Text>
    </View>
  );

  if (r.phase === "passed" || r.phase === "reviewRequested")
    return (
      <View style={[s.result, { borderColor: c.done }]}>
        <Text style={[s.resultTitle, { color: c.done }]}>{t(r.phase === "passed" ? ui.passedTitle : ui.statusReview)}</Text>
        <Text style={s.resultBody}>{t(r.phase === "passed" ? ui.passedBody : ui.reviewRequested)}</Text>
        {r.phase === "passed" && r.score != null && <Text style={s.score}>{t(ui.match, { n: Math.round(r.score) })}</Text>}
        <Btn {...ctx} primary label={t(ui.continue)} onPress={r.leave} style={{ marginTop: 12 }} />
      </View>
    );

  if (r.phase === "blocked" || r.phase === "failed") {
    const blocked = r.phase === "blocked";
    return (
      <>
        <View style={[s.result, { borderColor: c.error }]}>
          <Text style={s.resultTitle}>{t(blocked ? ui.blockedTitle : ui.failedTitle)}</Text>
          <Text style={s.resultBody}>{blocked ? t(ui.blockedBody, { max: r.maxAttempts }) : t(ui.failedBody)}</Text>
          {!blocked && r.score != null && <Text style={s.score}>{t(ui.match, { n: Math.round(r.score) })} · {left}</Text>}
          {o.failed && <Text style={s.error} accessibilityRole="alert">{t(ui.failed)}</Text>}
          <Btn
            {...ctx}
            primary
            label={t(blocked ? ui.requestReview : ui.tryAgain)}
            onPress={blocked ? r.requestReview : () => { r.retry(); setMode("live"); }}
            disabled={o.busy}
            style={{ marginTop: 12 }}
          />
        </View>
        {leave}
      </>
    );
  }

  const checking = r.phase === "checking";
  return (
    <View style={s.fields}>
      <View style={s.field}>
        <Text style={s.label}>{t(ui.shloka)}</Text>
        <Select {...ctx} label={t(ui.shloka)} value={r.shlokaId} options={r.shlokas} placeholder={t(ui.chooseShloka)} onChange={r.setShlokaId} disabled={checking || mode === "recording"} />
      </View>

      <View style={[s.camera, mode === "recording" && s.cameraRecording]}>
        {mode === "off" ? (
          <Text style={s.cameraText}>{t(ui.cameraOff)}</Text>
        ) : (
          <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="front" mode="video" />
        )}
        {mode === "recording" && (
          <View style={s.badge}><View style={s.badgeDot} /><Text style={s.badgeText}>{t(ui.recording)} · {t(ui.seconds, { n: seconds })}</Text></View>
        )}
        {mode === "recorded" && !checking && (
          <View style={[s.badge, { backgroundColor: "rgba(46,125,79,0.9)" }]}><Text style={s.badgeText}>{t(ui.recorded)} · {t(ui.seconds, { n: seconds })}</Text></View>
        )}
        {checking && (
          <View style={s.checking} accessibilityRole="alert"><Text style={s.checkingText}>{t(ui.checking)}</Text></View>
        )}
      </View>

      {!checking && (
        <View style={s.actions}>
          {mode === "off" && <Btn {...ctx} primary grow label={t(ui.startCamera)} onPress={start} disabled={!r.shlokaId} />}
          {mode === "live" && <Btn {...ctx} primary grow dot label={t(ui.startRecording)} onPress={record} disabled={!r.shlokaId} />}
          {mode === "recording" && (
            <>
              <Btn {...ctx} label={t(ui.restart)} onPress={restart} />
              <Btn {...ctx} primary grow label={t(ui.stop)} onPress={stop} />
            </>
          )}
          {mode === "recorded" && (
            <>
              <Btn {...ctx} label={t(ui.restart)} onPress={record} />
              <Btn {...ctx} primary grow label={t(ui.submitRecording)} onPress={() => r.submit(uri.current)} />
            </>
          )}
        </View>
      )}
      {!r.shlokaId && <Text style={s.hint}>{t(ui.chooseFirst)}</Text>}
      {o.failed && <Text style={s.error} accessibilityRole="alert">{t(ui.failed)}</Text>}
      <Text style={s.hint}>{left}</Text>
      {!checking && mode !== "recording" && leave}
    </View>
  );
}

// ---------------------------------------------------------------- review and profile screens

function Review(ctx: Ctx) {
  const { o, s } = ctx;
  const { t, ui } = o;
  const item = (key: string, label: string, text: string) => (
    <View key={key} style={{ marginBottom: 10 }}>
      <Text style={s.small}>{label}</Text>
      <Text style={s.body}>{text || "—"}</Text>
    </View>
  );
  return (
    <View style={s.cards}>
      <View style={s.card}>
        {item("m", t(ui.mobile), `+91 ${o.account.phone} · ${t(ui.verified)}`)}
        {item("g", t(ui.gmail), `${o.account.email} · ${t(ui.verified)}`)}
      </View>
      {o.wizardSteps.map((step) => (
        <View key={step.id} style={s.card}>
          {visibleFields(step, o.values).map((f) => item(f.id, t(f.label), display(f, o.values, o.lang)))}
          <LinkBtn {...ctx} label={t(ui.edit)} onPress={() => o.editStep(step.id)} />
        </View>
      ))}
    </View>
  );
}

function Hub(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui } = o;
  const rec = o.profileStatus === "aiVerified" ? "done" : o.profileStatus === "reviewRequested" ? "started" : "empty";
  const tile = (key: string, status: string, title: L, summary: L, statusText: string, open: () => void) => (
    <Pressable key={key} style={({ pressed }) => [s.card, s.tile, pressed && { borderColor: c.gold }]} onPress={open} accessibilityRole="button" accessibilityLabel={`${t(title)}. ${statusText}`}>
      <View style={[s.dot, status !== "empty" && { borderColor: c.gold }, status === "done" && { backgroundColor: c.gold }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.body, { fontWeight: "600" }]}>{t(title)}</Text>
        <Text style={s.small}>{t(summary)}</Text>
        <Text style={[s.small, { marginTop: 4 }, status === "done" && { color: c.done, fontWeight: "600" }]}>{statusText}</Text>
      </View>
    </Pressable>
  );
  return (
    <>
      <View style={s.pillRow}><StatusPill {...ctx} /></View>
      <View style={s.cards}>
        {tile("recitation", rec, ui.recitation, ui.recitationSummary, t(rec === "done" ? ui.statusVerified : rec === "started" ? ui.statusReview : ui.empty), o.openRecitation)}
        {o.profileSections.map((sec) => {
          const status = o.statusOf(sec);
          return tile(sec.id, status, sec.title, sec.summary, t(ui[status]), () => o.openSection(sec.id));
        })}
      </View>
    </>
  );
}

// ---------------------------------------------------------------- one field

function FieldRow(ctx: Ctx & { f: Field }) {
  const { f, o, s, c, props } = ctx;
  const { t, ui, values, setValue } = o;
  const value = values[f.id];
  const error = o.errors[f.id];
  const set = (x: any) => setValue(f.id, x);
  const options: Opt[] = f.options ?? [];
  const label = t(f.label);
  let control: React.ReactNode = null;

  if (f.type === "text" || f.type === "textarea") {
    const area = f.type === "textarea";
    control = (
      <>
        <TextInput
          style={[s.input, s.inputText, area && s.area, !!error && { borderColor: c.error }]}
          value={value ?? ""}
          maxLength={f.maxLength}
          multiline={area}
          textAlignVertical={area ? "top" : "center"}
          keyboardType={f.keyboard === "number" ? "number-pad" : f.keyboard === "email" ? "email-address" : "default"}
          autoCapitalize={f.capitalize ?? "sentences"}
          autoCorrect={!f.sensitive && f.keyboard !== "email"}
          placeholder={f.placeholder && t(f.placeholder)}
          placeholderTextColor={c.muted}
          accessibilityLabel={label}
          onChangeText={(raw) => {
            let x = raw;
            if (f.keyboard === "number") x = x.replace(/\D/g, "");
            if (f.capitalize === "characters") x = x.toUpperCase();
            set(x);
          }}
        />
        {area && !!f.maxLength && <Text style={[s.small, { textAlign: "right" }]}>{t(ui.left, { n: f.maxLength - (value?.length ?? 0) })}</Text>}
      </>
    );
  } else if (f.type === "select") {
    control = <Select {...ctx} label={label} value={value ?? ""} options={options} placeholder={t(ui.choose)} onChange={set} />;
  } else if (f.type === "choice" || f.type === "multi") {
    const many = f.type === "multi";
    const list: string[] = many ? value ?? [] : [];
    control = (
      <View style={s.chips}>
        {options.map((op) => {
          const on = many ? list.includes(op.value) : value === op.value;
          return <Chip key={op.value} {...ctx} label={t(op.label)} on={on} onPress={() => set(many ? (on ? list.filter((x) => x !== op.value) : [...list, op.value]) : op.value)} />;
        })}
      </View>
    );
  } else if (f.type === "date") {
    control = <DateInput {...ctx} value={value} onChange={set} invalid={!!error} />;
  } else if (f.type === "tags") {
    control = <Tags {...ctx} value={value ?? []} onChange={set} />;
  } else if (f.type === "image") {
    const pick = async () => { const uri = await props.pickImage(f.variant ?? "document"); if (uri) set(uri); };
    control =
      f.variant === "avatar" ? (
        <View style={[s.row, { alignItems: "center", gap: 16 }]}>
          <View style={s.avatar}>
            {value ? <Image source={{ uri: value }} style={{ width: "100%", height: "100%" }} /> : <Text style={s.avatarText}>{(values.fullName || "?").trim().charAt(0)}</Text>}
          </View>
          <Btn {...ctx} small label={t(value ? ui.changePhoto : ui.addPhoto)} onPress={pick} />
        </View>
      ) : (
        <Pressable style={s.drop} onPress={pick} accessibilityRole="button" accessibilityLabel={t(value ? ui.retake : ui.takePhoto)}>
          {!!value && <Image source={{ uri: value }} style={s.dropImage} resizeMode="contain" />}
          <Text style={[s.body, { fontWeight: "600" }]}>{t(value ? ui.retake : ui.takePhoto)}</Text>
        </Pressable>
      );
  } else if (f.type === "location") {
    const fallback = f.id === "serviceCentre" ? t(ui.fromAddress) : values.pin ? t(ui.fromPin, { pin: values.pin }) : t(ui.notSet);
    const pick = async () => { const p = await props.pickLocation?.(); if (p) set(p); };
    control = (
      <View style={[s.input, s.place]}>
        <Text style={[s.inputText, { flex: 1 }]}>{value ? display(f, values, o.lang) : fallback}</Text>
        {!!props.pickLocation && <Btn {...ctx} small label={t(value ? ui.changeOnMap : ui.setOnMap)} onPress={pick} />}
      </View>
    );
  } else if (f.type === "week") {
    const week: Record<string, string[]> = value ?? {};
    control = (
      <View style={{ gap: 8 }}>
        {DAYS.map((d) => (
          <View key={d.value} style={[s.row, { alignItems: "center", gap: 6 }]}>
            <Text style={[s.label, { width: 46 }]}>{t(d.label)}</Text>
            {SLOTS.map((sl) => {
              const list = week[d.value] ?? [];
              const on = list.includes(sl.value);
              return (
                <View key={sl.value} style={{ flex: 1 }}>
                  <Chip {...ctx} compact label={t(SLOT_SHORT[sl.value])} on={on} onPress={() => set({ ...week, [d.value]: on ? list.filter((x) => x !== sl.value) : [...list, sl.value] })} />
                </View>
              );
            })}
          </View>
        ))}
        <Text style={s.hint}>{SLOTS.map((sl) => t(sl.label)).join(" · ")}</Text>
      </View>
    );
  } else if (f.type === "dateList") {
    control = <DateList {...ctx} value={value ?? []} onChange={set} />;
  }

  return (
    <View style={s.field}>
      <Text style={s.label}>
        {label}
        {o.view.kind === "wizard" && !isRequired(f, values) && !f.hint && <Text style={s.optional}> ({t(ui.optional)})</Text>}
      </Text>
      {!!f.hint && <Text style={s.hint}>{t(f.hint)}</Text>}
      {control}
      {f.id === "pin" && o.pinState.status !== "idle" && !error && (
        <Text style={s.hint}>
          {o.pinState.status === "looking" ? t(ui.pinLooking) : o.pinState.status === "found" ? t(ui.pinFound, { place: o.pinState.place ?? "" }) : t(ui.pinNotFound)}
        </Text>
      )}
      {!!error && <Text style={s.error} accessibilityRole="alert">{t(error)}</Text>}
    </View>
  );
}

function Tags(ctx: Ctx & { f: Field; value: string[]; onChange: (x: string[]) => void }) {
  const { f, o, s, c, value, onChange } = ctx;
  const { t, ui } = o;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<L | null>(null);
  const add = () => {
    const x = draft.trim();
    if (!x) return;
    const e = f.validate?.(x, o.values) ?? null;
    setError(e);
    if (e) return;
    if (!value.includes(x)) onChange([...value, x]);
    setDraft("");
  };
  return (
    <>
      <View style={[s.row, { alignItems: "center" }]}>
        <TextInput
          style={[s.input, s.inputText, { flex: 1 }]}
          value={draft}
          maxLength={f.maxLength}
          keyboardType={f.keyboard === "number" ? "number-pad" : "default"}
          placeholder={f.placeholder && t(f.placeholder)}
          placeholderTextColor={c.muted}
          accessibilityLabel={t(f.label)}
          onChangeText={(x) => { setDraft(f.keyboard === "number" ? x.replace(/\D/g, "") : x); setError(null); }}
          onSubmitEditing={add}
        />
        <Btn {...ctx} small label={t(ui.add)} onPress={add} />
      </View>
      {!!error && <Text style={s.error} accessibilityRole="alert">{t(error)}</Text>}
      {value.length > 0 && (
        <View style={s.chips}>
          {value.map((x) => (
            <Pressable key={x} style={[s.chip, s.chipOn]} onPress={() => onChange(value.filter((y) => y !== x))} accessibilityRole="button" accessibilityLabel={`${t(ui.remove)} ${x}`}>
              <Text style={[s.chipText, { fontWeight: "600" }]}>{x}  ×</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

function DateList(ctx: Ctx & { f: Field; value: any[]; onChange: (x: any[]) => void }) {
  const { f, o, s, value, onChange } = ctx;
  const { t, ui } = o;
  const range = f.mode === "range";
  const patch = (i: number, p: any) => onChange(value.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const keys = useRef<number[]>([]);
  while (keys.current.length < value.length) keys.current.push(Math.random());
  const remove = (i: number) => { keys.current.splice(i, 1); onChange(value.filter((_, j) => j !== i)); };
  return (
    <View style={{ gap: 14, alignItems: "flex-start" }}>
      {value.map((r, i) => (
        <View key={keys.current[i]} style={[s.card, { alignSelf: "stretch", gap: 10 }]}>
          {range ? (
            <>
              <Text style={s.small}>{t(ui.from)}</Text>
              <DateInput {...ctx} value={r.from} onChange={(x) => patch(i, { from: x })} invalid={!!r.from && !isDate(r.from)} />
              <Text style={s.small}>{t(ui.to)}</Text>
              <DateInput {...ctx} value={r.to} onChange={(x) => patch(i, { to: x })} invalid={!!r.to && !isDate(r.to)} />
            </>
          ) : (
            <>
              <DateInput {...ctx} value={r.date} onChange={(x) => patch(i, { date: x })} invalid={!!r.date && !isDate(r.date)} />
              <View style={s.chips}>
                <Chip {...ctx} label={t(ui.dayOff)} on={!!r.off} onPress={() => patch(i, { off: !r.off, slots: [] })} />
                {SLOTS.map((sl) => {
                  const on = !r.off && (r.slots ?? []).includes(sl.value);
                  return <Chip key={sl.value} {...ctx} label={t(SLOT_SHORT[sl.value])} on={on} onPress={() => patch(i, { off: false, slots: on ? r.slots.filter((x: string) => x !== sl.value) : [...(r.slots ?? []), sl.value] })} />;
                })}
              </View>
            </>
          )}
          <LinkBtn {...ctx} label={t(ui.remove)} onPress={() => remove(i)} />
        </View>
      ))}
      <Btn {...ctx} small label={t(range ? ui.addLeave : ui.addDate)} onPress={() => onChange([...value, range ? { from: "", to: "" } : { date: "", off: true, slots: [] }])} />
    </View>
  );
}

// ---------------------------------------------------------------- styles

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    top: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
    logo: { width: 34, height: 34 },
    bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.goldSoft, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 3, backgroundColor: c.gold },
    lang: { paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: c.line, borderRadius: 999 },
    langText: { color: c.ink, fontSize: 15 },
    screen: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
    section: { color: c.muted, fontSize: 15, marginBottom: 4 },
    title: { color: c.ink, fontFamily: DISPLAY_FONT, fontSize: 28, lineHeight: 34 },
    intro: { color: c.muted, fontSize: 17, lineHeight: 24, marginTop: 8 },
    center: { textAlign: "center" },
    fields: { gap: 22, marginTop: 26 },
    field: { gap: 7 },
    label: { color: c.ink, fontSize: 17, fontWeight: "600" },
    optional: { color: c.muted, fontWeight: "400" },
    hint: { color: c.muted, fontSize: 15, lineHeight: 21 },
    error: { color: c.error, fontSize: 15, fontWeight: "600" },
    small: { color: c.muted, fontSize: 14.5, lineHeight: 20 },
    body: { color: c.ink, fontSize: 17, lineHeight: 24 },
    input: { minHeight: 50, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: c.line, borderRadius: 12, backgroundColor: c.field },
    inputText: { color: c.ink, fontSize: 17 },
    area: { minHeight: 130 },
    select: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    caret: { color: c.ink, fontSize: 16 },
    row: { flexDirection: "row", gap: 8 },
    day: { width: 68, textAlign: "center" },
    year: { width: 96, textAlign: "center" },
    otp: { width: 220, fontSize: 24, letterSpacing: 6, textAlign: "center" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: c.line, borderRadius: 999, backgroundColor: c.field },
    chipOn: { borderColor: c.gold, backgroundColor: c.goldSoft },
    chipCompact: { paddingHorizontal: 4 },
    chipText: { color: c.ink, fontSize: 16 },
    btn: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 22, paddingVertical: 12, borderWidth: 1.5, borderColor: c.line, borderRadius: 999 },
    btnPrimary: { borderColor: "transparent", backgroundColor: "#F0B040" },
    btnSmall: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 8 },
    btnWide: { minHeight: 56, backgroundColor: c.surface, gap: 12 },
    btnText: { color: c.ink, fontSize: 17, fontWeight: "600" },
    btnPrimaryText: { color: c.onGold },
    glyph: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: c.goldSoft },
    glyphText: { color: c.ink, fontWeight: "700", fontSize: 15 },
    link: { paddingVertical: 8, alignSelf: "flex-start" },
    linkText: { color: c.ink, fontSize: 17, fontWeight: "600", textDecorationLine: "underline" },
    linkDisabled: { color: c.muted, textDecorationLine: "none" },
    foot: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, backgroundColor: c.bg },
    actions: { flexDirection: "row", gap: 10 },
    avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: c.gold, backgroundColor: c.goldSoft, overflow: "hidden", alignItems: "center", justifyContent: "center" },
    avatarText: { color: c.ink, fontFamily: DISPLAY_FONT, fontSize: 30 },
    drop: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.gold, borderRadius: 14, backgroundColor: c.goldSoft },
    dropImage: { width: "100%", height: 170, borderRadius: 8 },
    place: { flexDirection: "row", alignItems: "center", gap: 10 },
    cards: { gap: 12, marginTop: 16 },
    card: { padding: 16, borderWidth: 1.5, borderColor: c.line, borderRadius: 16, backgroundColor: c.surface },
    tile: { flexDirection: "row", gap: 14 },
    dot: { width: 14, height: 14, marginTop: 5, borderWidth: 2, borderColor: c.muted, borderRadius: 7 },
    pillRow: { marginTop: 18, alignItems: "flex-start" },
    pillRowCenter: { marginTop: 18, alignItems: "center" },
    pill: { paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1.5, borderRadius: 999, backgroundColor: c.surface },
    pillText: { color: c.ink, fontSize: 15, fontWeight: "600" },
    lotus: { height: 230, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    camera: { aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: "#1D0A08", overflow: "hidden", alignItems: "center", justifyContent: "center" },
    cameraRecording: { borderWidth: 3, borderColor: "#D43D2F" },
    cameraText: { color: "#CDAB88", fontSize: 17 },
    badge: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.6)" },
    badgeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5A4A" },
    badgeText: { color: "#FFFFFF", fontSize: 14.5 },
    recDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#D43D2F" },
    checking: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(29,10,8,0.82)" },
    checkingText: { color: "#F8E6C4", fontSize: 17 },
    result: { gap: 8, marginTop: 26, padding: 22, borderWidth: 1.5, borderRadius: 18, backgroundColor: c.surface },
    resultTitle: { color: c.ink, fontFamily: DISPLAY_FONT, fontSize: 24 },
    resultBody: { color: c.muted, fontSize: 17, lineHeight: 24 },
    score: { color: c.ink, fontSize: 17, fontWeight: "600" },
    skip: { marginTop: 18, alignItems: "center" },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "70%", padding: 16, paddingBottom: 28, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: c.bg },
    sheetTitle: { color: c.ink, fontFamily: DISPLAY_FONT, fontSize: 22, marginBottom: 8 },
    option: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12 },
    optionOn: { backgroundColor: c.goldSoft },
  });
