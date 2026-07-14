"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function ContentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "desc");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateUrl = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("page", "1");
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "all") {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });

    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== (searchParams.get("search") || "")) {
        updateUrl({ search: searchQuery || null });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, searchParams]);

  const activeFiltersCount = [
    status !== "all"
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search post content or author..."
          className="w-full bg-brand-bg border border-brand-border/50 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2 outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Filter Button & Dropdown */}
      <div className="relative" ref={filterRef}>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFiltersCount > 0 
            ? 'bg-brand/10 text-brand border border-brand/30' 
            : 'bg-brand-bg text-gray-300 border border-brand-border/50 hover:bg-brand-border/30'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filters {activeFiltersCount > 0 && <span className="w-5 h-5 rounded-full bg-brand text-brand-bg text-[10px] flex items-center justify-center ml-1">{activeFiltersCount}</span>}
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-brand-card border border-brand-border/50 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
            <div className="p-4 space-y-4">
              {/* Status Group */}
              <div>
                <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider mb-2 block">Status</label>
                <div className="flex flex-col gap-2 text-sm text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer relative">
                    <div className="relative flex items-center justify-center">
                      <input type="radio" name="status" checked={status === "all"} onChange={() => setStatus("all")} className="appearance-none w-4 h-4 rounded-full border border-gray-600 bg-brand-bg checked:border-[4px] checked:border-brand transition-all cursor-pointer" />
                    </div>
                    All
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer relative">
                    <div className="relative flex items-center justify-center">
                      <input type="radio" name="status" checked={status === "flagged"} onChange={() => setStatus("flagged")} className="appearance-none w-4 h-4 rounded-full border border-gray-600 bg-brand-bg checked:border-[4px] checked:border-brand transition-all cursor-pointer" />
                    </div>
                    Flagged for Review
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer relative">
                    <div className="relative flex items-center justify-center">
                      <input type="radio" name="status" checked={status === "eligible"} onChange={() => setStatus("eligible")} className="appearance-none w-4 h-4 rounded-full border border-gray-600 bg-brand-bg checked:border-[4px] checked:border-brand transition-all cursor-pointer" />
                    </div>
                    Monetized (Eligible)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer relative">
                    <div className="relative flex items-center justify-center">
                      <input type="radio" name="status" checked={status === "ineligible"} onChange={() => setStatus("ineligible")} className="appearance-none w-4 h-4 rounded-full border border-gray-600 bg-brand-bg checked:border-[4px] checked:border-brand transition-all cursor-pointer" />
                    </div>
                    Not Eligible
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-border/30 flex justify-end">
                <button 
                  onClick={() => {
                    updateUrl({ status });
                    setIsFilterOpen(false);
                  }}
                  className="px-4 py-1.5 bg-brand text-brand-bg font-semibold text-xs rounded hover:bg-brand-hover transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort Dropdown */}
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
