const fs = require('fs');
let data = fs.readFileSync('src/monetization/monetization.service.ts', 'utf8');

const target1 = 'this.prisma.$queryRaw<any[]>\\`SELECT \\\\\\`value\\\\\\` FROM SystemSetting WHERE \\\\\\`key\\\\\\` = \\'monetization_rates\\'\\`,';
const replace1 = "this.prisma.$queryRaw<any[]>\`SELECT \\\`value\\\` FROM SystemSetting WHERE \\\`key\\\` = 'monetization_rates'\`,";

const target2 = 'this.prisma.$queryRaw<any[]>\\`SELECT \\\\\\`value\\\\\\` FROM SystemSetting WHERE \\\\\\`key\\\\\\` = \\'monetization_rules\\'\\`,';
const replace2 = "this.prisma.$queryRaw<any[]>\`SELECT \\\`value\\\` FROM SystemSetting WHERE \\\`key\\\` = 'monetization_rules'\`,";

data = data.replace(target1, replace1);
data = data.replace(target2, replace2);

fs.writeFileSync('src/monetization/monetization.service.ts', data);
console.log('Fixed syntax again');
