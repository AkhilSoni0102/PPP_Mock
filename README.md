# ProPoojaPaath design kit

The look and feel of ProPoojaPaath: the pandit app for the website and Expo,
the ops console, the public pages and the logo motion. Everything runs on
sample data; nothing here talks to a server.

Live preview: https://akhilsoni0102.github.io/PPP_Mock/

```
assets/                  logo layers, glow, mandala rings, bell, icons, push icon
web/  expo/              logo reveal and page heroes
pandit-app/shared/       schema.ts (what is asked, wording in English and Hindi, statuses)
                         usePanditApp.ts (the flow)
pandit-app/web/          PanditApp.tsx + pandit-app.css                 (website)
pandit-app/expo/         PanditApp.tsx                                  (Expo; needs expo-camera)
ops-console/             OpsConsole.tsx + ops-console.css + data.ts     (admin portal, website only)
web/PublicPage.tsx       Privacy policy and Delete your account (+ publicPages.ts, public-page.css)
web/pageHeroes.ts        also has `comingSoon`, the customer "Coming soon" page
showcase/                demo site source; built to docs/ with `npm run build`
```

## Pandit app flow

logo reveal → 3 intro slides → sign in (mobile code or Google) → add the missing
contact → **Home**. The logo of the reveal is one element that travels: into the
rings of the intro slides, up to the sign-in screen, and finally into the top
bar. It never cuts away, and it stays fixed while the slides change.

Where things live:

- **Phone (and the Expo app):** three tabs at the bottom, Home, Availability
  and Profile. The bell is top right.
- **Website (760px and wider):** one bar across the top with Home, Availability
  and Help, then language, the bell and the photo. The photo opens My profile,
  My account and Sign out. There is no side panel.
- **Home** is the same for new and verified pandits: a headline, "Your next
  step" with one main button that changes with the profile's state, "What you
  can do here", "What you get with ProPoojaPaath" and "How it works".
- **Profile** shows who the pandit is (photo, name, tick, status), then every
  section with an Edit or Add button, then account and settings on the phone.
- **Steps** show only Back and the progress bar (plus "Save and exit" on the
  website). A section returns to wherever it was opened from.
- **Availability** is a place of its own: tap a time-of-day heading to set it
  for every day; "Save changes" turns into "Saved".
- **Help** lists WhatsApp, phone and email from the `support` prop. Only the
  channels you pass are shown.
- **Delete my account** is only inside My account.

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

`assets/icon-*.png` are the tab and row icons for the Expo app (white, tinted in
code); the website draws the same icons as inline SVG.

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

Laid out like the pandit app: one bar across the top with the glowing logo on
the left and the photo menu (name, roles, Sign out) on the right. It keeps a
side list because it has seven places to go, where the pandit app has three.

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
