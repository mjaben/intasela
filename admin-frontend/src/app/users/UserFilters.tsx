"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

export default function UserFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filter States
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [isSuspended, setIsSuspended] = useState(searchParams.get("suspended") === "true");
  const [isShadowBanned, setIsShadowBanned] = useState(searchParams.get("shadowbanned") === "true");
  const [gender, setGender] = useState(searchParams.get("gender") || "all");
  const [state, setState] = useState(searchParams.get("state") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "desc");

  // Debounced Search Update
  useEffect(() => {
    const handler = setTimeout(() => {
      updateUrl({ search: search || null, page: "1" }); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyFilters = () => {
    updateUrl({
      status,
      suspended: isSuspended ? "true" : null,
      shadowbanned: isShadowBanned ? "true" : null,
      gender,
      state,
      page: "1"
    });
    setShowFilterMenu(false);
  };

  const clearFilters = () => {
    setStatus("all");
    setIsSuspended(false);
    setIsShadowBanned(false);
    setGender("all");
    setState("all");
    updateUrl({ status: null, suspended: null, shadowbanned: null, gender: null, state: null, page: "1" });
    setShowFilterMenu(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full mb-6 relative">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border/50 text-gray-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-bg border border-brand-border/50 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filter
          </button>
          
          {showFilterMenu && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-brand-card border border-brand-border/50 rounded-xl shadow-xl z-50 p-5">
              <div className="space-y-4">
                {/* Status Group */}
                <div>
                  <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-2 block">Group Status</label>
                  <div className="flex gap-4 text-sm text-gray-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" checked={status === "all"} onChange={() => setStatus("all")} className="appearance-none w-4 h-4 rounded-full border border-gray-600 bg-brand-bg checked:border-[4px] checked:border-brand transition-all cursor-pointer" /> All
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" checked={status === "active"} onChange={() => setStatus("active")} className="appearance-none w-4 h-4 rounded-full border border-gray-600 bg-brand-bg checked:border-[4px] checked:border-brand transition-all cursor-pointer" /> Active
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" checked={status === "inactive"} onChange={() => setStatus("inactive")} className="appearance-none w-4 h-4 rounded-full border border-gray-600 bg-brand-bg checked:border-[4px] checked:border-brand transition-all cursor-pointer" /> In-active
                    </label>
                  </div>
                </div>

                {/* Moderation */}
                <div>
                  <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-2 block">Moderation</label>
                  <div className="flex flex-col gap-2 text-sm text-gray-300">
                    <label className="flex items-center gap-2 cursor-pointer relative">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" checked={isSuspended} onChange={(e) => setIsSuspended(e.target.checked)} className="appearance-none w-4 h-4 rounded border border-gray-600 bg-brand-bg checked:bg-brand checked:border-brand transition-all cursor-pointer" />
                        {isSuspended && <svg className="absolute w-3 h-3 text-brand-bg pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      Suspended
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer relative">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" checked={isShadowBanned} onChange={(e) => setIsShadowBanned(e.target.checked)} className="appearance-none w-4 h-4 rounded border border-gray-600 bg-brand-bg checked:bg-brand checked:border-brand transition-all cursor-pointer" />
                        {isShadowBanned && <svg className="absolute w-3 h-3 text-brand-bg pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      Shadow Banned
                    </label>
                  </div>
                </div>

                {/* Demographics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1 block">Gender</label>
                    <div className="relative">
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="appearance-none w-full bg-brand-bg border border-brand-border/50 text-gray-200 text-xs rounded p-2 pr-8 outline-none focus:border-brand cursor-pointer">
                        <option value="all">All</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-1 block">State</label>
                    <div className="relative">
                      <select value={state} onChange={(e) => setState(e.target.value)} className="appearance-none w-full bg-brand-bg border border-brand-border/50 text-gray-200 text-xs rounded p-2 pr-8 outline-none focus:border-brand cursor-pointer">
                        <option value="all">All</option>
                        {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-brand-border/30">
                  <button onClick={clearFilters} className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors">Clear</button>
                  <button onClick={applyFilters} className="flex-1 py-2 text-xs font-semibold bg-brand text-brand-bg rounded hover:bg-brand-hover transition-colors">Apply Filters</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <select 
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            updateUrl({ sort: e.target.value });
          }}
          className="appearance-none bg-brand-bg border border-brand-border/50 text-gray-200 text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:border-brand cursor-pointer"
        >
          <option value="desc">Newest to Oldest</option>
          <option value="asc">Oldest to Newest</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
}
