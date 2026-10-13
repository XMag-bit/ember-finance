const r = require('expo-modules-autolinking')(['resolve', '--json', '--platform', 'android']);
for (const m of r.modules) {
  console.log('===', m.packageName, '===');
  console.log('projects:', m.projects);
  console.log('plugins:', m.plugins);
  console.log('modules:', m.modules);
}