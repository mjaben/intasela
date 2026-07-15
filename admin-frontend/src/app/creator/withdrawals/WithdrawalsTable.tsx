"use client";

import { useState } from "react";
import EarningsFilters from "../EarningsFilters";
import Pagination from "../../users/Pagination";
import { approveWithdrawal, rejectWithdrawal } from "./actions";
import { useToastStore } from "@/store/useToastStore";
import ReasonModal from "@/components/ReasonModal";

type Transaction = {
  id: number;
  amount: number;
  status: string;
  createdAt: Date;
  user: {
    username: string;
    firstName: string;
    lastName: string;
    paymentSettings: any;
  };
};

export default function WithdrawalsTable({ 
  transactions, 
  totalTransactions, 
  currentPage, 
  pageSize,
}: { 
  transactions: Transaction[], 
  totalTransactions: number, 
  currentPage: number, 
  pageSize: number,
}) {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const addToast = useToastStore((state) => state.addToast);
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; id: number | null; type: "APPROVE" | "REJECT" | null; title: string; placeholder: string }>({
    isOpen: false,
    id: null,
    type: null,
    title: "",
    placeholder: ""
  });

  const requestAction = (id: number, type: "APPROVE" | "REJECT") => {
    if (type === "APPROVE") {
      setModalState({
        isOpen: true,
        id,
        type,
        title: "Approve Withdrawal",
        placeholder: "Reason for approval (e.g., Transaction ID / Bank Ref):"
      });
    } else {
      setModalState({
        isOpen: true,
        id,
        type,
        title: "Reject Withdrawal",
        placeholder: "Reason for rejection:"
      });
    }
  };

  const handleConfirmAction = async (reason: string) => {
    const { id, type } = modalState;
    if (!id || !type) return;
    
    setModalState(prev => ({ ...prev, isOpen: false }));
    setProcessingId(id);
    
    if (type === "APPROVE") {
      const result = await approveWithdrawal(id, reason);
      if (result.success) {
        addToast("Withdrawal approved successfully.");
      } else {
        addToast(result.error || "Failed to approve withdrawal.");
      }
    } else {
      const result = await rejectWithdrawal(id, reason);
      if (result.success) {
        addToast("Withdrawal rejected and amount refunded.");
      } else {
        addToast(result.error || "Failed to reject withdrawal.");
      }
    }
    
    setProcessingId(null);
  };
  return (
    <div className="w-full">
      <EarningsFilters />
      
      <div className="bg-brand-card rounded-xl shadow-md border border-brand-border/30 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] text-gray-400 uppercase bg-brand-bg/50 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Payment Info</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status & Actions</th>
                <th className="px-6 py-4 font-semibold text-right">Date Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                      <h3 className="text-lg font-medium text-gray-300">No withdrawals found</h3>
                      <p className="text-sm mt-1">Try adjusting your search query or filter selections.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  // Attempt to parse payment settings
                  let paymentInfo = "No payment info provided";
                  if (tx.user.paymentSettings) {
                    try {
                      // Depending on how it's stored, it might be an object or a JSON string
                      const settings = typeof tx.user.paymentSettings === "string" 
                        ? JSON.parse(tx.user.paymentSettings) 
                        : tx.user.paymentSettings;
                      
                      if (settings.method === "bank") {
                        paymentInfo = `Bank: ${settings.bankName || "Unknown"} | Acc: ${settings.accountNumber || "N/A"}`;
                      } else if (settings.method === "crypto") {
                        paymentInfo = `Crypto (${settings.network || "USDT"}): ${settings.address || "N/A"}`;
                      } else if (settings.method) {
                        paymentInfo = `${settings.method}: ${settings.accountNumber || settings.address || "N/A"}`;
                      }
                    } catch (e) {
                      console.error("Failed to parse payment settings", e);
                    }
                  }

                  return (
                    <tr key={tx.id} className={`hover:bg-brand-border/10 transition-colors ${processingId === tx.id ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-brand">
                            {tx.user.firstName[0]}{tx.user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-200">{tx.user.firstName} {tx.user.lastName}</div>
                            <div className="text-xs text-gray-500">@{tx.user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-400 font-mono bg-gray-900 px-2 py-1.5 rounded border border-gray-800">
                          {paymentInfo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-white">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(tx.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tx.status === "PENDING" ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 mr-2">
                              Pending
                            </span>
                            <button 
                            disabled={processingId === tx.id}
                            onClick={() => requestAction(tx.id, "APPROVE")}
                            className="bg-brand/10 text-brand px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-brand/20 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button 
                            disabled={processingId === tx.id}
                            onClick={() => requestAction(tx.id, "REJECT")}
                            className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                          </div>
                        ) : tx.status === "COMPLETED" ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                            {tx.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <div className="text-[10px] text-gray-600 mt-0.5">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <ReasonModal 
          isOpen={modalState.isOpen}
          title={modalState.title}
          placeholder={modalState.placeholder}
          onConfirm={handleConfirmAction}
          onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        />

        {transactions.length > 0 && (
           <Pagination totalItems={totalTransactions} currentPage={currentPage} pageSize={pageSize} />
        )}
      </div>
    </div>
  );
}
