/**
 * withReleaseSigning - signs release builds with your own keystore.
 *
 * On every prebuild it edits android/app/build.gradle so that:
 *  - signingConfigs.release reads the keystore location and passwords from
 *    the Gradle properties EMBER_STORE_FILE, EMBER_STORE_PASSWORD,
 *    EMBER_KEY_ALIAS and EMBER_KEY_PASSWORD (set in the global
 *    C:\Users\<you>\.gradle\gradle.properties, never committed);
 *  - buildTypes.release uses signingConfigs.release instead of the debug key.
 *
 * The edits are idempotent: running prebuild twice changes nothing the
 * second time. Debug builds are untouched.
 */
const { withAppBuildGradle } = require("@expo/config-plugins");

const DEBUG_BLOCK = [
  "        debug {",
  "            storeFile file('debug.keystore')",
  "            storePassword 'android'",
  "            keyAlias 'androiddebugkey'",
  "            keyPassword 'android'",
  "        }",
].join("\n");

const RELEASE_BLOCK = [
  "        release {",
  "            storeFile file(EMBER_STORE_FILE)",
  "            storePassword EMBER_STORE_PASSWORD",
  "            keyAlias EMBER_KEY_ALIAS",
  "            keyPassword EMBER_KEY_PASSWORD",
  "        }",
].join("\n");

const RELEASE_MARKER = "storeFile file(EMBER_STORE_FILE)";

function addReleaseSigningConfig(src) {
  if (src.includes(RELEASE_MARKER)) return src; // already applied
  if (!src.includes(DEBUG_BLOCK)) {
    throw new Error(
      "[withReleaseSigning] debug signingConfigs block not found in android/app/build.gradle"
    );
  }
  return src.replace(DEBUG_BLOCK, DEBUG_BLOCK + "\n" + RELEASE_BLOCK);
}

function useReleaseSigning(src) {
  // Match ONLY the release buildType: `release {` immediately followed by
  // comment lines and then the signingConfig line. (A loose `release { ... }`
  // match would span across blocks and hit the debug buildType instead.)
  const donePattern = /release\s*\{\n(?:\s*\/\/[^\n]*\n)+\s*signingConfig signingConfigs\.release/;
  if (donePattern.test(src)) return src; // already applied
  const pattern = /(\n\s*release\s*\{\n(?:\s*\/\/[^\n]*\n)+)(\s*)signingConfig signingConfigs\.debug/;
  if (!pattern.test(src)) {
    throw new Error(
      "[withReleaseSigning] release buildType with debug signingConfig not found in android/app/build.gradle"
    );
  }
  return src.replace(pattern, "$1$2signingConfig signingConfigs.release");
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let src = config.modResults.contents;
    src = addReleaseSigningConfig(src);
    src = useReleaseSigning(src);
    config.modResults.contents = src;
    return config;
  });
};
