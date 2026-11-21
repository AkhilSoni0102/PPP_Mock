// ProPoojaPaath — logo reveal for the Expo / React Native app.
// Order: light behind the kalash → kalash → big petals → small petals →
// sparkles and backlight → brand name underneath.
//
// Uses only React Native's built-in Animated API (no extra packages).
// Copy the PNGs from assets/ into your app's assets/logo-reveal/ folder and
// adjust the require() paths below if this file lives somewhere else.

import React, { useEffect, useMemo, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";

type Props = {
  /** Defaults to the phone's light/dark setting. */
  theme?: "light" | "dark";
  /** Brand name written under the logo. */
  name?: string;
  /** Called when the reveal has finished. The glow and sparkles keep running
   *  until you unmount the component. */
  onComplete?: () => void;
};

const GLOW = require("../assets/logo-reveal/glow.png");

// Back-to-front: later images sit on top, so small petals emerge from behind big ones.
// delay / duration in ms, `from` = starting scale, `rot` = starting tilt in degrees.
const PIECES = [
  { src: require("../assets/logo-reveal/petal-base-left.png"), delay: 1770, duration: 750, from: 0.5, rot: 14 },
  { src: require("../assets/logo-reveal/petal-base-right.png"), delay: 1850, duration: 750, from: 0.5, rot: -14 },
  { src: require("../assets/logo-reveal/petal-side-left.png"), delay: 1610, duration: 750, from: 0.45, rot: 20 },
  { src: require("../assets/logo-reveal/petal-side-right.png"), delay: 1690, duration: 750, from: 0.45, rot: -20 },
  { src: require("../assets/logo-reveal/petal-upper-left.png"), delay: 1450, duration: 750, from: 0.45, rot: 16 },
  { src: require("../assets/logo-reveal/petal-upper-right.png"), delay: 1530, duration: 750, from: 0.45, rot: -16 },
  { src: require("../assets/logo-reveal/petal-top.png"), delay: 1000, duration: 850, from: 0.3, rot: 0 },
  { src: require("../assets/logo-reveal/petal-big-left.png"), delay: 800, duration: 850, from: 0.3, rot: 22 },
  { src: require("../assets/logo-reveal/petal-big-right.png"), delay: 900, duration: 850, from: 0.3, rot: -22 },
  { src: require("../assets/logo-reveal/kalash.png"), delay: 150, duration: 800, from: 0.55, rot: 0, origin: "50% 68%" },
];

// [dx, dy, size px, delay s, twinkle s] — dx/dy are fractions of the logo size
const SPARKLES: number[][] = /*SPARKLES*/ [
  [-0.805, 0.202, 5, 1.8, 2.01],
  [-0.546, -0.272, 3, 1.81, 2.18],
  [0.305, 0.586, 2, 1.24, 2.5],
  [-0.196, -0.43, 3, 2.55, 2.25],
  [-0.467, -0.338, 2, 2.35, 1.3],
  [0.99, 0.184, 3, 1.15, 1.94],
  [-0.926, 0.296, 3, 1.45, 1.67],
  [0.586, 0.014, 4, 1.52, 2.8],
  [0.993, -0.022, 4, 1.48, 2.41],
  [-0.554, -0.037, 3, 2.25, 1.84],
  [0.427, -0.501, 2, 2.37, 1.2],
  [0.258, 0.814, 3, 1.66, 2.33],
  [-0.741, 0.333, 2, 2.27, 1.63],
  [0.614, 0.305, 3, 2.24, 1.39],
  [0.013, 0.484, 2, 1.8, 1.98],
  [-0.266, -0.476, 3, 1.39, 2.37],
  [0.604, 0.53, 2, 1.69, 2.78],
  [1.007, 0.002, 5, 1.99, 2.8],
  [0.636, 0.064, 5, 2.0, 2.12],
  [0.597, 0.132, 3, 1.49, 2.44],
  [-0.333, 0.502, 2, 1.21, 1.53],
  [-0.359, -0.338, 3, 1.66, 1.93],
  [0.775, -0.166, 3, 1.3, 1.82],
  [-0.493, -0.414, 2, 2.33, 1.6],
  [0.347, 0.711, 3, 1.39, 2.72],
  [0.639, -0.476, 3, 1.17, 1.37],
];

const THEMES = {
  light: { bg: "#FFF4E0", ink: "#8A3A0A", rule: "#D98A1F", spark: "#E2941B", glow: 0.8, ambient: 0 },
  dark: { bg: "#24100B", ink: "#F3C15A", rule: "#E0A030", spark: "#FFD98A", glow: 1, ambient: 0.4 },
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const BLOOM = Easing.bezier(0.22, 1.18, 0.36, 1); // opens with a slight overshoot
const NAME_AT = 2500;

const tween = (v: Animated.Value, delay: number, duration: number, easing = EASE) =>
  Animated.timing(v, { toValue: 1, delay, duration, easing, useNativeDriver: true });

const range = (v: Animated.Value, from: number, to: number) =>
  v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

export default function LogoReveal({ theme, name = "ProPoojaPaath", onComplete }: Props) {
  const scheme = useColorScheme();
  const t = THEMES[theme ?? (scheme === "dark" ? "dark" : "light")];
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.56, 260);
  const letters = useMemo(() => Array.from(name), [name]);

  const v = useRef({
    pieces: PIECES.map(() => new Animated.Value(0)),
    chars: letters.map(() => new Animated.Value(0)),
    sparks: SPARKLES.map(() => new Animated.Value(0)),
    twinkles: SPARKLES.map(() => new Animated.Value(0)),
    glowSeed: new Animated.Value(0), // small light behind the kalash
    glowFull: new Animated.Value(0), // backlight opening up at the end
    breathe: new Animated.Value(0),
    rule: new Animated.Value(0),
  }).current;

  useEffect(() => {
    let cancelled = false;
    const running: Animated.CompositeAnimation[] = [];
    const run = (a: Animated.CompositeAnimation, done?: () => void) => {
      running.push(a);
      a.start(({ finished }) => finished && !cancelled && done?.());
    };
    const pulse = (val: Animated.Value, ms: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;

        if (reduce) {
          // Reduced motion: fade the finished logo in, no movement or loops
          const all = [...v.pieces, ...v.chars, ...v.sparks, v.glowSeed, v.glowFull, v.rule];
          run(Animated.parallel(all.map((x) => tween(x, 0, 400, Easing.linear))), onComplete);
          return;
        }

        run(
          Animated.parallel([
            tween(v.glowSeed, 0, 650),
            ...PIECES.map((p, i) => tween(v.pieces[i], p.delay, p.duration, BLOOM)),
            tween(v.glowFull, 1950, 950, Easing.out(Easing.ease)),
            ...SPARKLES.map((s, i) => tween(v.sparks[i], s[3] * 1000, 1000)),
            ...letters.map((_, i) => tween(v.chars[i], NAME_AT + i * 40, 500)),
            tween(v.rule, NAME_AT + 550, 700),
          ]),
          onComplete
        );

        // These keep running until the component unmounts
        run(Animated.sequence([Animated.delay(2900), pulse(v.breathe, 2800)]));
        SPARKLES.forEach((s, i) =>
          run(Animated.sequence([Animated.delay(s[3] * 1000 + 600), pulse(v.twinkles[i], s[4] * 1000)]))
        );
      });

    return () => {
      cancelled = true;
      running.forEach((a) => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowOpacity = Animated.multiply(
    Animated.add(range(v.glowSeed, 0, 0.65), range(v.glowFull, 0, 0.35)),
    range(v.breathe, t.glow, t.glow * 0.72)
  );
  const glowScale = Animated.multiply(
    Animated.add(range(v.glowSeed, 0.25, 0.45), range(v.glowFull, 0, 0.55)),
    range(v.breathe, 1, 1.1)
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: t.bg }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      <View style={{ width: size, height: size }}>
        {t.ambient > 0 && (
          <Animated.Image
            source={GLOW}
            style={[styles.ambient, { opacity: range(v.glowSeed, 0, t.ambient) }]}
          />
        )}
        <Animated.Image
          source={GLOW}
          style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        />

        {PIECES.map((p, i) => (
          <Animated.Image
            key={i}
            source={p.src}
            style={[
              styles.piece,
              {
                opacity: v.pieces[i].interpolate({ inputRange: [0, 0.35], outputRange: [0, 1], extrapolate: "clamp" }),
                transformOrigin: p.origin ?? "50% 79%",
                transform: [
                  { rotate: v.pieces[i].interpolate({ inputRange: [0, 1], outputRange: [`${p.rot}deg`, "0deg"] }) },
                  { scale: range(v.pieces[i], p.from, 1) },
                ],
              },
            ]}
          />
        ))}

        {SPARKLES.map(([dx, dy, z], i) => (
          <Animated.View
            key={i}
            style={[
              styles.sparkAnchor,
              {
                opacity: v.sparks[i].interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: "clamp" }),
                transform: [
                  { translateX: range(v.sparks[i], 0, dx * size) },
                  { translateY: range(v.sparks[i], 0, dy * size) },
                  { scale: v.sparks[i] },
                ],
              },
            ]}
          >
            <Animated.View
              style={{
                width: z,
                height: z,
                marginLeft: -z / 2,
                marginTop: -z / 2,
                borderRadius: z / 2,
                backgroundColor: t.spark,
                shadowColor: t.spark,
                shadowOpacity: 0.9,
                shadowRadius: z * 1.4,
                shadowOffset: { width: 0, height: 0 },
                opacity: range(v.twinkles[i], 1, 0.2),
                transform: [{ scale: range(v.twinkles[i], 1, 0.45) }],
              }}
            />
          </Animated.View>
        ))}
      </View>

      <View style={styles.nameRow}>
        {letters.map((ch, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.name,
              { color: t.ink, opacity: v.chars[i], transform: [{ translateY: range(v.chars[i], 12, 0) }] },
            ]}
          >
            {ch === " " ? " " : ch}
          </Animated.Text>
        ))}
      </View>
      <Animated.View
        style={[styles.rule, { width: size * 0.6, backgroundColor: t.rule, opacity: v.rule, transform: [{ scaleX: v.rule }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  piece: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  glow: {
    position: "absolute",
    top: "-75%",
    left: "-75%",
    width: "250%",
    height: "250%",
  },
  ambient: {
    position: "absolute",
    top: "-200%",
    left: "-200%",
    width: "500%",
    height: "500%",
  },
  sparkAnchor: {
    position: "absolute",
    left: "50%",
    top: "54%",
  },
  nameRow: {
    flexDirection: "row",
    marginTop: 22,
  },
  name: {
    // Swap in your brand font here once it is loaded with expo-font
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: 1,
  },
  rule: {
    height: 1.5,
    marginTop: 8,
    borderRadius: 1,
  },
});
