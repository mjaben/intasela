"use client";

import { useState, useTransition } from "react";
import { assignUserRole } from "./actions";
import ReasonModal from "@/components/ReasonModal";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  walletBalance: number;
  isSpaceMod: boolean;
  createdAt: Date;
  isActive?: boolean;
  isSuspended?: boolean;
  isShadowBanned?: boolean;
  state?: string | null;
  gender?: string | null;
  phone?: string | null;
};

import UserFilters from "./UserFilters";
import Pagination from "./Pagination";

export default function UserTable({ initialUsers, totalUsers, totalSystemUsers, currentPage, pageSize }: { initialUsers: User[]; totalUsers: number, totalSystemUsers: number, currentPage: number, pageSize: number }) {
  const [isPending, startTransition] = useTransition();
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; userId: string; currentStatus: boolean; title: string }>({
    isOpen: false,
    userId: "",
    currentStatus: false,
    title: ""
  });

  const requestSpaceModToggle = (userId: string, currentStatus: boolean) => {
    setModalState({
      isOpen: true,
      userId,
      currentStatus,
      title: "Reason for modifying Space Mod status"
    });
  };

  const handleConfirmSpaceModToggle = (reason: string) => {
    const { userId, currentStatus } = modalState;
    setModalState(prev => ({ ...prev, isOpen: false }));
    
    startTransition(async () => {
      await assignUserRole(userId, !currentStatus, reason);
    });
  };

  return (
    <div className="w-full">
      <UserFilters />
      
      <div className="bg-brand-card rounded-xl shadow-md border border-brand-border/30 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] text-gray-400 uppercase bg-brand-bg/50 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Status & Balance</th>
                <th className="px-6 py-4 font-semibold">Moderation</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      {totalSystemUsers === 0 ? (
                        <>
                          <h3 className="text-lg font-medium text-gray-300">No users in the database</h3>
                          <p className="text-sm mt-1">Users will appear here once they register on the platform.</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-medium text-gray-300">No users match your filters</h3>
                          <p className="text-sm mt-1">Try adjusting your search query or filter selections.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-brand-border/10 transition-colors ${user.isSuspended || user.isShadowBanned ? 'opacity-70' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-brand">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-200 flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {user.isActive === false && <span className="w-2 h-2 rounded-full bg-gray-600" title="Inactive"></span>}
                          </div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-300">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.state ? `${user.state}, Nigeria` : 'No location'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="font-medium text-gray-200">₦{new Intl.NumberFormat('en-NG').format(user.walletBalance)}</div>
                       <div className="flex gap-1 mt-1">
                         {user.isSuspended && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">Suspended</span>}
                         {user.isShadowBanned && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">Shadow Banned</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={user.isSpaceMod}
                            disabled={isPending}
                            onChange={() => requestSpaceModToggle(user.id, user.isSpaceMod)}
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                          <span className="ml-3 text-xs font-medium text-gray-300">
                            {user.isSpaceMod ? "Space Mod" : "Standard"}
                          </span>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <div className="flex items-center justify-end gap-3">
                         <button 
                            onClick={() => setViewingUser(user)}
                            className="text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
                          >
                            View Profile
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
          onConfirm={handleConfirmSpaceModToggle}
          onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Pagination Footer */}
        {initialUsers.length > 0 && (
           <Pagination totalItems={totalUsers} currentPage={currentPage} pageSize={pageSize} />
        )}
      </div>

      {/* Right Sidebar for User Profile */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setViewingUser(null)}></div>
          <div className="relative w-[400px] bg-brand-card border-l border-brand-border/50 h-full p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <button onClick={() => setViewingUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
            
            <div className="flex flex-col items-center mt-6 mb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center font-bold text-2xl text-brand mb-4 border-2 border-brand-border/50">
                {viewingUser.firstName[0]}{viewingUser.lastName[0]}
              </div>
              <h2 className="text-xl font-bold text-gray-200">{viewingUser.firstName} {viewingUser.lastName}</h2>
              <p className="text-gray-400 text-sm">@{viewingUser.username}</p>
              
              <div className="flex gap-2 mt-3">
                {viewingUser.isActive === false && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-700 text-gray-300">Inactive</span>}
                {viewingUser.isSuspended && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">Suspended</span>}
                {viewingUser.isShadowBanned && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">Shadow Banned</span>}
                {!viewingUser.isSuspended && !viewingUser.isShadowBanned && viewingUser.isActive !== false && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">Active</span>}
              </div>
            </div>

            <div className="px-2 mt-8">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Email Address</span>
                  <span className="text-sm text-gray-200 font-medium">{viewingUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Phone Number</span>
                  <span className="text-sm text-gray-200 font-medium">{viewingUser.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="flex my-6">
                <hr className="w-10/12 border-brand-border/30" />
              </div>

              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Demographics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Gender</span>
                  <span className="text-sm text-gray-200 font-medium">{viewingUser.gender || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">State</span>
                  <span className="text-sm text-gray-200 font-medium">{viewingUser.state ? `${viewingUser.state}, Nigeria` : 'Not specified'}</span>
                </div>
              </div>

              <div className="flex my-6">
                <hr className="w-10/12 border-brand-border/30" />
              </div>

              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Platform Data</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Wallet Balance</span>
                  <span className="text-sm text-brand font-bold">₦{new Intl.NumberFormat('en-NG').format(viewingUser.walletBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Space Mod</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${viewingUser.isSpaceMod ? 'text-purple-400' : 'text-gray-400'}`}>
                    {viewingUser.isSpaceMod ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Joined</span>
                  <span className="text-sm text-gray-200 font-medium">{new Date(viewingUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
