"use client";

import React from "react";

export default function DataTable({ columns, data }: { columns: string[], data: any[] }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className="px-6 py-3 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    {row[col] || "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
