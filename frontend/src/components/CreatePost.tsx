"use client";

import { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useFeedStore } from "@/store/useFeedStore";
import ReactMarkdown from 'react-markdown';

export default function CreatePost({ onPostCreated, hideInline = false, spaceId }: { onPostCreated: () => void, hideInline?: boolean, spaceId?: string }) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedMediaData, setUploadedMediaData] = useState<any[]>([]);
  const [placeholderText, setPlaceholderText] = useState("Drop your thoughts...");
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(spaceId || null);
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [acceptType, setAcceptType] = useState<string>("image/*,video/*");
  const [showDrafts, setShowDrafts] = useState(false);
  const [draftsList, setDraftsList] = useState<any[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
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
    const placeholders = [
      "Drop your thoughts...",
      "What is happening?",
      "Share a moment...",
      "What's on your mind?",
      "Some moments from my last trip..."
    ];
    setPlaceholderText(placeholders[Math.floor(Math.random() * placeholders.length)]);
  }, [isOpen]);

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
    setEditingDraftId(draft.id);
    setShowDrafts(false);
  };

  const deleteDraft = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      setDraftsList(prev => prev.filter(d => d.id !== id));
      if (editingDraftId === id) setEditingDraftId(null);
    } catch (err) {
      console.error("Failed to delete draft", err);
    }
  };

  const handleSubmit = async (e?: React.FormEvent | 'DRAFT') => {
    if (typeof e !== 'string' && e) e.preventDefault();
    if (!content.trim() && uploadedMediaData.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      let mediaData = uploadedMediaData[0] || null;
      let mediaUrls: string[] = uploadedMediaData.map(d => d.url);

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

      if (editingDraftId) {
        payload.draftId = editingDraftId;
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
      setUploadedMediaData([]);
      mediaPreviews.forEach(p => URL.revokeObjectURL(p));
      setMediaPreviews([]);
      setShowPoll(false);
      setPollOptions(['', '']);
      setShowSchedule(false);
      setScheduledFor("");
      setEditingDraftId(null);
      closeComposer(); // Close modal
      onPostCreated(); // Refresh feed
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Start background upload immediately
    setUploadingMedia(true);
    setUploadProgress(0);

    const token = localStorage.getItem("access_token");
    let currentUploadData = [...uploadedMediaData];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const endpoint = file.type.startsWith("video/") ? "/uploads/video" : "/uploads/image";
      
      try {
        const result: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              if (xhr.status === 413) {
                reject(new Error("File is too large. Please select a smaller file."));
              } else {
                reject(new Error("Upload failed. Please try again later."));
              }
            }
          };

          xhr.onerror = () => reject(new Error("Internet connection dropped. Please check your network and try again."));
          xhr.onabort = () => reject(new Error("Upload cancelled"));

          xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, true);
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
        
        currentUploadData.push(result);
      } catch (err: any) {
        if (err.message !== "Upload cancelled") {
          setError(err.message);
        }
        
        // Rollback the UI to match only successfully uploaded files
        setMediaFiles(prev => prev.slice(0, currentUploadData.length));
        setMediaPreviews(prev => {
          // revoke object URLs for the ones we are removing
          const removed = prev.slice(currentUploadData.length);
          removed.forEach(url => URL.revokeObjectURL(url));
          return prev.slice(0, currentUploadData.length);
        });

        setUploadingMedia(false);
        xhrRef.current = null;
        return; // Stop processing further files on error
      }
    }
    
    setUploadedMediaData(currentUploadData);
    setUploadingMedia(false);
    xhrRef.current = null;
  };

  const removeMedia = async (index: number) => {
    // If currently uploading, cancel it
    if (uploadingMedia && xhrRef.current) {
      xhrRef.current.abort();
      setUploadingMedia(false);
      setUploadProgress(0);
    }
    
    const previewToRemove = mediaPreviews[index];
    const uploadedDataToRemove = uploadedMediaData[index];
    
    URL.revokeObjectURL(previewToRemove);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    
    if (uploadedDataToRemove?.url) {
      // Call backend delete endpoint
      try {
        const token = localStorage.getItem("access_token");
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/delete`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ url: uploadedDataToRemove.url })
        });
      } catch (e) {
        console.error("Failed to delete orphaned media", e);
      }
      setUploadedMediaData(prev => prev.filter((_, i) => i !== index));
    }
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
          className="hidden sm:flex items-center gap-3 p-4 bg-transparent border border-white/20 rounded-xl cursor-text hover:border-white/30 transition-colors shadow-sm mb-6"
        >
          <UserAvatar src={user?.avatarUrl} fallback={user?.username} />
          <span className="text-gray-400 font-medium text-[15px]">Drop your thought...</span>
        </div>
      )}

      {/* Expanded Modal State */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#10170E] animate-in slide-in-from-bottom duration-300">
          {/* Subtle gradient background inspired by the mesh */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#ACC8A2]/5 to-transparent pointer-events-none opacity-50" />
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept={acceptType} multiple={acceptType.includes('image')}
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />

          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-4 z-10 sticky top-0 bg-[#10170E]/80 backdrop-blur-xl border-b border-white/5">
            <button onClick={closeComposer} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              <span className="text-[17px] font-medium tracking-tight">{mode === 'REPLY' ? 'New reply' : 'New post'}</span>
            </button>
            <button onClick={showDrafts ? () => setShowDrafts(false) : fetchDrafts} className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 transition-all">
              <span className="text-[14px] font-medium text-white/90">{showDrafts ? 'Back' : 'Drafts'}</span>
              {!showDrafts && draftsList.length > 0 && (
                <div className="bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {draftsList.length}
                </div>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-32 z-10 px-4">
            
            {/* Drafts View */}
            {showDrafts ? (
              <div className="w-full bg-transparent mt-4">
                {draftsList.length === 0 ? (
                  <div className="text-gray-500 text-center pt-8">No drafts found.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {draftsList.map(draft => (
                      <div 
                        key={draft.id} 
                        onClick={() => loadDraft(draft)}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 cursor-pointer transition-colors flex justify-between items-start group"
                      >
                        <div>
                          <p className="text-white text-[15px] line-clamp-2 leading-relaxed">{draft.content || "Empty draft"}</p>
                          <span className="text-gray-500 text-xs block mt-2 font-mono tracking-wide">{new Date(draft.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button 
                          onClick={(e) => deleteDraft(e, draft.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                          title="Delete Draft"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* REPLY/QUOTE MODE PREVIEWS */}
                {mode === 'REPLY' && targetPost && (
                  <div className="pt-6 pb-2">
                    <div className="flex gap-4 relative">
                      <div className="absolute left-[20px] top-12 bottom-[-16px] w-[2px] bg-white/10 z-0"></div>
                      <div className="z-10 bg-[#10170E] pb-1">
                        <UserAvatar size="md" src={targetPost.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${targetPost.author}`} fallback={targetPost.author} />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-[15px]">{targetPost.author}</span>
                          <span className="text-gray-500 text-sm">2h</span>
                        </div>
                        <div className="text-gray-300 mt-1 prose prose-invert max-w-none text-[15px] leading-relaxed">
                          <ReactMarkdown>{targetPost.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'QUOTE' && targetPost && (
                  <div className="mt-4 mb-4 border border-white/10 rounded-2xl p-4 bg-white/5 relative group shadow-sm">
                    <button onClick={() => openComposer('CREATE')} className="absolute top-3 right-3 text-gray-500 hover:text-white bg-black/40 p-1.5 rounded-full transition-colors backdrop-blur-md">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                    <div className="flex items-center gap-2 mb-2 pr-8">
                      <UserAvatar size="sm" src={targetPost.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${targetPost.author}`} fallback={targetPost.author} />
                      <span className="font-bold text-[14px] text-white">{targetPost.author}</span>
                    </div>
                    <div className="text-[14px] text-gray-300 prose prose-invert max-w-none line-clamp-3 leading-relaxed">
                      <ReactMarkdown>{targetPost.content}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Main Composer Area */}
                <div className="flex flex-col pt-4">
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar size="md" src={user?.avatarUrl} fallback={user?.username} />
                    <span className="font-bold text-white text-[16px]">{user?.name || user?.username}</span>
                  </div>
                  
                  {/* Input Area */}
                  <textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder={mode === 'REPLY' ? "Drop your reply..." : placeholderText}
                    className="w-full bg-transparent text-white text-[16px] placeholder-gray-500 focus:outline-none resize-none min-h-[80px] leading-relaxed"
                    autoFocus
                  />
                </div>

                {/* MEDIA PREVIEW UI */}
                {mediaPreviews.length > 0 && (
                  <div className="relative mt-4">
                    <div className={`grid gap-2 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {mediaPreviews.map((preview, index) => (
                        <div key={preview} className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-black/40 border border-white/5 group shadow-lg">
                          <button 
                            onClick={() => removeMedia(index)}
                            className="absolute top-3 right-3 bg-black/60 text-white/90 p-1.5 rounded-full hover:bg-black/80 backdrop-blur-md transition z-10 border border-white/10 shadow-sm"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                          {mediaFiles[index]?.type.startsWith('video/') ? (
                            <video src={preview} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={preview} className="w-full h-full object-cover" alt={`Upload preview ${index + 1}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    {uploadingMedia && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                        {uploadProgress === 100 ? (
                          <div className="flex flex-col items-center gap-3">
                            <svg className="animate-spin h-6 w-6 text-[#ACC8A2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-white text-sm font-medium">Processing...</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-white font-medium text-lg mb-3">{uploadProgress}%</span>
                            <div className="w-[60%] h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full bg-[#ACC8A2] transition-all duration-300 ease-out" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Poll / Schedule Expandable Sections */}
                <div className="mt-4 space-y-4">
                  {showPoll && (
                    <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden shadow-lg animate-in slide-in-from-top-2">
                      <div className="p-3 border-b border-white/10 space-y-3">
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
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ACC8A2]/50 text-[15px] transition-colors"
                            />
                            {i > 1 && (
                              <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="absolute right-3 text-gray-500 hover:text-red-500 bg-black/60 p-1.5 rounded-full">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 4 && (
                          <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[#ACC8A2] hover:bg-[#ACC8A2]/10 text-[15px] py-3 flex items-center justify-center gap-2 transition-colors w-full rounded-xl border border-dashed border-[#ACC8A2]/30">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                            Add Choice
                          </button>
                        )}
                      </div>
                      <div className="p-4 bg-black/20 flex items-center justify-between">
                        <span className="text-white/70 text-[15px]">Poll length</span>
                        <select 
                          value={pollDurationDays} 
                          onChange={e => setPollDurationDays(Number(e.target.value))}
                          className="bg-white/10 text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#ACC8A2]"
                        >
                          <option value={1}>1 Day</option>
                          <option value={3}>3 Days</option>
                          <option value={7}>7 Days</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {showSchedule && (
                    <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden p-5 shadow-lg animate-in slide-in-from-top-2">
                      <h3 className="text-white text-[16px] font-bold mb-4 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path></svg>
                        Schedule Post
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-white/60 text-xs uppercase font-bold tracking-wider mb-2 block font-mono">Date & Time</label>
                          <input 
                            type="datetime-local" 
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ACC8A2]/50 text-[15px]"
                          />
                          <p className="text-gray-500 text-xs mt-2 leading-relaxed">Scheduled posts will be published at this exact time in your local timezone.</p>
                        </div>
                        {scheduledFor && new Date(scheduledFor) < new Date() && (
                          <p className="text-red-400 text-sm font-medium">Please select a time in the future.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* "Add to your post" Section */}
                <div className="mt-8 mb-8">
                  <h3 className="text-white/80 text-[15px] font-medium mb-3">Add to your post:</h3>
                  <div className="grid grid-cols-2 gap-3">
                    
                    <button onClick={() => { setAcceptType("image/*"); setTimeout(() => fileInputRef.current?.click(), 0); }} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-transparent p-4 rounded-2xl transition-all">
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                      <span className="text-white text-[14.5px] font-medium">Photo</span>
                    </button>
                    
                    <button onClick={() => { setAcceptType("video/*"); setTimeout(() => fileInputRef.current?.click(), 0); }} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-transparent p-4 rounded-2xl transition-all">
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      <span className="text-white text-[14.5px] font-medium">Video</span>
                    </button>

                    <button onClick={() => { setShowPoll(!showPoll); setShowSchedule(false); }} className={`flex items-center gap-3 transition-all p-4 rounded-2xl border ${showPoll ? 'border-[#ACC8A2]/30 bg-[#ACC8A2]/10' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                      <svg className={`w-5 h-5 shrink-0 ${showPoll ? 'text-[#ACC8A2]' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      <span className={`text-[14.5px] font-medium ${showPoll ? 'text-[#ACC8A2]' : 'text-white'}`}>Poll</span>
                    </button>

                    <button onClick={() => { setShowSchedule(!showSchedule); setShowPoll(false); }} className={`flex items-center gap-3 transition-all p-4 rounded-2xl border ${showSchedule ? 'border-[#ACC8A2]/30 bg-[#ACC8A2]/10' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                      <svg className={`w-5 h-5 shrink-0 ${showSchedule ? 'text-[#ACC8A2]' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path></svg>
                      <span className={`text-[14.5px] font-medium ${showSchedule ? 'text-[#ACC8A2]' : 'text-white'}`}>Schedule</span>
                    </button>

                  </div>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">{error}</div>}
          </div>

          {/* Bottom Floating Action Bar */}
          <div className="absolute bottom-6 left-4 right-4 flex items-center gap-3 bg-[#1A2517]/80 backdrop-blur-3xl border border-white/10 p-3 rounded-[32px] shadow-2xl z-20">
            <button
              type="button"
              onClick={() => {
                if (content.trim() || mediaFiles.length > 0) {
                  handleSubmit('DRAFT');
                } else {
                  closeComposer();
                }
              }}
              className="flex-1 flex justify-center items-center gap-2 py-4 bg-black/40 hover:bg-black/60 rounded-full transition-all border border-white/5 group"
            >
              <span className="text-white/80 group-hover:text-white font-semibold text-[15px]">{content.trim() || mediaFiles.length > 0 ? "Save Draft" : "Cancel"}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-white transition-colors"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading || uploadingMedia || (!content.trim() && uploadedMediaData.length === 0)}
              className={`flex-1 flex justify-center items-center py-4 rounded-full font-bold text-[16px] transition-all shadow-xl ${
                loading || uploadingMedia || (!content.trim() && uploadedMediaData.length === 0) 
                  ? "bg-white/10 text-white/30 cursor-not-allowed" 
                  : "bg-gradient-to-br from-[#ACC8A2] to-[#9cb691] text-[#1A2517] hover:brightness-110 transform hover:scale-[1.01] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (mode === 'REPLY' ? 'Reply' : 'Sela')}
            </button>
          </div>

        </div>
      )}
    </>
  );
}
