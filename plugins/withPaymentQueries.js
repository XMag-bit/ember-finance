/**
 * withPaymentQueries - lets the app ask Android whether payment apps can be
 * opened (Linking.canOpenURL) on Android 11+ (API 30+), where package
 * visibility rules otherwise hide them. Adds one <intent> VIEW query per
 * URL scheme. Idempotent: running prebuild twice adds nothing twice.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

const SCHEMES = [
  "gopay",
  "ovo",
  "dana",
  "shopeepay",
  "linkaja",
  "bcamobile",
  "brimo",
  "livin",
  "bni",
];

function ensureQueries(manifest) {
  if (!manifest.queries) manifest.queries = [{}];
  const queries = manifest.queries[0];
  if (!queries.intent) queries.intent = [];
  const hasScheme = (scheme) =>
    queries.intent.some((entry) =>
      (entry.data || []).some((d) => d.$ && d.$["android:scheme"] === scheme)
    );
  for (const scheme of SCHEMES) {
    if (hasScheme(scheme)) continue;
    queries.intent.push({
      action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
      data: [{ $: { "android:scheme": scheme } }],
    });
  }
  return manifest;
}

module.exports = function withPaymentQueries(config) {
  return withAndroidManifest(config, (config) => {
    if (!config.modResults.manifest) {
      throw new Error("[withPaymentQueries] <manifest> element not found in AndroidManifest.xml");
    }
    config.modResults.manifest = ensureQueries(config.modResults.manifest);
    return config;
  });
};
