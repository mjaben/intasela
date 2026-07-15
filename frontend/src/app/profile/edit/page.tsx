"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

export default function EditProfilePage() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!currentUser?.username) {
        router.push('/login');
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/profile/${currentUser.username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setBio(data.bio || "");
          setUsername(data.username || "");
          setCountry(data.country || "");
          setState(data.state || "");
          setAvatarUrl(data.avatarUrl || "");
          setCoverUrl(data.coverUrl || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchProfile();
  }, [currentUser, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Image upload failed");
      
      const data = await res.json();
      if (type === 'avatar') {
        setAvatarUrl(data.url);
      } else {
        setCoverUrl(data.url);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio, country, state, username, avatarUrl, coverUrl })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await res.json();
      useUserStore.getState().updateUser(updatedUser);
      router.push(`/@${updatedUser.username}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex-1 min-h-screen p-8 flex justify-center mt-10">
        <div className="animate-spin w-8 h-8 border-4 border-[#3BC492] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="font-bold text-xl">Edit profile</h1>
        </div>
      </div>

      {/* Cover / Profile Header Area */}
      <div className="w-full bg-gradient-to-b from-muted/50 to-background relative px-6 py-12 border-b border-border flex justify-between items-center min-h-[250px] group overflow-hidden">
        
        {/* Left Side: Mock Profile Info (Optional, to match layout) */}
        <div className="flex-1 max-w-xl z-10 pr-6 relative pointer-events-none">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{profile?.firstName} {profile?.lastName}</h1>
          <p className="text-muted-foreground text-[15px] mb-4">@{username || profile?.username}</p>
          <div className="mb-4 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap opacity-70">
            {bio || "Your bio will appear here..."}
          </div>
        </div>

        {/* Right Side: Avatar inside the cover */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-muted overflow-hidden flex-shrink-0 z-30 shadow-lg relative group/avatar pointer-events-auto">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-4xl text-primary font-bold">
              {username[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
            <label className="cursor-pointer w-full h-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Cover Image Background */}
        <div className="absolute inset-0 z-0">
          {coverUrl && (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-40" />
          )}
        </div>

        {/* Cover Upload Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto">
          <label className="cursor-pointer px-4 py-2 bg-black/60 rounded-full text-white text-sm font-bold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Change Cover
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-8 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground">Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description about yourself..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 min-h-[100px] outline-none focus:border-[#3BC492] transition-colors resize-none text-[15px]"
              maxLength={160}
            />
            <div className="text-right text-xs text-muted-foreground">
              {bio.length} / 160
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-[14px] text-muted-foreground">@</span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-3 outline-none focus:border-[#3BC492] transition-colors text-[15px]"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">You can only change your username once every 45 days.</p>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-semibold text-muted-foreground">Country</label>
              <input 
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Nigeria"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-[#3BC492] transition-colors text-[15px]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-semibold text-muted-foreground">State / Region</label>
              <input 
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Lagos"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-[#3BC492] transition-colors text-[15px]"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              type="submit"
              disabled={loading || uploading}
              className="px-8 py-3 rounded-full bg-[#3BC492] text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-[15px]"
            >
              {loading || uploading ? "Saving changes..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
