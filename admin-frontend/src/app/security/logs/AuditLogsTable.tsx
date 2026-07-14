"use client";

import { useState } from "react";
import Pagination from "../../users/Pagination";
import { format } from "date-fns";

type AuditLog = {
  id: string;
  timestamp: Date;
  actorId: string;
  action: string;
  resourceType: string;
  requestPayload: any;
  success: boolean;
};

export default function AuditLogsTable({ 
  logs, 
  totalLogs, 
  currentPage, 
  pageSize,
}: { 
  logs: AuditLog[], 
  totalLogs: number, 
  currentPage: number, 
  pageSize: number,
}) {
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'UPDATE': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'DELETE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="w-full">
      <div className="bg-brand-card rounded-xl shadow-md border border-brand-border/30 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] text-gray-400 uppercase bg-brand-bg/50 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Actor ID</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Resource</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                      <h3 className="text-lg font-medium text-gray-300">No audit logs found</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-border/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-gray-200">{format(new Date(log.timestamp), "MMM d, yyyy")}</span>
                        <span className="text-xs text-gray-500">{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-400 bg-brand-bg px-2 py-1 rounded inline-block">
                        {log.actorId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 break-all">{log.resourceType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1.5 text-brand text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.requestPayload && Object.keys(log.requestPayload).length > 0 ? (
                        <button 
                          onClick={() => setSelectedPayload(log.requestPayload)}
                          className="text-xs text-brand hover:text-brand/80 font-medium bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded transition-colors"
                        >
                          View Payload
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 italic">No Payload</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalLogs > 0 && (
          <Pagination 
            currentPage={currentPage} 
            totalItems={totalLogs} 
            pageSize={pageSize} 
          />
        )}
      </div>

      {/* Payload Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-brand-card border border-brand-border/50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-brand-border/30 flex justify-between items-center bg-brand-bg/50">
              <h3 className="text-lg font-bold text-white">Request Payload</h3>
              <button 
                onClick={() => setSelectedPayload(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <pre className="bg-[#0d1117] text-gray-300 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-gray-800">
                {JSON.stringify(selectedPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
