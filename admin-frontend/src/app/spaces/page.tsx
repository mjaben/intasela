"use client";

import { useEffect, useState } from "react";
import { Users, MoreVertical, Edit, Trash2, Plus } from "lucide-react";
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
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteSpaceId, setDeleteSpaceId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({ id: "", name: "", description: "", type: "PUBLIC", coverUrl: "", postApprovalMode: "NONE" });
  
  const addToast = useToastStore((state) => state.addToast);

  const fetchSpaces = async () => {
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces`, {
        headers: { "x-admin-id": adminId },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-id": adminId },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchSpaces();
        setIsCreateModalOpen(false);
        setFormData({ id: "", name: "", description: "", type: "PUBLIC", coverUrl: "", postApprovalMode: "NONE" });
        addToast("Space created successfully", "success");
      } else {
        const err = await res.json();
        addToast(err.message || "Failed to create space", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${formData.id}`, {
        method: "POST", // mapped to POST /spaces/:id in backend for patch
        headers: { "Content-Type": "application/json", "x-admin-id": adminId },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchSpaces();
        setIsEditModalOpen(false);
        setFormData({ id: "", name: "", description: "", type: "PUBLIC", coverUrl: "", postApprovalMode: "NONE" });
        addToast("Space updated successfully", "success");
      } else {
        const err = await res.json();
        addToast(err.message || "Failed to update space", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteSpaceId) return;
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${deleteSpaceId}`, {
        method: "DELETE",
        headers: { "x-admin-id": adminId }
      });
      if (res.ok) {
        addToast("Space deleted", "success");
        fetchSpaces();
      } else {
        const err = await res.json();
        addToast(err.message || "Failed to delete space", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    } finally {
      setDeleteSpaceId(null);
    }
  };

  const openEditModal = (space: any) => {
    setFormData({
      id: space.id,
      name: space.name,
      description: space.description || "",
      type: space.type,
      coverUrl: space.coverUrl || "",
      postApprovalMode: space.postApprovalMode || "NONE"
    });
    setIsEditModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const uploadData = new FormData();
      uploadData.append("file", file);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/admin/image`, {
        method: "POST",
        headers: { "x-admin-id": adminId },
        body: uploadData
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, coverUrl: data.url }));
        addToast("Image uploaded", "success");
      } else {
        addToast("Failed to upload image", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Error uploading image", "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading spaces...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto relative">

      {/* Modals */}
      <AlertDialog open={!!deleteSpaceId} onOpenChange={(open) => { if (!open) setDeleteSpaceId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Space</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this space? All members and associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete Space</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manage Spaces</h1>
          <p className="text-gray-400">Create and monitor all public and private spaces.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: "", name: "", description: "", type: "PUBLIC", coverUrl: "", postApprovalMode: "NONE" });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus size={18} />
          Create Space
        </button>
      </div>

      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-black/20">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Approval Mode</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Members</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Created</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {spaces.map((space) => (
                <tr key={space.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
                        {space.coverUrl ? (
                          <img src={space.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand font-bold text-lg">
                            {space.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{space.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{space.description || "No description"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      space.type === 'PUBLIC' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {space.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                      {space.postApprovalMode === 'NONE' ? 'Auto-Approve' : space.postApprovalMode === 'FIRST_POST_ONLY' ? 'First Post' : 'All Posts'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Users size={14} />
                      <span>{space._count?.members || 0}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {format(new Date(space.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/spaces/${space.id}/members`}
                        className="p-1.5 text-gray-400 hover:text-brand bg-black/20 hover:bg-black/40 rounded transition-colors"
                        title="Manage Members"
                      >
                        <Users size={16} />
                      </Link>
                      <button 
                        onClick={() => openEditModal(space)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 bg-black/20 hover:bg-black/40 rounded transition-colors"
                        title="Edit Space"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteSpaceId(space.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 bg-black/20 hover:bg-black/40 rounded transition-colors"
                        title="Delete Space"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {spaces.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No spaces created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-card w-full max-w-md rounded-xl border border-brand-border p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6 flex-shrink-0">
              {isEditModalOpen ? "Edit Space" : "Create New Space"}
            </h2>
            <form onSubmit={isEditModalOpen ? handleEdit : handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-brand-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/40 border border-brand-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-colors h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                <Select 
                  value={formData.type}
                  onValueChange={(val) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger className="w-full bg-black/40 border border-brand-border rounded-lg px-4 h-[42px] text-white focus:ring-1 focus:ring-brand focus:ring-offset-0 focus:outline-none transition-colors">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-xl">
                    <SelectItem value="PUBLIC" className="focus:bg-brand/20 focus:text-brand cursor-pointer">Public</SelectItem>
                    <SelectItem value="PRIVATE" className="focus:bg-brand/20 focus:text-brand cursor-pointer">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Sela Approval Mode</label>
                <Select 
                  value={formData.postApprovalMode}
                  onValueChange={(val) => setFormData({...formData, postApprovalMode: val})}
                >
                  <SelectTrigger className="w-full bg-black/40 border border-brand-border rounded-lg px-4 h-[42px] text-white focus:ring-1 focus:ring-brand focus:ring-offset-0 focus:outline-none transition-colors">
                    <SelectValue placeholder="Select approval mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-xl">
                    <SelectItem value="NONE" className="focus:bg-brand/20 focus:text-brand cursor-pointer">Auto-Approve All</SelectItem>
                    <SelectItem value="FIRST_POST_ONLY" className="focus:bg-brand/20 focus:text-brand cursor-pointer">Require Approval for First Sela</SelectItem>
                    <SelectItem value="ALL_POSTS" className="focus:bg-brand/20 focus:text-brand cursor-pointer">Require Approval for All Selas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cover Image</label>
                {formData.coverUrl && (
                  <div className="mb-2 w-full h-32 rounded-lg overflow-hidden bg-black/40 border border-brand-border">
                    <img src={formData.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full bg-black/40 border border-brand-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/20 file:text-brand hover:file:bg-brand/30 cursor-pointer"
                />
                {uploading && <p className="text-xs text-brand mt-1">Uploading...</p>}
              </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-brand-border flex-shrink-0">
                <button 
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand/90 transition-colors"
                >
                  {isEditModalOpen ? "Save Changes" : "Save Space"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
