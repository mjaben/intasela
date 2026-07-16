const fs = require('fs');
const filePath = 'src/components/PostCard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const renderTopRightActionsCode = `
  const renderTopRightActions = () => (
    <div className="flex items-center gap-2 relative">
      {user?.username !== author.username && !isFollowing && (
        <button 
          onClick={async (e) => { 
            e.stopPropagation(); 
            if(!isAuthenticated) return router.push("/login"); 
            try {
              const token = localStorage.getItem("access_token");
              await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/\${author.username}/follow\`, {
                method: "POST",
                headers: { "Authorization": \`Bearer \${token}\` }
              });
              setFollow(author.username, true);
            } catch (err) {
              console.error(err);
            }
          }}
          className="text-primary font-bold text-[11px] px-3 py-1 rounded-full border border-primary/40 hover:bg-primary/10 transition-colors uppercase tracking-wide whitespace-nowrap"
        >
          {author.isFollower ? "Follow Back" : "Follow"}
        </button>
      )}

      {/* 3-dot Menu (Available to all) */}
      <div className="relative">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(!showOptionsMenu); }}
          className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </button>
        
        {showOptionsMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(false); }}></div>
            <div className="absolute top-8 right-0 z-20 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[160px]">
              
              {/* Copy Link Option - Common to all */}
              <button 
                onClick={handleCopyLink} 
                className="w-full px-2.5 py-2 hover:bg-accent text-left rounded-lg text-foreground font-medium flex items-center gap-2.5 transition-colors text-[13px]"
              >
                {copySuccess ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-[#22c55e]">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    Copy link
                  </>
                )}
              </button>

              {user?.username === author.username ? (
                /* Author-only Options */
                <button 
                  onClick={handleDelete} 
                  className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Delete
                </button>
              ) : (
                /* Non-Author Options */
                <>
                  {isFollowing ? (
                    <button 
                      onClick={handleUnfollow} 
                      className="w-full px-2.5 py-2 hover:bg-accent text-left rounded-lg text-foreground font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                      Unfollow @{author.username}
                    </button>
                  ) : (
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        if(!isAuthenticated) return router.push("/login"); 
                        try {
                          const token = localStorage.getItem("access_token");
                          await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/\${author.username}/follow\`, {
                            method: "POST",
                            headers: { "Authorization": \`Bearer \${token}\` }
                          });
                          setFollow(author.username, true);
                          setShowOptionsMenu(false);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="w-full px-2.5 py-2 hover:bg-accent text-left rounded-lg text-foreground font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                      {\`Follow @\${author.username} Back\`}
                    </button>
                  )}
                  
                  <div className="h-px bg-white/10 my-1 mx-1"></div>
                  
                  <button 
                    onClick={handleMute} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                    {isUserMuted ? \`Unmute @\${author.username}\` : \`Mute @\${author.username}\`}
                  </button>
                  
                  <button 
                    onClick={handleBlock} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    {isUserBlocked ? \`Unblock @\${author.username}\` : \`Block @\${author.username}\`}
                  </button>

                  <button 
                    onClick={handleMutePost} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>
                    {isPostMuted ? \`Unmute this post\` : \`Mute this post\`}
                  </button>
                  
                  <button 
                    onClick={handleReportClick} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    Report
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
`;

content = content.replace('  return (\n    <>\n    <style>{SCREAM_ANIMATION}</style>', renderTopRightActionsCode + '\n  return (\n    <>\n    <style>{SCREAM_ANIMATION}</style>');

const originalLayoutRegex = /<div className="flex gap-3">[\s\S]*?\/\* Body \*\//;

const newLayout = `      <div className={\`flex \${isDetailedView ? 'flex-col gap-3' : 'gap-3'}\`}>
        {/* Detailed View Header */}
        {isDetailedView && (
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-10 h-10 rounded-full bg-muted shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => { e.stopPropagation(); router.push(\`/@\${author.username}\`); }}
              >
                <img src={author.avatarUrl || \`https://api.dicebear.com/7.x/notionists/svg?seed=\${author.username}\`} alt={author.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(\`/@\${author.username}\`); }}>
                <span className="font-bold text-[15px] hover:underline leading-tight">{author.name}</span>
                <span className="text-muted-foreground text-[14px] leading-tight">@{author.username}</span>
              </div>
            </div>
            {renderTopRightActions()}
          </div>
        )}

        {/* Avatar for normal view */}
        {!isDetailedView && (
          <div 
            className="w-10 h-10 rounded-full bg-muted shrink-0 overflow-hidden mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => { e.stopPropagation(); router.push(\`/@\${author.username}\`); }}
          >
            <img src={author.avatarUrl || \`https://api.dicebear.com/7.x/notionists/svg?seed=\${author.username}\`} alt={author.name} className="w-full h-full object-cover" />
          </div>
        )}
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header for normal view */}
          {!isDetailedView && (
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center">
                <span 
                  className="font-bold mr-2 text-[14px] cursor-pointer hover:underline"
                  onClick={(e) => { e.stopPropagation(); router.push(\`/@\${author.username}\`); }}
                >
                  {author.name}
                </span>
                <span className="text-muted-foreground text-[13px]">2h</span>
              </div>
              {renderTopRightActions()}
            </div>
          )}
          
          {/* Body */`;

content = content.replace(originalLayoutRegex, newLayout);

// Body text size change
const bodyRegex = /<div className="text-\\[14px\\] leading-relaxed mb-2 text-foreground\\/90 break-words prose prose-invert max-w-none">/;
content = content.replace(bodyRegex, `<div className={\`leading-relaxed mb-2 text-foreground/90 break-words prose prose-invert max-w-none \${isDetailedView ? 'text-[17px]' : 'text-[14px]'}\`}>`);

// Add Engagement Stats right above Engagement Bar
const engagementBarRegex = /\{\/\* Engagement Bar \*\/\}\s*<div className="flex items-center gap-5 sm:gap-8 text-muted-foreground text-\[13px\] mt-1 pr-2 sm:pr-4">/;
const newEngagementBar = `{/* Engagement Stats (Detailed View Only) */}
          {isDetailedView && (
            <div className="py-4 border-y border-border/50 my-3 text-[15px] text-muted-foreground flex items-center gap-5 overflow-x-auto whitespace-nowrap hide-scrollbar">
              <span><b className="text-foreground font-bold">{stats.reselas || 0}</b> Reselas</span>
              <span><b className="text-foreground font-bold">{stats.likes || 0}</b> Likes</span>
              <span><b className="text-foreground font-bold">{stats.bookmarks || bookmarkCount || 0}</b> Bookmarks</span>
            </div>
          )}

          {/* Engagement Bar */}
          <div className={\`flex items-center text-muted-foreground text-[13px] \${isDetailedView ? 'justify-around py-1' : 'gap-5 sm:gap-8 mt-1 pr-2 sm:pr-4'}\`}>`;

content = content.replace(engagementBarRegex, newEngagementBar);

fs.writeFileSync(filePath, content);
console.log('PostCard.tsx updated successfully.');
