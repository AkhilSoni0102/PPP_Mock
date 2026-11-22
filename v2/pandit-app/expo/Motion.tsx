// Motion pieces for the pandit app (Expo): the whole logo that keeps glowing,
// the progress bar the logo rides, and the mandala that turns while the app waits.
// Uses only React Native's built-in Animated API.

import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from "react-native";

const LOGO = require("../../assets/logo-reveal/logo.png");
const GLOW = require("../../assets/logo-reveal/glow.png");
const RING_OUTER = require("../../assets/logo-reveal/mandala-outer.png");
const RING_INNER = require("../../assets/logo-reveal/mandala-inner.png");

const SPARKS = [[-0.62, -0.3], [0.6, -0.34], [-0.44, 0.44], [0.68, 0.22], [0.06, -0.72], [-0.74, 0.06], [0.38, 0.52]];
const GOLD = "#F0B040";

/** A value that runs back and forth forever, unless the phone asks for reduced motion. */
function useLoop(duration: number, pingPong = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let anim: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduce) => {
      if (cancelled || reduce) return;
      const to = (toValue: number) => Animated.timing(v, { toValue, duration, easing: pingPong ? Easing.inOut(Easing.ease) : Easing.linear, useNativeDriver: true });
      anim = Animated.loop(pingPong ? Animated.sequence([to(1), to(0)]) : to(1));
      anim.start();
    });
    return () => { cancelled = true; anim?.stop(); };
  }, []);
  return v;
}

/** The whole logo with a soft light behind it. `pulse` gives one burst of light (e.g. a code was accepted). */
export function GlowLogo({ size, sparkles = false, pulse = false, sparkColor = "#FFD98A" }: { size: number; sparkles?: boolean; pulse?: boolean; sparkColor?: string }) {
  const breathe = useLoop(2800);
  const twinkle = useLoop(1900);
  const burst = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!pulse) return;
    burst.setValue(0);
    Animated.timing(burst, { toValue: 1, duration: 1300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [pulse]);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.Image
        source={GLOW}
        style={{
          position: "absolute", width: size * 2.2, height: size * 2.2,
          opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
          transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: GOLD,
          opacity: burst.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 0.9, 0] }),
          transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.1] }) }],
        }}
      />
      <Image source={LOGO} style={{ width: size, height: size, resizeMode: "contain" }} />
      {sparkles && SPARKS.map(([x, y], i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute", left: size / 2 + x * size * 1.15 - 2, top: size * 0.54 + y * size * 1.15 - 2,
            width: 4, height: 4, borderRadius: 2, backgroundColor: sparkColor,
            opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: i % 2 ? [1, 0.15] : [0.15, 1] }),
          }}
        />
      ))}
    </View>
  );
}

/** A progress bar with the glowing logo at its front edge, moving right as progress grows. No number is shown. */
export function RiderBar({ value, label, track = "rgba(240,176,64,0.22)" }: { value: number; label: string; track?: string }) {
  const v = Math.max(0, Math.min(1, value));
  const anim = useRef(new Animated.Value(v)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: v, duration: 900, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: false }).start();
  }, [v]);
  // The logo travels between 17pt from each end, so it never hangs off the bar.
  const [width, setWidth] = useState(0);
  const travel = Math.max(0, width - 34);
  return (
    <View
      style={styles.rider}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
    >
      <View style={[styles.track, { backgroundColor: track }]}>
        <Animated.View style={[styles.fill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: [17, 17 + travel] }) }]} />
      </View>
      {width > 0 && (
        <Animated.View style={[styles.riderLogo, { left: anim.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }]}><GlowLogo size={34} /></Animated.View>
      )}
    </View>
  );
}

/** Where the travelling logo of the opening should go: the centre of a slot, in window coordinates. */
export const SlotContext = React.createContext<((at: { x: number; y: number; size: number }) => void) | null>(null);

/** An empty space the size of a logo. During the opening, the one travelling logo flies to wherever this is. */
export function LogoSlot({ size }: { size: number }) {
  const report = React.useContext(SlotContext);
  const ref = useRef<View>(null);
  const measure = () => requestAnimationFrame(() => ref.current?.measureInWindow((x, y, w, h) => { if (w > 0) report?.({ x: x + w / 2, y: y + h / 2, size: w }); }));
  useEffect(() => { measure(); const id = setTimeout(measure, 120); return () => clearTimeout(id); }, []);
  return <View ref={ref} onLayout={measure} style={{ width: size, height: size }} collapsable={false} />;
}

/** The mandala rings turning slowly, around the glowing logo unless `plain`: shown wherever the app waits. */
export function Turning({ size, plain = false, color = GOLD, slot = false }: { size: number; plain?: boolean; color?: string; slot?: boolean }) {
  const turn = useLoop(plain ? 3000 : 16000, false);
  const spin = (dir: 1 | -1) => ({ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${dir * 360}deg`] }) }] });
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.Image source={RING_OUTER} style={[StyleSheet.absoluteFill, styles.ring, { tintColor: color, opacity: plain ? 1 : 0.6 }, spin(1)]} />
      <Animated.Image source={RING_INNER} style={[styles.ringInner, styles.ring, { tintColor: color, opacity: plain ? 1 : 0.6 }, spin(-1)]} />
      {!plain && (slot ? <LogoSlot size={size * 0.46} /> : <GlowLogo size={size * 0.46} />)}
    </View>
  );
}

/** A gold ring that breathes around its child, e.g. the camera while recording. */
export function BreathingRing({ on, radius, children }: { on: boolean; radius: number; children: React.ReactNode }) {
  const breathe = useLoop(1800);
  return (
    <View>
      {on && <Animated.View pointerEvents="none" style={[styles.halo, { borderRadius: radius + 8, opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0.25] }) }]} />}
      <View style={on && { borderWidth: 3, borderColor: GOLD, borderRadius: radius + 3 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  rider: { alignSelf: "stretch", height: 38, justifyContent: "center" },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#F0B040", borderRadius: 4 },
  riderLogo: { position: "absolute", top: 2, width: 34, height: 34 },
  ring: { width: "100%", height: "100%", resizeMode: "contain" },
  ringInner: { position: "absolute", top: "13%", left: "13%", width: "74%", height: "74%" },
  halo: { position: "absolute", top: -8, left: -8, right: -8, bottom: -8, borderWidth: 8, borderColor: "rgba(240,176,64,0.35)" },
});
