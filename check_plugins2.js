const { execSync } = require('child_process');
const output = execSync('node --eval "require(\'expo-modules-autolinking\')([\'resolve\', \'--json\', \'--platform\', \'android\'])"', { cwd: 'D:\\App\\ember-finance' }).toString().trim();
const r = JSON.parse(output);
console.log('Modules:', JSON.stringify(r.modules, null, 2));