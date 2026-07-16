"use client";

import { useState } from "react";
import { useUserStore } from "@/store/useUserStore";

export default function AdvertiserWalletPage() {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

      if (res.ok) setSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen p-6 sm:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fund Ad Wallet</h1>
        <p className="text-muted-foreground">Add funds to your business wallet to start running campaigns.</p>
      </header>

      {success ? (
        <div className="bg-primary/10 border border-primary/30 p-8 rounded-xl text-center">
          <div className="text-primary text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Funding Request Submitted</h2>
          <p className="text-muted-foreground">
            We have received your funding request. Once we confirm the transfer to our bank account, your wallet will be credited automatically.
          </p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-6 bg-primary text-primary-foreground font-bold px-6 py-2 rounded-lg"
          >
            Make Another Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Bank Details */}
          <div className="bg-card border border-border p-6 rounded-xl self-start">
            <h3 className="font-bold text-lg mb-4">Official Bank Details</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Please transfer the desired funding amount to the bank account below. Ensure you include your name in the transfer description.
            </p>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Bank Name</span>
                <strong className="text-lg">Paystack</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Account Number</span>
                <strong className="text-xl text-primary font-mono tracking-widest">23456789</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Account Name</span>
                <strong className="text-lg">Intasela</strong>
              </div>
            </div>
          </div>

          {/* Funding Form */}
          <div className="bg-card border border-border p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-4">Confirm Transfer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Amount Sent (USD)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={1}
                  className="w-full bg-background border border-border rounded-lg py-2 px-4 focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Sender Name / Reference</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  required
                  placeholder="e.g. John Doe - Tech Corp"
                  className="w-full bg-background border border-border rounded-lg py-2 px-4 focus:outline-none focus:border-primary" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "I have transferred the funds"}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
