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
> PDFRookie turns paper into clean PDFs and gives you a full set of free PDF tools, all on your phone.
>
> SCAN
> • Automatic edge detection, cropping and perspective correction
> • Multi-page scans, or import photos from your gallery
> • Name your scan as soon as you capture it
>
> EDIT, with no signup and no watermarks
> • Reorder, rotate, delete and extract pages
> • Crop, split and merge PDFs
> • Compress large files
> • Sign documents with your finger
> • Add page numbers and watermarks
> • Password protect and unlock PDFs
> • Extract text from scans (OCR)
> • Convert images to PDF and PDF to images
>
> PRIVATE BY DESIGN
> • Your documents are processed on your phone and saved only on your phone
> • No account needed, no ads
> • Works offline (except OCR language download and sending feedback)
>
> The scanner is provided by Google Play services (Google's ML Kit Document Scanner) and needs no camera permission.

(Edit "no ads" if you later add ads.)

## Graphics
- App icon: `android/store/icon-512.png` (512x512)
- Feature graphic: `android/store/feature-graphic-1024x500.png`
- **Phone screenshots: you must capture these** from the running app (min. 2, up to 8). Don't use mock-ups that misrepresent the app.

## Data safety form (suggested answers, verify before submitting)
**Do not answer "no data collected" without checking.** The built app includes Google's ML Kit libraries, which pull in Google's
`datatransport` library and add network permissions. Google says ML Kit can send diagnostic/usage data. In addition, the app can send
**feedback and tool requests** (text the user types, plus a thumbs rating and the tool name) to pdfrookie.org, where they become public GitHub issues;
the OCR tool **downloads language data from a public CDN**; and the optional Office converter, if you enable it, **uploads the user's file** to your converter.
- Read Google's **ML Kit "Data disclosure" page** for the Document Scanner and answer the Data safety form to match
  (it lists which data types the SDK may collect, such as app diagnostics and device/other identifiers, and whether it is optional).
- Scans and tool results are processed on the device and stay in app-private storage (excluded from cloud backup). The app does not upload scans.
- Declare the feedback/request text as user-provided content you collect, and say it is public. Declare the converter upload if you enable it.
- Answer the "is data encrypted in transit" and "can users request deletion" questions according to what the disclosure says
  and how Google handles SDK data.
- Mismatches between the form and the app's real behaviour can get an app rejected or removed, so verify rather than copy.

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
