const r = require('expo-modules-autolinking')(['resolve', '--json', '--platform', 'android']);
console.log('Keys:', Object.keys(r));
console.log('Modules:', JSON.stringify(r.modules, null, 2));