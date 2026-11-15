# PDFRookie Scan (Android)

A small native Android app that scans paper into PDFs. It uses Google's on-device **ML Kit Document Scanner**
(automatic edge detection, crop, perspective fix, filters, multi-page, gallery import) and stores the results in
app-private storage. **No account, no camera permission, no ads, no analytics of our own, and the app's own code never uploads your scans.**
(Google's ML Kit libraries may send diagnostics to Google. See "Privacy design" below.)
"More tools" opens the website (https://pdfrookie.org) in a Custom Tab.

> **Status: builds and passes lint, but has not been run on a device.**
> Verified: `./gradlew :core:test` (11 unit tests pass), `:app:assembleDebug` (debug APK builds), `:app:lintDebug` (0 errors) and
> `:app:bundleRelease` (an unsigned release bundle builds).
> **Not verified:** actually running it (no emulator was available): the scanner flow, sharing, rename/delete, thumbnails.
> Test on real phones before publishing.

## Layout
| Path | What |
|---|---|
| `core/` | Pure Kotlin (no Android): file naming, name sanitising (path-traversal safe), size formatting. Unit-tested. |
| `app/` | The Android app (Jetpack Compose, Material 3). |
| `store/` | Google Play graphics: 512 px icon and 1024x500 feature graphic. |
| `../docs/PLAY_STORE.md` | Store listing text, Data safety answers, release checklist. |

## Build and run
Requirements: Android Studio (recent stable), which bundles a suitable JDK. Open the `android/` folder.

```bash
./gradlew :core:test          # unit tests for the naming logic
./gradlew :app:assembleDebug  # debug APK -> app/build/outputs/apk/debug/
```
Install the debug APK on a phone (USB debugging) or use an emulator **with Google Play services** (a "Google Play" system image).
The scanner needs Google Play services; on devices without it the app shows a clear message instead of crashing.

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
3. Build the bundle Play wants: `./gradlew :app:bundleRelease` -> `app/build/outputs/bundle/release/app-release.aab`.
4. Enrol in **Play App Signing** when you create the app, so Google holds the app-signing key and your upload key is replaceable.
5. Raise `versionCode` for every upload.

## Before you publish: things to check
- **Target API level.** `app/build.gradle.kts` targets API 35. Google Play raises its minimum target every year, so check the current
  requirement in Play Console and bump `compileSdk`/`targetSdk` (and AGP) if needed.
- **ML Kit version.** `play-services-mlkit-document-scanner:16.0.0` (stable) is pinned; re-check before each release.
- **Minification is off** (`isMinifyEnabled = false`) because it hasn't been tested. Enabling R8 shrinks the app; test the release build on a device first.
- **Test on real phones** (Android 8+, at least one low-end and one without Google Play services).
- Screenshots for the store listing must be captured from the running app. None are included here on purpose.

## Privacy design (matches the store listing)
- No camera permission: the scanner UI is provided by Google Play services.
- **The built app does declare `INTERNET` and `ACCESS_NETWORK_STATE`.** They are added by Google's `datatransport` library (a dependency of ML Kit),
  which Google uses to send diagnostics. This app's own code opens no network connections; "More tools" opens your browser.
  Because Google's SDK may collect diagnostic data, the Play **Data safety** form must reflect that (see `docs/PLAY_STORE.md`).
  If you want a stricter guarantee, the alternative is a scanner that doesn't use ML Kit (more work, lower quality).
- Scans live in `filesDir/scans` (app-private), are excluded from cloud backup, and are shared only when the user taps Share (via `FileProvider`, read-only, that one file).
- Renames are sanitised and checked to stay inside the scans folder.
