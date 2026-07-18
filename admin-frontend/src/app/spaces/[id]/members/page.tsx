"use client";

import { useEffect, useState, use } from "react";
import { Users, MoreVertical, ArrowLeft, ShieldAlert, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToastStore } from "@/store/useToastStore";
import ReasonModal from "@/components/ReasonModal";

export default function SpaceMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [space, setSpace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteUsername, setInviteUsername] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inviting, setInviting] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  
  // Modal state
  const [revokeUserId, setRevokeUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<{userId: string, role: string, permissions: string[]} | null>(null);
  const [reasonModalState, setReasonModalState] = useState<{isOpen: boolean, userId: string, newStatus: string} | null>(null);

  const AVAILABLE_PERMISSIONS = [
    { id: "MANAGE_MEMBERS", label: "Manage Members" },
    { id: "MANAGE_POSTS", label: "Manage Posts" },
    { id: "EDIT_SPACE", label: "Edit Space Info" },
  ];

  const fetchSpaceAndMembers = async () => {
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const headers = { "x-admin-id": adminId };
      
      const spaceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}`, { headers });
      if (spaceRes.ok) setSpace(await spaceRes.json());
      
      const membersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members`, { headers });
      if (membersRes.ok) setMembers(await membersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaceAndMembers();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (inviteUsername.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/search?q=${encodeURIComponent(inviteUsername)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inviteUsername]);

  const handleUpdateRole = async (userId: string, newRole: string, permissions?: string[]) => {
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-id": adminId },
        body: JSON.stringify({ role: newRole, permissions })
      });
      if (res.ok) {
        addToast("Role updated successfully", "success");
        setEditingPermissions(null);
        fetchSpaceAndMembers();
      } else {
        addToast("Failed to update role", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
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
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members/${userId}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-id": adminId },
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (res.ok) {
        addToast("Status updated successfully", "success");
        fetchSpaceAndMembers();
      } else {
        addToast("Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    } finally {
      setReasonModalState(null);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeUserId) return;
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/invitations/${revokeUserId}`, {
        method: "DELETE",
        headers: { "x-admin-id": adminId }
      });
      if (res.ok) {
        addToast("Invitation revoked", "success");
        fetchSpaceAndMembers();
      } else {
        addToast("Failed to revoke invitation", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    } finally {
      setRevokeUserId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;
    
    setInviting(true);
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      
      // We will loop and invite each selected user
      const results = await Promise.allSettled(
        selectedUsers.map(user => 
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-id": adminId },
            body: JSON.stringify({ username: user.username })
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to invite ${user.username}`);
            return res;
          })
        )
      );
      
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        addToast(`Failed to invite ${failures.length} user(s).`, "error");
      } else {
        addToast(`Successfully invited ${selectedUsers.length} user(s)!`, "success");
      }
      
      setSelectedUsers([]);
      setInviteUsername("");
      fetchSpaceAndMembers();
    } catch (err) {
      console.error(err);
      addToast("An error occurred during invite", "error");
    } finally {
      setInviting(false);
    }
  };

  const removeSelectedUser = (username: string) => {
    setSelectedUsers(prev => prev.filter(u => u.username !== username));
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading members...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto relative">

      <AlertDialog open={!!revokeUserId} onOpenChange={(open) => { if (!open) setRevokeUserId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this user's invitation? They will no longer be able to join the space unless re-invited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke} className="bg-red-500 hover:bg-red-600 text-white border-0">Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Link href="/spaces" className="inline-flex items-center gap-2 text-brand hover:text-brand/80 mb-6 font-medium transition-colors">
        <ArrowLeft size={16} /> Back to Spaces
      </Link>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Space Members: {space?.name}</h1>
          <p className="text-gray-400">Manage members, assign moderators, and handle suspensions.</p>
        </div>
      </div>

      <div className="bg-brand-card p-6 rounded-xl border border-brand-border mb-8 relative z-20">
        <h2 className="text-lg font-bold text-white mb-4">Invite Users</h2>
        
        {/* Selected Users Pills */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedUsers.map(user => (
              <div key={user.username} className="flex items-center gap-1.5 bg-brand/20 text-brand px-3 py-1.5 rounded-full text-sm font-medium border border-brand/30">
                <img src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} className="w-5 h-5 rounded-full object-cover bg-black/40" alt="" />
                <span>@{user.username}</span>
                <button type="button" onClick={() => removeSelectedUser(user.username)} className="ml-1 text-brand hover:text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleInvite} className="flex gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inviteUsername} 
              onChange={(e) => {
                setInviteUsername(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (searchResults.length > 0 && inviteUsername.length >= 2) setShowDropdown(true);
              }}
              onBlur={() => {
                // Delay hiding dropdown so clicks register
                setTimeout(() => setShowDropdown(false), 200);
              }}
              placeholder={selectedUsers.length > 0 ? "Search for more users..." : "Search username or name..."} 
              className="w-full bg-black/40 border border-brand-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-colors"
            />
            {/* Autocomplete Dropdown */}
            {showDropdown && (inviteUsername.length >= 2) && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#18181b] border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-400 animate-pulse">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="py-2">
                    {searchResults.filter(u => !selectedUsers.find(su => su.username === u.username)).map(user => (
                      <li key={user.id}>
                        <div
                          className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent onBlur from firing before click
                            setSelectedUsers(prev => [...prev, user]);
                            setInviteUsername("");
                            setShowDropdown(false);
                          }}
                        >
                          <img 
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} 
                            alt="" 
                            className="w-8 h-8 rounded-full object-cover shrink-0 bg-black/40"
                          />
                          <div className="truncate">
                            <div className="font-bold text-white text-sm truncate">{user.firstName} {user.lastName}</div>
                            <div className="text-gray-400 text-xs truncate">@{user.username}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                    {searchResults.filter(u => !selectedUsers.find(su => su.username === u.username)).length === 0 && (
                       <div className="p-4 text-center text-sm text-gray-500">All matching users selected.</div>
                    )}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No users found matching "{inviteUsername}"</div>
                )}
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={inviting || selectedUsers.length === 0}
            className={`font-bold px-6 py-2 rounded-lg transition-colors shrink-0 ${
              inviting || selectedUsers.length === 0 
                ? "bg-brand/50 text-white/50 cursor-not-allowed" 
                : "bg-brand text-white hover:bg-brand/90"
            }`}
          >
            {inviting ? "Inviting..." : `Invite ${selectedUsers.length > 0 ? selectedUsers.length : ''} User${selectedUsers.length > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>

      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-black/20">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/40 overflow-hidden flex-shrink-0">
                        <img 
                          src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.user?.username}`} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{member.user?.firstName || member.user?.username}</div>
                        <div className="text-sm text-gray-500">@{member.user?.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="relative inline-block group w-32">
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
                            ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                            : 'bg-black/40 text-gray-300 hover:bg-white/5'
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
                        className="block mt-2 text-[10px] text-brand hover:text-white hover:underline transition-colors w-full text-center"
                      >
                        Edit Permissions
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {member.status === 'ACTIVE' && <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><CheckCircle2 size={12} /> Active</span>}
                      {member.status === 'PENDING' && <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">Pending</span>}
                      {member.status === 'INVITED' && <span className="flex items-center gap-1.5 text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">Invited</span>}
                      {member.status === 'SUSPENDED' && <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-full"><Ban size={12} /> Suspended</span>}
                      {member.status === 'APPEALED' && <span className="flex items-center gap-1.5 text-xs font-medium text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">Appealed</span>}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {format(new Date(member.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="p-4 text-right">
                    {member.status !== 'SUSPENDED' && member.status !== 'INVITED' && member.status !== 'APPEALED' && (
                      <button 
                        onClick={() => handleUpdateStatusClick(member.userId, 'SUSPENDED')}
                        className="p-1.5 text-gray-400 hover:text-red-400 bg-black/20 hover:bg-black/40 rounded transition-colors ml-2"
                        title="Suspend User"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    {member.status === 'INVITED' && (
                      <button 
                        onClick={() => setRevokeUserId(member.userId)}
                        className="text-xs font-medium text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-400/50 px-3 py-1 rounded transition-colors ml-2"
                      >
                        Revoke
                      </button>
                    )}
                    {member.status === 'APPEALED' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateStatusClick(member.userId, 'ACTIVE')}
                          className="bg-green-500/10 text-green-500 hover:bg-green-500/20 px-3 py-1 rounded text-xs font-medium transition-colors border border-green-500/20"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateStatusClick(member.userId, 'SUSPENDED')}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded text-xs font-medium transition-colors border border-red-500/20"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Modal */}
      {editingPermissions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Moderator Permissions</h3>
            <div className="flex flex-col gap-3 mb-6">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={editingPermissions.permissions.includes(perm.id)}
                    onChange={(e) => {
                      const newPerms = e.target.checked 
                        ? [...editingPermissions.permissions, perm.id]
                        : editingPermissions.permissions.filter(p => p !== perm.id);
                      setEditingPermissions({ ...editingPermissions, permissions: newPerms });
                    }}
                    className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-brand focus:ring-brand focus:ring-offset-black transition-colors cursor-pointer"
                  />
                  <span className="text-[15px] font-medium text-gray-300 group-hover:text-white transition-colors ml-1">{perm.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setEditingPermissions(null)}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-white/5 text-gray-300 hover:bg-white/10 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateRole(editingPermissions.userId, editingPermissions.role, editingPermissions.permissions)}
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-brand text-black hover:bg-brand/90 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      <ReasonModal 
        isOpen={!!reasonModalState?.isOpen}
        title="Reason for Suspension/Rejection"
        placeholder="Provide a reason..."
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
