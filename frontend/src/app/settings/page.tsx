"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToastStore } from "@/store/useToastStore";
import { useBlockMuteStore } from "@/store/useBlockMuteStore";

export default function SettingsPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const setGlobalSettings = useSettingsStore((state) => state.setSettings);
  const { blockedUsers, mutedUsers, toggleBlockUser, toggleMuteUser } = useBlockMuteStore();
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
  const [editModal, setEditModal] = useState<'email' | 'phone' | 'handle' | 'blocked' | 'muted' | 'interests' | 'cookies' | 'recovery' | 'deletePosts' | 'deleteAccount' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const addToast = useToastStore((state) => state.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interest expand state
  const [expandedInterests, setExpandedInterests] = useState<Record<string, boolean>>({});

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
            const mergedSettings = { ...settings, ...data.settings };
            setSettings(mergedSettings);
            setGlobalSettings(mergedSettings);
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
    setGlobalSettings(newSettings);

    // If cookies were rejected, clean up localStorage for safety
    if (key === 'cookies') {
      const rejectedCookies = Object.keys(value).filter(k => value[k] === false);
      rejectedCookies.forEach(cookieId => {
        localStorage.removeItem(cookieId);
      });
    }

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:3001/users/me/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        addToast("Settings updated successfully");
      }
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

  const handleDeletePosts = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:3001/users/me/posts", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        closeModal();
        addToast("All posts deleted successfully");
      } else {
        alert("Failed to delete posts.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:3001/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        useUserStore.getState().logout();
        router.push("/login");
      } else {
        alert("Failed to delete account.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (type: 'email' | 'phone' | 'handle' | 'blocked' | 'muted' | 'interests' | 'cookies' | 'recovery' | 'deletePosts' | 'deleteAccount') => {
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

  const updateInterest = async (id: string, value: 'up'|'down'|null) => {
    const newSettings = { ...settings };
    if (!newSettings.interests) newSettings.interests = {};
    if (value === null) {
      delete newSettings.interests[id];
    } else {
      newSettings.interests[id] = value;
    }
    await updateSetting('interests', newSettings.interests);
  };

  const INTERESTS_DATA = [
    { id: 'arts', label: 'Arts & Entertainment', sub: ['Movies & TV', 'Music', 'Books & Literature', 'Theater & Performing Arts', 'Visual Arts & Design'] },
    { id: 'business', label: 'Business & Finance', sub: ['Entrepreneurship', 'Investing & Stocks', 'Marketing & Advertising', 'Small Business', 'Economics', 'Cryptocurrency & Blockchain'] },
    { id: 'careers', label: 'Careers & Education', sub: ['Job Searching & Careers', 'Higher Education', 'Online Learning', 'Professional Development'] },
    { id: 'family', label: 'Family & Parenting', sub: ['Parenting', 'Motherhood', 'Fatherhood', 'Family Activities', 'Pregnancy & Newborns'] },
    { id: 'food', label: 'Food & Drink', sub: ['Cooking & Recipes', 'Restaurants', 'Healthy Eating & Nutrition', 'Coffee & Tea', 'Wine & Beer'] },
    { id: 'health', label: 'Health & Fitness', sub: ['Fitness & Exercise', 'Mental Health', 'Nutrition & Diet', 'Yoga & Meditation', 'Weight Loss'] },
    { id: 'hobbies', label: 'Hobbies & Interests', sub: ['Gaming', 'Photography', 'Gardening', 'DIY & Crafts', 'Travel', 'Pets & Animals'] },
    { id: 'news', label: 'News & Politics', sub: ['World News', 'U.S. Politics', 'Technology News', 'Science News', 'Business News'] },
    { id: 'science', label: 'Science & Technology', sub: ['Gadgets & Consumer Tech', 'Artificial Intelligence', 'Space & Astronomy', 'Environment & Climate', 'Programming & Software'] },
    { id: 'sports', label: 'Sports', sub: ['Football (Soccer)', 'American Football', 'Basketball', 'Baseball', 'Tennis', 'Motorsports', 'Combat Sports'] },
    { id: 'style', label: 'Style & Fashion', sub: ['Men\'s Fashion', 'Women\'s Fashion', 'Beauty & Makeup', 'Streetwear', 'Luxury Fashion'] },
    { id: 'travel', label: 'Travel & Events', sub: ['Destinations', 'Adventure Travel', 'Luxury Travel', 'Festivals & Events'] }
  ];

  const COOKIE_DATA = [
    { id: 'intro_popup', label: 'intro_popup_last_hidden_at', type: 'FUNCTIONALITY', desc: 'Prevents showing introductory information the user has already seen.' },
    { id: 'muxData', label: 'muxData', type: 'FUNCTIONALITY', desc: 'Used for anonymous video metric collection and aggregation.' },
    { id: 'like_upsell', label: 'like_upsell_last_shown_at', type: 'FUNCTIONALITY', desc: 'Prevents users from repeatedly being shown features.' },
    { id: 'chatbot_terms', label: 'chatbot_terms_last_accepted_at', type: 'FUNCTIONALITY', desc: 'Prevents users from repeatedly having to accept chatbot terms.' },
    { id: 'preferred_language', label: 'preferred_language', type: 'FUNCTIONALITY', desc: 'Stores the user\'s preferred language.' }
  ];

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
              <div 
                className="w-[18px] h-[18px] bg-muted-foreground"
                style={{
                  WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADZUlEQVR4nO3ae4hVVRTH8c+de+/MbZz3ODNRgfmYUuk1YZFWY6WRgTVSQdCDgbAgih5/RNEfGhmJPSYpEgzKMiiC6g+tiMyUnpY1jCViPgqkbJwps/qjMYIbB7ZQ5uSM93HuHfrC5cJm77XPOmeftX9r7cP/SGAGbsP9uAVnhfaRcBIuxVxMFgMJ3IAd+Bor8DBWYXdouwkVRxibRDc+x35swLv4DnvxFKYXw4lGvIHNmDNMn4uwCe+g5W/tZ4Rx7+PyIzg6CYuDU89gXKGcqEMfliN9lL7RnX8I32ICbsdPuHGE86zEV2hVgOX0NnpGOe5OHMAWtI9y7GJ8hCp55NqwrqM7PVq6UH+M876Fu+TxaezCTMXnVOzL11OJQuw28bEhhOiceRBLxMciPJIPQy/hOvFxJV7Nh6GNmC0+ZoW9J2d60SE+ZoSImTORhLhEfMwPaiJnXo75HVkSVELO3IsnxMeXOD8fhi4M70kczA572EhTg/8kEoj9mKr4vIeF+TT4GB5XXK4KyyqVT6Mn42ccrzicGDRWQfavJ/GcwpMM+urRQk3QFNLRKM8uJA/gY1QWcpIr8ANOKJD97pDqFsr+P1iKT1FbgB28H6cpElHR4DV8gJo82ewML/e5ikxlSEM35qHacVkoTMSm5zLhyWzKYU1fjYFQQoqVZNBhe0PeMBpuxfc4WwlxDQZx9zAVxsOd7wkFjdGWiIpCdFFfhCAwZZg+DVgbNFSzEiaFe/BjyLOjquEhOkJteMUIKpUlQXUikehtbGwYrKqq+iWVqrgjqtQnk8nfm5ub3lQuJBKJ1Z2ds/bs3tmXXbvmlezM8875beLECb+++MLKbE3NuINFFJ45Ma+xsWFg29bPst/s2vKv380Lu7Ntba15Ke0UlHQ6/cmCrvl/dHScOTjn4s7+wx3p6/0wW1dbOxSOGEqWikQiMVRZmYoi16rp06ZuP+TA8p6l2fHNTQdbW1sO1NfXDWUymShqlTQt4b/rlPYpO9avW5Ntb5/8Z3197f5MJhPpqWlYELK/sqAtnU4PVFdX70smk5tDSC575mLrMZ6tlBzRadfzY8GZBqzHMmVOBVbjaWXOs1iH45QxF2BnuTsRcTr2lIvGOhr3YXv4/qTsWRS+XxlvDLAMrxsDpHB93BehlPkLRtzTRcJTeY0AAAAASUVORK5CYII=)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADZUlEQVR4nO3ae4hVVRTH8c+de+/MbZz3ODNRgfmYUuk1YZFWY6WRgTVSQdCDgbAgih5/RNEfGhmJPSYpEgzKMiiC6g+tiMyUnpY1jCViPgqkbJwps/qjMYIbB7ZQ5uSM93HuHfrC5cJm77XPOmeftX9r7cP/SGAGbsP9uAVnhfaRcBIuxVxMFgMJ3IAd+Bor8DBWYXdouwkVRxibRDc+x35swLv4DnvxFKYXw4lGvIHNmDNMn4uwCe+g5W/tZ4Rx7+PyIzg6CYuDU89gXKGcqEMfliN9lL7RnX8I32ICbsdPuHGE86zEV2hVgOX0NnpGOe5OHMAWtI9y7GJ8hCp55NqwrqM7PVq6UH+M876Fu+TxaezCTMXnVOzL11OJQuw28bEhhOiceRBLxMciPJIPQy/hOvFxJV7Nh6GNmC0+ZoW9J2d60SE+ZoSImTORhLhEfMwPaiJnXo75HVkSVELO3IsnxMeXOD8fhi4M70kczA572EhTg/8kEoj9mKr4vIeF+TT4GB5XXK4KyyqVT6Mn42ccrzicGDRWQfavJ/GcwpMM+urRQk3QFNLRKM8uJA/gY1QWcpIr8ANOKJD97pDqFsr+P1iKT1FbgB28H6cpElHR4DV8gJo82ewML/e5ikxlSEM35qHacVkoTMSm5zLhyWzKYU1fjYFQQoqVZNBhe0PeMBpuxfc4WwlxDQZx9zAVxsOd7wkFjdGWiIpCdFFfhCAwZZg+DVgbNFSzEiaFe/BjyLOjquEhOkJteMUIKpUlQXUikehtbGwYrKqq+iWVqrgjqtQnk8nfm5ub3lQuJBKJ1Z2ds/bs3tmXXbvmlezM8875beLECb+++MLKbE3NuINFFJ45Ma+xsWFg29bPst/s2vKv380Lu7Ntba15Ke0UlHQ6/cmCrvl/dHScOTjn4s7+wx3p6/0wW1dbOxSOGEqWikQiMVRZmYoi16rp06ZuP+TA8p6l2fHNTQdbW1sO1NfXDWUymShqlTQt4b/rlPYpO9avW5Ntb5/8Z3197f5MJhPpqWlYELK/sqAtnU4PVFdX70smk5tDSC575mLrMZ6tlBzRadfzY8GZBqzHMmVOBVbjaWXOs1iH45QxF2BnuTsRcTr2lIvGOhr3YXv4/qTsWRS+XxlvDLAMrxsDpHB93BehlPkLRtzTRcJTeY0AAAAASUVORK5CYII=)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                }}
              />
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
              <div 
                className="w-[18px] h-[18px] bg-muted-foreground"
                style={{
                  WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADh0lEQVR4nO3Ze4inUxzH8dfuGLus2qzrbmMtxcS65bpbbsuuW2E3/CGS61JbaFxWJKuEtca6RRapdSv+4A/l9geNP+S2YluXGCyLRSktalPo1Ef9mmKfZ+Y383vUvOvUNHOec84z5zyf7/f7OYwzzv+WbvTgIOyJ3bGNhjMBc3EdXsD32Ixv8B4G8RV+w+d4HldjlobQgxuz0A/Qj4WYkZcbSvndTJyB+/Oib+McTOzA+u2IlfgJ9+b4DIcunIwX8REWGUMuwY+4Gzu1cdzjsAarMdUosj2ezZnfexQFoh9foHc0Jihnfl2O09ZGn4URh4PbOWiRzc9wjbHlJPyA2e0YbLvsxBU6wyJ8gmkjHehJPKKz3IyX/0XOK3Eu3sdknaUb7+LC4Ty8Lb7GHM1gX2xI/KrF9Xhas7gT99V5oKQK63FAxf6TE2NmRfsPwbE4EWcl/Vic1oelycluTytxo0rM2AEb6wThBQl6VV+66P3P+BIf5zy/hpfwTATjobS7Wl5gadqVmF5xvnuwrOqLlNzpWs1kv2TPlXgHR2omXfi9ipJ2p+MUzWVdlWi/czLbJvNclXS/t84Z7BAP4rIqH1PZujpMivzOSG2+fyT4cMxvaQsix63t4tQ3u9SY77ao3X8yPVptGPL7bUreDyPBpYR9taW9EjlubQ9HlmfXmLPEoFu31KnUGn90qn6uSDEtVlTpODha1VmbWIabqnR8ChdoLitwVZWOl+NRzeUJnFel426xecaiNh8Oa3Bo1c5v4NQag09NWTwWKcqvdeZaHFtzS0yM7Bb53YQ/8/P6xKO3hkjwSHO4o1K11gpypSI7sOZEExIcexIci51zREtQHKnx1l9VsVrpiyHXFLqz0yVzqMUpcdWH7V60mfNzPGuxB77DMZrBJHyaEroyRRHWYonmcEfdYz4x+X5J5prC/AhPMR8qsxwDDQqGc+L/1pLtJblsGbHP2sad2IgT6tr4Gxpyp7dVrvPKeo6u8+Dc1Omlqus08yI0xRPbte7Da3OReSn2MvYUgSlmwuu5hzl9uAMVC/JsPJbtLOb144ns85JytJspqeEfSNAdwJlJCttGb/zalZlgU+70ynavwg25cihKsk9yqmlDMtJ/cq6ZybVOS4m6KvX8L7FV+8byu+zKYo/HRbglfu5AFjWY/2pZ3F9pm5MFl7+9mdi0PK7JYfmgxxlnHKPP3/f5ueKem89DAAAAAElFTkSuQmCC)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADh0lEQVR4nO3Ze4inUxzH8dfuGLus2qzrbmMtxcS65bpbbsuuW2E3/CGS61JbaFxWJKuEtca6RRapdSv+4A/l9geNP+S2YluXGCyLRSktalPo1Ef9mmKfZ+Y383vUvOvUNHOec84z5zyf7/f7OYwzzv+WbvTgIOyJ3bGNhjMBc3EdXsD32Ixv8B4G8RV+w+d4HldjlobQgxuz0A/Qj4WYkZcbSvndTJyB+/Oib+McTOzA+u2IlfgJ9+b4DIcunIwX8REWGUMuwY+4Gzu1cdzjsAarMdUosj2ezZnfexQFoh9foHc0Jihnfl2O09ZGn4URh4PbOWiRzc9wjbHlJPyA2e0YbLvsxBU6wyJ8gmkjHehJPKKz3IyX/0XOK3Eu3sdknaUb7+LC4Ty8Lb7GHM1gX2xI/KrF9Xhas7gT99V5oKQK63FAxf6TE2NmRfsPwbE4EWcl/Vic1oelycluTytxo0rM2AEb6wThBQl6VV+66P3P+BIf5zy/hpfwTATjobS7Wl5gadqVmF5xvnuwrOqLlNzpWs1kv2TPlXgHR2omXfi9ipJ2p+MUzWVdlWi/czLbJvNclXS/t84Z7BAP4rIqH1PZujpMivzOSG2+fyT4cMxvaQsix63t4tQ3u9SY77ao3X8yPVptGPL7bUreDyPBpYR9taW9EjlubQ9HlmfXmLPEoFu31KnUGn90qn6uSDEtVlTpODha1VmbWIabqnR8ChdoLitwVZWOl+NRzeUJnFel426xecaiNh8Oa3Bo1c5v4NQag09NWTwWKcqvdeZaHFtzS0yM7Bb53YQ/8/P6xKO3hkjwSHO4o1K11gpypSI7sOZEExIcexIci51zREtQHKnx1l9VsVrpiyHXFLqz0yVzqMUpcdWH7V60mfNzPGuxB77DMZrBJHyaEroyRRHWYonmcEfdYz4x+X5J5prC/AhPMR8qsxwDDQqGc+L/1pLtJblsGbHP2sad2IgT6tr4Gxpyp7dVrvPKeo6u8+Dc1Omlqus08yI0xRPbte7Da3OReSn2MvYUgSlmwuu5hzl9uAMVC/JsPJbtLOb144ns85JytJspqeEfSNAdwJlJCttGb/zalZlgU+70ynavwg25cihKsk9yqmlDMtJ/cq6ZybVOS4m6KvX8L7FV+8byu+zKYo/HRbglfu5AFjWY/2pZ3F9pm5MFl7+9mdi0PK7JYfmgxxlnHKPP3/f5ueKem89DAAAAAElFTkSuQmCC)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                }}
              />
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
                <div className="relative">
                  <select 
                    className="bg-background border border-border text-foreground font-semibold text-[14px] rounded-lg pl-3 pr-10 py-2 outline-none cursor-pointer hover:border-muted-foreground/50 transition-colors appearance-none focus:border-[#FF6719]"
                    value={settings.notifications?.messaging?.allowRequestsFrom || 'Everyone'}
                    onChange={(e) => updateMessageRequest(e.target.value)}
                  >
                    <option value="Everyone">Everyone</option>
                    <option value="Following">Following</option>
                    <option value="Nobody">Nobody</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
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
        <div className="p-5 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openModal('blocked')}>
          <div>
            <div className="font-semibold text-[15px]">Blocked accounts</div>
            <div className="text-muted-foreground text-[14px] mt-1">Blocked accounts can not interact with you or your content.</div>
          </div>
          <Chevron />
        </div>
        <div className="p-5 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openModal('muted')}>
          <div>
            <div className="font-semibold text-[15px]">Muted accounts</div>
            <div className="text-muted-foreground text-[14px] mt-1">Muted accounts are automatically hidden from view.</div>
          </div>
          <Chevron />
        </div>
        <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openModal('interests')}>
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
          action={<ActionButton label="Manage" onClick={() => openModal('cookies')} />} 
        />
      </Section>

      <Section title="Security">
        <RowItem 
          title="Recovery questions" 
          description="Recovery questions help us verify your identity and log you back in if you ever lose access to your email or authenticator app." 
          action={<Toggle checked={settings.recoveryQuestions} onChange={(v) => v ? openModal('recovery') : updateSetting("recoveryQuestions", false)} />} 
        />
        <div className={`p-5 flex items-center justify-between relative group ${!settings.recoveryQuestions ? 'cursor-not-allowed' : ''}`}>
          <div className={!settings.recoveryQuestions ? 'opacity-50' : ''}>
            <div className="font-semibold text-[15px]">Two-factor authentication</div>
            <div className="text-muted-foreground text-[14px] mt-1">Two-factor authentication adds an extra layer of security by requiring a special code each time you log in. <a href="#" className="underline">Learn more</a></div>
          </div>
          <div className={!settings.recoveryQuestions ? 'opacity-50 pointer-events-none' : ''}>
            <Toggle checked={settings.twoFactorAuth} onChange={(v) => settings.recoveryQuestions && updateSetting("twoFactorAuth", v)} />
          </div>
          {!settings.recoveryQuestions && (
            <div className="absolute right-5 bottom-[80%] mb-1 hidden group-hover:block bg-foreground text-background text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl pointer-events-none font-medium">
              First turn on Recovery to use 2FA
              <div className="absolute top-full right-5 border-[5px] border-transparent border-t-foreground"></div>
            </div>
          )}
        </div>
      </Section>

      <div className="mt-10 mb-20">
        <h2 className="text-xl font-bold mb-4 px-2">Danger zone</h2>
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[15px]">Delete all posts</div>
              <div className="text-muted-foreground text-[14px] mt-1">Permanently delete all your posts, reselas, and reselas with notes.</div>
            </div>
            <button 
              className="shrink-0 bg-[#ED5F62] hover:bg-[#ED5F62]/90 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm disabled:opacity-50"
              onClick={() => openModal('deletePosts')}
              disabled={isSubmitting}
            >
              Delete posts
            </button>
          </div>
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[15px]">Delete your account</div>
              <div className="text-muted-foreground text-[14px] mt-1">Permanently delete your account and information</div>
            </div>
            <button 
              className="shrink-0 bg-[#ED5F62] hover:bg-[#ED5F62]/90 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm disabled:opacity-50"
              onClick={() => openModal('deleteAccount')}
              disabled={isSubmitting}
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {editModal !== 'recovery' && (
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-bold text-lg capitalize">{editModal === 'cookies' ? 'Cookie Preferences' : `Edit ${editModal}`}</h3>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            {editModal === 'recovery' && (
              <div className="flex justify-end p-4 pb-0">
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            <div className={`p-6 ${editModal === 'recovery' ? 'pt-0' : ''}`}>
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

              {editModal === 'blocked' && (
                <div className="p-4 sm:p-6 text-foreground max-h-[60vh] overflow-y-auto nice-scrollbar">
                  {blockedUsers.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      <div className="font-bold text-foreground text-base mb-2">Nobody is blocked</div>
                      <div className="text-sm">You can block people by clicking the three dots on their profile, comments, or notes.</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {blockedUsers.map(user => (
                        <div key={user.username} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[15px] leading-tight">{user.name}</span>
                              <span className="text-muted-foreground text-[14px]">@{user.username}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              toggleBlockUser(user);
                              addToast(`Unblocked @${user.username}`, "success");
                            }}
                            className="px-4 py-1.5 rounded-full border border-border hover:bg-muted/50 transition-colors text-sm font-semibold"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editModal === 'muted' && (
                <div className="p-4 sm:p-6 text-foreground max-h-[60vh] overflow-y-auto nice-scrollbar">
                  {mutedUsers.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      <div className="font-bold text-foreground text-base mb-2">Nobody is muted</div>
                      <div className="text-sm">You can mute people by clicking the three dots on their profile, comments, or notes.</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {mutedUsers.map(user => (
                        <div key={user.username} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[15px] leading-tight">{user.name}</span>
                              <span className="text-muted-foreground text-[14px]">@{user.username}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              toggleMuteUser(user);
                              addToast(`Unmuted @${user.username}`, "success");
                            }}
                            className="px-4 py-1.5 rounded-full border border-border hover:bg-muted/50 transition-colors text-sm font-semibold"
                          >
                            Unmute
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editModal === 'interests' && (
                <div className="max-h-[60vh] overflow-y-auto px-1">
                  <div className="text-muted-foreground text-sm mb-6">Control which topics you see more or less of in your feed.</div>
                  {INTERESTS_DATA.map((cat) => {
                    const currentStatus = settings.interests?.[cat.id] || null;
                    return (
                      <div key={cat.id} className="mb-2">
                        <div className="flex items-center justify-between py-3 px-2 hover:bg-muted/30 rounded-xl transition-colors">
                          <div 
                            className="flex items-center gap-3 cursor-pointer select-none flex-1"
                            onClick={() => setExpandedInterests(p => ({...p, [cat.id]: !p[cat.id]}))}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-muted-foreground transition-transform duration-200 ${expandedInterests[cat.id] ? 'rotate-90' : ''}`}>
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                            <span className="font-bold text-[15px]">{cat.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateInterest(cat.id, currentStatus === 'down' ? null : 'down')}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${currentStatus === 'down' ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                            </button>
                            <button 
                              onClick={() => updateInterest(cat.id, currentStatus === 'up' ? null : 'up')}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${currentStatus === 'up' ? 'bg-green-500/20 text-green-500 border border-green-500' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            </button>
                          </div>
                        </div>
                        {expandedInterests[cat.id] && (
                          <div className="pl-11 pr-2 pb-2">
                            {cat.sub.map((subItem) => {
                              const subId = `${cat.id}_${subItem.replace(/\s+/g, '_').toLowerCase()}`;
                              const subStatus = settings.interests?.[subId] || null;
                              return (
                                <div key={subItem} className="flex items-center justify-between py-2 border-l-2 border-border pl-4 ml-1">
                                  <span className="text-[14px] text-muted-foreground">{subItem}</span>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => updateInterest(subId, subStatus === 'down' ? null : 'down')}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${subStatus === 'down' ? 'text-red-500' : 'text-muted-foreground/60 hover:text-foreground'}`}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                                    </button>
                                    <button 
                                      onClick={() => updateInterest(subId, subStatus === 'up' ? null : 'up')}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${subStatus === 'up' ? 'text-green-500' : 'text-muted-foreground/60 hover:text-foreground'}`}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {editModal === 'cookies' && (
                <div className="flex flex-col max-h-[70vh]">
                  <div className="overflow-y-auto px-1 flex-1">
                    {COOKIE_DATA.map((cookie) => {
                      const isChecked = settings.cookies?.[cookie.id] ?? true;
                      return (
                        <div key={cookie.id} className="py-4 border-b border-border last:border-b-0 flex items-start justify-between">
                          <div className="pr-6">
                            <div className="font-semibold text-[15px] text-foreground mb-1">{cookie.label}</div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[12px] font-bold tracking-wider mb-2">
                              {cookie.type}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </div>
                            <div className="text-muted-foreground text-[13px]">{cookie.desc}</div>
                          </div>
                          <div className="pt-2 shrink-0">
                            <Checkbox 
                              checked={isChecked} 
                              onChange={(v) => {
                                const newCookies = { ...(settings.cookies || {}) };
                                newCookies[cookie.id] = v;
                                updateSetting('cookies', newCookies);
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-5 border-t border-border flex justify-end gap-3 mt-auto">
                    <button 
                      onClick={() => {
                        const newCookies: any = {};
                        COOKIE_DATA.forEach(c => newCookies[c.id] = true);
                        updateSetting('cookies', newCookies);
                        closeModal();
                      }}
                      className="px-6 py-2.5 bg-[#FF6719] text-white font-semibold rounded-lg hover:opacity-90 transition-colors"
                    >
                      Accept all
                    </button>
                    <button 
                      onClick={() => {
                        const newCookies: any = {};
                        COOKIE_DATA.forEach(c => newCookies[c.id] = false);
                        updateSetting('cookies', newCookies);
                        closeModal();
                      }}
                      className="px-6 py-2.5 bg-[#FF6719] text-white font-semibold rounded-lg hover:opacity-90 transition-colors"
                    >
                      Reject All
                    </button>
                  </div>
                </div>
              )}

              {editModal === 'recovery' && (
                <div className="flex flex-col">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    </div>
                    <h3 className="font-bold text-2xl mb-2">Turn on recovery questions</h3>
                    <p className="text-muted-foreground text-[15px]">Recovery questions help us verify your identity and log you back in if you ever lose access to your email or authenticator app. Please select three questions and type your answers below.</p>
                  </div>
                  
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="space-y-2">
                        <label className="text-sm font-semibold">Question {num}</label>
                        <div className="relative">
                          <select className="w-full p-3 pr-10 bg-background border border-border rounded-lg outline-none focus:border-[#FF6719] appearance-none cursor-pointer transition-colors hover:border-muted-foreground/50" defaultValue="" onChange={(e) => setFormData({...formData, [`q${num}`]: e.target.value})}>
                            <option value="" disabled>Select a question...</option>
                            <option value="city">In what city or town did your parents meet?</option>
                            <option value="teacher">What was your first teacher's last name?</option>
                            <option value="pet">What was the name of your first pet?</option>
                            <option value="childhood">What was your childhood nickname?</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-muted-foreground">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Type your answer here..." 
                          className="w-full p-3 bg-background border border-border rounded-lg outline-none focus:border-[#FF6719]"
                          value={formData[`a${num}`] || ''}
                          onChange={(e) => setFormData({...formData, [`a${num}`]: e.target.value})}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    <button 
                      className="w-full bg-[#333333] hover:bg-[#444444] text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors"
                      disabled={!formData.q1 || !formData.a1 || !formData.q2 || !formData.a2 || !formData.q3 || !formData.a3}
                      onClick={() => {
                        updateSetting('recoveryQuestions', true);
                        closeModal();
                      }}
                    >
                      Save
                    </button>
                    <button 
                      className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-border text-white font-semibold py-3 rounded-xl transition-colors"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {(editModal === 'deletePosts' || editModal === 'deleteAccount') && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-500 text-[15px] font-medium leading-relaxed">
                      {editModal === 'deletePosts' 
                        ? "WARNING: You are about to permanently delete all your posts and reselas. This action cannot be undone."
                        : "WARNING: You are about to permanently delete your account. All your data, posts, and balances will be lost forever. This action CANNOT be undone."}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Type DELETE to confirm</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:border-red-500" 
                      placeholder="DELETE" 
                      value={formData.deleteConfirmation || ''} 
                      onChange={(e) => setFormData({...formData, deleteConfirmation: e.target.value})} 
                    />
                  </div>
                  <button 
                    onClick={editModal === 'deletePosts' ? handleDeletePosts : handleDeleteAccount} 
                    disabled={isSubmitting || formData.deleteConfirmation !== 'DELETE'} 
                    className="w-full mt-4 bg-red-500 text-white font-semibold py-2.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : "Confirm Deletion"}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
