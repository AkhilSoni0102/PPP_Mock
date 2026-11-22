// ProPoojaPaath pandit app for Expo / React Native.
//
//   logo reveal → 3 intro slides → sign in → add the missing contact
//   The logo of the reveal is one element that travels: into the rings of the intro slides,
//   up to the sign-in screen, and finally into the top bar. It never cuts away.
//   Three tabs at the bottom: Home, Availability, Profile. The bell is top right.
//   Home says what the platform gives, what you can do, and your next step.
//   Profile holds every section with its Edit button, then account and settings.
//   Steps show only Back and the progress bar.
//   → submit for review → ask to allow notifications
//   → Updates (from the bell or the status badge): the review timeline and every update
//
// What is asked lives in ../shared/schema.ts; the flow lives in ../shared/usePanditApp.ts.
// Needs ../../expo/LogoReveal.tsx, the PNGs in assets/logo-reveal/, and expo-camera
// (npx expo install expo-camera) for the recitation recorder.
// Push itself (permission, token, delivery) is yours: pass onEnableNotifications, e.g. with expo-notifications.

import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo, Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, Pressable,
  Linking, ScrollView, StyleSheet, Switch, Text, TextInput, View, useColorScheme,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import LotusMark from "../../expo/LotusMark";
import { BreathingRing, GlowLogo, LogoSlot, RiderBar, SlotContext, Turning } from "./Motion";
import {
  DAYS, ID_TYPES, INTRO, MAX_RECORDING_SECONDS, SLOTS, SLOT_SHORT, STATUS_LABEL, STATUS_TONE, UPDATE_TEXT,
  Field, L, Opt, Section, display, isDate, mask, pad, visibleFields,
} from "../shared/schema";
import { PanditApp as App, PanditAppProps, Place, usePanditApp } from "../shared/usePanditApp";

const BELL = require("../../assets/logo-reveal/bell.png");
const ICONS = {
  home: require("../../assets/logo-reveal/icon-home.png"),
  calendar: require("../../assets/logo-reveal/icon-calendar.png"),
  user: require("../../assets/logo-reveal/icon-user.png"),
  chat: require("../../assets/logo-reveal/icon-chat.png"),
  phone: require("../../assets/logo-reveal/icon-phone.png"),
  mail: require("../../assets/logo-reveal/icon-mail.png"),
  camera: require("../../assets/logo-reveal/icon-camera.png"),
  pin: require("../../assets/logo-reveal/icon-pin.png"),
  globe: require("../../assets/logo-reveal/icon-globe.png"),
  shield: require("../../assets/logo-reveal/icon-shield.png"),
  out: require("../../assets/logo-reveal/icon-out.png"),
  bell: BELL,
};
type IconName = keyof typeof ICONS;
/** The size the travelling logo is drawn at; it is scaled to fit each slot. */
const FLY = 150;


const COLORS = {
  light: {
    bg: "#FFF8EC", surface: "#FFFFFF", field: "#FFFDF8", ink: "#3D1708", muted: "#7B563A", line: "#E6D0B1",
    gold: "#E8961E", goldSoft: "#FCEBCB", onGold: "#2A0F0A", done: "#2E7D4F", error: "#B3261E", tabOn: "#A86708",
  },
  dark: {
    bg: "#1D0A08", surface: "#2A120D", field: "#24100B", ink: "#F8E6C4", muted: "#CDAB88", line: "#53301F",
    gold: "#F0B040", goldSoft: "#3D2411", onGold: "#2A0F0A", done: "#7FD1A0", error: "#FFA094", tabOn: "#F0B040",
  },
};
type Palette = typeof COLORS.light;

// Swap these for your brand fonts once loaded with expo-font (Marcellus / Mukta on the website).
const DISPLAY_FONT = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

type Ctx = { o: App; c: Palette; s: ReturnType<typeof makeStyles>; props: PanditAppProps };

