# ProPoojaPaath — design kit

Look-and-feel reference for the ProPoojaPaath website and Expo app: the logo
reveal, the animated page heroes, and the pandit onboarding flow. Everything
comes in light and dark, and the onboarding and heroes in English and Hindi.

```
assets/                 kalash + 9 petal PNGs, glow, logo, 2 mandala rings
web/                    LogoReveal, PageHero, LotusMark, pageHeroes + CSS      (React / Next.js)
expo/                   LogoReveal, PageHero, LotusMark, pageHeroes            (React Native / Expo)
onboarding/shared/      schema.ts (what is asked), useOnboarding.ts (the flow)  used by both
onboarding/web/         PanditOnboarding.tsx + pandit-onboarding.css
onboarding/expo/        PanditOnboarding.tsx
showcase/               the click-through demo site (source)
docs/                   the built demo site, ready for GitHub Pages
```

Image paths: the web components load PNGs from `/logo-reveal/` (copy `assets/*`
to `public/logo-reveal/`, or pass `assetBase`). The Expo components `require`
them from `assets/logo-reveal/`.

## 1. Logo reveal

Light behind the kalash → kalash → three big petals → six small petals →
sparkles and backlight → name.

```tsx
// Website: logo opens in the centre, slides left, "ProPoojaPaath" writes in beside it
<LogoReveal fixed layout="row" theme="dark" onComplete={() => setShowWelcome(false)} />

// Expo: name writes in underneath
{!revealed && <LogoReveal onComplete={() => setRevealed(true)} />}
```

## 2. Page heroes

One component, `PageHero`; words and arrangement come from `pageHeroes.ts`
(`heroes` in English, `heroesHi` in Hindi).

| Page              | Preset                          | Website arrangement                      |
| ----------------- | ------------------------------- | ---------------------------------------- |
| Home              | `heroes.home`                   | words left, lotus right                  |
| Pandit welcome    | `heroes.panditWelcome(name)`    | lotus above, greeting centred            |
| Customer welcome  | `heroes.customerWelcome(name)`  | lotus left, greeting right               |
| Admin welcome     | `heroes.adminWelcome(name)`     | short strip for the top of the dashboard |
| About us / Vision | `heroes.about`                  | oversized mandala running off the edge   |

```tsx
<PageHero {...heroes.home} theme="dark" />
<PageHero {...heroesHi.panditWelcome(user.name)} />
```

## 3. Pandit onboarding

```
sign in            Google then mobile code, or mobile code then Google (both are needed)
required form      Personal → Address (2 short steps) → review → submit
recitation check   choose a shloka, start camera, record / stop / restart / submit
                   80% match or better → "AI verified"; 3 attempts; after the third,
                   blocked with "Request staff review". Can be skipped: the profile
                   stays a draft until it passes.
complete profile   Religious practice · Service area · Bank or UPI · ID document ·
                   Availability, each in 1–3 small steps, in any order
```

A bar at the top shows progress (no number). The same flow, wording and
validation drive both platforms: edit `onboarding/shared/schema.ts` to change a
label, an option list, a step, the pass mark (`PASS_MARK`) or the number of
attempts (`MAX_ATTEMPTS`).

The component does not talk to any server. You connect it through props:

```tsx
<PanditOnboarding
  signInWithGoogle={async () => ({ email, name, photo })}   // or null if cancelled
  sendOtp={async (phone) => { /* send SMS */ }}
  verifyOtp={async (phone, code) => true}
  pickImage={async (kind) => uri}                            // "avatar" | "document"
  checkRecitation={async (shlokaId, recording) => ({ score })}  // 0–100
  lookupPin={async (pin) => ({ city, district, state })}     // optional
  pickLocation={async () => ({ lat, lng, label })}           // optional
  shlokas={[{ value: "gayatri", label: { en: "Gayatri Mantra", hi: "गायत्री मंत्र" } }]}
  onDraftChange={(draft) => save(draft)}                     // never contains bank number / UPI ID
  onSubmitProfile={async (values) => { /* Personal + Address */ }}
  onSaveSection={async (section, values) => { /* later sections */ }}
  onRequestStaffReview={async () => {}}
  onProfileStatus={(status) => {}}                           // "draft" | "aiVerified" | "reviewRequested"
  account={{ phone, phoneVerified, email, googleVerified }}  // skips sign-in when both are verified
  startAt="profile"                                          // for a pandit who has already submitted
  initialValues={savedDraft}
  theme="dark" lang="hi"
/>
```

`recording` is a `Blob` on the website (recorded with the browser camera) and a
file uri in the Expo app (recorded with `expo-camera`; run
`npx expo install expo-camera`). Only shloka names are shown, never the text.

## Things to review before shipping

- **Option lists are drafts**: dharma, traditions, languages, pujas, time slots
  and the sample shlokas in `schema.ts`.
- **Hindi is a draft** throughout. Please have a Hindi speaker read it.
- **Hero wording and link targets** (`/pandit/verification`, `/book`) are placeholders.
- **Bank details**: the form passes what was typed to `onSaveSection`; mask it
  before storing (`mask()` in `schema.ts` shows the masked form on screen).
- **Expo**: the components were run in a browser through react-native-web with a
  stand-in camera. They have not been run on a phone.
- **Fonts**: the website CSS asks for Marcellus and Mukta (Google Fonts). The
  Expo files use system fonts until you set `DISPLAY_FONT`.
- Everything falls back to no movement when the device asks for reduced motion.
