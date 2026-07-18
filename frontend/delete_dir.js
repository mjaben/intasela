const fs = require('fs');
const path = require('path');

const oldDir = path.join(__dirname, 'src', 'app', 'spaces', '[id]', 'posts');
fs.rmSync(oldDir, { recursive: true, force: true });
console.log("Deleted old dir");
