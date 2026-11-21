// ProPoojaPaath pandit app (v2) for Expo / React Native.
//
//   logo reveal → 3 intro slides → sign in → add the missing contact
//   → Home (complete-your-profile banner, status, updates, sections, profile menu)
//   → sections in small steps · availability · bank or UPI · ID document · get verified
//   → submit for review
//
// What is asked lives in ../shared/schema.ts; the flow lives in ../shared/usePanditApp.ts.
// Needs ../../expo/LogoReveal.tsx, the PNGs in assets/logo-reveal/, and expo-camera
// (npx expo install expo-camera) for the recitation recorder.

import React, { useEffect, useRef, useState } from "react";
import {
  Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import LogoReveal from "../../expo/LogoReveal";
import LotusMark from "../../expo/LotusMark";
import { BreathingRing, GlowLogo, RiderBar, Turning } from "./Motion";
import {
  DAYS, ID_TYPES, INTRO, MAX_RECORDING_SECONDS, SLOTS, SLOT_SHORT, STATUS_LABEL, STATUS_TONE, UPDATE_TEXT,
  Field, L, Opt, Section, display, isDate, mask, pad, visibleFields,
} from "../shared/schema";
import { PanditApp as App, PanditAppProps, Place, usePanditApp } from "../shared/usePanditApp";


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

type Ctx = { o: App; c: Palette; s: ReturnType<typeof makeStyles>; props: PanditAppProps };

type Props = PanditAppProps & {
  /** Play the logo reveal before the intro slides. Default true. */
  reveal?: boolean;
};

export default function PanditApp({ reveal = true, ...props }: Props) {
  const o = usePanditApp(props);
  const { t, ui, view } = o;
  const scheme = useColorScheme();
  const mode = props.theme ?? (scheme === "dark" ? "dark" : "light");
  const c = COLORS[mode];
  const s = React.useMemo(() => makeStyles(c), [mode]);
  const ctx: Ctx = { o, c, s, props };
  const [revealing, setRevealing] = useState(reveal && view.kind === "intro");
  const [code, setCode] = useState("");
  const viewKey = view.kind + ("stage" in view ? view.stage : "") + ("need" in view ? view.need : "") + ("index" in view ? view.index : "") + ("id" in view ? view.id : "") + ("slide" in view ? view.slide : "");

  // One pulse of light on the logo when a mobile number or Gmail is verified.
  const [pulse, setPulse] = useState(false);
  const contacts = Number(!!o.account.phoneVerified) + Number(!!o.account.googleVerified);
  const lastContacts = useRef(contacts);
  useEffect(() => {
    const grew = contacts > lastContacts.current;
    lastContacts.current = contacts;
    if (!grew) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 1500);
    return () => clearTimeout(id);
  }, [contacts]);

  // Milestones play the full reveal once: the profile is submitted, or the recitation passes.
  const [moment, setMoment] = useState<"submitted" | "passed" | null>(null);
  const lastStatus = useRef(o.status);
  const lastRecitation = useRef(o.recitation.state);
  useEffect(() => {
    const was = lastStatus.current, wasRec = lastRecitation.current;
    lastStatus.current = o.status;
    lastRecitation.current = o.recitation.state;
    const next = o.status === "submitted" && (was === "draft" || was === "changes_requested") ? "submitted"
      : o.recitation.state === "passed" && wasRec !== "passed" ? "passed" : null;
    if (!next) return;
    setMoment(next);
    const id = setTimeout(() => setMoment(null), 3600);
    return () => clearTimeout(id);
  }, [o.status, o.recitation.state]);

  // Each new screen fades up.
  const enter = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    setCode("");
    scroll.current?.scrollTo({ y: 0, animated: false });
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 450, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [viewKey]);

  if (revealing)
    return (
      <View style={s.root}>
        <LogoReveal theme={mode} onComplete={() => setRevealing(false)} />
      </View>
    );

  if (moment)
    return (
      <View style={[s.root, s.moment]} accessibilityRole="alert">
        <LotusMark key={moment} size={150} theme={mode} />
        <Text style={[s.title, s.center, { marginTop: 70 }]}>{t(moment === "submitted" ? UPDATE_TEXT.submitted : ui.recPassed)}</Text>
        {moment === "submitted" && <Text style={[s.intro, s.center]}>{t(ui.bannerLocked)}</Text>}
      </View>
    );

  const otp = (view.kind === "signin" || view.kind === "contact") && view.stage === "otp";
  let title = "";
  let intro: string | undefined;
  switch (view.kind) {
    case "intro": title = t(INTRO[view.slide].title); intro = t(INTRO[view.slide].body); break;
    case "signin": title = t(otp ? ui.otpTitle : ui.signInTitle); intro = otp ? t(ui.otpIntro, { phone: o.signIn.phone }) : t(ui.signInIntro); break;
    case "contact":
      title = t(otp ? ui.otpTitle : view.need === "phone" ? ui.addPhoneTitle : ui.addEmailTitle);
      intro = otp ? t(ui.otpIntro, { phone: o.signIn.phone }) : t(view.need === "phone" ? ui.addPhoneIntro : ui.addEmailIntro, { email: o.account.email ?? "" });
      break;
    case "home": title = o.firstName ? t(ui.namaste, { name: o.firstName }) : t(ui.namasteNoName); break;
    case "section": title = t(o.step!.title); intro = o.step!.intro && t(o.step!.intro); break;
    case "recitation": title = t(ui.getVerified); intro = t(ui.recIntro); break;
    case "language": title = t(ui.chooseLanguage); break;
    case "profile": title = t(ui.myProfile); intro = t(ui.myProfileIntro); break;
    case "account": title = t(ui.myAccount); intro = t(ui.myAccountIntro); break;
    case "help": title = t(ui.help); intro = t(ui.helpIntro); break;
    case "deletion": title = t(ui.deleteAccount); break;
  }

  const inFlow = view.kind === "section";
  const showBack = view.kind !== "home" && !(view.kind === "intro" && view.slide === 0) && !(view.kind === "signin" && view.stage === "main") && !(view.kind === "contact" && view.stage === "main");
  const centered = view.kind === "intro" || view.kind === "signin" || view.kind === "contact";

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.top}>
        {showBack ? (
          <Pressable style={s.icon} onPress={o.back} accessibilityRole="button" accessibilityLabel={t(ui.back)}><Text style={s.iconText}>←</Text></Pressable>
        ) : (
          <GlowLogo size={34} pulse={pulse && view.kind === "home"} />
        )}
        {inFlow ? (
          <View style={{ flex: 1 }}><RiderBar value={o.progress} label={title} track={c.goldSoft} /></View>
        ) : (
          <Text style={s.topName}>{t(ui.brand)}</Text>
        )}
        {(view.kind === "intro" || view.kind === "signin" || view.kind === "home") && (
          <Pressable style={s.lang} onPress={() => o.go("language")} accessibilityRole="button" accessibilityLabel={t(ui.language)}>
            <Text style={s.langText}>{o.languages.find((x) => x.code === o.language)?.name}</Text>
          </Pressable>
        )}
        {o.signedIn && (
          <Pressable onPress={() => o.setMenuOpen(true)} accessibilityRole="button" accessibilityLabel={t(ui.menu)}>
            <Avatar {...ctx} size={44} />
          </Pressable>
        )}
      </View>

      <ScrollView ref={scroll} contentContainerStyle={[s.screen, view.kind === "intro" && s.screenCentered]} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          {view.kind === "intro" && <View style={s.hero}><Turning size={230} color={c.gold} /></View>}
          {(view.kind === "signin" || view.kind === "contact") && <View style={s.hero}><GlowLogo size={92} sparkles pulse={pulse} sparkColor={mode === "dark" ? "#FFD98A" : "#E2941B"} /></View>}
          {!!o.section && <Text style={s.section}>{t(o.section.title)}</Text>}
          <Text style={[s.title, centered && s.center]} accessibilityRole="header">
            {title}
            {view.kind === "home" && o.status === "approved" && <Text style={{ color: c.done }} accessibilityLabel={t(ui.verified)}> ✔</Text>}
          </Text>
          {!!intro && <Text style={[s.intro, centered && s.center]}>{intro}</Text>}

          {view.kind === "intro" && (
            <>
              <View style={s.dots}>{INTRO.map((_, i) => <View key={i} style={[s.dotSmall, i === view.slide && s.dotOn]} />)}</View>
              <Btn {...ctx} primary label={t(view.slide < 2 ? ui.next : ui.getStarted)} onPress={o.nextSlide} style={{ marginTop: 28 }} />
            </>
          )}
          {(view.kind === "signin" || view.kind === "contact") && <SignIn {...ctx} code={code} setCode={setCode} />}
          {view.kind === "home" && <Home {...ctx} />}
          {view.kind === "section" && (
            <View style={s.fields}>
              {o.section!.id === "bank" && o.statusOf(o.section!) === "done" && (
                <View style={[s.card, { borderColor: c.done }]}>
                  <Text style={[s.body, { fontWeight: "600" }]}>{t(ui.savedAs, { masked: o.values.payoutMethod ? mask(o.values.payoutMethod === "upi" ? o.values.upiId : o.values.accountNumber) : o.savedBank?.masked ?? "" })}</Text>
                  <Text style={s.small}>{t(o.bankStatus === "verified" ? ui.bankVerified : ui.pending)}</Text>
                </View>
              )}
              {visibleFields(o.step!, o.values).map((f) => <FieldRow key={f.id} f={f} {...ctx} />)}
            </View>
          )}
          {view.kind === "recitation" && <Recitation {...ctx} />}
          {view.kind === "language" && (
            <View style={s.cards} accessibilityRole="radiogroup">
              {o.languages.map((x) => (
                <Pressable key={x.code} style={[s.rowBtn, x.code === o.language && s.chipOn]} onPress={() => { o.setLanguage(x.code); o.back(); }} accessibilityRole="radio" accessibilityState={{ checked: x.code === o.language }}>
                  <View style={[s.radio, x.code === o.language && { borderColor: c.gold, backgroundColor: c.gold }]} />
                  <Text style={[s.body, { fontSize: 19 }, x.code === o.language && { fontWeight: "600" }]}>{x.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {view.kind === "profile" && <Profile {...ctx} />}
          {view.kind === "account" && (
            <View style={s.cards}>
              <View style={s.card}>
                <Item {...ctx} label={t(ui.mobile)} text={`+91 ${o.account.phone} · ${t(ui.verified)}`} />
                <Item {...ctx} label={t(ui.gmail)} text={`${o.account.email} · ${t(ui.verified)}`} />
              </View>
              <Btn {...ctx} label={t(ui.signOut)} onPress={o.signIn.signOut} style={{ alignSelf: "flex-start" }} />
              <LinkBtn {...ctx} label={t(ui.deleteAccount)} onPress={() => o.go("deletion")} />
            </View>
          )}
          {view.kind === "help" && (
            <View style={s.cards}>
              <View style={s.card}><Item {...ctx} label="Email" text="propoojapaath@gmail.com" /></View>
              {!!o.openPrivacy && <LinkBtn {...ctx} label={t(ui.privacy)} onPress={o.openPrivacy} />}
            </View>
          )}
          {view.kind === "deletion" && (
            <View style={s.cards}>
              {o.deletionRequested ? (
                <>
                  <View style={s.card}><Text style={s.body}>{t(ui.deletionRequested)}</Text></View>
                  <Btn {...ctx} label={t(ui.cancelRequest)} onPress={o.cancelDeletion} disabled={o.busy} style={{ alignSelf: "flex-start" }} />
                </>
              ) : (
                <>
                  <View style={s.card}>
                    <Text style={s.label}>{t(ui.deleteIntro)}</Text>
                    {t(ui.deleteItems).split(" · ").map((x) => <Text key={x} style={s.body}>•  {x}</Text>)}
                    <Text style={[s.hint, { marginTop: 8 }]}>{t(ui.deleteNote)}</Text>
                  </View>
                  <Btn {...ctx} danger label={t(ui.requestDeletion)} onPress={o.requestDeletion} disabled={o.busy} style={{ alignSelf: "flex-start" }} />
                </>
              )}
              {o.failed && <Text style={s.error} accessibilityRole="alert">{t(ui.failed)}</Text>}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {view.kind === "section" && (
        <View style={s.foot}>
          {o.failed && <Text style={[s.error, { marginBottom: 10 }]} accessibilityRole="alert">{t(ui.failed)}</Text>}
          <View style={s.actions}>
            {o.canSkip && <Btn {...ctx} label={t(ui.skip)} onPress={o.skip} disabled={o.busy} />}
            <Btn {...ctx} primary grow busy={o.busy} label={t(o.busy ? ui.saving : ui.saveContinue)} onPress={o.save} disabled={o.busy} />
          </View>
        </View>
      )}
      {view.kind === "home" && o.editable && (
        <View style={s.foot}>
          {o.failed && <Text style={[s.error, { marginBottom: 10 }]} accessibilityRole="alert">{t(ui.failed)}</Text>}
          <View style={{ gap: 10 }}>
            <Btn {...ctx} label={t(ui.continueProfile)} onPress={o.continueProfile} />
            <Btn {...ctx} primary busy={o.busy} label={t(o.busy ? ui.submitting : ui.submitForReview)} onPress={o.submitForReview} disabled={!o.requiredDone || o.busy} />
          </View>
        </View>
      )}

      <MenuSheet {...ctx} />
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------- small pieces

function Btn({ s, c, label, onPress, primary, grow, small, disabled, style, dot, danger, busy }: Ctx & {
  label: string; onPress: () => void; primary?: boolean; grow?: boolean; small?: boolean; disabled?: boolean; style?: any; dot?: boolean; danger?: boolean; busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, primary && s.btnPrimary, grow && { flex: 1 }, small && s.btnSmall, danger && { borderColor: c.error }, disabled && { opacity: 0.6 }, pressed && { opacity: 0.85 }, style]}
    >
      {dot && <View style={s.recDot} />}
      {busy && <Turning size={24} plain color={primary ? c.onGold : c.ink} />}
      <Text style={[s.btnText, primary && s.btnPrimaryText, small && { fontSize: 16 }, danger && { color: c.error }]}>{label}</Text>
    </Pressable>
  );
}

function Chip({ s, c, label, on, onPress, compact, mark }: Ctx & { label: string; on: boolean; onPress: () => void; compact?: boolean; mark?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.chip, on && s.chipOn, compact && s.chipCompact]}>
      <Text style={[s.chipText, on && { fontWeight: "600" }, compact && { fontSize: 14 }]} numberOfLines={1}>
        {mark && <Text style={{ color: c.gold, fontWeight: "700" }}>{on ? "✓  " : "+  "}</Text>}{label}
      </Text>
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

// ---------------------------------------------------------------- profile menu

const MENU = ["home", "profile", "account", "language", "help", "deletion"] as const;
const menuLabel = (o: App, k: (typeof MENU)[number]) =>
  o.t(k === "home" ? o.ui.home : k === "profile" ? o.ui.myProfile : k === "account" ? o.ui.myAccount : k === "language" ? o.ui.language : k === "help" ? o.ui.help : o.ui.deleteAccount);

function Avatar({ o, s, size }: Ctx & { size: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {o.values.photo
        ? <Image source={{ uri: o.values.photo }} style={{ width: "100%", height: "100%" }} />
        : <Text style={[s.avatarText, { fontSize: size * 0.42 }]}>{(o.values.fullName || o.account.email || "?").trim().charAt(0).toUpperCase()}</Text>}
    </View>
  );
}

function StatusBadge({ o, s, c, onDark }: Ctx & { onDark?: boolean }) {
  const tone = STATUS_TONE[o.status];
  const color = tone === "good" ? (onDark ? "#7FD1A0" : c.done) : tone === "attention" ? (onDark ? "#FFA094" : c.error) : tone === "waiting" ? c.gold : onDark ? "rgba(248,230,196,0.45)" : c.line;
  return (
    <View style={[s.pill, { borderColor: color }, onDark && { backgroundColor: "transparent" }]}>
      <Text style={[s.pillText, onDark && { color: "#F8E6C4" }, (tone === "good" || tone === "attention") && { color }]}>{o.t(STATUS_LABEL[o.status])}</Text>
    </View>
  );
}

function MenuSheet(ctx: Ctx) {
  const { o, s } = ctx;
  return (
    <Modal visible={o.menuOpen} transparent animationType="fade" onRequestClose={() => o.setMenuOpen(false)}>
      <Pressable style={s.backdrop} onPress={() => o.setMenuOpen(false)} accessibilityLabel={o.t(o.ui.close)} />
      <View style={s.sheet}>
        <View style={[s.row, { alignItems: "center", gap: 12, marginBottom: 10 }]}>
          <Avatar {...ctx} size={48} />
          <View>
            <Text style={[s.body, { fontWeight: "600" }]}>{o.values.fullName || o.t(o.ui.namasteNoName)}</Text>
            <Text style={s.small}>+91 {o.account.phone}</Text>
          </View>
        </View>
        {MENU.map((k) => (
          <Pressable key={k} style={s.option} onPress={() => o.go(k)} accessibilityRole="menuitem"><Text style={s.body}>{menuLabel(o, k)}</Text></Pressable>
        ))}
        <Pressable style={s.option} onPress={o.signIn.signOut} accessibilityRole="menuitem"><Text style={s.body}>{o.t(o.ui.signOut)}</Text></Pressable>
      </View>
    </Modal>
  );
}

function Item({ s, label, text }: Ctx & { label: string; text: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.small}>{label}</Text>
      <Text style={s.body}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- sign-in and contact

function SignIn(ctx: Ctx & { code: string; setCode: (x: string) => void }) {
  const { o, s, c, code, setCode } = ctx;
  const { t, ui, view, signIn } = o;
  if (view.kind !== "signin" && view.kind !== "contact") return null;
  const failed = o.failed && <Text style={s.error} accessibilityRole="alert">{t(ui.failed)}</Text>;
  const signOut = view.kind === "contact" && <LinkBtn {...ctx} center label={t(ui.signOut)} onPress={signIn.signOut} />;
  const google = (label: L) => (
    <Pressable style={({ pressed }) => [s.btn, s.btnWide, pressed && { opacity: 0.85 }]} onPress={signIn.google} disabled={o.busy} accessibilityRole="button">
      <View style={s.glyph}><Text style={s.glyphText}>G</Text></View>
      <Text style={s.btnText}>{t(label)}</Text>
    </Pressable>
  );

  if (view.stage === "otp")
    return (
      <View style={s.fields}>
        <View style={s.field}>
          <Text style={s.label}>{t(ui.otpLabel)}</Text>
          <TextInput style={[s.input, s.inputText, s.otp, !!signIn.error && { borderColor: c.error }]} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" maxLength={6}
            value={code} onChangeText={(x) => { setCode(x.replace(/\D/g, "")); signIn.clearError(); }} accessibilityLabel={t(ui.otpLabel)} />
          {!!signIn.error && <Text style={s.error} accessibilityRole="alert">{t(signIn.error)}</Text>}
        </View>
        <Btn {...ctx} primary busy={o.busy} label={t(o.busy ? ui.verifying : ui.verify)} onPress={() => signIn.verifyCode(code)} disabled={o.busy} />
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <LinkBtn {...ctx} label={signIn.resendIn > 0 ? t(ui.sendAgainIn, { n: signIn.resendIn }) : t(ui.sendAgain)} onPress={signIn.sendCode} disabled={signIn.resendIn > 0 || o.busy} />
          <LinkBtn {...ctx} label={t(ui.changeNumber)} onPress={o.back} />
        </View>
        {failed}
      </View>
    );

  if (view.kind === "contact" && view.need === "google")
    return <View style={s.fields}>{google(ui.verifyWithGoogle)}{failed}{signOut}</View>;

  return (
    <View style={s.fields}>
      <View style={s.field}>
        <Text style={s.label}>{t(ui.phoneLabel)}</Text>
        <View style={[s.row, { alignItems: "center" }]}>
          <Text style={s.label}>+91</Text>
          <TextInput style={[s.input, s.inputText, { flex: 1 }, !!signIn.error && { borderColor: c.error }]} keyboardType="number-pad" textContentType="telephoneNumber" maxLength={10}
            value={signIn.phone} onChangeText={signIn.setPhone} accessibilityLabel={t(ui.phoneLabel)} />
        </View>
        {!!signIn.error && <Text style={s.error} accessibilityRole="alert">{t(signIn.error)}</Text>}
      </View>
      <Btn {...ctx} primary busy={o.busy} label={t(o.busy ? ui.sending : ui.sendCode)} onPress={signIn.sendCode} disabled={o.busy} />
      {view.kind === "signin" && (
        <>
          <View style={[s.row, { alignItems: "center", gap: 12 }]}>
            <View style={s.rule} /><Text style={s.small}>{t(ui.or)}</Text><View style={s.rule} />
          </View>
          {google(ui.withGoogle)}
          {!!o.openPrivacy && <LinkBtn {...ctx} center label={t(ui.privacy)} onPress={o.openPrivacy} />}
        </>
      )}
      {failed}
      {signOut}
    </View>
  );
}

// ---------------------------------------------------------------- Home and My profile

function Home(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui } = o;
  const unread = o.updates.filter((u) => !u.read);
  const r = o.recitation;
  const docs = Object.values(o.values.idDocs ?? {}).filter(Boolean).length;
  const note = (sec: Section): string => {
    const st = o.statusOf(sec);
    if (sec.id === "bank" && st === "done") return t(o.bankStatus === "verified" ? ui.bankVerified : ui.bankPending);
    if (sec.id === "idDocument" && docs) return t(ui.uploadedCount, { n: docs });
    if (sec.group === "profile") return t(st === "done" ? ui.done : sec.required ? ui.required : ui.optional);
    return t(ui[st]);
  };
  const row = (key: string, state: string, title: string, summary: string, text: string, open: () => void) => (
    <Pressable key={key} style={({ pressed }) => [s.card, s.tile, pressed && { borderColor: c.gold }]} onPress={open} accessibilityRole="button" accessibilityLabel={`${title}. ${text}`}>
      <View style={[s.dot, state !== "empty" && { borderColor: c.gold }, state === "done" && { backgroundColor: c.gold }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.body, { fontWeight: "600" }]}>{title}</Text>
        <Text style={s.small}>{summary}</Text>
      </View>
      <Text style={[s.small, s.tileStatus, state === "done" && { color: c.done, fontWeight: "600" }]}>{text}</Text>
    </Pressable>
  );
  const recNote = r.state === "passed" ? t(ui.passedShort) : r.state === "checking" ? t(ui.beingCheckedShort) : r.reviewRequested ? t(ui.reviewAsked) : t(ui.attemptsLeft, { n: r.attemptsLeft });

  return (
    <>
      <View style={[s.banner, o.status === "approved" && s.bannerVerified]}>
        <View style={[s.row, { justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }]}>
          <Text style={s.bannerTitle}>{t(o.editable ? ui.bannerTitle : ui.yourProfile)}</Text>
          <StatusBadge {...ctx} onDark />
        </View>
        <RiderBar value={o.profileProgress} label={t(ui.bannerTitle)} />
        <Text style={s.bannerBody}>{t(o.status === "approved" ? ui.bannerVerified : !o.editable ? ui.bannerLocked : o.requiredDone ? ui.bannerReady : ui.bannerNeeds)}</Text>
      </View>

      {!!o.reviewerMessage && (
        <View style={[s.card, { marginTop: 16, borderColor: c.error }]}>
          <Text style={[s.body, { fontWeight: "600" }]}>{t(ui.reviewerMessage)}</Text>
          <Text style={s.body}>{o.reviewerMessage}</Text>
        </View>
      )}

      {unread.length > 0 && (
        <>
          <Text style={s.h2}>{t(ui.updates)}</Text>
          <View style={s.list}>
            {unread.map((u) => (
              <Pressable key={u.id} style={[s.card, s.tile, { borderColor: c.gold }]} onPress={() => o.markRead(u.id)} accessibilityRole="button" accessibilityLabel={`${t(UPDATE_TEXT[u.kind])} ${t(ui.markRead)}`}>
                <View style={[s.dot, { borderColor: c.gold, backgroundColor: c.gold }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.body, { fontWeight: "600" }]}>{t(UPDATE_TEXT[u.kind])}</Text>
                  {!!u.reason && <Text style={s.small}>{u.reason}</Text>}
                  <Text style={[s.small, { marginTop: 4 }]}>{t(ui.markRead)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={s.h2}>{t(ui.yourProfile)}</Text>
      <View style={s.list}>{o.profileSections.map((sec) => row(sec.id, o.statusOf(sec), t(sec.title), t(sec.summary), note(sec), () => o.openSection(sec.id)))}</View>

      <Text style={s.h2}>{t(ui.moreAboutYou)}</Text>
      <View style={s.list}>
        {o.moreSections.map((sec) => row(sec.id, o.statusOf(sec), t(sec.title), t(sec.summary), note(sec), () => o.openSection(sec.id)))}
        {row("recitation", r.state === "passed" ? "done" : r.state === "none" ? "empty" : "started", t(ui.getVerified), t(ui.getVerifiedSummary), recNote, () => o.go("recitation"))}
      </View>
    </>
  );
}

function Profile(ctx: Ctx) {
  const { o, s } = ctx;
  const { t, ui } = o;
  return (
    <View style={s.cards}>
      {o.allSections.map((sec) => (
        <View key={sec.id} style={s.card}>
          <Text style={s.cardTitle}>{t(sec.title)}</Text>
          {sec.steps.flatMap((st) => visibleFields(st, o.values)).filter((f) => f.type !== "search" && f.id !== "accountNumberAgain").map((f) => (
            <Item key={f.id} {...ctx} label={t(f.label)} text={(f.id === "serviceCentre" ? o.centre?.label : display(f, o.values, o.lang)) || t(ui.notAdded)} />
          ))}
          {o.canEdit(sec) && <LinkBtn {...ctx} label={t(ui.edit)} onPress={() => o.openSection(sec.id)} />}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- get verified

function Recitation(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui } = o;
  const r = o.recitation;
  const cam = useRef<CameraView>(null);
  const [camPerm, askCam] = useCameraPermissions();
  const [micPerm, askMic] = useMicrophonePermissions();
  const [mode, setMode] = useState<"off" | "denied" | "live" | "recording" | "recorded">("off");
  const [accepted, setAccepted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const uri = useRef<string | null>(null);
  const take = useRef(0); // lets "Record again" discard the recording it replaced
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => stopTimer, []);

  const start = async () => {
    const a = camPerm?.granted ? camPerm : await askCam();
    const b = micPerm?.granted ? micPerm : await askMic();
    setMode(a.granted && b.granted ? "live" : "denied");
  };
  const record = () => {
    const mine = ++take.current;
    uri.current = null;
    setAccepted(false);
    setSeconds(0);
    setMode("recording");
    stopTimer();
    timer.current = setInterval(() => setSeconds((n) => n + 1), 1000);
    cam.current
      ?.recordAsync({ maxDuration: MAX_RECORDING_SECONDS })
      .then((v) => {
        if (take.current !== mine) return;
        stopTimer();
        uri.current = v?.uri ?? null;
        setMode(uri.current ? "recorded" : "live"); // nothing was captured: let them record again
      })
      .catch(() => { if (take.current === mine) { stopTimer(); setMode("live"); } });
  };
  const cancel = () => { take.current++; stopTimer(); setAccepted(false); setConfirming(false); setMode("off"); };
  const name = (id: string) => { const x = r.shlokas.find((k) => k.value === id); return x ? t(x.label) : id; };
  const lastFailed = [...r.attempts].reverse().find((a) => a.result === "failed");

  const history = r.attempts.length > 0 && (
    <>
      <Text style={s.h2}>{t(ui.history)}</Text>
      <View style={s.list}>
        {r.attempts.map((a) => (
          <View key={a.n} style={[s.card, s.historyRow]}>
            <Text style={[s.body, { flex: 1 }]}>{t(ui.attemptN, { n: a.n })} · {name(a.shlokaId)}</Text>
            <Text style={[s.body, { fontWeight: "600" }, a.result === "passed" && { color: c.done }, a.result === "failed" && { color: c.error }]}>
              {t(a.result === "passed" ? ui.resultPassed : a.result === "failed" ? ui.resultFailed : ui.resultChecking)}
            </Text>
          </View>
        ))}
      </View>
    </>
  );

  if (r.state === "passed" || r.state === "checking" || r.state === "blocked")
    return (
      <>
        {r.state === "checking" && <View style={[s.hero, { marginBottom: 0 }]}><Turning size={150} color={c.gold} /></View>}
        <View style={[s.result, { borderColor: r.state === "passed" ? c.done : r.state === "blocked" ? c.error : c.gold }]}>
          <Text style={[s.resultTitle, r.state === "passed" && { color: c.done }]}>{t(r.state === "passed" ? ui.recPassed : r.state === "checking" ? ui.beingChecked : ui.noAttempts)}</Text>
          {r.state === "blocked" && (r.reviewRequested ? (
            <Text style={s.resultBody}>{t(ui.reviewRequested)}</Text>
          ) : (
            <>
              <Text style={s.resultBody}>{t(ui.noAttemptsBody)}</Text>
              {o.failed && <Text style={s.error} accessibilityRole="alert">{t(ui.failed)}</Text>}
              <Btn {...ctx} primary label={t(ui.requestReview)} onPress={r.requestReview} disabled={o.busy} style={{ marginTop: 12 }} />
            </>
          ))}
        </View>
        {r.state !== "passed" && <Text style={[s.hint, { marginTop: 12 }]}>{t(ui.attemptsLeft, { n: r.attemptsLeft })}</Text>}
        {history}
      </>
    );

  return (
    <View style={s.fields}>
      {!!lastFailed && <View style={[s.card, { borderColor: c.error }]}><Text style={s.body}>{t(ui.attemptFailed, { n: lastFailed.n })}</Text></View>}
      <View style={s.field}>
        <Text style={s.label}>{t(ui.whichShloka)}</Text>
        <Select {...ctx} label={t(ui.whichShloka)} value={r.shlokaId} options={r.shlokas} placeholder={t(ui.chooseShloka)} onChange={r.setShlokaId} disabled={r.uploading || mode === "recording"} />
      </View>

      <BreathingRing on={mode === "recording"} radius={18}>
      <View style={s.camera}>
        {mode === "off" || mode === "denied" ? (
          <Text style={s.cameraText}>{t(mode === "denied" ? ui.cameraDenied : ui.cameraOff)}</Text>
        ) : (
          <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="front" mode="video" />
        )}
        {mode === "recording" && <View style={s.badge}><View style={s.badgeDot} /><Text style={s.badgeText}>{t(ui.recording)} · {t(ui.seconds, { n: seconds })}</Text></View>}
        {mode === "recorded" && accepted && !r.uploading && <View style={[s.badge, { backgroundColor: "rgba(46,125,79,0.9)" }]}><Text style={s.badgeText}>{t(ui.recordingReady)} · {t(ui.seconds, { n: seconds })}</Text></View>}
        {r.uploading && <View style={s.checking} accessibilityRole="alert"><Turning size={110} /><Text style={[s.checkingText, { marginTop: 14 }]}>{t(ui.uploadingRec)}</Text></View>}
      </View>
      </BreathingRing>

      {confirming ? (
        <View style={[s.card, { borderColor: c.gold, backgroundColor: c.goldSoft, gap: 12 }]} accessibilityRole="alert">
          <Text style={[s.body, { fontWeight: "600" }]}>{t(ui.confirmAttempt)}</Text>
          <View style={s.actions}>
            <Btn {...ctx} label={t(ui.notYet)} onPress={() => setConfirming(false)} />
            <Btn {...ctx} primary grow label={t(ui.yesSubmit)} onPress={() => { setConfirming(false); r.submit(uri.current).then((ok) => { if (ok) cancel(); }); }} />
          </View>
        </View>
      ) : !r.uploading && (
        <View style={s.actions}>
          {(mode === "off" || mode === "denied") && <Btn {...ctx} primary grow dot label={t(ui.record)} onPress={start} disabled={!r.shlokaId} />}
          {mode === "live" && (
            <>
              <Btn {...ctx} label={t(ui.cancel)} onPress={cancel} />
              <Btn {...ctx} primary grow dot label={t(ui.startRecording)} onPress={record} />
            </>
          )}
          {mode === "recording" && <Btn {...ctx} primary grow label={t(ui.stop)} onPress={() => cam.current?.stopRecording()} />}
          {mode === "recorded" && (
            <>
              <Btn {...ctx} label={t(ui.recordAgain)} onPress={record} />
              {accepted
                ? <Btn {...ctx} primary grow label={t(ui.submitVerification)} onPress={() => setConfirming(true)} />
                : <Btn {...ctx} primary grow label={t(ui.useThis)} onPress={() => setAccepted(true)} />}
            </>
          )}
        </View>
      )}
      {!r.shlokaId && <Text style={s.hint}>{t(ui.chooseFirst)}</Text>}
      {o.failed && <Text style={s.error} accessibilityRole="alert">{t(ui.failed)}</Text>}
      <Text style={s.hint}>{t(ui.attemptsLeft, { n: r.attemptsLeft })}</Text>
      {history}
    </View>
  );
}

// ---------------------------------------------------------------- one field

function FieldRow(ctx: Ctx & { f: Field }) {
  const { f, o, s, c, props } = ctx;
  const { t, ui, values, setValue } = o;
  if (f.type === "search" && !o.search) return null;
  const value = values[f.id] ?? f.defaultValue;
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
          value={value ?? ""} maxLength={f.maxLength} multiline={area} textAlignVertical={area ? "top" : "center"}
          keyboardType={f.keyboard === "number" ? "number-pad" : f.keyboard === "email" ? "email-address" : "default"}
          autoCapitalize={f.capitalize ?? "sentences"} autoCorrect={!f.sensitive && f.keyboard !== "email"}
          placeholder={f.placeholder && t(f.placeholder)} placeholderTextColor={c.muted} accessibilityLabel={label}
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
          return <Chip key={op.value} {...ctx} mark={many} label={t(op.label)} on={on} onPress={() => set(many ? (on ? list.filter((x) => x !== op.value) : [...list, op.value]) : op.value)} />;
        })}
      </View>
    );
  } else if (f.type === "date") {
    control = <DateInput {...ctx} value={value} onChange={set} invalid={!!error} />;
  } else if (f.type === "image") {
    const pick = async (source: "camera" | "gallery") => { const uri = await props.pickImage(source, "avatar"); if (uri) set(uri); };
    control = (
      <View style={[s.row, { alignItems: "center", gap: 16 }]}>
        <Avatar {...ctx} size={76} />
        <View style={{ flex: 1, gap: 8, alignItems: "flex-start" }}>
          <Btn {...ctx} small label={t(ui.takePhoto)} onPress={() => pick("camera")} />
          <Btn {...ctx} small label={t(ui.fromGallery)} onPress={() => pick("gallery")} />
        </View>
      </View>
    );
  } else if (f.type === "search") {
    control = <Search {...ctx} placeholder={f.placeholder ? t(f.placeholder) : ""} label={label} onPick={o.applyPlace} />;
  } else if (f.type === "centre") {
    control = <Centre {...ctx} />;
  } else if (f.type === "docs") {
    control = <Docs {...ctx} />;
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
  } else if (f.type === "calendar") {
    control = <Calendar {...ctx} value={value ?? []} onChange={set} />;
  } else if (f.type === "dateList") {
    control = <Leave {...ctx} value={value ?? []} onChange={set} />;
  }

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {!!f.hint && <Text style={s.hint}>{t(f.hint)}</Text>}
      {control}
      {f.id === "pin" && o.pinState.status !== "idle" && !error && (
        <Text style={s.hint}>{o.pinState.status === "looking" ? t(ui.pinLooking) : o.pinState.status === "found" ? t(ui.pinFound, { place: o.pinState.place ?? "" }) : t(ui.pinNotFound)}</Text>
      )}
      {!!error && <Text style={s.error} accessibilityRole="alert">{t(error)}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------- address search, service area, documents

/** Type-ahead: after 3 characters, up to 5 suggestions appear below the field. */
function Search(ctx: Ctx & { placeholder: string; label: string; onPick: (p: Place) => void }) {
  const { o, s, c, placeholder, label, onPick } = ctx;
  const [q, setQ] = useState("");
  const [state, setState] = useState<{ status: "idle" | "searching" | "done"; results: Place[] }>({ status: "idle", results: [] });
  useEffect(() => {
    if (q.trim().length < 3 || !o.search) return setState({ status: "idle", results: [] });
    let cancelled = false;
    setState((x) => ({ ...x, status: "searching" }));
    const timer = setTimeout(() => {
      o.search!(q.trim())
        .then((r) => !cancelled && setState({ status: "done", results: r.slice(0, 5) }))
        .catch(() => !cancelled && setState({ status: "done", results: [] }));
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q]);
  return (
    <View style={{ gap: 6 }}>
      <TextInput style={[s.input, s.inputText]} value={q} onChangeText={setQ} placeholder={placeholder} placeholderTextColor={c.muted} autoCorrect={false} accessibilityLabel={label} />
      {state.status === "searching" && <Text style={s.hint}>{o.t(o.ui.searching)}</Text>}
      {state.status === "done" && state.results.length === 0 && <Text style={s.hint}>{o.t(o.ui.noResults)}</Text>}
      {state.results.length > 0 && (
        <View style={[s.card, { padding: 6 }]}>
          {state.results.map((p) => (
            <Pressable key={p.label} style={s.option} onPress={() => { onPick(p); setQ(""); setState({ status: "idle", results: [] }); }} accessibilityRole="button">
              <Text style={s.body}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const CIRCLE: Record<string, number> = { "2": 14, "5": 20, "10": 27, "15": 32, "25": 38, "50": 44, "100": 48 };

function Centre(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui } = o;
  const km = String(o.values.radiusKm ?? "10");
  const place = o.centre;
  const image = place && o.mapImageUrl?.(place, Number(km));
  return (
    <>
      {place ? <Text style={[s.body, { fontWeight: "600" }]}>{place.label}</Text> : <View style={s.card}><Text style={s.body}>{t(ui.noCentre)}</Text></View>}
      {!!place && (
        <View style={s.map} accessibilityRole="image" accessibilityLabel={t(ui.mapAlt, { place: place.label, km })}>
          {image ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} /> : (
            <>
              <View style={[s.mapRoad, { top: "30%", left: 0, right: 0, height: 7 }]} />
              <View style={[s.mapRoad, { top: "62%", left: 0, right: 0, height: 7 }]} />
              <View style={[s.mapRoad, { left: "24%", top: 0, bottom: 0, width: 7 }]} />
              <View style={[s.mapRoad, { left: "70%", top: 0, bottom: 0, width: 7 }]} />
            </>
          )}
          <View style={[s.mapCircle, { width: `${CIRCLE[km] * 2}%`, borderColor: c.gold }]}><View style={s.mapDot} /></View>
        </View>
      )}
      {!!o.search && (
        <View style={s.field}>
          <Text style={s.hint}>{t(ui.differentCentre)}</Text>
          <Search {...ctx} placeholder="" label={t(ui.differentCentre)} onPick={o.setCentre} />
        </View>
      )}
    </>
  );
}

function Docs(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui } = o;
  const docs: Record<string, string> = o.values.idDocs ?? {};
  const [type, setType] = useState<string>(() => ID_TYPES.find((d) => docs[d.value])?.value ?? "");
  const chosen = ID_TYPES.find((d) => d.value === type);
  const state = o.docState[type];
  return (
    <>
      <View style={s.chips}>
        {ID_TYPES.map((d) => <Chip key={d.value} {...ctx} label={`${docs[d.value] ? "✓ " : ""}${t(d.label)}`} on={type === d.value} onPress={() => setType(d.value)} />)}
      </View>
      {!!chosen?.warning && <View style={[s.card, { borderColor: c.error }]}><Text style={s.body}>{t(chosen.warning)}</Text></View>}
      {!!chosen && (
        <>
          {!!docs[type] && <View style={s.drop}><Image source={{ uri: docs[type] }} style={s.dropImage} resizeMode="contain" /></View>}
          <View style={s.actions}>
            <Btn {...ctx} grow label={t(ui.takePhoto)} onPress={() => o.addDocument(type, "camera")} disabled={state === "uploading"} />
            <Btn {...ctx} grow label={t(ui.fromGallery)} onPress={() => o.addDocument(type, "gallery")} disabled={state === "uploading"} />
          </View>
          {!!state && (
            <View style={[s.row, { alignItems: "center", gap: 10 }]}>
              {state === "uploading" && <Turning size={26} plain color={c.ink} />}
              <Text style={state === "failed" ? s.error : s.hint}>{t(state === "uploading" ? ui.uploading : state === "uploaded" ? ui.uploaded : ui.uploadFailed)}</Text>
            </View>
          )}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- availability: month calendar and leave

function Calendar(ctx: Ctx & { value: string[]; onChange: (x: string[]) => void }) {
  const { o, s, c, value, onChange } = ctx;
  const { t, ui } = o;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const week: Record<string, string[]> = o.values.week ?? {};
  const leave: { from: string; to: string }[] = o.values.leave ?? [];
  const kind = (date: string, weekday: number) => {
    if (leave.some((r) => isDate(r.from) && isDate(r.to) && date >= r.from && date <= r.to)) return "leave";
    if (value.includes(date)) return "off";
    const n = (week[DAYS[weekday].value] ?? []).length;
    return n === SLOTS.length ? "available" : n ? "partly" : "notset";
  };
  const look: Record<string, { label: L; border: string; fill: string }> = {
    available: { label: ui.legendAvailable, border: c.done, fill: c.done + "33" },
    partly: { label: ui.legendPartly, border: c.gold, fill: c.goldSoft },
    off: { label: ui.legendOff, border: c.error, fill: c.error + "26" },
    leave: { label: ui.legendLeave, border: c.muted, fill: c.muted + "44" },
    notset: { label: ui.legendNotSet, border: c.line, fill: c.field },
  };
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < lead; i++) cells.push(<View key={`x${i}`} style={s.calCell} />);
  for (let i = 0; i < days; i++) {
    const date = `${y}-${pad(m + 1)}-${pad(i + 1)}`;
    const k = kind(date, (lead + i) % 7);
    cells.push(
      <View key={date} style={s.calCell}>
        <Pressable
          style={[s.calDay, { borderColor: look[k].border, backgroundColor: look[k].fill }]}
          disabled={k === "leave"}
          onPress={() => onChange(value.includes(date) ? value.filter((x) => x !== date) : [...value, date])}
          accessibilityRole="button"
          accessibilityLabel={`${i + 1}, ${t(look[k].label)}`}
        >
          <Text style={[s.body, k === "off" && { textDecorationLine: "line-through" }]}>{i + 1}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <Text style={[s.body, { fontWeight: "600" }]}>{new Intl.DateTimeFormat(o.lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" }).format(now)}</Text>
      <View style={s.calGrid}>
        {DAYS.map((d) => <View key={d.value} style={s.calCell}><Text style={[s.small, s.center]}>{t(d.label)}</Text></View>)}
        {cells}
      </View>
      <View style={[s.chips, { gap: 12 }]}>
        {Object.keys(look).map((k) => (
          <View key={k} style={[s.row, { alignItems: "center", gap: 6 }]}>
            <View style={[s.legend, { borderColor: look[k].border, backgroundColor: look[k].fill }]} />
            <Text style={s.small}>{t(look[k].label)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Leave(ctx: Ctx & { value: any[]; onChange: (x: any[]) => void }) {
  const { o, s, value, onChange } = ctx;
  const { t, ui } = o;
  const patch = (i: number, p: any) => onChange(value.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const keys = useRef<number[]>([]);
  while (keys.current.length < value.length) keys.current.push(Math.random());
  const remove = (i: number) => { keys.current.splice(i, 1); onChange(value.filter((_, j) => j !== i)); };
  return (
    <View style={{ gap: 14, alignItems: "flex-start" }}>
      {value.map((r, i) => (
        <View key={keys.current[i]} style={[s.card, { alignSelf: "stretch", gap: 10 }]}>
          <Text style={s.small}>{t(ui.from)}</Text>
          <DateInput {...ctx} value={r.from} onChange={(x) => patch(i, { from: x })} invalid={!!r.from && !isDate(r.from)} />
          <Text style={s.small}>{t(ui.to)}</Text>
          <DateInput {...ctx} value={r.to} onChange={(x) => patch(i, { to: x })} invalid={!!r.to && !isDate(r.to)} />
          <LinkBtn {...ctx} label={t(ui.remove)} onPress={() => remove(i)} />
        </View>
      ))}
      <Btn {...ctx} small label={t(ui.addLeave)} onPress={() => onChange([...value, { from: "", to: "" }])} />
    </View>
  );
}

// ---------------------------------------------------------------- styles

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    top: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
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

    // v2 additions
    screenCentered: { flexGrow: 1, justifyContent: "center" },
    hero: { alignItems: "center", marginTop: 18, marginBottom: 30 },
    moment: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    bannerVerified: { borderWidth: 1.5, borderColor: "#F0B040" },
    icon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
    iconText: { color: c.ink, fontSize: 20 },
    topName: { flex: 1, color: c.ink, fontFamily: DISPLAY_FONT, fontSize: 20 },
    dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 24 },
    dotSmall: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.line },
    dotOn: { width: 24, backgroundColor: c.gold },
    rule: { flex: 1, height: 1, backgroundColor: c.line },
    h2: { color: c.muted, fontSize: 16, fontWeight: "600", marginTop: 26 },
    list: { gap: 10, marginTop: 10 },
    tileStatus: { maxWidth: "36%", textAlign: "right" },
    banner: { gap: 12, marginTop: 18, padding: 20, borderRadius: 20, backgroundColor: "#2C120C" },
    bannerTitle: { color: "#F8E6C4", fontFamily: DISPLAY_FONT, fontSize: 23 },
    bannerBody: { color: "#CDAB88", fontSize: 15.5, lineHeight: 22 },
    cardTitle: { color: c.ink, fontFamily: DISPLAY_FONT, fontSize: 20, marginBottom: 10 },
    rowBtn: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: c.line, borderRadius: 14, backgroundColor: c.surface },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.muted },
    historyRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
    map: { height: 240, borderWidth: 1.5, borderColor: c.line, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: c.goldSoft },
    mapRoad: { position: "absolute", backgroundColor: c.field },
    mapCircle: { aspectRatio: 1, borderWidth: 2, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,150,30,0.22)" },
    mapDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: "#C8620E" },
    calGrid: { flexDirection: "row", flexWrap: "wrap" },
    calCell: { width: `${100 / 7}%`, padding: 2.5 },
    calDay: { minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 10 },
    legend: { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5 },
  });