type Props = PanditAppProps & {
  /** Play the logo reveal first, then let the logo travel into the app. Default true. */
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
  // The opening: "reveal" while the petals open, then "travel" while the one logo follows the screens
  // to its place in the top bar, then null: every screen draws its own logo again.
  const [opening, setOpening] = useState<"reveal" | "travel" | null>(reveal ? "reveal" : null);
  const rootRef = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const fly = useRef({ x: new Animated.Value(0), y: new Animated.Value(0), s: new Animated.Value(1), o: new Animated.Value(0), name: new Animated.Value(0), placed: false }).current;
  const flyTo = (x: number, y: number, scale: number, animate: boolean) => {
    const to = (v: Animated.Value, toValue: number) => Animated.timing(v, { toValue, duration: animate ? 950 : 0, easing: Easing.bezier(0.6, 0, 0.2, 1), useNativeDriver: true });
    Animated.parallel([to(fly.x, x - FLY / 2), to(fly.y, y - FLY / 2), to(fly.s, scale), Animated.timing(fly.o, { toValue: 1, duration: animate ? 200 : 0, useNativeDriver: true })]).start();
    fly.placed = true;
  };
  const onRootLayout = (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
    rootRef.current?.measureInWindow((x, y) => { origin.current = { x, y }; });
    const { width, height } = e.nativeEvent.layout;
    if (opening === "reveal") flyTo(width / 2, height * 0.4, Math.min(1.35, (width * 0.5) / FLY), false);
  };
  const reportSlot = React.useCallback((at: { x: number; y: number; size: number }) => {
    flyTo(at.x - origin.current.x, at.y - origin.current.y, at.size / FLY, fly.placed);
  }, []);
  useEffect(() => {
    if (opening !== "reveal") return;
    Animated.timing(fly.name, { toValue: 1, duration: 700, delay: 2500, useNativeDriver: true }).start();
    const id = setTimeout(() => setOpening("travel"), 3500);
    return () => clearTimeout(id);
  }, [opening]);
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
    if (moment) return; // the screen is not mounted during a milestone; fade it up when the milestone ends
    setCode("");
    scroll.current?.scrollTo({ y: 0, animated: false });
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: opening ? 600 : 450, delay: opening ? 250 : 0, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [viewKey, moment, opening === "reveal"]);

  // Once the logo has settled in the top bar of a signed-in screen, the opening is over.
  const settled = opening === "travel" && o.signedIn && view.kind !== "contact";
  useEffect(() => {
    if (!settled) return;
    const id = setTimeout(() => setOpening(null), 1250);
    return () => clearTimeout(id);
  }, [settled]);
  // A screen with nowhere for the logo to go (the language list before sign-in): let it fade out.
  useEffect(() => {
    if (opening !== "travel") return;
    const hasSlot = view.kind === "intro" || view.kind === "signin" || view.kind === "contact" || o.signedIn;
    if (!hasSlot) Animated.timing(fly.o, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  }, [viewKey, opening]);
  const logo = (size: number, extra?: { sparkles?: boolean; pulse?: boolean; sparkColor?: string }) =>
    opening ? <LogoSlot size={size} /> : <GlowLogo size={size} {...extra} />;
  const flying = !!opening && (
    <Animated.View pointerEvents="none" style={[s.fly, { opacity: fly.o, transform: [{ translateX: fly.x }, { translateY: fly.y }, { scale: fly.s }] }]}>
      <LotusMark size={FLY} theme={mode} />
    </Animated.View>
  );

  if (opening === "reveal")
    return (
      <View style={[s.root, mode === "dark" && { backgroundColor: "#2C120C" }]} ref={rootRef} onLayout={onRootLayout} collapsable={false}>
        <Animated.Text style={[s.openName, { opacity: fly.name, transform: [{ translateY: fly.name.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>{t(ui.brand)}</Animated.Text>
        {flying}
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
    case "home": title = t(ui.home); break;
    case "section": title = t(o.step!.title); intro = o.step!.intro && t(o.step!.intro); break;
    case "recitation": title = t(ui.getVerified); intro = t(ui.recIntro); break;
    case "updates": title = t(ui.updates); break;
    case "notify":
      title = t(view.stage === "ask" ? ui.notifyTitle : view.stage === "on" ? ui.notifyOnTitle : ui.notifyLaterTitle);
      intro = t(view.stage === "ask" ? ui.notifyIntro : view.stage === "on" ? ui.notifyOnBody : ui.notifyLaterBody);
      break;
    case "language": title = t(ui.chooseLanguage); break;
    case "profile": title = t(ui.myProfile); break;
    case "account": title = t(ui.myAccount); break;
    case "help": title = t(ui.help); intro = o.support.hours ?? t(ui.supportHours); break;
    case "deletion": title = t(ui.deleteAccount); break;
  }

  const inFlow = view.kind === "section";
  /** A question flow: nothing on screen but Back and the progress bar. */
  const focused = inFlow && !o.tab;
  const showBack = !o.tab && view.kind !== "notify" && !(view.kind === "intro" && view.slide === 0) && !(view.kind === "signin" && view.stage === "main") && !(view.kind === "contact" && view.stage === "main");
  const centered = view.kind === "intro" || view.kind === "signin" || view.kind === "contact" || view.kind === "notify";
  /** A signed-in page that is neither a tab nor a flow: its title sits in the bar. */
  const inner = o.signedIn && !o.tab && !focused && view.kind !== "notify" && view.kind !== "contact";
  const ownHeading = view.kind === "home" || view.kind === "profile";
  const backButton = <Pressable style={s.icon} onPress={o.back} accessibilityRole="button" accessibilityLabel={t(ui.back)}><Text style={s.iconText}>←</Text></Pressable>;

  return (
    <SlotContext.Provider value={opening ? reportSlot : null}>
    <View style={s.root} ref={rootRef} onLayout={onRootLayout} collapsable={false}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.top, o.signedIn && !focused && s.topApp]}>
        {focused ? (
          <>
            {backButton}
            <View style={{ flex: 1 }}><RiderBar value={o.progress} label={title} track={c.goldSoft} /></View>
          </>
        ) : !o.signedIn ? (
          <>
            {/* During the opening the one logo is still travelling, so the bar waits for it without a second logo. */}
            {showBack ? backButton : !opening && <GlowLogo size={34} />}
            <Text style={[s.topName, { flex: 1 }]}>{t(ui.brand)}</Text>
            {(view.kind === "intro" || view.kind === "signin") && (
              <Pressable style={s.lang} onPress={() => o.go("language")} accessibilityRole="button" accessibilityLabel={t(ui.language)}>
                <Text style={s.langText}>{o.languages.find((x) => x.code === o.language)?.name}</Text>
              </Pressable>
            )}
          </>
        ) : (
          <>
            {inner ? backButton : (
              <Pressable onPress={() => o.go("home")} accessibilityRole="button" accessibilityLabel={t(ui.home)}>{logo(34, { pulse: pulse && view.kind === "home" })}</Pressable>
            )}
            <Text style={[s.topName, { flex: 1 }]} numberOfLines={1} accessibilityRole={inner ? "header" : undefined}>{inner ? title : t(ui.brand)}</Text>
            {view.kind !== "updates" && view.kind !== "notify" && view.kind !== "contact" && <Bell {...ctx} />}
          </>
        )}
      </View>

      <ScrollView ref={scroll} contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
        {/* While the logo travels the screen only fades: a screen that slid would move the slot the logo is aiming for. */}
        <Animated.View style={{ opacity: enter, transform: [{ translateY: opening ? 0 : enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          {view.kind === "intro" && <View style={[s.hero, { marginTop: 24 }]}><Turning size={230} color={c.gold} slot={!!opening} /></View>}
          {(view.kind === "signin" || view.kind === "contact") && <View style={s.hero}>{logo(92, { sparkles: true, pulse, sparkColor: mode === "dark" ? "#FFD98A" : "#E2941B" })}</View>}
          {view.kind === "notify" && (
            <View style={s.hero}>
              <View style={s.bigBell}>
                <Image source={BELL} style={{ width: 46, height: 46, tintColor: c.gold }} />
                {view.stage === "ask" && <View style={s.bigBellLogo}><GlowLogo size={30} /></View>}
              </View>
            </View>
          )}
          {!!o.section && <Text style={s.section}>{t(o.section.title)}</Text>}
          {/* Tabs draw their own heading; inner pages show their title in the bar. */}
          {!ownHeading && !inner && <Text style={[s.title, centered && s.center, view.kind === "intro" && s.slideTitle]} accessibilityRole="header">{title}</Text>}
          {!!intro && <Text style={[s.intro, centered && s.center, view.kind === "intro" && s.slideText, inner && { marginTop: 0 }]}>{intro}</Text>}

          {view.kind === "intro" && (
            <>
              <View style={s.dots}>{INTRO.map((_, i) => <View key={i} style={[s.dotSmall, i === view.slide && s.dotOn]} />)}</View>
              <Btn {...ctx} primary label={t(view.slide < 2 ? ui.next : ui.getStarted)} onPress={o.nextSlide} style={{ marginTop: 28 }} />
            </>
          )}
          {(view.kind === "signin" || view.kind === "contact") && <SignIn {...ctx} code={code} setCode={setCode} />}
          {view.kind === "home" && <Home {...ctx} />}
          {view.kind === "updates" && <Updates {...ctx} />}
          {view.kind === "notify" && (
            <>
              {view.stage === "ask" && (
                <View style={s.reasons}>
                  {t(ui.notifyItems).split(" · ").map((x) => (
                    <View key={x} style={[s.row, { gap: 12, alignItems: "flex-start" }]}><View style={s.reasonDot} /><Text style={[s.body, { flexShrink: 1 }]}>{x}</Text></View>
                  ))}
                </View>
              )}
              <View style={{ marginTop: 26, gap: 6 }}>
                {view.stage === "ask" ? (
                  <>
                    <Btn {...ctx} primary label={t(ui.allowNotifications)} onPress={o.enableNotifications} disabled={o.busy} busy={o.busy} />
                    <LinkBtn {...ctx} center label={t(ui.notNow)} onPress={o.disableNotifications} disabled={o.busy} />
                  </>
                ) : <Btn {...ctx} primary label={t(ui.goHome)} onPress={() => o.go("home")} />}
                {o.failed && <Text style={[s.error, s.center]} accessibilityRole="alert">{t(ui.failed)}</Text>}
              </View>
            </>
          )}
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
            <>
              <Text style={[s.h2, { marginTop: 8 }]}>{t(ui.signInWith)}</Text>
              <View style={s.rows}>
                <Row {...ctx} first icon="phone" title={`+91 ${o.account.phone ?? ""}`} note={`${t(ui.mobile)} · ${t(ui.verified)}`} />
                <Row {...ctx} icon="mail" title={o.account.email ?? ""} note={`${t(ui.gmail)} · ${t(ui.verified)}`} />
              </View>
              <Text style={s.h2}>{t(ui.settings)}</Text>
              <View style={s.rows}>
                {!!o.notifications && (
                  <Row {...ctx} first icon="bell" title={t(ui.notifications)}
                    note={t(o.notifications === "blocked" ? ui.notifBlockedNote : o.notifications === "on" ? ui.notifOnNote : ui.notifOffNote)}
                    end={o.notifications === "blocked"
                      ? (o.openNotificationSettings ? <Btn {...ctx} small label={t(ui.openSettings)} onPress={o.openNotificationSettings} /> : <View />)
                      : <Switch
                          value={o.notifications === "on"}
                          onValueChange={(on) => (on ? o.enableNotifications() : o.disableNotifications())}
                          disabled={o.busy}
                          trackColor={{ false: c.line, true: c.gold }}
                          thumbColor={o.notifications === "on" ? c.onGold : c.muted}
                          accessibilityLabel={t(ui.notifications)}
                        />} />
                )}
                <Row {...ctx} first={!o.notifications} icon="globe" title={t(ui.language)} note={o.languages.find((x) => x.code === o.language)?.name} onPress={() => o.go("language")} />
              </View>
              {o.failed && <Text style={[s.error, { marginTop: 10 }]} accessibilityRole="alert">{t(ui.failed)}</Text>}
              <View style={[s.rows, { marginTop: 24 }]}><Row {...ctx} first icon="out" title={t(ui.signOut)} onPress={o.signIn.signOut} end={<View />} /></View>
              <View style={{ alignItems: "center", marginTop: 18 }}><LinkBtn {...ctx} muted label={t(ui.deleteAccount)} onPress={() => o.go("deletion")} /></View>
            </>
          )}
          {view.kind === "help" && (
            <>
              <View style={[s.rows, { marginTop: 24 }]}>
                {!!o.support.whatsapp && <Row {...ctx} first icon="chat" title={t(ui.whatsappUs)} note={t(ui.whatsappNote)} onPress={() => Linking.openURL(`https://wa.me/${o.support.whatsapp}`)} />}
                {!!o.support.phone && <Row {...ctx} first={!o.support.whatsapp} icon="phone" title={t(ui.callUs)} note={`+${o.support.phone}`} onPress={() => Linking.openURL(`tel:+${o.support.phone}`)} />}
                {!!o.support.email && <Row {...ctx} first={!o.support.whatsapp && !o.support.phone} icon="mail" title={t(ui.emailUs)} note={o.support.email} onPress={() => Linking.openURL(`mailto:${o.support.email}`)} />}
              </View>
              {!!o.openPrivacy && (
                <>
                  <Text style={s.h2}>{t(ui.more)}</Text>
                  <View style={s.rows}><Row {...ctx} first icon="shield" title={t(ui.privacy)} onPress={o.openPrivacy} /></View>
                </>
              )}
            </>
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
            {o.canSkip && !o.tab && <Btn {...ctx} label={t(ui.skip)} onPress={o.skip} disabled={o.busy} />}
            {o.tab
              ? <Btn {...ctx} primary grow busy={o.busy} label={t(o.busy ? ui.saving : o.justSaved ? ui.saved : ui.saveChanges)} onPress={o.save} disabled={o.busy || o.justSaved} />
              : <Btn {...ctx} primary grow busy={o.busy} label={t(o.busy ? ui.saving : ui.saveContinue)} onPress={o.save} disabled={o.busy} />}
          </View>
        </View>
      )}

      {o.signedIn && !!o.tab && (
        <View style={s.tabs} accessibilityRole="tablist">
          {(["home", "availability", "profile"] as const).map((k) => {
            const on = o.tab === k;
            return (
              <Pressable key={k} style={s.tab} onPress={() => o.go(k)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                <Image source={ICONS[k === "home" ? "home" : k === "availability" ? "calendar" : "user"]} style={{ width: 24, height: 24, tintColor: on ? c.tabOn : c.muted }} />
                <Text style={[s.tabText, on && { color: c.tabOn, fontWeight: "600" }]}>{t(k === "home" ? ui.home : k === "availability" ? ui.tabAvailability : ui.tabProfile)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </KeyboardAvoidingView>
      {flying}
    </View>
    </SlotContext.Provider>
  );
}

// ---------------------------------------------------------------- small pieces

function Btn({ s, c, label, onPress, primary, grow, small, disabled, style, dot, danger, busy, onDark, a11y }: Ctx & {
  label: string; onPress: () => void; primary?: boolean; grow?: boolean; small?: boolean; disabled?: boolean; style?: any; dot?: boolean; danger?: boolean; busy?: boolean;
  /** An outlined button on the maroon banner. */
  onDark?: boolean;
  /** A fuller name for screen readers, e.g. "Edit Address". */
  a11y?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, primary && s.btnPrimary, grow && { flex: 1 }, small && s.btnSmall, danger && { borderColor: c.error }, onDark && { borderColor: "rgba(248,230,196,0.45)" }, disabled && { opacity: 0.6 }, pressed && { opacity: 0.85 }, style]}
    >
      {dot && <View style={s.recDot} />}
      {busy && <Turning size={24} plain color={primary ? c.onGold : c.ink} />}
      <Text style={[s.btnText, primary && s.btnPrimaryText, small && { fontSize: 16 }, danger && { color: c.error }, onDark && { color: "#F8E6C4" }]}>{label}</Text>
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

function LinkBtn({ s, c, label, onPress, disabled, center, muted }: Ctx & { label: string; onPress: () => void; disabled?: boolean; center?: boolean; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={[s.link, center && { alignSelf: "center" }]}>
      <Text style={[s.linkText, muted && { color: c.muted, fontWeight: "400" }, disabled && s.linkDisabled]}>{label}</Text>
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

function Avatar({ o, s, size }: Ctx & { size: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {o.values.photo
        ? <Image source={{ uri: o.values.photo }} style={{ width: "100%", height: "100%" }} />
        : <Text style={[s.avatarText, { fontSize: size * 0.42 }]}>{(o.values.fullName || o.account.email || "?").trim().charAt(0).toUpperCase()}</Text>}
    </View>
  );
}

/** The bell in the top bar: a gold count of unread updates, and one swing when a new one arrives. */
function Bell({ o, s, c }: Ctx) {
  const n = o.unreadCount;
  const swing = useRef(new Animated.Value(0)).current;
  const last = useRef(n);
  useEffect(() => {
    const more = n > last.current;
    last.current = n;
    if (!more) return;
    swing.setValue(0);
    Animated.timing(swing, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  }, [n]);
  const rotate = swing.interpolate({ inputRange: [0, 0.2, 0.45, 0.7, 1], outputRange: ["0deg", "16deg", "-13deg", "7deg", "0deg"] });
  return (
    <Pressable style={s.bell} onPress={() => o.go("updates")} accessibilityRole="button" accessibilityLabel={n ? o.t(o.ui.updatesUnread, { n }) : o.t(o.ui.updates)}>
      <Animated.Image source={BELL} style={{ width: 28, height: 28, tintColor: c.ink, transform: [{ translateY: -11 }, { rotate }, { translateY: 11 }] }} />
      {n > 0 && <View style={s.bellCount}><Text style={s.bellCountText}>{n > 9 ? "9+" : n}</Text></View>}
    </Pressable>
  );
}

/** The status as a badge. With `open`, tapping it goes to the Updates page. */
function StatusBadge({ o, s, c, onDark, open }: Ctx & { onDark?: boolean; open?: boolean }) {
  const tone = STATUS_TONE[o.status];
  const color = tone === "good" ? (onDark ? "#7FD1A0" : c.done) : tone === "attention" ? (onDark ? "#FFA094" : c.error) : tone === "waiting" ? c.gold : onDark ? "rgba(248,230,196,0.45)" : c.line;
  const label = o.t(STATUS_LABEL[o.status]);
  const text = [s.pillText, onDark && { color: "#F8E6C4" }, (tone === "good" || tone === "attention") && { color }];
  const box = [s.pill, { borderColor: color }, onDark && { backgroundColor: "transparent" }];
  if (!open) return <View style={box}><Text style={text}>{label}</Text></View>;
  return (
    <Pressable style={[box, s.pillOpen]} hitSlop={8} onPress={() => o.go("updates")} accessibilityRole="button" accessibilityLabel={o.t(o.ui.badgeHint, { status: label })}>
      <Text style={text}>{label}</Text><Text style={[text, { fontSize: 18, lineHeight: 20 }]}>›</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------- updates: the review timeline, then every update

function Updates(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui } = o;
  const last = o.timeline.length - 1;
  return (
    <>
      <Text style={[s.h2, { marginTop: 8 }]}>{t(ui.whereProfile)}</Text>
      <View style={{ marginTop: 14 }}>
        {o.timeline.map((st, i) => {
          const attention = st.tone === "attention";
          return (
            <View key={st.id} style={[s.row, { gap: 14 }]} accessibilityState={{ selected: st.tone === "now" || attention }}>
              <View style={{ alignItems: "center", width: 30 }}>
                <View style={[s.node, st.tone === "done" && { borderColor: c.gold, backgroundColor: c.gold }, st.tone === "now" && { borderColor: c.gold }, attention && { borderColor: c.error }]}>
                  {st.tone === "done" && <Text style={[s.nodeText, { color: c.onGold }]}>✓</Text>}
                  {attention && <Text style={[s.nodeText, { color: c.error }]}>!</Text>}
                  {st.tone === "now" && <BreathingDot color={c.gold} />}
                </View>
                {i < last && <View style={[s.nodeLine, st.tone === "done" && { backgroundColor: c.gold }]} />}
              </View>
              <View style={{ flex: 1, gap: 6, paddingTop: 3, paddingBottom: i < last ? 22 : 0, alignItems: "flex-start" }}>
                <View style={[s.row, { flexWrap: "wrap", alignItems: "baseline", columnGap: 12 }]}>
                  <Text style={[s.stepTitle, st.tone === "todo" && { color: c.muted, fontWeight: "400" }, attention && { color: c.error }]}>{st.title}</Text>
                  {!!st.when && <Text style={s.small}>{st.when}</Text>}
                </View>
                {!!st.note && <Text style={[s.small, { fontSize: 15.5 }]}>{st.note}</Text>}
                {!!st.message && <View style={s.stepMsg}><Text style={s.body}>{st.message}</Text></View>}
                {!!st.action && <Btn {...ctx} small primary={st.action.primary} label={st.action.label} onPress={st.action.run} disabled={o.busy} />}
              </View>
            </View>
          );
        })}
      </View>
      {o.failed && <Text style={[s.error, { marginTop: 10 }]} accessibilityRole="alert">{t(ui.failed)}</Text>}

      <Text style={s.h2}>{t(ui.allUpdates)}</Text>
      {o.updates.length === 0 ? <Text style={[s.body, { color: c.muted, marginTop: 10 }]}>{t(ui.noUpdates)}</Text> : (
        <View style={{ marginTop: 10 }}>
          {o.updates.map((u, i) => {
            const fresh = o.freshUpdates.includes(u.id);
            const attention = u.kind === "changes_requested" || u.kind === "rejected" || u.kind === "suspended" || u.kind === "recitation_failed";
            const when = o.whenOf(u);
            return (
              <View key={u.id} style={[s.row, s.news, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                <View style={[s.newDot, fresh && { backgroundColor: attention ? c.error : c.gold }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.body, fresh && { fontWeight: "600" }]}>{t(UPDATE_TEXT[u.kind])}</Text>
                  {!!u.reason && <Text style={[s.small, { fontSize: 15.5 }]}>{u.reason}</Text>}
                  {(!!when || fresh) && (
                    <Text style={s.small}>{when}{fresh && <Text style={{ color: c.gold, fontWeight: "600" }}>{when ? " · " : ""}{t(ui.newLabel)}</Text>}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

/** The dot inside the current step, breathing gently unless the phone asks for reduced motion. */
function BreathingDot({ color }: { color: string }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduce) => {
      if (cancelled || reduce) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => { cancelled = true; loop?.stop(); };
  }, []);
  return <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: v }} />;
}

/** An icon in a soft gold circle. */
function IconDot({ s, c, name, size = 40 }: Ctx & { name: IconName; size?: number }) {
  return <View style={[s.settingIcon, { width: size, height: size, borderRadius: size / 2 }]}><Image source={ICONS[name]} style={{ width: size * 0.55, height: size * 0.55, tintColor: c.ink }} /></View>;
}

/** One line of a settings-style list: an icon, a title, a note, and either a control or an arrow. */
function Row(ctx: Ctx & { icon: IconName; title: string; note?: string; end?: React.ReactNode; onPress?: () => void; first?: boolean }) {
  const { s, c, icon, title, note, end, onPress, first } = ctx;
  const inner = (
    <>
      <IconDot {...ctx} name={icon} />
      <View style={{ flex: 1 }}>
        <Text style={[s.body, { fontWeight: "600" }]}>{title}</Text>
        {!!note && <Text style={s.small}>{note}</Text>}
      </View>
      {end ?? (onPress ? <Text style={{ color: c.muted, fontSize: 24, lineHeight: 26 }}>›</Text> : null)}
    </>
  );
  const style = [s.rowLine, !first && { borderTopWidth: 1, borderTopColor: c.line }];
  return onPress
    ? <Pressable style={({ pressed }) => [...style, pressed && { backgroundColor: c.goldSoft }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={note ? `${title}. ${note}` : title}>{inner}</Pressable>
    : <View style={style}>{inner}</View>;
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
  const done = (id: string) => { const sec = o.allSections.find((x) => x.id === id); return !!sec && o.statusOf(sec) === "done"; };
  const actions: [IconName, string, string, boolean, () => void][] = [
    ["user", t(ui.yourProfile), t(o.requiredDone ? ui.actProfileSee : ui.actProfileAdd), o.requiredDone, () => (o.requiredDone || !o.editable ? o.go("profile") : o.continueProfile())],
    ["calendar", t(ui.tabAvailability), t(ui.actAvailability), done("availability"), () => o.go("availability")],
    ["shield", t(ui.getVerified), t(ui.actVerify), o.recitation.state === "passed", () => o.go("recitation")],
    ["pin", t(o.allSections.find((x) => x.id === "serviceArea")!.title), t(ui.actArea), done("serviceArea"), () => o.openSection("serviceArea")],
  ];
  const benefits: [IconName, string, string][] = [
    ["pin", t(ui.benefit1), t(ui.benefit1Body)], ["shield", t(ui.benefit2), t(ui.benefit2Body)],
    ["calendar", t(ui.benefit3), t(ui.benefit3Body)], ["home", t(ui.benefit4), t(ui.benefit4Body)],
  ];
  const how = [[t(ui.how1), t(ui.how1Body)], [t(ui.how2), t(ui.how2Body)], [t(ui.how3), t(ui.how3Body)]];

  return (
    <>
      <Text style={[s.body, { color: c.muted }]}>
        {o.firstName ? t(ui.namaste, { name: o.firstName }) : t(ui.namasteNoName)}
        {o.status === "approved" && <Text style={{ color: c.done }} accessibilityLabel={t(ui.verified)}> ✔</Text>}
      </Text>
      <Text style={[s.title, { fontSize: 25, lineHeight: 31 }]} accessibilityRole="header">{t(ui.headline)}</Text>

      <View style={[s.banner, { marginTop: 14 }, o.status === "approved" && s.bannerVerified]}>
        <View style={[s.row, { justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }]}>
          <Text style={s.bannerTitle}>{t(o.editable ? ui.nextStep : ui.yourProfile)}</Text>
          <StatusBadge {...ctx} onDark open />
        </View>
        <RiderBar value={o.profileProgress} label={t(ui.bannerTitle)} />
        <Text style={s.bannerBody}>{t(o.status === "approved" ? ui.bannerVerified : !o.editable ? ui.bannerLocked : o.requiredDone ? ui.bannerReady : ui.bannerNeeds)}</Text>
        {/* One main button, chosen by where the profile stands. */}
        {o.editable && !o.requiredDone && <Btn {...ctx} primary label={t(ui.continueProfile)} onPress={o.continueProfile} />}
        {o.editable && o.requiredDone && <Btn {...ctx} primary busy={o.busy} label={t(o.busy ? ui.submitting : ui.submitForReview)} onPress={o.submitForReview} disabled={o.busy} />}
        {o.status === "approved" && <Btn {...ctx} onDark label={t(ui.updateAvailability)} onPress={() => o.go("availability")} />}
        {o.failed && <Text style={[s.error, { color: "#FFA094" }]} accessibilityRole="alert">{t(ui.failed)}</Text>}
      </View>

      {!!o.reviewerMessage && (
        <View style={[s.card, { marginTop: 16, borderColor: c.error }]}>
          <Text style={[s.body, { fontWeight: "600" }]}>{t(ui.reviewerMessage)}</Text>
          <Text style={s.body}>{o.reviewerMessage}</Text>
          <View style={[s.row, { flexWrap: "wrap", alignItems: "center", columnGap: 18, rowGap: 6, marginTop: 12 }]}>
            {o.status === "changes_requested" && <Btn {...ctx} small primary label={t(ui.updateProfile)} onPress={() => o.go("profile")} />}
            <LinkBtn {...ctx} label={t(ui.seeUpdates)} onPress={() => o.go("updates")} />
          </View>
        </View>
      )}

      <Text style={s.h2}>{t(ui.whatYouCanDo)}</Text>
      <View style={s.actionGrid}>
        {actions.map(([icon, title, note, ok, run]) => (
          <Pressable key={title} style={({ pressed }) => [s.card, s.action, pressed && { borderColor: c.gold }]} onPress={run} accessibilityRole="button" accessibilityLabel={`${title}. ${note}${ok ? `. ${t(ui.done)}` : ""}`}>
            <IconDot {...ctx} name={icon} />
            <Text style={[s.body, { fontWeight: "600", marginTop: 8 }]}>{title}{ok && <Text style={{ color: c.done }}> ✔</Text>}</Text>
            <Text style={s.small}>{note}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.h2}>{t(ui.whatYouGet)}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.benefitStrip} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
        {benefits.map(([icon, title, text]) => (
          <View key={title} style={s.benefit}>
            <Image source={ICONS[icon]} style={{ width: 26, height: 26, tintColor: "#F0B040" }} />
            <Text style={[s.bannerTitle, { fontSize: 20 }]}>{title}</Text>
            <Text style={s.bannerBody}>{text}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={s.h2}>{t(ui.howItWorks)}</Text>
      <View style={{ gap: 12, marginTop: 12 }}>
        {how.map(([title, text], i) => (
          <View key={title} style={[s.row, { gap: 14 }]}>
            <View style={s.howNumber}><Text style={[s.body, { fontFamily: DISPLAY_FONT }]}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}><Text style={[s.body, { fontWeight: "600" }]}>{title}</Text><Text style={[s.small, { fontSize: 15.5 }]}>{text}</Text></View>
          </View>
        ))}
      </View>
    </>
  );
}

function Profile(ctx: Ctx) {
  const { o, s, c } = ctx;
  const { t, ui } = o;
  const r = o.recitation;
  const personal = o.allSections.find((x) => x.id === "personal")!;
  const years = o.values.experienceYears;
  const yearsLabel = t(o.allSections.flatMap((x) => x.steps).flatMap((st) => st.fields).find((f) => f.id === "experienceYears")!.label);
  const recNote = r.state === "passed" ? t(ui.passedShort) : r.state === "checking" ? t(ui.beingCheckedShort) : r.reviewRequested ? t(ui.reviewAsked) : t(ui.attemptsLeft, { n: r.attemptsLeft });
  const sub = [o.values.city, years && `${yearsLabel}: ${years}`].filter(Boolean).join(" · ");
  return (
    <>
      <View style={s.idCard}>
        <View>
          <Avatar {...ctx} size={84} />
          {o.canEdit(personal) && (
            <Pressable style={s.idCamera} onPress={() => o.openSection("personal")} accessibilityRole="button" accessibilityLabel={t(ui.changePhoto)}>
              <Image source={ICONS.camera} style={{ width: 18, height: 18, tintColor: "#2A0F0A" }} />
            </Pressable>
          )}
        </View>
        <Text style={[s.title, s.center, { color: "#F8E6C4", marginTop: 8 }]} accessibilityRole="header">
          {o.values.fullName || t(ui.myProfile)}
          {o.status === "approved" && <Text style={{ color: "#7FD1A0" }} accessibilityLabel={t(ui.verified)}> ✔</Text>}
        </Text>
        {!!sub && <Text style={[s.bannerBody, s.center]}>{sub}</Text>}
        <View style={{ marginTop: 8 }}><StatusBadge {...ctx} onDark open /></View>
        {o.status !== "approved" && <View style={{ alignSelf: "stretch", marginTop: 8 }}><RiderBar value={o.profileProgress} label={t(ui.bannerTitle)} /></View>}
      </View>

      <View style={[s.cards, { marginTop: 14 }]}>
        {o.allSections.map((sec) => {
          const st = o.statusOf(sec);
          return (
            <View key={sec.id} style={s.card}>
              <View style={[s.row, { alignItems: "center", justifyContent: "space-between", marginBottom: 8 }]}>
                <Text style={[s.cardTitle, { flex: 1, marginBottom: 0 }]}>{t(sec.title)}</Text>
                {o.canEdit(sec) && <Btn {...ctx} small label={t(st === "empty" ? ui.add : ui.editSection)} a11y={`${t(st === "empty" ? ui.add : ui.editSection)} ${t(sec.title)}`} onPress={() => (sec.id === "availability" ? o.go("availability") : o.openSection(sec.id))} />}
              </View>
              {st === "empty" ? <Text style={s.hint}>{t(sec.summary)}</Text> : sec.steps.flatMap((x) => visibleFields(x, o.values)).filter((f) => f.type !== "search" && f.id !== "accountNumberAgain" && f.id !== "photo").map((f) => (
                <Item key={f.id} {...ctx} label={t(f.label)} text={(f.id === "serviceCentre" ? o.centre?.label : display(f, o.values, o.lang)) || t(ui.notAdded)} />
              ))}
            </View>
          );
        })}
        <View style={s.card}>
          <View style={[s.row, { alignItems: "center", justifyContent: "space-between", marginBottom: 8 }]}>
            <Text style={[s.cardTitle, { flex: 1, marginBottom: 0 }]}>{t(ui.getVerified)}{r.state === "passed" && <Text style={{ color: c.done }}> ✔</Text>}</Text>
            {r.state !== "passed" && <Btn {...ctx} small label={t(r.state === "none" ? ui.record : ui.open)} onPress={() => o.go("recitation")} />}
          </View>
          <Text style={s.hint}>{r.state === "none" ? t(ui.getVerifiedSummary) : recNote}</Text>
        </View>
      </View>

      <Text style={s.h2}>{t(ui.accountSettings)}</Text>
      <View style={s.rows}>
        <Row {...ctx} first icon="user" title={t(ui.myAccount)} note={t(ui.accountNote)} onPress={() => o.go("account")} />
        <Row {...ctx} icon="globe" title={t(ui.language)} note={o.languages.find((x) => x.code === o.language)?.name} onPress={() => o.go("language")} />
        <Row {...ctx} icon="chat" title={t(ui.help)} onPress={() => o.go("help")} />
        <Row {...ctx} icon="out" title={t(ui.signOut)} onPress={o.signIn.signOut} end={<View />} />
      </View>
    </>
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

  const camOff = (mode === "off" || mode === "denied") && !r.uploading;
  return (
    <View style={s.fields}>
      <View style={[s.row, { gap: 8 }]}>
        {[ui.recStep1, ui.recStep2, ui.recStep3].map((x, i) => (
          <View key={i} style={s.recStep}>
            <View style={s.recStepNumber}><Text style={[s.small, { color: c.ink, fontWeight: "600" }]}>{i + 1}</Text></View>
            <Text style={[s.small, s.center, { color: c.ink }]}>{t(x)}</Text>
          </View>
        ))}
      </View>
      {!!lastFailed && <View style={[s.card, { borderColor: c.error }]}><Text style={s.body}>{t(ui.attemptFailed, { n: lastFailed.n })}</Text></View>}
      <View style={s.field}>
        <Text style={s.label}>{t(ui.whichShloka)}</Text>
        <Select {...ctx} label={t(ui.whichShloka)} value={r.shlokaId} options={r.shlokas} placeholder={t(ui.chooseShloka)} onChange={r.setShlokaId} disabled={r.uploading || mode === "recording"} />
      </View>

      {/* While the camera is off it is one line, so the Record button stays in view. */}
      {camOff && (
        <View style={[s.card, s.row, { alignItems: "center", gap: 14, borderStyle: "dashed", backgroundColor: "transparent" }]}>
          <IconDot {...ctx} name="camera" />
          <View style={{ flex: 1 }}>
            <Text style={[s.body, { fontWeight: "600" }]}>{t(mode === "denied" ? ui.cameraDenied : ui.cameraOff)}</Text>
            {mode === "off" && <Text style={s.small}>{t(ui.cameraOffNote)}</Text>}
          </View>
        </View>
      )}
      <BreathingRing on={mode === "recording"} radius={18}>
      <View style={[s.camera, camOff && { display: "none" }]}>
        {mode === "off" || mode === "denied" ? null : (
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
      <View style={{ gap: 6 }}>
        <View style={[s.row, { gap: 6 }]}>
          <View style={{ width: 46 }} />
          {SLOTS.map((sl) => {
            const all = DAYS.every((d) => (week[d.value] ?? []).includes(sl.value));
            const [name, hours] = t(sl.label).split(", ");
            return (
              // Tap a time of day to switch it on or off for the whole week.
              <Pressable key={sl.value} style={[s.colHead, all && { borderColor: c.gold }]} accessibilityRole="button" accessibilityState={{ selected: all }} accessibilityLabel={t(ui.everyDayHint, { slot: name })}
                onPress={() => set(Object.fromEntries(DAYS.map((d) => { const list: string[] = week[d.value] ?? []; return [d.value, all ? list.filter((x) => x !== sl.value) : list.includes(sl.value) ? list : [...list, sl.value]]; })))}>
                <Text style={[s.small, { color: c.ink, fontWeight: "700" }]} numberOfLines={1}>{name}</Text>
                {!!hours && <Text style={[s.small, { fontSize: 12.5 }]} numberOfLines={1}>{hours}</Text>}
                <Text style={[s.small, { fontSize: 12.5, fontWeight: "600", marginTop: 3 }, all ? { color: c.tabOn } : { textDecorationLine: "underline" }]} numberOfLines={1}>{t(ui.everyDay)}{all ? " ✓" : ""}</Text>
              </Pressable>
            );
          })}
        </View>
        {DAYS.map((d) => (
          <View key={d.value} style={[s.row, { alignItems: "center", gap: 6 }]}>
            <Text style={[s.label, { width: 46 }]}>{t(d.label)}</Text>
            {SLOTS.map((sl) => {
              const list: string[] = week[d.value] ?? [];
              const on = list.includes(sl.value);
              return (
                <Pressable key={sl.value} style={[s.cell, on && { borderColor: c.gold, backgroundColor: c.gold }]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${t(d.label)}, ${t(sl.label)}`}
                  onPress={() => set({ ...week, [d.value]: on ? list.filter((x) => x !== sl.value) : [...list, sl.value] })}>
                  {on && <Text style={{ color: c.onGold, fontSize: 18, fontWeight: "700" }}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
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
  // One address with a Change link; the search box appears only when asked for, or when there is no address yet.
  const [changing, setChanging] = useState(false);
  const searching = !!o.search && (changing || !place);
  return (
    <>
      {searching ? (
        <View style={s.field}>
          <Search {...ctx} placeholder={t(ui.differentCentre)} label={t(ui.differentCentre)} onPick={(p) => { o.setCentre(p); setChanging(false); }} />
          {!!place && <LinkBtn {...ctx} label={t(ui.cancel)} onPress={() => setChanging(false)} />}
        </View>
      ) : place ? (
        <View style={[s.card, s.row, { alignItems: "center", gap: 14 }]}>
          <IconDot {...ctx} name="pin" />
          <Text style={[s.body, { flex: 1, fontWeight: "600" }]}>{place.label}</Text>
          {!!o.search && <LinkBtn {...ctx} label={t(ui.changeCentre)} onPress={() => setChanging(true)} />}
        </View>
      ) : <View style={s.card}><Text style={s.body}>{t(ui.noCentre)}</Text></View>}
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
    top: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 68, paddingHorizontal: 16, paddingVertical: 12 },
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

    // home, menus, calendar, documents
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
    // notifications: the bell, the Updates page, the permission screen
    bell: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    bellCount: { position: "absolute", top: 3, right: 1, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, borderWidth: 2, borderColor: c.bg, backgroundColor: c.gold, alignItems: "center", justifyContent: "center" },
    bellCountText: { color: c.onGold, fontSize: 11.5, fontWeight: "700", lineHeight: 14 },
    pillOpen: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
    node: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: c.line, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
    nodeText: { fontSize: 15, fontWeight: "700", lineHeight: 18 },
    nodeLine: { flex: 1, width: 2, backgroundColor: c.line },
    stepTitle: { color: c.ink, fontSize: 17.5, fontWeight: "600", lineHeight: 24 },
    stepMsg: { alignSelf: "stretch", paddingVertical: 10, paddingHorizontal: 14, borderLeftWidth: 3, borderLeftColor: c.error, borderTopRightRadius: 10, borderBottomRightRadius: 10, backgroundColor: c.surface },
    news: { gap: 12, paddingVertical: 13 },
    newDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8 },
    bigBell: { width: 108, height: 108, borderRadius: 54, borderWidth: 1.5, borderColor: c.gold, alignItems: "center", justifyContent: "center", shadowColor: "#F0B040", shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } },
    bigBellLogo: { position: "absolute", right: -8, top: -8 },
    reasons: { alignSelf: "center", gap: 6, marginTop: 14 },
    reasonDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8, backgroundColor: c.gold },
    settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.goldSoft, alignItems: "center", justifyContent: "center" },
    // the opening: one logo that travels
    fly: { position: "absolute", left: 0, top: 0, width: FLY, height: FLY },
    openName: { position: "absolute", left: 0, right: 0, top: "40%", marginTop: 118, textAlign: "center", color: c.gold, fontFamily: DISPLAY_FONT, fontSize: 32 },
    // intro slides: the rings and the logo stay put while the words change
    slideTitle: { minHeight: 68 },
    slideText: { minHeight: 76 },
    // layout: top bar, tabs, rows
    topApp: { minHeight: 64, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line },
    tabs: { flexDirection: "row", borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg },
    tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 62, paddingTop: 9, paddingBottom: 8 },
    tabText: { color: c.muted, fontSize: 13.5 },
    rows: { marginTop: 10, borderWidth: 1.5, borderColor: c.line, borderRadius: 16, backgroundColor: c.surface, overflow: "hidden" },
    rowLine: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 64, paddingHorizontal: 16, paddingVertical: 10 },
    // Home
    actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
    action: { flexBasis: "47%", flexGrow: 1, alignItems: "flex-start", gap: 4, padding: 14 },
    benefitStrip: { marginTop: 10, marginHorizontal: -16 },
    benefit: { width: 270, gap: 6, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 18, backgroundColor: "#2C120C" },
    howNumber: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: c.gold, alignItems: "center", justifyContent: "center" },
    // Profile
    idCard: { alignItems: "center", gap: 6, paddingTop: 24, paddingBottom: 20, paddingHorizontal: 18, borderRadius: 20, backgroundColor: "#2C120C" },
    idCamera: { position: "absolute", right: -6, bottom: -4, width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#2C120C", backgroundColor: "#F0B040", alignItems: "center", justifyContent: "center" },
    // get verified, availability
    recStep: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14, backgroundColor: c.surface },
    recStepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.goldSoft, alignItems: "center", justifyContent: "center" },
    colHead: { flex: 1, alignItems: "center", paddingVertical: 8, paddingHorizontal: 2, borderWidth: 1.5, borderColor: c.line, borderRadius: 12 },
    cell: { flex: 1, height: 46, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.line, borderRadius: 12, backgroundColor: c.field },
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
