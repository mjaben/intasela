"use client";

import { useState, useTransition } from "react";
import ContentFilters from "./ContentFilters";
import Pagination from "../users/Pagination";
import { togglePostFlag, togglePostEligibility, deletePost } from "./actions";
import ReasonModal from "@/components/ReasonModal";

type Post = {
  id: number;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  author: {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  earned: number;
  viewsCount: number;
  isEligible: boolean;
  isFlagged: boolean;
  createdAt: Date;
};

export default function ContentTable({ 
  posts, 
  totalPosts, 
  currentPage, 
  pageSize,
  contentType
}: { 
  posts: Post[], 
  totalPosts: number, 
  currentPage: number, 
  pageSize: number,
  contentType: "Selas" | "Orbits" | "Replies" | "Flagged Content"
}) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modalState, setModalState] = useState<{ 
    isOpen: boolean; 
    id: number | null; 
    actionType: "FLAG" | "ELIGIBILITY" | "DELETE" | null; 
    currentStatus?: boolean; 
    title: string; 
    placeholder: string 
  }>({
    isOpen: false,
    id: null,
    actionType: null,
    title: "",
    placeholder: ""
  });

  const requestAction = (id: number, actionType: "FLAG" | "ELIGIBILITY" | "DELETE", currentStatus?: boolean) => {
    if (actionType === "DELETE" && !confirm("Are you sure you want to permanently delete this content?")) return;
    
    setModalState({
      isOpen: true,
      id,
      actionType,
      currentStatus,
      title: actionType === "DELETE" ? "Reason for deletion" : "Reason for this action",
      placeholder: actionType === "DELETE" ? "Reason for deletion:" : "Reason for this action:"
    });
  };

  const handleConfirmAction = (reason: string) => {
    const { id, actionType, currentStatus } = modalState;
    if (!id || !actionType) return;
    
    setModalState(prev => ({ ...prev, isOpen: false }));
    
    startTransition(async () => {
      if (actionType === "FLAG") {
        await togglePostFlag(id, !currentStatus, reason);
      } else if (actionType === "ELIGIBILITY") {
        await togglePostEligibility(id, !currentStatus, reason);
      } else if (actionType === "DELETE") {
        setDeletingId(id);
        await deletePost(id, reason);
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="w-full">
      <ContentFilters />
      
      <div className="bg-brand-card rounded-xl shadow-md border border-brand-border/30 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] text-gray-400 uppercase bg-brand-bg/50 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/3">Content Snippet</th>
                <th className="px-6 py-4 font-semibold">Author</th>
                <th className="px-6 py-4 font-semibold">Metrics</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      <h3 className="text-lg font-medium text-gray-300">No {contentType.toLowerCase()} found</h3>
                      <p className="text-sm mt-1">Try adjusting your search query or filter selections.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className={`hover:bg-brand-border/10 transition-colors ${deletingId === post.id ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {post.mediaUrl ? (
                          <div className="w-12 h-12 rounded bg-gray-800 flex-shrink-0 overflow-hidden border border-gray-700 relative flex items-center justify-center">
                             {post.mediaType === "VIDEO" ? (
                               <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"></path></svg>
                             ) : (
                               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                             )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-brand-bg flex-shrink-0 border border-brand-border/50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 line-clamp-2 leading-snug">
                            {post.content || <span className="italic text-gray-500">No text content</span>}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{new Date(post.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px] text-brand">
                          {post.author.firstName[0]}{post.author.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-200 text-xs">{post.author.firstName} {post.author.lastName}</div>
                          <div className="text-[10px] text-gray-500">@{post.author.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-xs text-gray-300">Views: <span className="font-semibold text-gray-100">{post.viewsCount.toLocaleString()}</span></div>
                       <div className="text-xs text-brand font-semibold mt-0.5">Earned: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(post.earned)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        {post.isEligible ? (
                           <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">Monetized</span>
                        ) : (
                           <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">Ineligible</span>
                        )}

                        {post.isFlagged && (
                           <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Flagged</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <div className="flex items-center justify-end gap-3">
                         <button 
                            onClick={() => requestAction(post.id, "FLAG", post.isFlagged)}
                            disabled={isPending}
                            className={`text-xs font-semibold transition-colors disabled:opacity-50 ${post.isFlagged ? 'text-gray-400 hover:text-white' : 'text-orange-400 hover:text-orange-300'}`}
                          >
                            {post.isFlagged ? 'Unflag' : 'Flag'}
                         </button>
                         <button 
                            onClick={() => requestAction(post.id, "ELIGIBILITY", post.isEligible)}
                            disabled={isPending}
                            className="text-xs font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {post.isEligible ? 'Restrict' : 'Allow Earnings'}
                         </button>
                         <button 
                            onClick={() => requestAction(post.id, "DELETE")}
                            disabled={deletingId === post.id || isPending}
                            className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            Delete
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
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

        {/* Pagination Footer */}
        {posts.length > 0 && (
           <Pagination totalItems={totalPosts} currentPage={currentPage} pageSize={pageSize} />
        )}
      </div>
    </div>
  );
}
