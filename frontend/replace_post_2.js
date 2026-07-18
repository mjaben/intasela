const fs = require('fs');
const path = require('path');

const replacements = [
    [/\bLoading post\.\.\./g, 'Loading sela...'],
    [/\bPost not found\b/g, 'Sela not found'],
    [/\bRequire Approval for First Post\b/g, 'Require Approval for First Sela'],
    [/\bRequire Approval for All Posts\b/g, 'Require Approval for All Selas'],
    [/\bDelete all posts\b/g, 'Delete all selas'],
    [/\bPermanently delete all your posts\b/g, 'Permanently delete all your selas'],
    [/\bNo posts yet\. Be the first to post!\b/g, 'No selas yet. Be the first to sela!'],
    [/\bTotal Posts\b/g, 'Total Selas'],
    [/\bSave posts for later\b/g, 'Save selas for later'],
    [/\bBookmark Posts\b/g, 'Bookmark Selas'],
    [/\bSelect Post to Promote\b/g, 'Select Sela to Promote'],
    [/\bYou have no posts to promote\b/g, 'You have no selas to promote'],
    [/\bChange Post\b/g, 'Change Sela'],
    [/\bNo Post Selected\b/g, 'No Sela Selected'],
    [/\bReview flagged posts\b/g, 'Review flagged selas'],
    [/\bPost ID:/g, 'Sela ID:'],
    [/\bNGN per post\b/g, 'NGN per sela'],
    [/\blow-effort posts\b/g, 'low-effort selas'],
    [/\bprevious post\/reply\b/g, 'previous sela/reply'],
    [/\bown posts\b/g, 'own selas'],
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;
            
            for (const [pattern, replacement] of replacements) {
                newContent = newContent.replace(pattern, replacement);
            }
            
            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'src'));
processDirectory(path.join(__dirname, '../admin-frontend/src'));
