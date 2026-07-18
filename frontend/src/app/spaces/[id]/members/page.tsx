"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToastStore } from "@/store/useToastStore";
import ReasonModal from "@/components/ReasonModal";

export default function SpaceMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [inviteUsername, setInviteUsername] = useState("");
  const [editingPermissions, setEditingPermissions] = useState<{userId: string, role: string, permissions: string[]} | null>(null);
  const [reasonModalState, setReasonModalState] = useState<{isOpen: boolean, userId: string, newStatus: string} | null>(null);
  const addToast = useToastStore(state => state.addToast);

  const AVAILABLE_PERMISSIONS = [
    { id: "MANAGE_MEMBERS", label: "Manage Members" },
    { id: "MANAGE_POSTS", label: "Manage Posts" },
    { id: "EDIT_SPACE", label: "Edit Space Info" },
  ];

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

  const handleUpdateRole = async (userId: string, newRole: string, permissions?: string[]) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ role: newRole, permissions })
      });
      if (res.ok) {
        setEditingPermissions(null);
        fetchSpaceAndMembers();
        addToast("Role updated successfully", "success");
      } else {
        const error = await res.json();
        addToast(error.message || "Failed to update role", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update role", "error");
    }
  };

  const handleUpdateStatusClick = (userId: string, newStatus: string) => {
    if (newStatus === 'SUSPENDED') {
      setReasonModalState({ isOpen: true, userId, newStatus });
    } else {
      executeStatusUpdate(userId, newStatus, "");
    }
  };

  const executeStatusUpdate = async (userId: string, newStatus: string, reason: string) => {

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members/${userId}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (res.ok) {
        fetchSpaceAndMembers();
        addToast("Status updated successfully", "success");
      } else {
        const error = await res.json();
        addToast(error.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    } finally {
      setReasonModalState(null);
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
        addToast("User invited successfully!", "success");
        setInviteUsername("");
        fetchSpaceAndMembers();
      } else {
        const error = await res.json();
        addToast(error.message || "Failed to invite user", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to invite user", "error");
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
                    <div className="relative group">
                      <Select 
                        value={member.role}
                        onValueChange={(newRole) => {
                          if (newRole === 'MODERATOR') {
                            setEditingPermissions({ userId: member.userId, role: newRole, permissions: member.permissions || [] });
                          } else {
                            handleUpdateRole(member.userId, newRole);
                          }
                        }}
                      >
                        <SelectTrigger className={`border-none rounded-full h-8 text-xs font-bold transition-colors ${
                          member.role === 'MODERATOR' 
                            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}>
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="MODERATOR">Moderator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {member.role === 'MODERATOR' && (
                      <button 
                        onClick={() => setEditingPermissions({ userId: member.userId, role: member.role, permissions: member.permissions || [] })}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Edit Permissions
                      </button>
                    )}
                    
                    
                    <div className="relative group">
                      <Select 
                        value={member.status}
                        onValueChange={(newStatus) => handleUpdateStatusClick(member.userId, newStatus)}
                      >
                        <SelectTrigger className={`border-none rounded-full h-8 text-xs font-bold transition-colors ${
                          member.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                          : member.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' 
                          : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                        }`}>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          <SelectItem value="APPEALED">Appealed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingPermissions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-xl font-bold mb-6 text-foreground tracking-tight">Moderator Permissions</h3>
            <div className="flex flex-col gap-3 mb-6">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPermissions.permissions.includes(perm.id)}
                    onChange={(e) => {
                      const newPerms = e.target.checked 
                        ? [...editingPermissions.permissions, perm.id]
                        : editingPermissions.permissions.filter(p => p !== perm.id);
                      setEditingPermissions({ ...editingPermissions, permissions: newPerms });
                    }}
                    className="w-5 h-5 rounded-md border-border bg-white/5 text-[#3BC492] focus:ring-[#3BC492]/50 transition-colors cursor-pointer"
                  />
                  <span className="text-[15px] font-medium ml-1">{perm.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setEditingPermissions(null)}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateRole(editingPermissions.userId, editingPermissions.role, editingPermissions.permissions)}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      <ReasonModal 
        isOpen={!!reasonModalState?.isOpen}
        title="Reason for Suspension"
        placeholder="Provide a reason for suspending this user..."
        onConfirm={(reason) => {
          if (reasonModalState) {
            executeStatusUpdate(reasonModalState.userId, reasonModalState.newStatus, reason);
          }
        }}
        onCancel={() => setReasonModalState(null)}
      />
    </div>
  );
}
