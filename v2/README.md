# ProPoojaPaath design kit, v2

A duplicate of the kit in the repo root, reworked around the functional spec.
The original (root folder, live at the site root) is untouched.

```
v2/assets/               same images as v1
v2/web/  v2/expo/        logo reveal and page heroes (unchanged from v1)
v2/pandit-app/shared/    schema.ts (what is asked, wording in English and Hindi, statuses)
                         usePanditApp.ts (the flow)
v2/pandit-app/web/       PanditApp.tsx + pandit-app.css
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

## Still to come in v2

The Expo version of the pandit app, the ops console, the customer
"Coming soon" page and the public pages.
