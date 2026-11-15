# PDFRookie Scan (Android)

A small native Android app that scans paper into PDFs. It uses Google's on-device **ML Kit Document Scanner**
(automatic edge detection, crop, perspective fix, filters, multi-page, gallery import) and stores the results in
app-private storage. **No account, no permissions, no network requests from the app, no analytics.**
"More tools" opens the website (https://pdfrookie.org) in a Custom Tab.

> **Status: written but not yet compiled or run on a device.** It was authored in an environment without the Android SDK,
> so the first thing to do is open this folder in Android Studio and build. Expect to fix small things.
> What *has* been verified: the file-naming/sanitising logic in `core/` (11 unit tests, run on the JVM).

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
- **ML Kit version.** `play-services-mlkit-document-scanner:16.0.0-beta1` is pinned; check for a newer or stable release.
- **Minification is off** (`isMinifyEnabled = false`) because it hasn't been tested. Enabling R8 shrinks the app; test the release build on a device first.
- **Test on real phones** (Android 8+, at least one low-end and one without Google Play services).
- Screenshots for the store listing must be captured from the running app. None are included here on purpose.

## Privacy design (matches the store listing)
- No `INTERNET` or camera permission in the manifest. The scanner UI is provided by Google Play services.
- Scans live in `filesDir/scans` (app-private), are excluded from cloud backup, and are shared only when the user taps Share (via `FileProvider`, read-only, that one file).
- Renames are sanitised and checked to stay inside the scans folder.
