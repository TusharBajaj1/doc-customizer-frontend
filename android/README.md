# PDFRookie (Android)

The app opens on the **tools home screen**: a **Scan a document** button, a **My scans** button, and then every tool from the website
(merge, reorder, rotate, delete and extract pages, crop, split, compress, sign, page numbers, watermark, password protect/unlock, OCR,
images <-> PDF and more). The tools are bundled inside the app and run on the device, so they work offline.

1. **Scanning** is native: Google's on-device **ML Kit Document Scanner** (automatic edge detection, crop, perspective fix, filters,
   multi-page, gallery import). Right after capture you **name the scan**, then it is saved to **My scans**.
2. **My scans** (a native screen) lists saved scans, which can be opened, shared, renamed or deleted. Each has an **Edit...** button that
   opens it straight into any PDF tool; the result can be added to My scans, replace the original, be saved to the device, or be shared.
3. Anything a tool produces goes through a native **File ready** dialog (with a rename field) because WebViews can't download files themselves.

> **Status: builds, lints clean and passes its unit tests, but has not been run on a device or emulator.**
> Verified: `:core:test` (17 tests), `:app:assembleDebug`, `:app:lintDebug` (0 errors), `:app:bundleRelease`, every file of the bundled site is inside the
> APK, the app's URL routing resolves every URL the site actually requests, and the bundled site was exercised end to end in desktop Chrome
> with a simulated app bridge (`scripts/serve-export.mjs`).
> **Not verified:** the Android pieces themselves (WebView behaviour, file chooser, the save/share dialog, the scanner flow). Test on real phones.

## How it fits together
| Path | What |
|---|---|
| `core/` | Pure Kotlin, unit-tested: file naming and sanitising, safe download names, and the rules that map URLs to bundled files (`AssetRouting`). |
| `app/` | The Android app (Kotlin, Compose for the Scans screen, a WebView for the tools). |
| `app/src/main/assets/www/` | **Generated** copy of the website (git-ignored). Built by `npm run build:app`. |
| `store/` | Google Play graphics. |
| `../docs/PLAY_STORE.md` | Listing text, Data safety guidance, release checklist. |

The website is bundled as static files and served from a made-up HTTPS origin (`https://localapp.pdfrookie.org`) that is intercepted inside the
app (`WebViewAssetLoader`); no real server is contacted for the pages. A small JavaScript bridge (`window.PdfRookieNative`) lets the pages hand
finished files to the app (Save / Share / Open) and start the native scanner, because WebViews cannot do blob downloads or use the scanner.
Android's asset packager silently drops folders starting with `_`, so `scripts/build-app.mjs` stores them with an `x` prefix and `AssetRouting` maps URLs back.

## Build and run
1. Build the bundled website (repository root):
   ```bash
   npm install
   npm run build:app          # static export -> android/app/src/main/assets/www
   ```
   Optional environment variables for this build: `NEXT_PUBLIC_API_BASE` (default `https://www.pdfrookie.org`, used by the feedback form),
   `NEXT_PUBLIC_CONVERTER_URL` (shows the Word-to-PDF tool; the converter's `ALLOWED_ORIGINS` must include `https://localapp.pdfrookie.org`).
2. Build the app (Android Studio, or):
   ```bash
   cd android
   ./gradlew :core:test            # unit tests
   ./gradlew :app:assembleDebug    # debug APK -> app/build/outputs/apk/debug/
   ```
   The Gradle build stops with a clear message if step 1 hasn't been done.

To preview the bundled site in a desktop browser exactly as the app serves it: `node scripts/serve-export.mjs` (from the repository root). On start it checks its routing rules against `core/src/test/resources/asset_routing_cases.tsv`, the same table the Kotlin tests use.

## Release (Google Play)
1. **Create an upload key once** and keep it safe (back it up; never commit it):
   ```bash
   keytool -genkeypair -v -keystore ~/pdfrookie-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Create `android/keystore.properties` (git-ignored):
   ```properties
   storeFile=/absolute/path/to/pdfrookie-upload.jks
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```
3. `npm run build:app`, then `./gradlew :app:bundleRelease` -> `app/build/outputs/bundle/release/app-release.aab`.
4. Enrol in **Play App Signing** when you create the app. Raise `versionCode` for every upload.
5. **Updating the website does not update the app.** The site is bundled, so ship a new app version when you want the new tools/text inside it.

## Before you publish
- **Target API level.** `app/build.gradle.kts` targets API 35. Google Play raises its minimum target every year; check the current requirement and bump `compileSdk`/`targetSdk` (and AGP) if needed.
- **Dependency versions.** Lint lists newer library versions; most need a newer compile target. ML Kit Document Scanner 16.0.0 (stable) is pinned.
- **Minification is off** (`isMinifyEnabled = false`) because it hasn't been tested with the WebView bridge (R8 can strip `@JavascriptInterface` methods unless kept). Don't turn it on without adding keep rules and testing.
- **Test on real phones** (Android 8+; one low-end; one without Google Play services). Test: scan -> name -> save; Edit... on a scan in several tools; saving files from tools; sharing; opening PDFs from the Files app; rotation; back button; offline.
- **Policy fit.** Google Play can reject apps that are only a website in a frame. This app has native functionality (scanner, file saving/sharing, offline tools), but review Google's current "minimum functionality" policy wording.
- Screenshots for the store listing must be captured from the running app.

## Privacy design (matches the store listing and the website's privacy page)
- Scans and tool results are processed **on the device**. Saved scans live in app-private storage and are excluded from cloud backup.
- No camera permission: scanning uses the Google Play services scanner UI. The web camera is never used in the app (permission prompts are denied).
- The app declares `INTERNET` because: the OCR tool downloads language data from a public CDN, feedback/requests go to pdfrookie.org, and the optional Office converter uploads a file to our converter service (only if you enable it).
- Google's ML Kit libraries add their own network permissions and may send diagnostics to Google. The Play **Data safety** form must reflect that (see `docs/PLAY_STORE.md`).
- Only the bundled site is loaded in the WebView; external links open in the browser (Custom Tabs). The JavaScript bridge validates file names and types and caps sizes.
