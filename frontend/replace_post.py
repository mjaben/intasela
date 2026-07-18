import os
import re

replacements = [
    # Exact capitalized phrases
    (r'\bCreate Post\b', 'Create Sela'),
    (r'\bBoost Post\b', 'Boost Sela'),
    (r'\bDelete Post\b', 'Delete Sela'),
    (r'\bMute this post\b', 'Mute this sela'),
    (r'\bUnmute this post\b', 'Unmute this sela'),
    (r'\bDeleting post\.\.\.', 'Deleting sela...'),
    (r'\bFailed to delete post\b', 'Failed to delete sela'),
    (r'\bPost Impressions\b', 'Sela Impressions'),
    (r'\bPost media\b', 'Sela media'),
    (r'\bPost your reply\b', 'Drop your reply'), # Custom adjustment for "Drop your reply" or "Sela your reply"? The user said "Change all text Post to Sela". So "Sela your reply"? "Sela" can be a verb. I'll use "Drop your reply" because they had "Drop your thought". Wait, they said change "Post" to "Sela". I'll use "Sela your reply".
    (r'\bPost your reply\b', 'Sela your reply'),
    
    # Text inside JSX tags
    (r'>Post<', '>Sela<'),
    (r'>Posts<', '>Selas<'),
    (r'>Posts\b', '>Selas'),
    (r'>\s*Post\s*<', '>Sela<'),
    
    # Specific sentences
    (r'liked your post', 'liked your sela'),
    (r'resela\'d your post', 'resela\'d your sela'),
    (r'replied to your post', 'replied to your sela'),
    (r'quoted your post', 'quoted your sela'),
    (r'Check out this post', 'Check out this sela'),
    (r'No posts in this space', 'No selas in this space'),
    (r'pending posts', 'pending selas'),
    
    # Generic lowercase with "this" or "a"
    (r'\bthis post\b', 'this sela'),
    (r'\ba post\b', 'a sela'),
    (r'\byour post\b', 'your sela'),
    
    # Plurals
    (r'12\.5K posts', '12.5K selas'),
    (r'8,432 posts', '8,432 selas'),
    (r'5,210 posts', '5,210 selas'),
    (r'3,100 posts', '3,100 selas'),
    (r'\bK posts\b', 'K selas'),
    
    # Buttons/Actions
    (r'"Post"', '"Sela"'),
    (r"'Post'", "'Sela'"),
]

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, replacement in replacements:
                    new_content = re.sub(pattern, replacement, new_content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")

process_directory('c:/Users/HP/Desktop/intasela/frontend/src')
process_directory('c:/Users/HP/Desktop/intasela/admin-frontend/src')
