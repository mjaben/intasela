"use client";

import { useState } from "react";
import PostCard from "./PostCard";

export default function ThreadedReply({ 
  reply, 
  isLastInList, 
  onReplyDeleted,
  depth = 0
}: { 
  reply: any; 
  isLastInList: boolean;
  onReplyDeleted: () => void;
  depth?: number;
}) {
  const [childReplies, setChildReplies] = useState<any[] | null>(reply.replies || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!!reply.replies && reply.replies.length > 0);

  const hasChildren = reply.stats?.replies > 0;

  const handleToggleReplies = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    
    if (childReplies !== null) {
      setIsExpanded(true);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${reply.id}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch child replies");
      const data = await res.json();
      setChildReplies(data.replies || []);
      setIsExpanded(true);
    } catch (err) {
      console.error("Error fetching child replies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // We draw the vertical thread line from the PostCard if we are expanding child replies,
  // OR if we have children and haven't expanded them yet (so the line connects to the "Show replies" button).
  const showThreadLine = hasChildren;

  return (
    <div className="relative">
      <PostCard 
        id={reply.id}
        createdAt={reply.createdAt}
        author={{
          name: reply.author.firstName || reply.author.username,
          username: reply.author.username,
          avatarUrl: reply.author.avatarUrl,
          isFollowing: reply.author.isFollowing,
          isFollower: reply.author.isFollower
        }}
        content={reply.content} 
        earned={reply.earned || 0}
        stats={reply.stats}
        userInteractions={reply.userInteractions}
        quotedPost={reply.quotedPost}
        mediaType={reply.mediaType}
        mediaUrl={reply.mediaUrl}
        mediaUrls={reply.mediaUrls}
        thumbnailUrl={reply.thumbnailUrl}
        poll={reply.poll}
        onDelete={onReplyDeleted}
        isThreadContext={showThreadLine || isExpanded || depth > 0} 
        hasNextInThread={showThreadLine}
      />

      {!isExpanded && hasChildren && (
        <div className="relative flex items-center pt-1 pb-4 cursor-pointer hover:bg-accent/10 transition-colors" onClick={handleToggleReplies}>
          <div className="absolute left-[36px] top-[-24px] bottom-1/2 w-[2px] bg-[#2F3336]" />
          <div className="absolute left-[36px] top-1/2 w-4 h-[2px] bg-[#2F3336]" style={{ borderBottomLeftRadius: '12px' }} />
          
          <button 
            className="pl-[60px] text-brand text-[14px] hover:underline font-medium flex items-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              `Show replies`
            )}
          </button>
        </div>
      )}

      {isExpanded && childReplies && childReplies.length > 0 && (
        <div className="relative">
          <div className="">
            {childReplies.map((child, idx) => (
              <ThreadedReply 
                key={child.id} 
                reply={child} 
                isLastInList={idx === childReplies.length - 1} 
                onReplyDeleted={() => {
                  handleToggleReplies();
                }}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
