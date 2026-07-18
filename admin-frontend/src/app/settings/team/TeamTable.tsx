"use client";

import { useState, useTransition } from "react";
import { inviteAdmin } from "./actions";
import { useToastStore } from "@/store/useToastStore";

type Role = { id: string; name: string; permissions: any };
type SystemAdmin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: Role;
  createdAt: Date;
};

export default function TeamTable({ initialAdmins, roles }: { initialAdmins: SystemAdmin[], roles: Role[] }) {
  const [isPending, startTransition] = useTransition();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    roleId: ""
  });
  const addToast = useToastStore(state => state.addToast);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.roleId) {
      addToast("Please fill all fields.", "error");
      return;
    }
    
    startTransition(async () => {
      const result = await inviteAdmin(formData);
      if (result.success) {
        setIsInviteModalOpen(false);
        setFormData({ email: "", password: "", firstName: "", lastName: "", roleId: "" });
        addToast("Admin invited successfully", "success");
      } else {
        addToast(result.error || "Failed to invite admin", "error");
      }
    });
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2 bg-brand text-brand-bg font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors"
        >
          Invite Admin
        </button>
      </div>

      <div className="bg-brand-card rounded-xl shadow-md border border-brand-border/30 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] text-gray-400 uppercase bg-brand-bg/50 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Admin</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {initialAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-brand-border/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-brand">
                        {admin.firstName[0]}{admin.lastName[0]}
                      </div>
                      <div className="font-medium text-gray-200">{admin.firstName} {admin.lastName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand">
                      {admin.role.name.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {admin.isActive ? (
                      <span className="text-brand font-medium">Active</span>
                    ) : (
                      <span className="text-red-400 font-medium">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isPending && setIsInviteModalOpen(false)}></div>
          <div className="relative bg-brand-card border border-brand-border/50 rounded-xl shadow-2xl w-[400px] p-6">
            <h3 className="text-lg font-bold text-gray-200 mb-6">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex gap-4">
                <input required placeholder="First Name" className="w-full bg-brand-bg border border-brand-border rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-brand" 
                  value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input required placeholder="Last Name" className="w-full bg-brand-bg border border-brand-border rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-brand"
                  value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <input required type="email" placeholder="Email Address" className="w-full bg-brand-bg border border-brand-border rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-brand"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input required type="text" placeholder="Temporary Password" className="w-full bg-brand-bg border border-brand-border rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-brand"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              
              <select required className="w-full bg-brand-bg border border-brand-border rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-brand"
                value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}>
                <option value="" disabled>Select Role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>)}
              </select>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} disabled={isPending}
                  className="px-4 py-2 text-gray-400 font-semibold text-sm hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isPending}
                  className="px-4 py-2 bg-brand text-brand-bg font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50">
                  {isPending ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
