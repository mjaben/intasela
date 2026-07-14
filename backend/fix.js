const fs = require('fs');
let data = fs.readFileSync('src/monetization/monetization.service.ts', 'utf8');
data = data.replace(/\\\`/g, '`');
data = data.replace(/\\\$/g, '$');
fs.writeFileSync('src/monetization/monetization.service.ts', data);
console.log('Fixed monetization.service.ts');
