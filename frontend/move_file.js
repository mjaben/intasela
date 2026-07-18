const fs = require('fs');
const path = require('path');

const oldDir = path.join(__dirname, 'src', 'app', 'spaces', '[id]', 'posts', '[postId]');
const newDir = path.join(__dirname, 'src', 'app', 'spaces', '[id]', '[username]', 'posts', '[postId]');

fs.mkdirSync(newDir, { recursive: true });

const oldFile = path.join(oldDir, 'page.tsx');
const newFile = path.join(newDir, 'page.tsx');

if (fs.existsSync(oldFile)) {
  fs.copyFileSync(oldFile, newFile);
  console.log("Copied to", newFile);
} else {
  console.log("Old file not found", oldFile);
}
