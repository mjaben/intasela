"use client";

import { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isAuthenticated) return null;

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scrolling
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:3001/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      setContent(""); // Clear input on success
      setIsExpanded(false); // Close modal
      onPostCreated(); // Refresh feed
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const UserAvatar = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const classes = size === "md" ? "w-10 h-10" : "w-8 h-8";
    return user?.avatarUrl ? (
      <img src={user.avatarUrl} alt="Avatar" className={`${classes} rounded-full object-cover bg-gray-800 shrink-0`} />
    ) : (
      <div className={`${classes} rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0`}>
        <span className="text-gray-400 font-medium">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Inline Compact State */}
      {!isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 p-4 bg-[#18181b] border border-gray-800 rounded-xl cursor-text hover:border-gray-700 transition-colors"
        >
          <UserAvatar />
          <span className="text-gray-400 font-medium">What's on your mind?</span>
        </div>
      )}

      {/* Expanded Modal State */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            ref={modalRef}
            className="w-full max-w-[600px] bg-[#18181b] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col h-full max-h-[80vh]">
              {/* Header */}
              <div className="flex justify-between items-start p-6 pb-2">
                <div className="flex items-start gap-3 w-full">
                  <UserAvatar size="md" />
                  <div className="flex flex-col w-full">
                    <span className="font-semibold text-white">{user?.firstName} {user?.lastName}</span>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none resize-none mt-1 min-h-[150px]"
                      autoFocus
                    />
                  </div>
                </div>
                <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors shrink-0">
                  Drafts
                </button>
              </div>

              {/* Error Message */}
              {error && <div className="px-6 pb-2 text-red-500 text-sm">{error}</div>}

              {/* Footer Toolbar */}
              <div className="flex items-center justify-between p-4 border-t border-gray-800/50 bg-[#141416]">
                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" title="Image">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                  </button>
                  <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" title="Video">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                  <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" title="Emoji">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
                  <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors hidden sm:block" title="Poll">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  </button>
                  <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors hidden sm:block" title="Schedule">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path></svg>
                  </button>
                  <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" title="More options">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading || !content.trim()}
                    className={`px-5 py-2 rounded-full font-bold transition-colors ${
                      loading || !content.trim() 
                        ? "bg-[#262626] text-gray-500 cursor-not-allowed" 
                        : "bg-[#3BC492] hover:bg-[#2fa076] text-black"
                    }`}
                  >
                    {loading ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
