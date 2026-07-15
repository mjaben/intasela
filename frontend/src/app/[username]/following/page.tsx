"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername).replace('@', '');

  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowing() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${username}/following`);
        if (res.ok) {
          const data = await res.json();
          setFollowing(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (username) fetchFollowing();
  }, [username]);

  return (
    <div className="flex-1 min-h-screen">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="font-bold text-xl">{username}</h1>
          <p className="text-sm text-muted-foreground">Following</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : following.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          Not following anyone yet.
        </div>
      ) : (
        <div className="flex flex-col">
          {following.map((user) => (
            <Link href={`/@${user.username}`} key={user.id} className="flex items-center gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user.name?.[0] || user.username[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{user.name || user.username}</div>
                <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
                {user.bio && <div className="text-sm mt-1 line-clamp-1">{user.bio}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
