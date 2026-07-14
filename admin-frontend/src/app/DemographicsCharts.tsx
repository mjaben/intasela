"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const genderData = [
  { name: 'Male', value: 5400 },
  { name: 'Female', value: 4600 },
];

const locationData = [
  { name: 'Lagos', value: 4200 },
  { name: 'Abuja', value: 2400 },
  { name: 'Kano', value: 1800 },
  { name: 'Rivers', value: 1600 },
];

const COLORS = ['#3BC492', '#288865', '#164d39', '#8cdfc0'];

export default function DemographicsCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-brand-card rounded-xl p-6 shadow-md border border-brand-border/30 flex flex-col items-center">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 w-full text-left">Active Users by Gender</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#151921', borderColor: '#1F2937', color: '#F3F4F6', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#3BC492' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-brand-card rounded-xl p-6 shadow-md border border-brand-border/30 flex flex-col items-center">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 w-full text-left">Active Users by Location</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={locationData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {locationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#151921', borderColor: '#1F2937', color: '#F3F4F6', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#3BC492' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
