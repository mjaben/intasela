"use client";

import { useEffect, useState } from "react";

export default function AdminFundingDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/funding/pending`, { headers });
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/funding/approve/${id}`, {
        method: "POST",
        headers
      });
      
      // Remove from list
      setRequests(requests.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Pending Funding Requests</h1>
          <p className="text-muted-foreground">Review and approve manual bank transfers to credit advertiser wallets.</p>
        </div>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-muted/20 rounded-xl w-full"></div>
          <div className="h-16 bg-muted/20 rounded-xl w-full"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          No pending funding requests.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Advertiser</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Amount</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Reference</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Date</th>
                <th className="px-6 py-4 font-semibold text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold">{req.advertiser?.companyName}</div>
                    <div className="text-xs text-muted-foreground">{req.advertiser?.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">${req.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">{req.reference}</td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleApprove(req.id)}
                      className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-xs hover:opacity-90"
                    >
                      Approve & Credit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
