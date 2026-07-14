"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function Pagination({ totalItems, currentPage, pageSize }: { totalItems: number, currentPage: number, pageSize: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const updateUrl = (page: number, newLimit?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (newLimit) {
      params.set("limit", newLimit.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border/30 bg-brand-bg/20">
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <div className="relative">
            <select 
              value={pageSize}
              onChange={(e) => updateUrl(1, parseInt(e.target.value))}
              className="appearance-none bg-brand-card border border-brand-border/50 text-gray-200 rounded pl-2 pr-6 py-1 outline-none focus:border-brand cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-400">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
        <span>
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          disabled={currentPage <= 1}
          onClick={() => updateUrl(currentPage - 1)}
          className="px-3 py-1.5 rounded bg-brand-card border border-brand-border/50 text-sm font-medium text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          Prev
        </button>
        <div className="px-3 py-1.5 text-sm font-medium text-gray-400">
          Page {currentPage} of {totalPages}
        </div>
        <button 
          disabled={currentPage >= totalPages}
          onClick={() => updateUrl(currentPage + 1)}
          className="px-3 py-1.5 rounded bg-brand-card border border-brand-border/50 text-sm font-medium text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
