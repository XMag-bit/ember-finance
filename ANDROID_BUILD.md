# Build Ember Finance in Android Studio (step by step)

This project is **Expo (React Native)**. Android Studio cannot open it directly -
first generate the native `android/` project with prebuild, then open that in
Android Studio. No code changes needed.

## Part A - Install prerequisites (once)

1. **Node.js 18+**: https://nodejs.org - verify with `node --version`.
2. **Java JDK 17** (Gradle needs exactly 17):
   - Android Studio bundles one: `C:\Program Files\Android\Android Studio\jbr`
   - Or install Temurin 17: https://adoptium.net
   - Verify: `java -version` shows 17.
3. **Android Studio** (latest stable): https://developer.android.com/studio
4. In Android Studio → **Settings → Appearance → System Settings → Android SDK**:
   - SDK Platforms tab: check **Android 14 (API 34)** → Apply.
   - SDK Tools tab: check **Android SDK Build-Tools**, **Android Emulator**,
     **Android SDK Platform-Tools** → Apply.
5. Create an emulator: **Device Manager → Create Device** → Pixel 6 →
   system image **UPSIDE_DOWN_CAKE (API 34)** → Finish.

## Part B - Generate the Android project (in this folder)

```powershell
cd "C:\Users\Bryan\OneDrive\文档\Default Project"
npm install
npx expo prebuild --platform android --clean
```

- `--clean` regenerates `android/` from scratch (safe to re-run any time).
- It reads `app.json` (name, package `com.ember.finance`, icons in `assets/`).
- Result: a new `android/` folder - **this** is what Android Studio opens.

> Re-run prebuild whenever you change `app.json`, the icon, or add a native
> library. Your TypeScript code is untouched by it.

## Part C - Open in Android Studio and run

1. Android Studio → **Open** → select the **`android`** folder inside the project.
2. Wait for **Gradle sync** to finish (bottom bar; first run downloads
   dependencies, takes a few minutes).
3. If sync asks for SDK location, point it at your SDK
   (default `C:\Users\<you>\AppData\Local\Android\Sdk`).
4. Start the Metro bundler (leave running) in a terminal:
   ```powershell
   npx expo start
   ```
5. Back in Studio: select your emulator in the device dropdown → **Run ▶**
   (`Shift+F10`). The app installs and opens on the emulator.
   - Prefer running without Metro later? Use a release build below instead.

## Part D - Build the APK

**Debug APK (fastest, for testing):**

Terminal option (no Studio needed after prebuild):
```powershell
cd android
.\gradlew.bat assembleDebug
```
APK lands at:
`android\app\build\outputs\apk\debug\app-debug.apk`

Or in Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**,
then click **locate** in the notification.

**Release APK (for sharing / installing on phones):**

1. Generate a signing key (once, keep the file + passwords safe):
   ```powershell
   keytool -genkeypair -v -storetype PKCS12 -keystore ember-release.keystore `
     -alias ember -keyalg RSA -keysize 2048 -validity 10000
   ```
2. In Studio: **Build → Generate Signed Bundle / APK → APK →** choose the
   `android` module → select your keystore → **release** variant → Finish.
3. Output: `android\app\release\app-release.apk`.

**Install it:** drag the APK onto a running emulator, or on a physical phone:
```powershell
adb install -r android\app\build\outputs\apk\release\app-release.apk
```
(Enable USB debugging + "Install via USB" on the phone.)

## Part E - Regenerate the icon (optional)

The launcher art is generated, not hand-drawn:

```powershell
python assets\gen_icons.py   # rewrites icon.png, adaptive-icon.png, splash.png
npx expo prebuild --platform android --clean   # re-apply into android/
```

Edit the flame coordinates / colors in `gen_icons.py` to restyle.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` |
| Gradle fails on Java version | Set `JAVA_HOME` to JDK 17 |
| `npm install` errors | Delete `node_modules`, run `npm install` again |
| Emulator won't boot | Enable virtualization (VT-x/SVM) in BIOS; use x86_64 image |
| Want cloud builds instead | `eas build -p android --profile preview` (needs `eas-cli` + Expo account) |
