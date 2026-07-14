"use client";

export default function LogFilters({ 
  search, 
  filterAction, 
  filterSuccess 
}: { 
  search: string, 
  filterAction: string, 
  filterSuccess: string 
}) {
  return (
    <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
      <form className="flex-1 min-w-[200px]" action="/security/logs" method="GET">
        <div className="relative">
          <input 
            type="text" 
            name="search"
            defaultValue={search}
            placeholder="Search Actor ID or Resource..." 
            className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </form>
      
      <form className="flex gap-4" action="/security/logs" method="GET">
        {search && <input type="hidden" name="search" value={search} />}
        <select 
          name="action"
          defaultValue={filterAction}
          onChange={(e) => e.target.form?.submit()}
          className="bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand appearance-none pr-10 cursor-pointer"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="execute">Execute</option>
        </select>
        
        <select 
          name="success"
          defaultValue={filterSuccess}
          onChange={(e) => e.target.form?.submit()}
          className="bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand appearance-none pr-10 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="true">Success</option>
          <option value="false">Failed</option>
        </select>
      </form>
    </div>
  );
}
