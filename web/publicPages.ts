// Words for the public pages. These are drafts for layout only, written from the
// functional spec. Replace them with your reviewed legal text before publishing.

import type { PublicPageContent } from "./PublicPage";

const DRAFT = "Draft wording for layout. Replace with your reviewed policy text before publishing.";
const CONTACT = { contactLabel: "Contact us", contactEmail: "propoojapaath@gmail.com" };

export const privacyPolicy: PublicPageContent = {
  title: "Privacy policy",
  intro: "What ProPoojaPaath collects from pandits, why, who can see it, how long we keep it and how to have it deleted.",
  notice: DRAFT,
  sections: [
    {
      heading: "What we collect",
      items: [
        "Contact: your mobile number and Gmail address, both verified",
        "Personal: full name, gender, date of birth and profile photo",
        "Address: PIN code, house, street and area, city, district, state and map position",
        "Practice: dharma, gotra, traditions, years of experience, languages and services",
        "Service area: the centre, how far you travel and any extra PIN codes",
        "Bank or UPI: holder name and IFSC; the account number or UPI ID is stored masked",
        "ID: a photo of one of masked Aadhaar, PAN or driving licence",
        "Recitation: the shloka you chose and your video recordings",
        "Availability: weekly times, days off and leave",
      ],
    },
    { heading: "Why we collect it", body: "To create your profile, verify who you are, show families the pandits near them, and send payments for the pujas you perform." },
    { heading: "Who can see it", body: "Your ID photos and recitation recordings are seen only by our review team, and every viewing of an ID document is logged." },
    { heading: "How long we keep it", body: "For as long as your account is open. After a deletion request your account and its data are deleted within 30 days, except records the law requires us to keep." },
    { heading: "How to delete your data", body: "Use \"Delete my account\" in the app, or write to us at the address below." },
  ],
  ...CONTACT,
};

export const deleteAccount: PublicPageContent = {
  title: "Delete your account",
  intro: "How to ask for your ProPoojaPaath account to be deleted, what is removed and what we keep.",
  notice: DRAFT,
  sections: [
    { heading: "How to request deletion", items: ["In the app: open the menu, choose \"Delete my account\", then \"Request deletion\"", "By email: write to us from your registered Gmail address"] },
    { heading: "What is deleted", items: ["Your profile and addresses", "Bank or UPI details", "Availability", "ID photos", "Recitation recordings"] },
    { heading: "What is kept", body: "Records the law requires us to keep." },
    { heading: "Timeline", body: "Deletion is completed within 30 days of your request and cannot be undone. You can cancel the request in the app before then." },
  ],
  ...CONTACT,
};
