"use client";

import { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useFeedStore } from "@/store/useFeedStore";
import ReactMarkdown from 'react-markdown';

export default function CreatePost({ onPostCreated, hideInline = false }: { onPostCreated: () => void, hideInline?: boolean }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  
  const { composerState, openComposer, closeComposer } = useFeedStore();
  const { isOpen, mode, targetPost } = composerState;
  
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isAuthenticated) return null;

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeComposer();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeComposer]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      let mediaData = null;

      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        const endpoint = mediaFile.type.startsWith("video/") ? "/uploads/video" : "/uploads/image";
        
        const uploadRes = await fetch(`http://localhost:3001${endpoint}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        
        if (!uploadRes.ok) {
          const errRes = await uploadRes.json();
          throw new Error(errRes.message || "Failed to upload media");
        }
        mediaData = await uploadRes.json();
      }

      const payload: any = { content };
      
      if (mode === 'REPLY' && targetPost) {
        payload.parentId = targetPost.id;
      } else if (mode === 'QUOTE' && targetPost) {
        payload.quotedPostId = targetPost.id;
      }

      if (mediaData) {
        payload.mediaUrl = mediaData.url;
        payload.mediaType = mediaData.mediaType || (mediaFile?.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
        payload.thumbnailUrl = mediaData.thumbnailUrl;
        payload.videoWidth = mediaData.width;
        payload.videoHeight = mediaData.height;
        payload.videoDuration = mediaData.duration;
      }

      const res = await fetch("http://localhost:3001/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create post");

      setContent(""); // Clear input on success
      setMediaFile(null);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
      closeComposer(); // Close modal
      onPostCreated(); // Refresh feed
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setMediaFile(file);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const UserAvatar = ({ size = "sm", src, fallback }: { size?: "sm" | "md", src?: string, fallback?: string }) => {
    const classes = size === "md" ? "w-10 h-10" : "w-8 h-8";
    return src ? (
      <img src={src} alt="Avatar" className={`${classes} rounded-full object-cover bg-gray-800 shrink-0`} />
    ) : (
      <div className={`${classes} rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0`}>
        <span className="text-gray-400 font-medium">
          {fallback?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Inline Compact State for top of Feed */}
      {!hideInline && (
        <div 
          onClick={() => openComposer('CREATE')}
          className="flex items-center gap-3 p-4 bg-[#18181b] border border-white/20 rounded-xl cursor-text hover:border-white/30 transition-colors shadow-sm"
        >
          <UserAvatar src={user?.avatarUrl} fallback={user?.username} />
          <span className="text-gray-400 font-medium">Drop your thought...</span>
        </div>
      )}

      {/* Expanded Modal State */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            ref={modalRef}
            className="w-full max-w-[600px] bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col h-full max-h-[80vh] overflow-y-auto">
              
              {/* REPLY MODE UI */}
              {mode === 'REPLY' && targetPost && (
                <div className="px-6 pt-6 pb-2">
                  <div className="flex gap-4 relative">
                    {/* Vertical thread line connecting avatars */}
                    <div className="absolute left-[20px] top-12 bottom-[-16px] w-[2px] bg-gray-700/50 z-0"></div>
                    
                    <div className="z-10 bg-[#18181b] pb-1">
                      <UserAvatar size="md" src={targetPost.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${targetPost.author}`} fallback={targetPost.author} />
                    </div>
                    
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">{targetPost.author}</span>
                        <span className="text-gray-500 text-sm">2h</span>
                      </div>
                      <div className="text-gray-300 mt-1 prose prose-invert max-w-none text-[15px] leading-relaxed">
                        <ReactMarkdown>{targetPost.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Input Area */}
              <div className="flex items-start gap-4 p-6 pb-2 relative z-10">
                <UserAvatar size="md" src={user?.avatarUrl} fallback={user?.username} />
                <div className="flex flex-col w-full relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white text-[15px]">{user?.username}</span>
                    
                    {/* Drafts Button */}
                    <button className="text-[14px] font-medium text-white hover:text-gray-300 transition-colors absolute right-0 top-0">
                      Drafts
                    </button>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={mode === 'REPLY' ? "Post your reply" : "Drop your thought..."}
                    className={`w-full bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none resize-none ${mode === 'REPLY' ? 'min-h-[80px]' : mode === 'QUOTE' ? 'min-h-[40px] mt-2' : 'min-h-[150px] mt-1'}`}
                    autoFocus
                  />
                  
                  {/* QUOTE PREVIEW UI */}
                  {mode === 'QUOTE' && targetPost && (
                    <div className="mt-2 border border-white/20 rounded-2xl p-4 bg-[#141416] relative group shadow-sm">
                      <button 
                        onClick={() => openComposer('CREATE')}
                        className="absolute top-3 right-3 text-gray-500 hover:text-white hover:bg-gray-800 p-1.5 rounded-full transition-colors"
                        title="Remove quote"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                      </button>
                      
                      <div className="flex items-center gap-2 mb-2 pr-8">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-muted shrink-0">
                          <img src={targetPost.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${targetPost.author}`} alt={targetPost.author} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-[14px] text-white">{targetPost.author}</span>
                        <span className="text-gray-500 text-sm">Jun 13</span>
                      </div>
                      <div className="text-[14px] text-gray-300 prose prose-invert max-w-none line-clamp-4 leading-relaxed">
                        <ReactMarkdown>{targetPost.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* MEDIA PREVIEW UI */}
                  {mediaPreview && (
                    <div className="mt-3 relative rounded-xl overflow-hidden max-h-[300px] bg-black/20 flex justify-center border border-white/10">
                      <button 
                        onClick={removeMedia}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 backdrop-blur-md transition z-10"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                      </button>
                      {mediaFile?.type.startsWith('video/') ? (
                        <video src={mediaPreview} controls className="max-h-[300px] object-contain" />
                      ) : (
                        <img src={mediaPreview} className="max-h-[300px] object-contain" alt="Upload preview" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && <div className="px-6 pb-2 text-red-500 text-sm">{error}</div>}

              {/* Footer Toolbar */}
              <div className="flex items-center justify-between p-4 border-t border-gray-800/50 bg-[#141416]">
                <div className="flex items-center gap-1">
                  <input 
                    type="file" 
                    accept="image/*,video/mp4,video/webm,video/quicktime" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" 
                    title="Media (Image/Video)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                  </button>
                  <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors hidden sm:block" title="Poll">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => closeComposer()}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading || (!content.trim() && !mediaFile)}
                    className={`px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2 ${
                      loading || (!content.trim() && !mediaFile) 
                        ? "bg-[#262626] text-gray-500 cursor-not-allowed" 
                        : "bg-[#3BC492] hover:bg-[#2fa076] text-black"
                    }`}
                  >
                    {loading && (
                      <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {loading ? "Processing..." : (mode === 'REPLY' ? 'Reply' : 'Post')}
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
