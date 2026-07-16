"use client";

import { useEffect, useState } from "react";
import ReasonModal from "@/components/ReasonModal";
import { useToastStore } from "@/store/useToastStore";

export default function AdCampaignsPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{isOpen: boolean, id: string, action: 'approve' | 'reject' | null}>({
    isOpen: false,
    id: '',
    action: null
  });

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("admin_access_token") || localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/campaigns`, { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleActionClick = (id: string, action: 'approve' | 'reject') => {
    setModalState({ isOpen: true, id, action });
  };

  const handleConfirmAction = async (reason: string) => {
    const { id, action } = modalState;
    if (!id || !action) return;

    try {
      const token = localStorage.getItem("admin_access_token") || localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/campaigns/${action}/${id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        addToast(`Successfully ${action}d campaign.`);
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(`Error: ${err.message || 'Failed to process request'}`);
      }
    } catch (err) {
      console.error(err);
      addToast("Network error occurred.");
    } finally {
      setModalState({ isOpen: false, id: '', action: null });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ad Campaigns</h1>
          <p className="text-gray-400 text-sm mt-1">Review, approve, or reject advertiser campaigns.</p>
        </div>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold">Advertiser</th>
                  <th className="px-6 py-4 font-semibold">Campaign Name</th>
                  <th className="px-6 py-4 font-semibold">Objective / Bid</th>
                  <th className="px-6 py-4 font-semibold">Budget</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No campaigns found.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(camp.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{camp.advertiser?.companyName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{camp.advertiser?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{camp.name}</td>
                      <td className="px-6 py-4">
                        <div className="uppercase text-[10px] tracking-wider text-brand font-bold mb-0.5">{camp.objective}</div>
                        <div className="text-xs text-gray-400">Bid: ₦{camp.bid}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">₦{camp.budget.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${
                          camp.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 
                          camp.status === 'REJECTED' || camp.status === 'PAUSED' ? 'bg-red-500/10 text-red-500' : 
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {camp.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleActionClick(camp.id, 'approve')}
                              className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded hover:bg-brand/90 transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleActionClick(camp.id, 'reject')}
                              className="px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-bold rounded hover:bg-red-500/20 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReasonModal
        isOpen={modalState.isOpen}
        title={`Confirm ${modalState.action === 'approve' ? 'Approval' : 'Rejection'}`}
        placeholder="Provide a reason (optional but recommended)..."
        onConfirm={handleConfirmAction}
        onCancel={() => setModalState({ isOpen: false, id: '', action: null })}
      />
    </div>
  );
}
