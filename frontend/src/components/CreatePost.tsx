"use client";

import { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useFeedStore } from "@/store/useFeedStore";
import ReactMarkdown from 'react-markdown';

export default function CreatePost({ onPostCreated, hideInline = false, spaceId }: { onPostCreated: () => void, hideInline?: boolean, spaceId?: string }) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(spaceId || null);
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [acceptType, setAcceptType] = useState<string>("image/*,video/*");
  const [showDrafts, setShowDrafts] = useState(false);
  const [draftsList, setDraftsList] = useState<any[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDurationDays, setPollDurationDays] = useState<number>(1);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  
  const { composerState, openComposer, closeComposer } = useFeedStore();
  const { isOpen, mode, targetPost } = composerState;
  
  const modalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (spaceId) {
      setSelectedSpaceId(spaceId);
      return;
    }
    
    if (isAuthenticated && isOpen) {
      const fetchMySpaces = async () => {
        try {
          const token = localStorage.getItem("access_token");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const mySpaces = data.filter((s: any) => 
              s.members?.some((m: any) => m.userId === user?.id && m.status === 'ACTIVE')
            );
            setSpaces(mySpaces);
          }
        } catch (err) {
          console.error("Failed to fetch spaces for composer", err);
        }
      };
      fetchMySpaces();
    }
  }, [isAuthenticated, isOpen, spaceId, user?.id]);

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/drafts`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDraftsList(data);
        setShowDrafts(true);
      }
    } catch (err) {
      console.error("Failed to load drafts", err);
    }
  };

  const loadDraft = (draft: any) => {
    setContent(draft.content);
    setShowDrafts(false);
    // Ideally we would load media as well, but this is a V1 drafts implementation
  };

  const handleSubmit = async (e?: React.FormEvent | 'DRAFT') => {
    if (typeof e !== 'string' && e) e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      let mediaData = null;
      let mediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const endpoint = file.type.startsWith("video/") ? "/uploads/video" : "/uploads/image";
          
          const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
          });
          
          if (!uploadRes.ok) {
            const errRes = await uploadRes.json();
            throw new Error(errRes.message || "Failed to upload media");
          }
          return await uploadRes.json();
        });
        
        const results = await Promise.all(uploadPromises);
        mediaData = results[0]; // For fallback and video details
        mediaUrls = results.map(r => r.url);
      }

      const payload: any = { content };
      
      if (mode === 'REPLY' && targetPost) {
        payload.parentId = targetPost.id;
      } else if (mode === 'QUOTE' && targetPost) {
        payload.quotedPostId = targetPost.id;
      }
      
      if (selectedSpaceId) {
        payload.spaceId = selectedSpaceId;
      }

      if (mediaData) {
        payload.mediaUrl = mediaData.url;
        if (mediaUrls.length > 0) {
          payload.mediaUrls = mediaUrls;
        }
        payload.mediaType = mediaData.mediaType || (mediaFiles[0]?.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
        payload.thumbnailUrl = mediaData.thumbnailUrl;
        payload.videoWidth = mediaData.width;
        payload.videoHeight = mediaData.height;
        payload.videoDuration = mediaData.duration;
      }
      
      // If saving as draft, flag it
      if (e === 'DRAFT') {
        payload.status = 'DRAFT';
      }

      if (showPoll) {
        payload.pollOptions = pollOptions.filter(o => o.trim() !== '');
        payload.pollDurationDays = pollDurationDays;
      }

      if (showSchedule && scheduledFor) {
        payload.scheduledFor = new Date(scheduledFor).toISOString();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Failed to create post");
      }

      setContent(""); // Clear input on success
      setMediaFiles([]);
      mediaPreviews.forEach(p => URL.revokeObjectURL(p));
      setMediaPreviews([]);
      setShowPoll(false);
      setPollOptions(['', '']);
      setShowSchedule(false);
      setScheduledFor("");
      closeComposer(); // Close modal
      onPostCreated(); // Refresh feed
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const hasVideo = files.some(f => f.type.startsWith('video/')) || mediaFiles.some(f => f.type.startsWith('video/'));
    
    if (hasVideo && (files.length > 1 || mediaFiles.length > 0)) {
      setError("You can only upload 1 video per post, and it cannot be mixed with images.");
      return;
    }

    if (mediaFiles.length + files.length > 4) {
      setError("You can only upload up to 4 images per post.");
      return;
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Each file size must be less than 10MB");
        return;
      }
    }

    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    setError("");
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Inline Compact State for top of Feed */}
      {!hideInline && (
        <div 
          onClick={() => openComposer('CREATE')}
          className="flex items-center gap-3 p-4 bg-transparent border border-white/20 rounded-xl cursor-text hover:border-white/30 transition-colors shadow-sm"
        >
          <UserAvatar src={user?.avatarUrl} fallback={user?.username} />
          <span className="text-gray-400 font-medium text-[15px]">Drop your thought...</span>
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
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white text-[15px]">{user?.username}</span>
                      
                      {!spaceId && spaces.length > 0 && mode !== 'REPLY' && mode !== 'QUOTE' && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsSpaceDropdownOpen(!isSpaceDropdownOpen)}
                            className="flex items-center gap-1.5 bg-[#262626]/80 hover:bg-[#333333] text-xs font-medium text-[#3BC492] px-3 py-1 rounded-full border border-[#3BC492]/20 transition-colors"
                          >
                            {selectedSpaceId ? spaces.find(s => s.id === selectedSpaceId)?.name : "Public Feed"}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isSpaceDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                          
                          {isSpaceDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsSpaceDropdownOpen(false)}></div>
                              <div className="absolute top-full left-0 mt-2 w-48 bg-[#18181b] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1">
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedSpaceId(null); setIsSpaceDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${!selectedSpaceId ? 'bg-[#3BC492]/10 text-[#3BC492]' : 'text-gray-300 hover:bg-white/5'}`}
                                  >
                                    Public Feed
                                    {!selectedSpaceId && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                  </button>
                                  {spaces.map(s => (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => { setSelectedSpaceId(s.id); setIsSpaceDropdownOpen(false); }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedSpaceId === s.id ? 'bg-[#3BC492]/10 text-[#3BC492]' : 'text-gray-300 hover:bg-white/5'}`}
                                    >
                                      <span className="truncate pr-2">{s.name}</span>
                                      {selectedSpaceId === s.id && <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Drafts Button */}
                    <button 
                      onClick={showDrafts ? () => setShowDrafts(false) : fetchDrafts}
                      className="text-[14px] font-medium text-[#3BC492] hover:text-[#2fa076] transition-colors absolute right-0 top-0"
                    >
                      {showDrafts ? 'Back' : 'Drafts'}
                    </button>
                  </div>
                  
                  {showDrafts ? (
                    <div className="w-full bg-transparent min-h-[150px] mt-1 overflow-y-auto max-h-[300px]">
                      {draftsList.length === 0 ? (
                        <div className="text-gray-500 text-center pt-8">No drafts found.</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {draftsList.map(draft => (
                            <div 
                              key={draft.id} 
                              onClick={() => loadDraft(draft)}
                              className="p-3 border border-white/10 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <p className="text-white text-sm line-clamp-2">{draft.content || "Empty draft"}</p>
                              <span className="text-gray-500 text-xs block mt-1">{new Date(draft.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder={mode === 'REPLY' ? "Drop your reply" : "Drop your thought..."}
                      className={`w-full bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none resize-none ${mode === 'REPLY' ? 'min-h-[60px]' : mode === 'QUOTE' ? 'min-h-[40px] mt-2' : 'min-h-[60px] mt-1'}`}
                      autoFocus
                    />
                  )}
                  
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
                  {mediaPreviews.length > 0 && (
                    <div className="mt-3 flex overflow-x-auto snap-x snap-mandatory gap-0.5 pb-1 no-scrollbar">
                      {mediaPreviews.map((preview, index) => (
                        <div key={preview} className={`relative shrink-0 ${mediaPreviews.length > 1 ? 'w-[85%]' : 'w-full'} snap-center rounded-lg overflow-hidden bg-black/20 flex justify-center border border-white/10 group`}>
                          <button 
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 backdrop-blur-md transition opacity-0 group-hover:opacity-100 z-10"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                          </button>
                          {mediaFiles[index]?.type.startsWith('video/') ? (
                            <video src={preview} controls className="max-h-[300px] w-full object-cover" />
                          ) : (
                            <img src={preview} className="max-h-[300px] w-full object-cover" alt={`Upload preview ${index + 1}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* POLL UI */}
              {showPoll && (
                <div className="px-16 pb-4">
                  <div className="border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-3 border-b border-gray-800 space-y-3">
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 relative">
                          <input 
                            type="text" 
                            placeholder={`Choice ${i + 1}${i > 1 ? ' (optional)' : ''}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...pollOptions];
                              newOpts[i] = e.target.value;
                              setPollOptions(newOpts);
                            }}
                            className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#3BC492] text-[15px]"
                          />
                          {i > 1 && (
                            <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="absolute right-3 text-gray-500 hover:text-red-500">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 4 && (
                        <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[#3BC492] hover:text-[#2fa076] text-[15px] p-2 flex items-center gap-1 transition-colors w-full rounded-md hover:bg-[#3BC492]/10 justify-center border border-dashed border-[#3BC492]/30">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                          Add Choice
                        </button>
                      )}
                    </div>
                    <div className="p-3 bg-gray-900/30 flex items-center justify-between">
                      <span className="text-gray-400 text-[15px]">Poll length</span>
                      <select 
                        value={pollDurationDays} 
                        onChange={e => setPollDurationDays(Number(e.target.value))}
                        className="bg-transparent text-white border border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#3BC492]"
                      >
                        <option value={1}>1 Day</option>
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SCHEDULE UI */}
              {showSchedule && (
                <div className="px-16 pb-4">
                  <div className="border border-gray-800 rounded-2xl overflow-hidden p-4">
                    <h3 className="text-white text-[15px] font-bold mb-3 flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path></svg>
                      Schedule Post
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1.5 block">Date & Time</label>
                        <input 
                          type="datetime-local" 
                          value={scheduledFor}
                          onChange={(e) => setScheduledFor(e.target.value)}
                          className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#3BC492] text-[15px]"
                        />
                        <p className="text-gray-500 text-xs mt-1.5">Scheduled posts will be published at this exact time in your local timezone.</p>
                      </div>
                      {scheduledFor && new Date(scheduledFor) < new Date() && (
                        <p className="text-red-500 text-sm">Please select a time in the future.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && <div className="px-6 pb-2 text-red-500 text-sm">{error}</div>}

              {/* Footer Toolbar */}
              <div className="flex items-center justify-between p-4 border-t border-gray-800/50 bg-[#141416]">
                <div className="flex items-center gap-1">
                  <input 
                    type="file" 
                    accept={acceptType} multiple={acceptType.includes('image')}
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                  />
                  
                  {/* Image Button */}
                  <button 
                    type="button" 
                    onClick={() => { setAcceptType("image/*"); setTimeout(() => fileInputRef.current?.click(), 0); }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" 
                    title="Image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                  </button>

                  {/* Video Button */}
                  <button 
                    type="button" 
                    onClick={() => { setAcceptType("video/mp4,video/webm,video/quicktime"); setTimeout(() => fileInputRef.current?.click(), 0); }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors" 
                    title="Video"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>

                  {/* Poll Button */}
                  <button 
                    type="button" 
                    onClick={() => { setShowPoll(!showPoll); setShowSchedule(false); }}
                    className={`p-2 rounded-full transition-colors hidden sm:block ${showPoll ? 'text-[#3BC492] bg-[#3BC492]/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    title="Poll"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  </button>

                  {/* Schedule Button */}
                  <button 
                    type="button" 
                    onClick={() => { setShowSchedule(!showSchedule); setShowPoll(false); }}
                    className={`p-2 rounded-full transition-colors hidden sm:block ${showSchedule ? 'text-[#3BC492] bg-[#3BC492]/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    title="Schedule"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (content.trim() || mediaFiles.length > 0) {
                        handleSubmit('DRAFT');
                      } else {
                        closeComposer();
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                  >
                    {(content.trim() || mediaFiles.length > 0) ? "Save Draft" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading || (!content.trim() && mediaFiles.length === 0)}
                    className={`px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2 ${
                      loading || (!content.trim() && mediaFiles.length === 0) 
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
                    {loading ? "Processing..." : (mode === 'REPLY' ? 'Reply' : 'Sela')}
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
