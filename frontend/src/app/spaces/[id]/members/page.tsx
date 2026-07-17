"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

export default function SpaceMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [inviteUsername, setInviteUsername] = useState("");

  const fetchSpaceAndMembers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch space");
      const data = await res.json();
      setSpace(data);
      // Data.members includes all members. In a real app we might paginate or have a specific members endpoint.
      // But for now, we use the space response if it includes members.
      
      const membersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members`, { headers });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      } else {
        // fallback to what is in space object if any
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error(err);
      alert("You might not have access to this page.");
      router.push(`/spaces/${resolvedParams.id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchSpaceAndMembers();
    }
  }, [resolvedParams.id, isAuthenticated]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchSpaceAndMembers();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    let reason = "";
    if (newStatus === 'SUSPENDED') {
      const input = window.prompt("Reason for suspension:");
      if (input === null) return; // user cancelled
      reason = input.trim();
    }

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members/${userId}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (res.ok) {
        fetchSpaceAndMembers();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ targetUsername: inviteUsername })
      });
      if (res.ok) {
        alert("User invited successfully!");
        setInviteUsername("");
        fetchSpaceAndMembers();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to invite user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading members...</div>;
  if (!space) return <div className="p-8 text-center">Space not found</div>;

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen p-4">
      <button onClick={() => router.push(`/spaces/${space.id}`)} className="mb-4 text-primary hover:underline">
        &larr; Back to Space
      </button>
      
      <h1 className="text-2xl font-bold mb-6">Manage Members: {space.name}</h1>

      <div className="bg-card border border-border p-4 rounded-xl mb-6">
        <h2 className="font-bold mb-2">Invite User</h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input 
            type="text" 
            value={inviteUsername} 
            onChange={(e) => setInviteUsername(e.target.value)} 
            placeholder="Username (e.g. john_doe)" 
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2"
          />
          <button type="submit" className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg">
            Invite
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="font-bold">Members List</h2>
        </div>
        <div className="divide-y divide-border">
          {members.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No members found.</div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                    <img src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.user?.username}`} alt={member.user?.username} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold">{member.user?.firstName || member.user?.username}</div>
                    <div className="text-sm text-muted-foreground">@{member.user?.username}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <div className="flex flex-col gap-1 items-end">
                    <select 
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                      className="bg-background border border-border rounded text-sm px-2 py-1"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="MODERATOR">Moderator</option>
                    </select>
                    
                    <select 
                      value={member.status}
                      onChange={(e) => handleUpdateStatus(member.userId, e.target.value)}
                      className={`border rounded text-sm px-2 py-1 ${member.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-500 border-red-500/30' : member.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="APPEALED">Appealed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
