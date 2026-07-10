"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

export default function SettingsPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [userData, setUserData] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    filterExplicit: false,
    autoplayVideos: true,
    showLikesOnProfile: true,
    allowGuestPosts: true,
    contactMatching: true,
    contactMatching: true,
    requireEmailVerification: false,
    recoveryQuestions: false,
    notifications: {
      engagement: {
        likes: { email: true, push: true },
        replies: { email: true, push: true },
        reselas: { email: true, push: true },
        mentions: { email: true, push: true }
      },
      messaging: {
        newChatThreads: { email: true, push: true },
        newReaderThread: { push: true },
        newChatReplies: { push: true },
        newChatReactions: { push: true },
        directMessages: { email: true, push: true },
        directMessageRequests: { email: true, push: true },
        allowRequestsFrom: 'Everyone'
      },
      connections: {
        newFollowers: { email: true, push: true },
        newSubscribers: { email: true, push: true },
        newRecommenders: { push: true },
        newChats: { email: true, push: true },
        newNotes: { email: true, push: true },
        leaderboardUpdates: { push: true }
      },
      marketing: {
        activityDigests: { push: true },
        readingSuggestions: { email: true, push: true },
        marketing: { email: true, push: true }
      }
    }
  });
  const [loading, setLoading] = useState(true);

  // Expanded sections state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    engagement: false,
    messaging: false,
    connections: false,
    marketing: false
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState<'email' | 'phone' | 'handle' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For email verification step
  const [emailStep, setEmailStep] = useState<1 | 2>(1); // 1 = request, 2 = verify OTP

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:3001/users/me/settings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          if (data.settings) {
            setSettings({ ...settings, ...data.settings });
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [isAuthenticated, router]);

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      const token = localStorage.getItem("access_token");
      await fetch("http://localhost:3001/users/me/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
    } catch (err) {
      console.error("Failed to update setting:", err);
    }
  };

  const updateNotificationSetting = async (section: string, category: string, type: 'email' | 'push', value: boolean) => {
    const newSettings = { ...settings };
    if (!newSettings.notifications) newSettings.notifications = {};
    if (!newSettings.notifications[section]) newSettings.notifications[section] = {};
    if (!newSettings.notifications[section][category]) newSettings.notifications[section][category] = { email: true, push: true };
    
    newSettings.notifications[section][category][type] = value;
    await updateSetting('notifications', newSettings.notifications);
  };

  const turnOffAll = async (section: string, defaultKeys: Record<string, any>) => {
    const newSettings = { ...settings };
    if (!newSettings.notifications) newSettings.notifications = {};
    newSettings.notifications[section] = defaultKeys;
    await updateSetting('notifications', newSettings.notifications);
  };

  const updateMessageRequest = async (value: string) => {
    const newSettings = { ...settings };
    if (!newSettings.notifications) newSettings.notifications = {};
    if (!newSettings.notifications.messaging) newSettings.notifications.messaging = {};
    newSettings.notifications.messaging.allowRequestsFrom = value;
    await updateSetting('notifications', newSettings.notifications);
  };

  const toggleExpand = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openModal = (type: 'email' | 'phone' | 'handle') => {
    setErrorMsg("");
    setEmailStep(1);
    setEditModal(type);
    if (type === 'email') {
      setFormData({ email: userData.email, otp: '' });
    } else if (type === 'phone') {
      setFormData({ phone: userData.phone || '' });
    } else if (type === 'handle') {
      setFormData({ username: userData.username });
    }
  };

  const closeModal = () => {
    setEditModal(null);
    setFormData({});
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append('file', file);
      
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:3001/uploads/image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data
        });
        if (res.ok) {
          const json = await res.json();
          setFormData({ ...formData, avatarUrl: json.url });
        }
      } catch (err) {
        console.error("Failed to upload image", err);
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:3001/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update");
      }
      const updatedUser = await res.json();
      setUserData({ ...userData, ...formData });
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEmailRequest = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:3001/users/me/email/request-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail: formData.email })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to request email update");
      }
      setEmailStep(2);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEmailVerify = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:3001/users/me/email/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: formData.otp })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Invalid OTP");
      }
      setUserData({ ...userData, email: formData.email });
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !userData) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );

  const RowItem = ({ title, description, action }: { title: string, description?: string, action: React.ReactNode }) => (
    <div className="flex items-center justify-between p-5 border-b border-border last:border-b-0">
      <div className="pr-8">
        <div className="font-semibold text-[15px]">{title}</div>
        {description && <div className="text-muted-foreground text-[14px] mt-1">{description}</div>}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-[44px] h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${checked ? 'bg-[#FF6719]' : 'bg-muted-foreground/30'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  const Chevron = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  const DownChevron = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const UpChevron = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );

  const Checkbox = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors duration-200 ${checked ? 'bg-[#FF6719]' : 'bg-muted-foreground/30'}`}
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );

  const ActionButton = ({ label, primary = false, onClick }: { label: string, primary?: boolean, onClick?: () => void }) => (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-lg font-semibold text-[14px] transition-colors ${primary ? 'bg-[#FF6719] text-white hover:opacity-90' : 'bg-muted hover:bg-muted/80'}`}>
      {label}
    </button>
  );

  return (
    <div className="max-w-[700px] py-10 px-6 relative">
      
      <Section title="Account">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-muted">
              <img src={userData.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${userData.username}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-semibold text-[15px]">Profile</div>
              <div className="text-muted-foreground text-[14px]">{userData.firstName} {userData.lastName}</div>
            </div>
          </div>
          <ActionButton label="Edit" onClick={() => router.push('/profile/edit')} />
        </div>
        <RowItem 
          title="Email" 
          description={userData.email} 
          action={<ActionButton label="Edit" onClick={() => openModal('email')} />} 
        />
        <RowItem 
          title="Phone" 
          description={userData.phone || "Add your phone number"} 
          action={<ActionButton label={userData.phone ? "Edit" : "Add phone"} primary={!userData.phone} onClick={() => openModal('phone')} />} 
        />
        <RowItem 
          title="Handle" 
          description={`@${userData.username}`} 
          action={<ActionButton label="Edit" onClick={() => openModal('handle')} />} 
        />
      </Section>

      <Section title="Notifications">
        {/* Engagement */}
        <div className="border-b border-border transition-colors relative">
          <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30" onClick={() => toggleExpand('engagement')}>
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span className="font-semibold text-[15px]">Engagement</span>
            </div>
            {expanded.engagement ? <UpChevron /> : <DownChevron />}
          </div>
          
          {expanded.engagement && (
            <div className="pl-[2.75rem] pr-5 pb-5 relative animate-in slide-in-from-top-2 duration-200">
              {/* Left connector line */}
              <div className="absolute left-[1.8rem] top-0 bottom-5 w-px bg-border"></div>
              
              <div className="flex justify-end gap-6 mb-4 text-xs font-semibold text-muted-foreground tracking-wider">
                <span className="w-8 text-center">EMAIL</span>
                <span className="w-8 text-center">PUSH</span>
              </div>

              {[
                { id: 'likes', label: 'Likes', desc: 'Notify me when someone likes my notes or comments.', hasEmail: true, hasPush: true },
                { id: 'replies', label: 'Replies', desc: 'Notify me when someone replies to my notes and comments.', hasEmail: true, hasPush: true },
                { id: 'reselas', label: 'Reselas', desc: 'Notify me when someone reselas my post, note or comment.', hasEmail: true, hasPush: true },
                { id: 'mentions', label: 'Mentions', desc: 'Notify me when someone mentions me in a post, note or comment.', hasEmail: true, hasPush: true }
              ].map(item => (
                <div key={item.id} className="flex items-start justify-between mb-6 group">
                  <div className="pr-8">
                    <div className="font-semibold text-[14px] text-foreground">{item.label}</div>
                    <div className="text-muted-foreground text-[13px] mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex justify-end gap-6 pt-1">
                    <div className="w-8 flex justify-center">
                      {item.hasEmail && (
                        <Checkbox 
                          checked={settings.notifications?.engagement?.[item.id]?.email ?? true} 
                          onChange={(v) => updateNotificationSetting('engagement', item.id, 'email', v)} 
                        />
                      )}
                    </div>
                    <div className="w-8 flex justify-center">
                      {item.hasPush && (
                        <Checkbox 
                          checked={settings.notifications?.engagement?.[item.id]?.push ?? true} 
                          onChange={(v) => updateNotificationSetting('engagement', item.id, 'push', v)} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => turnOffAll('engagement', {
                  likes: { email: false, push: false },
                  replies: { email: false, push: false },
                  reselas: { email: false, push: false },
                  mentions: { email: false, push: false }
                })}
                className="w-full mt-2 py-3 bg-muted rounded-xl text-[14px] font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                Turn off all
              </button>
            </div>
          )}
        </div>

        {/* Messaging */}
        <div className="border-b border-border transition-colors relative">
          <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30" onClick={() => toggleExpand('messaging')}>
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span className="font-semibold text-[15px]">Messaging</span>
            </div>
            {expanded.messaging ? <UpChevron /> : <DownChevron />}
          </div>
          
          {expanded.messaging && (
            <div className="pl-[2.75rem] pr-5 pb-5 relative animate-in slide-in-from-top-2 duration-200">
              <div className="absolute left-[1.8rem] top-0 bottom-5 w-px bg-border"></div>
              
              <div className="flex justify-end gap-6 mb-4 text-xs font-semibold text-muted-foreground tracking-wider">
                <span className="w-8 text-center">EMAIL</span>
                <span className="w-8 text-center">PUSH</span>
              </div>

              {[
                { id: 'newChatThreads', label: 'New chat threads', desc: 'Notify me when an author starts a new chat thread.', hasEmail: true, hasPush: true },
                { id: 'newReaderThread', label: 'New reader created thread', desc: 'Notify me when a reader starts a new chat thread.', hasEmail: false, hasPush: true },
                { id: 'newChatReplies', label: 'New chat replies', desc: 'Notify me when someone replies to me in a chat.', hasEmail: false, hasPush: true },
                { id: 'newChatReactions', label: 'New chat reactions', desc: 'Notify me when someone reacts to my message in a chat.', hasEmail: false, hasPush: true },
                { id: 'directMessages', label: 'Direct messages', desc: 'Notify me when someone sends me a direct message.', hasEmail: true, hasPush: true },
                { id: 'directMessageRequests', label: 'Direct message requests', desc: 'Notify me when someone requests to send me a direct message.', hasEmail: true, hasPush: true }
              ].map(item => (
                <div key={item.id} className="flex items-start justify-between mb-6 group">
                  <div className="pr-8">
                    <div className="font-semibold text-[14px] text-foreground">{item.label}</div>
                    <div className="text-muted-foreground text-[13px] mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex justify-end gap-6 pt-1">
                    <div className="w-8 flex justify-center">
                      {item.hasEmail && (
                        <Checkbox 
                          checked={settings.notifications?.messaging?.[item.id]?.email ?? true} 
                          onChange={(v) => updateNotificationSetting('messaging', item.id, 'email', v)} 
                        />
                      )}
                    </div>
                    <div className="w-8 flex justify-center">
                      {item.hasPush && (
                        <Checkbox 
                          checked={settings.notifications?.messaging?.[item.id]?.push ?? true} 
                          onChange={(v) => updateNotificationSetting('messaging', item.id, 'push', v)} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between mb-8">
                <div className="pr-8">
                  <div className="font-semibold text-[14px] text-foreground">Allow message requests from</div>
                  <div className="text-muted-foreground text-[13px] mt-0.5">People you follow or subscribe to can always message you.</div>
                </div>
                <div>
                  <select 
                    className="bg-background border border-border text-foreground font-semibold text-[14px] rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    value={settings.notifications?.messaging?.allowRequestsFrom || 'Everyone'}
                    onChange={(e) => updateMessageRequest(e.target.value)}
                  >
                    <option value="Everyone">Everyone</option>
                    <option value="Following">Following</option>
                    <option value="Nobody">Nobody</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={() => turnOffAll('messaging', {
                  newChatThreads: { email: false, push: false },
                  newReaderThread: { push: false },
                  newChatReplies: { push: false },
                  newChatReactions: { push: false },
                  directMessages: { email: false, push: false },
                  directMessageRequests: { email: false, push: false },
                  allowRequestsFrom: settings.notifications?.messaging?.allowRequestsFrom || 'Everyone'
                })}
                className="w-full mt-2 py-3 bg-muted rounded-xl text-[14px] font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                Turn off all
              </button>
            </div>
          )}
        </div>

        {/* Connections */}
        <div className="border-b border-border transition-colors relative">
          <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30" onClick={() => toggleExpand('connections')}>
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span className="font-semibold text-[15px]">Connections</span>
            </div>
            {expanded.connections ? <UpChevron /> : <DownChevron />}
          </div>

          {expanded.connections && (
            <div className="pl-[2.75rem] pr-5 pb-5 relative animate-in slide-in-from-top-2 duration-200">
              <div className="absolute left-[1.8rem] top-0 bottom-5 w-px bg-border"></div>
              
              <div className="flex justify-end gap-6 mb-4 text-xs font-semibold text-muted-foreground tracking-wider">
                <span className="w-8 text-center">EMAIL</span>
                <span className="w-8 text-center">PUSH</span>
              </div>

              {[
                { id: 'newFollowers', label: 'New followers', desc: 'Notify me when someone follows my profile.', hasEmail: true, hasPush: true },
                { id: 'newSubscribers', label: 'New subscribers', desc: 'Notify me when someone subscribes to my publication.', hasEmail: true, hasPush: true },
                { id: 'newRecommenders', label: 'New recommenders', desc: 'Notify me when another writer recommends my publication.', hasEmail: false, hasPush: true },
                { id: 'newChats', label: 'New chats', desc: 'Notify me when someone I subscribe to uses chat.', hasEmail: true, hasPush: true },
                { id: 'newNotes', label: 'New notes', desc: 'Notify me when someone I subscribe to posts a note.', hasEmail: true, hasPush: true },
                { id: 'leaderboardUpdates', label: 'Leaderboard updates', desc: 'Notify me when my ranking changes on the paid subscription leaderboards.', hasEmail: false, hasPush: true }
              ].map(item => (
                <div key={item.id} className="flex items-start justify-between mb-6 group">
                  <div className="pr-8">
                    <div className="font-semibold text-[14px] text-foreground">{item.label}</div>
                    <div className="text-muted-foreground text-[13px] mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex justify-end gap-6 pt-1">
                    <div className="w-8 flex justify-center">
                      {item.hasEmail && (
                        <Checkbox 
                          checked={settings.notifications?.connections?.[item.id]?.email ?? true} 
                          onChange={(v) => updateNotificationSetting('connections', item.id, 'email', v)} 
                        />
                      )}
                    </div>
                    <div className="w-8 flex justify-center">
                      {item.hasPush && (
                        <Checkbox 
                          checked={settings.notifications?.connections?.[item.id]?.push ?? true} 
                          onChange={(v) => updateNotificationSetting('connections', item.id, 'push', v)} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => turnOffAll('connections', {
                  newFollowers: { email: false, push: false },
                  newSubscribers: { email: false, push: false },
                  newRecommenders: { push: false },
                  newChats: { email: false, push: false },
                  newNotes: { email: false, push: false },
                  leaderboardUpdates: { push: false }
                })}
                className="w-full mt-2 py-3 bg-muted rounded-xl text-[14px] font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                Turn off all
              </button>
            </div>
          )}
        </div>

        {/* Marketing */}
        <div className="transition-colors relative">
          <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30" onClick={() => toggleExpand('marketing')}>
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span className="font-semibold text-[15px]">Marketing</span>
            </div>
            {expanded.marketing ? <UpChevron /> : <DownChevron />}
          </div>

          {expanded.marketing && (
            <div className="pl-[2.75rem] pr-5 pb-5 relative animate-in slide-in-from-top-2 duration-200">
              <div className="absolute left-[1.8rem] top-0 bottom-5 w-px bg-border"></div>
              
              <div className="flex justify-end gap-6 mb-4 text-xs font-semibold text-muted-foreground tracking-wider">
                <span className="w-8 text-center">EMAIL</span>
                <span className="w-8 text-center">PUSH</span>
              </div>

              {[
                { id: 'activityDigests', label: 'Activity Digests', desc: 'Send me a summary of replies, mentions, and more I may have missed.', hasEmail: false, hasPush: true },
                { id: 'readingSuggestions', label: 'Reading suggestions', desc: 'Send me suggested posts based on what I read.', hasEmail: true, hasPush: true },
                { id: 'marketing', label: 'Marketing', desc: 'Send me information about new features and updates.', hasEmail: true, hasPush: true }
              ].map(item => (
                <div key={item.id} className="flex items-start justify-between mb-6 group">
                  <div className="pr-8">
                    <div className="font-semibold text-[14px] text-foreground">{item.label}</div>
                    <div className="text-muted-foreground text-[13px] mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex justify-end gap-6 pt-1">
                    <div className="w-8 flex justify-center">
                      {item.hasEmail && (
                        <Checkbox 
                          checked={settings.notifications?.marketing?.[item.id]?.email ?? true} 
                          onChange={(v) => updateNotificationSetting('marketing', item.id, 'email', v)} 
                        />
                      )}
                    </div>
                    <div className="w-8 flex justify-center">
                      {item.hasPush && (
                        <Checkbox 
                          checked={settings.notifications?.marketing?.[item.id]?.push ?? true} 
                          onChange={(v) => updateNotificationSetting('marketing', item.id, 'push', v)} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => turnOffAll('marketing', {
                  activityDigests: { push: false },
                  readingSuggestions: { email: false, push: false },
                  marketing: { email: false, push: false }
                })}
                className="w-full mt-2 py-3 bg-muted rounded-xl text-[14px] font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                Turn off all
              </button>
            </div>
          )}
        </div>
      </Section>

      <Section title="Content preferences">
        <RowItem 
          title="Filter explicit content" 
          description="If enabled, explicit images and publications will be automatically filtered." 
          action={<Toggle checked={settings.filterExplicit} onChange={(v) => updateSetting("filterExplicit", v)} />} 
        />
        <RowItem 
          title="Auto-play videos" 
          description="This includes video posts and video in Notes" 
          action={<Toggle checked={settings.autoplayVideos} onChange={(v) => updateSetting("autoplayVideos", v)} />} 
        />
        <div className="p-5 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
          <div>
            <div className="font-semibold text-[15px]">Blocked accounts</div>
            <div className="text-muted-foreground text-[14px] mt-1">Blocked accounts can not interact with you or your content.</div>
          </div>
          <Chevron />
        </div>
        <div className="p-5 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
          <div>
            <div className="font-semibold text-[15px]">Muted accounts</div>
            <div className="text-muted-foreground text-[14px] mt-1">Muted accounts are automatically hidden from view.</div>
          </div>
          <Chevron />
        </div>
        <div className="p-5 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
          <div>
            <div className="font-semibold text-[15px]">Hidden publications</div>
            <div className="text-muted-foreground text-[14px] mt-1">Hidden publications are automatically filtered out of your feed.</div>
          </div>
          <Chevron />
        </div>
        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
          <div>
            <div className="font-semibold text-[15px]">Manage interests</div>
            <div className="text-muted-foreground text-[14px] mt-1">Control which topics you see in your feed.</div>
          </div>
          <Chevron />
        </div>
      </Section>

      <Section title="Privacy">
        <RowItem 
          title="Show likes on profile" 
          description="Show posts and notes you've liked on your profile." 
          action={<Toggle checked={settings.showLikesOnProfile} onChange={(v) => updateSetting("showLikesOnProfile", v)} />} 
        />
        <RowItem 
          title="Allow guest posts" 
          description="Let other users add you as a guest author to their posts." 
          action={<Toggle checked={settings.allowGuestPosts} onChange={(v) => updateSetting("allowGuestPosts", v)} />} 
        />
        <RowItem 
          title="Contact matching" 
          description="Let us use contact data you've uploaded to suggest users for you to follow." 
          action={<Toggle checked={settings.contactMatching} onChange={(v) => updateSetting("contactMatching", v)} />} 
        />
        <RowItem 
          title="Manage cookie preferences" 
          description="Control which cookies are used for analytics and tracking." 
          action={<ActionButton label="Manage" />} 
        />
      </Section>

      <Section title="Security">
        <RowItem 
          title="Require email verification when subscribing" 
          description="Prevents other people from adding you to email lists" 
          action={<Toggle checked={settings.requireEmailVerification} onChange={(v) => updateSetting("requireEmailVerification", v)} />} 
        />
        <RowItem 
          title="Recovery questions" 
          description="Recovery questions help us verify your identity and log you back in if you ever lose access to your email or authenticator app." 
          action={<Toggle checked={settings.recoveryQuestions} onChange={(v) => updateSetting("recoveryQuestions", v)} />} 
        />
      </Section>

      {/* Edit Modal Overlay */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-lg capitalize">Edit {editModal}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-6">
              {errorMsg && <div className="mb-4 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{errorMsg}</div>}

              {editModal === 'phone' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Phone Number</label>
                    <input type="tel" className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:border-[#FF6719]" placeholder="+1 234 567 890" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <button onClick={handleSaveProfile} disabled={isSubmitting} className="w-full mt-4 bg-[#FF6719] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">Save Phone</button>
                </div>
              )}

              {editModal === 'handle' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Handle (Username)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                      <input type="text" className="w-full p-2.5 pl-8 bg-background border border-border rounded-lg outline-none focus:border-[#FF6719]" value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">You can only change your handle once every 45 days.</p>
                  </div>
                  <button onClick={handleSaveProfile} disabled={isSubmitting} className="w-full mt-4 bg-[#FF6719] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">Save Handle</button>
                </div>
              )}

              {editModal === 'email' && (
                <div className="space-y-4">
                  {emailStep === 1 ? (
                    <>
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">New Email Address</label>
                        <input type="email" className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:border-[#FF6719]" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <button onClick={handleSaveEmailRequest} disabled={isSubmitting || !formData.email || formData.email === userData.email} className="w-full mt-4 bg-[#FF6719] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">Send Verification Code</button>
                    </>
                  ) : (
                    <>
                      <div className="mb-2 text-sm text-muted-foreground text-center">
                        We sent a 6-digit code to <span className="font-semibold text-foreground">{formData.email}</span>. Check your backend console for the code!
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Verification Code</label>
                        <input type="text" maxLength={6} className="w-full p-2.5 text-center tracking-widest text-lg font-bold bg-background border border-border rounded-lg outline-none focus:border-[#FF6719]" placeholder="000000" value={formData.otp || ''} onChange={(e) => setFormData({...formData, otp: e.target.value})} />
                      </div>
                      <button onClick={handleSaveEmailVerify} disabled={isSubmitting || !formData.otp || formData.otp.length !== 6} className="w-full mt-4 bg-[#FF6719] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">Verify & Update Email</button>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
