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
contact → **Home** (complete-your-profile banner, status, updates, sections,
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
