const fs = require('fs');
const path = require('path');

const files = [
  'c:/Users/HP/Desktop/intasela/frontend/src/app/page.tsx',
  'c:/Users/HP/Desktop/intasela/frontend/src/app/[username]/page.tsx',
  'c:/Users/HP/Desktop/intasela/frontend/src/app/[username]/posts/[id]/page.tsx',
  'c:/Users/HP/Desktop/intasela/frontend/src/app/spaces/[id]/page.tsx',
  'c:/Users/HP/Desktop/intasela/frontend/src/app/bookmarks/page.tsx',
  'c:/Users/HP/Desktop/intasela/frontend/src/app/ads/campaigns/new/page.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We only want to replace if createdAt is not already there
    // We can do a string replacement on id={post.id} -> id={post.id}\ncreatedAt={post.createdAt}
    const lines = content.split('\n');
    let modified = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('id={post.id}') && !lines[i].includes('createdAt')) {
        // Just add createdAt on the same line or next line
        // Actually, some might be `id={post.id}`
        lines[i] = lines[i].replace('id={post.id}', 'id={post.id}\ncreatedAt={post.createdAt}');
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, lines.join('\n'), 'utf8');
      console.log('Updated ' + file);
    }
  }
}
