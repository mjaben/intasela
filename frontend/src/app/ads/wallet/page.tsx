"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useToastStore } from "@/store/useToastStore";

export default function AdvertiserWalletPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [showFundWallet, setShowFundWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [resBalance, resHistory] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/wallet/balance`, { headers, cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/wallet/transactions`, { headers, cache: 'no-store' })
      ]);

      if (resBalance.ok) {
        const data = await resBalance.json();
        setBalance(data.balance);
      }
      
      if (resHistory.ok) {
        const data = await resHistory.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching wallet data", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/wallet/fund`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount: Number(amount), reference }),
      });

      if (res.ok) {
        setShowFundWallet(false);
        setAmount("");
        setReference("");
        await fetchWalletData(); // Refresh history immediately
        addToast("Funding request submitted successfully. Awaiting confirmation.");
      } else {
        const errorData = await res.json().catch(() => ({}));
        addToast(errorData.message || "Failed to submit funding request. Please try again.");
      }
    } catch (error) {
      console.error(error);
      addToast("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filterStatus === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.status === filterStatus);

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen p-6 sm:p-10 space-y-8">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Ad Wallet</h1>
          <p className="text-sm text-muted-foreground">Manage your ad funds and view transaction history.</p>
        </div>
        <button 
          onClick={() => setShowFundWallet(true)} 
          className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Fund Wallet
        </button>
      </header>

      {/* DASHBOARD CARD */}
      <div className="relative rounded-2xl p-6 sm:p-8 overflow-hidden group shadow-lg mb-8">
        {/* Liquid Orbs Background */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full mix-blend-screen filter blur-[48px] group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand/20 rounded-full mix-blend-screen filter blur-[48px] group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#151B24]/40"></div>
        </div>

        {/* Glass Card Surface */}
        <div className="absolute inset-0 z-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"></div>

        <div className="relative z-20 flex items-center justify-between">
          <div>
            <p className="text-white/60 font-medium uppercase tracking-wider text-[11px] mb-2">Available Balance</p>
            {loadingData ? (
              <div className="h-12 w-40 bg-white/10 animate-pulse rounded-md"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white tracking-tight">
                  ₦{balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
                </span>
              </div>
            )}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs text-white/50 mb-1 font-medium tracking-wide">Status</p>
            <div className="inline-flex items-center gap-2 mt-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <span className={`w-2.5 h-2.5 rounded-full ${balance && balance > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></span>
              <span className="text-sm font-semibold text-white/90">{balance && balance > 0 ? 'Active & Ready' : 'Funds Required'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FUNDING MODAL */}
      {showFundWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative w-full max-w-md max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200 no-scrollbar">
            <button 
              onClick={() => { setShowFundWallet(false); setSuccess(false); }}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4">Top Up Funds</h2>

            <div className="space-y-4">
              {/* Bank Details */}
              <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-4 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <p className="text-[13px] text-white/60 mb-3 leading-relaxed">
                  Transfer the funding amount to the bank account below. Include your name in the transfer description.
                </p>
                <div className="space-y-2 text-sm bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center relative pr-6">
                    <span className="text-white/50 font-medium text-xs">Bank</span>
                    <strong className="text-white">Paystack</strong>
                  </div>
                  <div className="flex justify-between items-center relative pr-6">
                    <span className="text-white/50 font-medium text-xs">Account</span>
                    <strong className="text-base text-primary font-mono tracking-widest">23456789</strong>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("23456789");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      title="Copy Account Number"
                    >
                      {copied ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3BC492" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between items-center relative pr-6">
                    <span className="text-white/50 font-medium text-xs">Name</span>
                    <strong className="text-white">Intasela</strong>
                  </div>
                </div>
              </div>

              {/* Funding Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Amount Sent (₦)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min={1}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 focus:outline-none focus:border-white/30 text-white font-medium text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 font-bold mb-1 uppercase tracking-wider">Sender Name / Reference</label>
                  <input 
                    type="text" 
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                    placeholder="e.g. John Doe - Tech Corp"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 focus:outline-none focus:border-white/30 text-white placeholder:text-white/20 font-medium text-sm" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-bold px-4 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 mt-1"
                >
                  {loading ? "Submitting..." : "I have transferred the funds"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Transaction History</h3>
          <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/10">
            {['ALL', 'COMPLETED', 'PENDING', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  filterStatus === status 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {status === 'ALL' ? 'All' : status === 'COMPLETED' ? 'Success' : status === 'REJECTED' ? 'Failed' : 'Pending'}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg min-h-[300px]">
          {loadingData ? (
            <div className="p-16 flex justify-center"><div className="animate-pulse w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div></div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              <p>No transactions found.</p>
              <p className="text-sm mt-1">{filterStatus === 'ALL' ? 'Fund your wallet to start running campaigns.' : `No ${filterStatus.toLowerCase()} transactions.`}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Reference</th>
                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {t.type === 'MANUAL_FUNDING' ? 'Wallet Top Up' : 'Campaign Spend'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {t.reference || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-bold text-right ${t.type === 'MANUAL_FUNDING' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'MANUAL_FUNDING' ? '+' : '-'}₦{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${
                          t.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                          t.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
