// ProPoojaPaath — animated screen hero for the Expo app.
// One component for every screen: the words come from props, with ready-made
// sets in pageHeroes.ts. The mandala rings settle in, the lotus opens petal by
// petal inside them, and the headline rises line by line.
//
// Needs LotusMark.tsx next to this file and the PNGs from assets/ in
// assets/logo-reveal/. Uses only React Native's built-in Animated API.

import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import LotusMark from "./LotusMark";

export type PageHeroProps = {
  /** stack: full screen, lotus on top, words centred underneath.
   *  banner: short strip (lotus left, words right) for the top of a screen. */
  layout?: "stack" | "banner";
  /** Defaults to the phone's light/dark setting. */
  theme?: "light" | "dark";
  /** Headline, one entry per line. */
  title: string[];
  lede?: string;
  /** Leave out to show no button. */
  ctaLabel?: string;
  onPressCta?: () => void;
  /** Small line under the button. */
  note?: string;
};

const RING_OUTER = require("../assets/logo-reveal/mandala-outer.png");
const RING_INNER = require("../assets/logo-reveal/mandala-inner.png");
const GLOW = require("../assets/logo-reveal/glow.png");

const THEMES = {
  light: { bg: "#FFF4E0", ink: "#4A1D0A", muted: "#7B563A", ring: "#C47A14", ringOpacity: 0.42, ambient: 0 },
  dark: { bg: "#24100B", ink: "#F8E6C4", muted: "#CDAB88", ring: "#E0A030", ringOpacity: 0.5, ambient: 0.4 },
};

// Swap these for your brand fonts once loaded with expo-font
// (the website uses Marcellus for the headline and Mukta for body text).
const DISPLAY_FONT = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });
const BODY_FONT: string | undefined = undefined; // system font

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

const tween = (v: Animated.Value, delay: number, duration: number, easing = EASE) =>
  Animated.timing(v, { toValue: 1, delay, duration, easing, useNativeDriver: true });

const range = (v: Animated.Value, from: number, to: number) =>
  v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

export default function PageHero({
  layout = "stack",
  theme,
  title,
  lede,
  ctaLabel,
  onPressCta,
  note,
}: PageHeroProps) {
  const scheme = useColorScheme();
  const mode = theme ?? (scheme === "dark" ? "dark" : "light");
  const t = THEMES[mode];
  const { width } = useWindowDimensions();
  const banner = layout === "banner";

  const art = banner ? 104 : Math.min(width * 0.8, 360); // mandala diameter
  const lotus = art * (banner ? 0.52 : 0.46);
  const titleSize = banner ? 24 : 34;
  const titleLine = banner ? 30 : 40;

  const v = useRef({
    outer: new Animated.Value(0),
    inner: new Animated.Value(0),
    turn: new Animated.Value(0),
    lines: title.map(() => new Animated.Value(0)),
    lede: new Animated.Value(0),
    actions: new Animated.Value(0),
  }).current;

  useEffect(() => {
    let cancelled = false;
    const running: Animated.CompositeAnimation[] = [];
    const run = (a: Animated.CompositeAnimation) => {
      running.push(a);
      a.start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;

        if (reduce) {
          const all = [v.outer, v.inner, ...v.lines, v.lede, v.actions];
          run(Animated.parallel(all.map((x) => tween(x, 0, 400, Easing.linear))));
          return;
        }

        run(
          Animated.parallel([
            tween(v.outer, 0, 1800),
            tween(v.inner, 250, 1800),
            ...v.lines.map((l, i) => tween(l, 550 + i * 160, 1000)),
            tween(v.lede, 1100, 900),
            tween(v.actions, 1350, 900),
          ])
        );
        // The rings keep turning slowly until the screen unmounts
        run(
          Animated.loop(
            Animated.timing(v.turn, { toValue: 1, duration: 120000, easing: Easing.linear, useNativeDriver: true })
          )
        );
      });

    return () => {
      cancelled = true;
      running.forEach((a) => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ring = (inVal: Animated.Value, direction: 1 | -1) => ({
    tintColor: t.ring,
    opacity: range(inVal, 0, t.ringOpacity),
    transform: [
      { scale: range(inVal, 0.82, 1) },
      { rotate: v.turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${direction * 360}deg`] }) },
    ],
  });
  const fadeUp = (val: Animated.Value) => ({ opacity: val, transform: [{ translateY: range(val, 12, 0) }] });
  const align = banner ? "left" : "center";

  return (
    <View style={[banner ? styles.banner : styles.stack, { backgroundColor: t.bg }]}>
      <View style={[styles.art, { width: art, height: art }, !banner && styles.artStack]}>
        {t.ambient > 0 && (
          <Animated.Image source={GLOW} style={[styles.ambient, { opacity: range(v.outer, 0, t.ambient) }]} />
        )}
        <Animated.Image source={RING_OUTER} style={[styles.ring, ring(v.outer, 1)]} />
        <Animated.Image source={RING_INNER} style={[styles.ring, styles.ringInner, ring(v.inner, -1)]} />
        <LotusMark size={lotus} theme={mode} />
      </View>

      <View style={banner ? styles.copyBanner : styles.copyStack}>
        <View accessible accessibilityRole="header" accessibilityLabel={title.join(" ")}>
          {title.map((line, i) => (
            <View key={i} style={{ height: titleLine, overflow: "hidden" }}>
              <Animated.Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: titleSize,
                  lineHeight: titleLine,
                  textAlign: align,
                  color: t.ink,
                  transform: [{ translateY: range(v.lines[i], titleLine * 1.1, 0) }],
                }}
              >
                {line}
              </Animated.Text>
            </View>
          ))}
        </View>

        {!!lede && (
          <Animated.Text
            style={[
              styles.lede,
              banner && styles.ledeBanner,
              { color: t.muted, textAlign: align },
              fadeUp(v.lede),
            ]}
          >
            {lede}
          </Animated.Text>
        )}

        {(!!ctaLabel || !!note) && (
          <Animated.View style={[banner ? styles.actionsBanner : styles.actionsStack, fadeUp(v.actions)]}>
            {!!ctaLabel && (
              <Pressable
                onPress={onPressCta}
                accessibilityRole="button"
                style={({ pressed }) => [styles.cta, banner && styles.ctaBanner, pressed && styles.ctaPressed]}
              >
                <Text style={styles.ctaLabel}>{ctaLabel}</Text>
              </Pressable>
            )}
            {!!note && <Text style={[styles.note, { color: t.muted }]}>{note}</Text>}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    overflow: "hidden",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
  },
  art: {
    alignItems: "center",
    justifyContent: "center",
  },
  artStack: {
    marginBottom: 10,
  },
  ring: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  ringInner: {
    top: "13%",
    left: "13%",
    width: "74%",
    height: "74%",
  },
  ambient: {
    position: "absolute",
    top: "-60%",
    left: "-60%",
    width: "220%",
    height: "220%",
  },
  copyStack: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  copyBanner: {
    flex: 1,
    marginLeft: 14,
  },
  lede: {
    fontFamily: BODY_FONT,
    maxWidth: 330,
    marginTop: 18,
    fontSize: 17,
    lineHeight: 26,
  },
  ledeBanner: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
  },
  actionsStack: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 28,
  },
  actionsBanner: {
    alignItems: "flex-start",
    marginTop: 10,
  },
  cta: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: "#F0B040",
  },
  ctaBanner: {
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    fontFamily: BODY_FONT,
    fontSize: 17,
    fontWeight: "600",
    color: "#2A0F0A",
  },
  note: {
    fontFamily: BODY_FONT,
    marginTop: 14,
    fontSize: 15,
  },
});
