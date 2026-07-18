"use client";

import EarningsFilters from "./EarningsFilters";
import Pagination from "../users/Pagination";
import Link from "next/link";

type Transaction = {
  id: number;
  amount: number;
  status: string;
  createdAt: Date;
  user: {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  post: {
    id: number;
    content: string;
  } | null;
};

export default function EarningsTable({ 
  transactions, 
  totalTransactions, 
  currentPage, 
  pageSize,
  earningsType
}: { 
  transactions: Transaction[], 
  totalTransactions: number, 
  currentPage: number, 
  pageSize: number,
  earningsType: "Sela" | "Resela" | "Replies" | "Views"
}) {
  return (
    <div className="w-full">
      <EarningsFilters />
      
      <div className="bg-brand-card rounded-xl shadow-md border border-brand-border/30 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] text-gray-400 uppercase bg-brand-bg/50 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Creator</th>
                <th className="px-6 py-4 font-semibold w-1/3">Content Ref</th>
                <th className="px-6 py-4 font-semibold">Amount Earned</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                      <h3 className="text-lg font-medium text-gray-300">No {earningsType.toLowerCase()} earnings found</h3>
                      <p className="text-sm mt-1">Try adjusting your search query or filter selections.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-brand-border/10 transition-colors">
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
                      {tx.post ? (
                        <Link href={`/moderation/selas`} className="block group">
                          <p className="text-sm text-gray-300 line-clamp-1 group-hover:text-brand transition-colors">
                            {tx.post.content || <span className="italic text-gray-500">Media only</span>}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Sela ID: #{tx.post.id}</p>
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Content unavailable or deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="font-bold text-brand">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(tx.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.status === "COMPLETED" ? (
                         <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">Completed</span>
                      ) : (
                         <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">{tx.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                       <div className="text-[10px] text-gray-600 mt-0.5">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {transactions.length > 0 && (
           <Pagination totalItems={totalTransactions} currentPage={currentPage} pageSize={pageSize} />
        )}
      </div>
    </div>
  );
}
