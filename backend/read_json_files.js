const fs = require('fs');
const path = require('path');

function readJsonFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  try {
    const rawData = fs.readFileSync(filePath, 'utf16le');
    // Remove BOM if present
    const cleanData = rawData.replace(/^\uFEFF/, '');
    const parsed = JSON.parse(cleanData);
    console.log(`Successfully parsed ${filename}:`);
    console.log(`- Type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
    console.log(`- Length/Keys: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length}`);
    console.log(`- Sample item:`, Array.isArray(parsed) ? parsed[0] : Object.keys(parsed).slice(0, 2));
  } catch (err) {
    console.error(`Error reading ${filename} as UTF-16LE:`, err.message);
    try {
      const rawDataUtf8 = fs.readFileSync(filePath, 'utf8');
      const parsedUtf8 = JSON.parse(rawDataUtf8);
      console.log(`Successfully parsed ${filename} as UTF-8:`);
      console.log(`- Length/Keys: ${Array.isArray(parsedUtf8) ? parsedUtf8.length : Object.keys(parsedUtf8).length}`);
    } catch (err2) {
      console.error(`Error reading ${filename} as UTF-8:`, err2.message);
    }
  }
}

readJsonFile('posts.json');
readJsonFile('user_posts.json');
