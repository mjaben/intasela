"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Sun', User: 120, Sela: 400, Comment: 240, Orbit: 100 },
  { name: 'Mon', User: 200, Sela: 300, Comment: 139, Orbit: 150 },
  { name: 'Tue', User: 150, Sela: 200, Comment: 480, Orbit: 80 },
  { name: 'Wed', User: 278, Sela: 278, Comment: 390, Orbit: 110 },
  { name: 'Thu', User: 189, Sela: 189, Comment: 480, Orbit: 120 },
  { name: 'Fri', User: 239, Sela: 239, Comment: 380, Orbit: 130 },
  { name: 'Sat', User: 349, Sela: 349, Comment: 430, Orbit: 140 },
];

const TABS = ["User", "Sela", "Comment", "Orbit"] as const;
type TabType = typeof TABS[number];

export default function TabbedAnalyticsChart() {
  const [activeTab, setActiveTab] = useState<TabType>("Sela");

  return (
    <div className="lg:col-span-2 bg-brand-card rounded-xl p-6 shadow-md border border-brand-border/30 flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b border-brand-border/50 pb-2">
        <h2 className="text-sm font-semibold text-gray-300">Platform Activity (7 days)</h2>
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === tab ? "bg-brand text-brand-bg" : "bg-gray-800 text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#151921', borderColor: '#1F2937', color: '#F3F4F6', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#3BC492' }}
            />
            <Line 
              key={activeTab}
              type="monotone" 
              dataKey={activeTab} 
              stroke="#3BC492" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#151921', stroke: '#3BC492', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#3BC492' }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
