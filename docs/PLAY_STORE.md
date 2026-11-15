# Google Play listing: PDFRookie Scan

Copy-paste material for Play Console. Review everything against Google's current policies before submitting.

## Basics
- **App name:** PDFRookie Scan  (30 chars max)
- **Package name:** `org.pdfrookie.scanner`  (cannot be changed after the first upload)
- **Category:** Tools (or Productivity)
- **Contact email:** use a dedicated address (e.g. the one you set up for pdfrookie.org)
- **Website:** https://pdfrookie.org
- **Privacy policy URL:** https://pdfrookie.org/privacy  (this page covers the app)

## Short description (80 chars max)
> Scan documents to PDF. Free, no account, and everything stays on your phone.

## Full description
> PDFRookie Scan turns paper into clean PDFs in a few taps.
>
> • Automatic edge detection, cropping and perspective correction
> • Scan multiple pages into one PDF, or import photos from your gallery
> • Clean-up filters for sharp, readable text
> • Rename, open, share or delete your scans
> • Free. No account, no ads, no watermarks
> • Private: your scans stay on your phone. The app has no internet permission and collects no data
>
> Need more? Tap "More tools" for free browser-based PDF tools from pdfrookie.org: merge, split, compress, sign, protect and more.
>
> The scanner is provided by Google Play services (Google's ML Kit Document Scanner), so it works on most Android phones with Play services and needs no camera permission.

(Edit "no ads" if you later add ads.)

## Graphics
- App icon: `android/store/icon-512.png` (512x512)
- Feature graphic: `android/store/feature-graphic-1024x500.png`
- **Phone screenshots: you must capture these** from the running app (min. 2, up to 8). Don't use mock-ups that misrepresent the app.

## Data safety form (suggested answers, verify before submitting)
- *Does your app collect or share any of the required user data types?* **No.**
  The app has no network permission and no analytics/ad SDKs. Scans stay in app-private storage.
- *Is all of the user data collected by your app encrypted in transit?* Not applicable (no data collected).
- *Do you provide a way for users to request that their data be deleted?* Not applicable; users delete scans inside the app, and uninstalling removes everything.
- Note: the document scanner component runs through Google Play services and is covered by Google's own privacy terms.
  Read Google's current ML Kit and Play data-safety guidance to confirm whether that needs to be disclosed.

## Content rating
Answer the questionnaire honestly (utility app; no violence, gambling, user-generated content sharing, or location). Expect an "Everyone" rating.

## Account and testing requirements (check current rules)
- A Play developer account costs a one-time fee. **Personal accounts created recently must run a closed test with a minimum number of testers for a minimum period before they can publish to production.** Check Google's current numbers.
  Start recruiting testers early (friends, family, community) and use the Internal/Closed testing tracks.
- Organisation accounts need a registered business and a D-U-N-S number; personal accounts need identity verification.
- Developer contact details can be shown on the listing; confirm what Google displays for your account type.

## Release checklist
1. Build and test on at least 2 real phones (see `android/README.md`).
2. Capture screenshots.
3. Create the app in Play Console, enrol in Play App Signing, upload the `.aab`.
4. Fill in Store listing, Data safety, Content rating, Target audience, Ads declaration (**No ads**, if still true).
5. Run the closed test, then promote to production.
