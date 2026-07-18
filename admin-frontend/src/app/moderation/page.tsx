"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useToastStore } from "@/store/useToastStore";
import ReasonModal from "@/components/ReasonModal";

export default function ModerationModule() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore(state => state.addToast);
  const [modalState, setModalState] = useState<{isOpen: boolean, spaceId: string, userId: string, newStatus: string} | null>(null);

  const fetchAppeals = async () => {
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const headers = { "x-admin-id": adminId };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/admin/appeals`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAppeals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const handleUpdateStatusClick = (spaceId: string, userId: string, newStatus: string) => {
    if (newStatus === 'SUSPENDED') {
      setModalState({ isOpen: true, spaceId, userId, newStatus });
    } else {
      executeStatusUpdate(spaceId, userId, newStatus, "");
    }
  };

  const executeStatusUpdate = async (spaceId: string, userId: string, newStatus: string, reason: string) => {
    try {
      const adminId = localStorage.getItem("admin_id") || "admin";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${spaceId}/members/${userId}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-id": adminId },
        body: JSON.stringify({ status: newStatus, reason })
      });
      
      if (res.ok) {
        addToast("Status updated successfully", "success");
        fetchAppeals();
      } else {
        const error = await res.json();
        addToast(error.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    } finally {
      setModalState(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Content Moderation</h1>
        <p className="text-sm text-gray-400 mt-1">Review flagged selas, comments, and appeals.</p>
      </div>
      
      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Pending Appeals
          </h2>
          <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-700">
            {appeals.length} Total
          </span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading appeals...</div>
        ) : appeals.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <svg className="w-12 h-12 mb-3 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <p>No pending appeals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/30">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Space</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Original Reason</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Appealed</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {appeals.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={appeal.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${appeal.user.username}`} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-gray-700 object-cover" 
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{appeal.user.firstName || appeal.user.username}</div>
                          <div className="text-xs text-gray-500">@{appeal.user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300 font-medium">
                      {appeal.space.name}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-red-400 max-w-[250px] truncate" title={appeal.suspendReason || "No reason provided"}>
                        {appeal.suspendReason || <span className="text-gray-600 italic">No reason provided</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {formatDistanceToNow(new Date(appeal.updatedAt), { addSuffix: true })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateStatusClick(appeal.spaceId, appeal.userId, 'ACTIVE')}
                          className="bg-green-500/10 text-green-500 hover:bg-green-500/20 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-green-500/20"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateStatusClick(appeal.spaceId, appeal.userId, 'SUSPENDED')}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-red-500/20"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReasonModal 
        isOpen={!!modalState?.isOpen}
        title="Reason for Rejection"
        placeholder="Provide a reason for rejecting this appeal..."
        onConfirm={(reason) => {
          if (modalState) {
            executeStatusUpdate(modalState.spaceId, modalState.userId, modalState.newStatus, reason);
          }
        }}
        onCancel={() => setModalState(null)}
      />
    </div>
  );
}
