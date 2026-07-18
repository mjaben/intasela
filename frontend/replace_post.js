const fs = require('fs');
const path = require('path');

const replacements = [
    // Exact capitalized phrases
    [/\bCreate Post\b/g, 'Create Sela'],
    [/\bBoost Post\b/g, 'Boost Sela'],
    [/\bDelete Post\b/g, 'Delete Sela'],
    [/\bMute this post\b/g, 'Mute this sela'],
    [/\bUnmute this post\b/g, 'Unmute this sela'],
    [/\bDeleting post\.\.\./g, 'Deleting sela...'],
    [/\bFailed to delete post\b/g, 'Failed to delete sela'],
    [/\bPost Impressions\b/g, 'Sela Impressions'],
    [/\bPost media\b/g, 'Sela media'],
    [/\bPost your reply\b/g, 'Drop your reply'],
    
    // Text inside JSX tags
    [/>Post</g, '>Sela<'],
    [/>Posts</g, '>Selas<'],
    [/>Posts\b/g, '>Selas'],
    [/>\s*Post\s*</g, '>Sela<'],
    
    // Specific sentences
    [/liked your post/g, 'liked your sela'],
    [/resela\'d your post/g, "resela'd your sela"],
    [/replied to your post/g, 'replied to your sela'],
    [/quoted your post/g, 'quoted your sela'],
    [/Check out this post/g, 'Check out this sela'],
    [/No posts in this space/g, 'No selas in this space'],
    [/pending posts/g, 'pending selas'],
    
    // Generic lowercase with "this" or "a"
    [/\bthis post\b/g, 'this sela'],
    [/\ba post\b/g, 'a sela'],
    [/\byour post\b/g, 'your sela'],
    
    // Plurals
    [/12\.5K posts/g, '12.5K selas'],
    [/8,432 posts/g, '8,432 selas'],
    [/5,210 posts/g, '5,210 selas'],
    [/3,100 posts/g, '3,100 selas'],
    [/\bK posts\b/g, 'K selas'],
    
    // Buttons/Actions
    [/"Post"/g, '"Sela"'],
    [/'Post'/g, "'Sela'"],
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
