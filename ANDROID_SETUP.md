# Android Setup - Bare React Native Workflow (No Expo Services)

This guide builds and runs Ember Finance **natively in Android Studio** without
Expo Go, EAS, or the Expo CLI at runtime. Two paths are covered:

- **Path 1 (recommended): Prebuild once, then go native.** Keep the Expo
  *packages* as plain npm libraries, but build/run/debug 100% with Android
  Studio + Gradle + Metro. No Expo account, no QR codes.
- **Path 2 (optional): Remove Expo packages entirely.** Pure
  `@react-native-community/cli` project. More work, zero Expo footprint.

The committed code already supports both: no `expo-router`, no Expo config
plugins, no EAS-only APIs.

---

## 0. One-time machine setup

1. Install **Node.js 18+** (`node --version`).
2. Install **JDK 17** and set:
   ```powershell
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.11.9-hotspot", "User")
   java -version   # must print 17
   ```
3. Install **Android Studio**, then SDK Manager → install:
   - SDK Platforms → **Android 14 (API 34)**
   - SDK Tools → **Android SDK Build-Tools**, **Platform-Tools**, **Emulator**
4. Set the SDK variable (Gradle and `adb` need it):
   ```powershell
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   [Environment]::SetEnvironmentVariable("Path", "$env:Path;%LOCALAPPDATA%\Android\Sdk\platform-tools", "User")
   ```
   Restart the terminal afterwards. Verify: `adb --version`.
5. Device Manager → **Create Device** → Pixel 6 → API 34 image → Finish.

## Path 1 - Prebuild once, then stay native (recommended)

### Step 1 - Install JS deps and generate `android/`

```powershell
cd "C:\Users\Bryan\OneDrive\文档\Default Project"
npm install
npx expo prebuild --platform android --clean
```

What this does: reads `app.json` (name, `com.ember.finance`, icons in
`assets/`) and generates a standard Gradle project in `android/`.
From here on, **treat `android/` as a normal native project**.

### Step 2 - Open in Android Studio, sync Gradle

1. Studio → **Open** → select the **`android`** folder.
2. Wait for **Gradle sync** (bottom status bar). First sync downloads the
   Gradle distribution + Maven deps - a few minutes on first run.
3. If you see *"SDK location not found"*, create `android/local.properties`:
   ```properties
   sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
   ```
   (use double backslashes, or forward slashes) and click **Sync Now**.

### Step 3 - Run (Metro + native shell, no Expo CLI)

Terminal 1 - start Metro directly (bypasses `expo start`):
```powershell
npx react-native start
```
Terminal 2 - build & install the debug shell:
```powershell
cd android
.\gradlew.bat installDebug
```
Or skip terminals: select the emulator → **Run ▶** (`Shift+F10`).
Studio installs the app; **press `R` twice in the Metro terminal** (or
shake/`adb shell input keyevent 82` → Reload) after JS edits - Fast Refresh
handles most edits automatically.

> `npx react-native start` works because `expo` here is just an npm dep;
> nothing phones home to Expo servers.

### Step 4 - Build APKs with Gradle

```powershell
cd android
.\gradlew.bat assembleDebug        # testing:  app\build\outputs\apk\debug\app-debug.apk
.\gradlew.bat assembleRelease      # release:  app\build\outputs\apk\release\app-release.apk (unsigned)
```

Or in Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.

### Step 5 - Signed release APK (for real phones)

1. Create a keystore once (guard the passwords):
   ```powershell
   keytool -genkeypair -v -storetype PKCS12 -keystore ember-release.keystore `
     -alias ember -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add to `android/gradle.properties` (never commit this file):
   ```properties
   EMBER_STORE_FILE=C:/path/to/ember-release.keystore
   EMBER_STORE_PASSWORD=****
   EMBER_KEY_ALIAS=ember
   EMBER_KEY_PASSWORD=****
   ```
3. In `android/app/build.gradle`, inside the `android { ... }` block:
   ```gradle
   signingConfigs {
     release {
       storeFile file(EMBER_STORE_FILE)
       storePassword EMBER_STORE_PASSWORD
       keyAlias EMBER_KEY_ALIAS
       keyPassword EMBER_KEY_PASSWORD
     }
   }
   buildTypes {
     release { signingConfig signingConfigs.release }
   }
   ```
4. `.\gradlew.bat assembleRelease` → signed
   `app\build\outputs\apk\release\app-release.apk`.
5. Install: `adb install -r app-release.apk` (phone needs USB debugging).

### Step 6 - Day-to-day native loop

| Task | Command / action |
|---|---|
| Edit JS/TS | Edit `App.tsx` / `src/`, save, Fast Refresh applies it |
| Edit native code | Edit under `android/app/src/main/`, then Run ▶ |
| Change `app.json` / icons | Re-run `npx expo prebuild --platform android --clean` |
| Add a native library | `npm i <lib>`, re-run prebuild, Gradle sync |
| Clean a broken build | `.\gradlew.bat clean` in `android/`, rebuild |

---

## Path 2 - Remove Expo packages entirely (optional, advanced)

Only needed if you want zero `expo-*` imports. The app uses exactly two:

1. `App.tsx`: `import { StatusBar } from "expo-status-bar"` →
   ```tsx
   import { StatusBar } from "react-native";
   // usage: <StatusBar barStyle="dark-content" />
   ```
2. `npm uninstall expo expo-status-bar` and delete any `expo` key leftovers.
3. `package.json` scripts: replace `expo start` with `react-native start`
   (`@react-native-community/cli` comes with `react-native`).
4. `index.js` entry (CLI needs one at project root):
   ```js
   import { AppRegistry } from "react-native";
   import App from "./App";
   import { name as appName } from "./app.json";
   AppRegistry.registerComponent(appName, () => App);
   ```
   Point `android/app/src/main/.../MainActivity` / `getMainComponentName`
   at the same name (prebuild already wires this from `app.json`).
5. Re-run prebuild once, then follow Path 1 Steps 2–6. `@expo/vector-icons`,
   navigation, screens, and safe-area packages are Expo-independent and stay.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Gradle sync fails on Java | `echo $env:JAVA_HOME` must be JDK 17 |
| `adb: command not found` | Reopen terminal after setting `ANDROID_HOME`/Path |
| Metro port 8081 busy | `npx react-native start --port 8082` |
| Red screen after JS edit | `.\gradlew.bat installDebug` once, then reload |
| Release app crashes on launch | You installed the **unsigned** release APK - sign it (Step 5) |
