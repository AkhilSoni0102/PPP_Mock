# ProPoojaPaath design kit, v2

A duplicate of the kit in the repo root, reworked around the functional spec.
The original (root folder, live at the site root) is untouched.

```
v2/assets/               same images as v1
v2/web/  v2/expo/        logo reveal and page heroes (unchanged from v1)
v2/pandit-app/shared/    schema.ts (what is asked, wording in English and Hindi, statuses)
                         usePanditApp.ts (the flow)
v2/pandit-app/web/       PanditApp.tsx + pandit-app.css                 (website)
v2/pandit-app/expo/      PanditApp.tsx                                  (Expo; needs expo-camera)
v2/ops-console/          OpsConsole.tsx + ops-console.css + data.ts     (admin portal, website only)
v2/web/PublicPage.tsx    Privacy policy and Delete your account (+ publicPages.ts, public-page.css)
v2/web/pageHeroes.ts     now also has `comingSoon`, the customer "Coming soon" page
v2/showcase/             demo site source; built to docs/v2/ with `npm run build:v2`
```

## Pandit app flow

logo reveal → 3 intro slides → sign in (mobile code or Google) → add the missing
contact → **Home** (complete-your-profile banner, status, the bell, sections,
profile menu) → sections in small steps → submit for review.

Decisions built in:

- Required before submitting: name, gender, date of birth, address.
- Sections by category: Personal, Address, Religious practice, Service area;
  then Availability, Bank or UPI, ID document, Get verified.
- Progress is a bar with no numbers.
- Recitation: 3 attempts, each "being checked" by the review team; after the
  third, "Request staff review". The shloka text is never shown.
- 8-language picker (Hindi default). Only Hindi and English are written;
  the other six fall back to English.
- Profile photo sits with personal details; ID document holds Aadhaar
  (masked), PAN or driving licence.

The component talks to no server. Status, updates and recitation attempts come
in as props; sign-in, uploads, address search and saving go out through
callbacks. See the `PanditAppProps` type in `usePanditApp.ts`.

## Updates and notifications

- **The bell** sits in the top bar on every signed-in screen, with a gold count
  of unread updates (capped at "9+"). It swings once when a new update arrives.
- **Updates page**, opened by the bell, the status badge on the Home banner, or
  the menu. On top is a timeline of where the profile is in review (submitted →
  recitation checked → under review → verified), with the reviewer's message and
  a fix button on the step it belongs to. Below is every update, newest first.
  Opening the page marks updates as read (`onUpdateRead` is called for each).
- **Home** no longer lists updates. A reviewer's message stays on Home because
  it needs action.
- **Asking for permission**: once, straight after "Submit for review". Our own
  screen comes first; your `onEnableNotifications` shows the device's question.
- **Setting**: a switch in My account. When `notifications` is `"blocked"` the
  row offers "Open settings" (`onOpenNotificationSettings`).

Props to connect: `updates` (give each an `at` date-time so the page can show
when it happened), `notifications` (`"unknown" | "on" | "off" | "blocked"`),
`onEnableNotifications`, `onDisableNotifications`, `onOpenNotificationSettings`,
`onUpdateRead`. Without `onEnableNotifications` the app never asks and shows no
setting. Sending the push itself (tokens, delivery) is your backend's job.

`assets/push-icon.png` is the one-colour lotus for the small notification icon
(Android tints it; use the saffron-gold `#F0B040` as the accent colour). The
full-colour logo stays as the app icon. `assets/bell.png` is the bell used by
the Expo app.

## Motion in the pandit app

`pandit-app/web/Motion.tsx` and `pandit-app/expo/Motion.tsx` hold three pieces:

- `GlowLogo`: the whole logo with a light behind it that keeps breathing. Used
  at the top of every screen, above sign-in, and inside the turning mandala.
  It gives one pulse of light when a mobile number or Gmail is verified.
- `RiderBar`: the progress bar with the small glowing logo at its front edge,
  moving right as progress grows. Used on the Home banner and on section steps.
  The intro slides have no bar (the dots show the position).
- `Turning`: the mandala rings turning slowly, shown wherever the app waits
  (busy buttons, uploads, "being checked").

The full logo reveal plays once when the profile is submitted and when the
recitation passes. A gold ring breathes around the camera while recording, and
the Home banner gets a gold outline once the profile is verified. All of it
stops when the device asks for reduced motion.

## Ops console

English only, desktop-first, and it narrows to a single column on small screens.
Areas: Dashboard, Pandits, Review queue, Pandit detail, Onboard a pandit,
Users & roles, Reference data, Audit log, plus Sign in and "No access yet".
Navigation follows the roles passed in (`roles={["reviewer"]}`): staff see only
profiles they prepared, reviewers get the queue and decisions, admins get
everything. A reviewer cannot decide on a profile they prepared.

It runs entirely on the made-up records in `data.ts`. Decisions, role switches
and reference edits change what is on screen and add rows to the audit log, but
nothing is saved or sent.

## Coming soon and public pages

- `<PageHero {...heroes.comingSoon} />`: the whole customer side for now, with
  "Are you a pandit? Join here". English and Hindi.
- `<PublicPage {...privacyPolicy} />` and `<PublicPage {...deleteAccount} />`:
  the wording is a draft for layout, written from the functional spec. Replace
  it with reviewed legal text before publishing. English only.

## Things to review

- Hindi wording throughout is a draft. The other six languages in the picker
  fall back to English.
- Expo: the pandit app was run in a browser through react-native-web with a
  stand-in camera. It has not been run on a phone.
- Ops console numbers and people are sample data, including the PIN code and
  translation counts on Reference data.
- Bank details: the form hands over what was typed; mask it before storing.
