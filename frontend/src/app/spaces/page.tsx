"use client";

import { useEffect, useState } from "react";
import SpaceCard from "@/components/SpaceCard";
import { useUserStore } from "@/store/useUserStore";
import { motion } from "framer-motion";

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Explore" | "My Spaces">("Explore");
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces`, { 
        headers,
        cache: 'no-store'
      });
      if (!res.ok) throw new Error("Failed to fetch spaces");
      const data = await res.json();
      setSpaces(data);
    } catch (err) {
      console.error("Failed to fetch spaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [activeTab]);

  const displaySpaces = activeTab === "Explore" 
    ? spaces.filter(s => s.type === 'PUBLIC') 
    : spaces.filter(s => s.members?.some((m: any) => m.userId === user?.id && m.status === 'ACTIVE'));

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen bg-[#09090b]">
      <header className="sticky top-0 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/10 z-10 flex">
        <button 
          onClick={() => setActiveTab("Explore")}
          className={`flex-1 px-8 py-4 text-center font-bold text-[15px] transition-colors hover:bg-white/5 relative ${activeTab === "Explore" ? "text-white" : "text-gray-400"}`}
        >
          Explore
          {activeTab === "Explore" && (
            <motion.div
              layoutId="spacesTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-1 bg-[#ACC8A2] rounded-t-full mx-auto w-12"
            />
          )}
        </button>
        {isAuthenticated && (
          <button 
            onClick={() => setActiveTab("My Spaces")}
            className={`flex-1 px-8 py-4 text-center font-bold text-[15px] transition-colors hover:bg-white/5 relative ${activeTab === "My Spaces" ? "text-white" : "text-gray-400"}`}
          >
            My Spaces
            {activeTab === "My Spaces" && (
              <motion.div
                layoutId="spacesTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#ACC8A2] rounded-t-full mx-auto w-12"
              />
            )}
          </button>
        )}
      </header>

      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Spaces</h1>
          <p className="text-gray-400">Discover niche mini-communities.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-xl bg-white/5 border border-white/10 animate-pulse"></div>
            ))}
          </div>
        ) : displaySpaces.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white/5 rounded-xl border border-white/10 border-dashed">
            No spaces found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displaySpaces.map(space => (
              <SpaceCard 
                key={space.id} 
                id={space.id}
                name={space.name}
                description={space.description}
                coverUrl={space.coverUrl}
                type={space.type}
                membersCount={space._count?.members || 0}
                isMember={space.members?.some((m: any) => m.userId === user?.id && m.status === 'ACTIVE')}
                sampleMembers={space.sampleMembers}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
