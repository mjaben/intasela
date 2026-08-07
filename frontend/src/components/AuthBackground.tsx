import React from "react";

export default function AuthBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {/* Volumetric Glow - Soft Sage #ACC8A2 */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[70vw] max-w-[800px] h-[70vw] max-h-[800px] rounded-full blur-[120px] opacity-10"
        style={{ background: 'radial-gradient(circle, #ACC8A2 0%, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] max-w-[600px] h-[60vw] max-h-[600px] rounded-full blur-[100px] opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #ACC8A2 0%, transparent 70%)' }}
      />
      
      {/* Orbital Lines - SVG */}
      <svg 
        className="absolute w-[200vw] sm:w-[150vw] md:w-[120vw] lg:w-[100vw] max-w-[1400px] h-auto opacity-[0.05] text-white mix-blend-overlay" 
        viewBox="0 0 1000 1000" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="500" cy="500" r="300" stroke="currentColor" strokeWidth="1" />
        <circle cx="500" cy="500" r="450" stroke="currentColor" strokeWidth="1" />
        <circle cx="500" cy="500" r="600" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="500" cy="500" rx="400" ry="900" stroke="currentColor" strokeWidth="1" transform="rotate(45 500 500)" />
        <ellipse cx="500" cy="500" rx="400" ry="900" stroke="currentColor" strokeWidth="1" transform="rotate(-45 500 500)" />
        <ellipse cx="500" cy="500" rx="150" ry="850" stroke="currentColor" strokeWidth="1" transform="rotate(20 500 500)" />
        <ellipse cx="500" cy="500" rx="150" ry="850" stroke="currentColor" strokeWidth="1" transform="rotate(-20 500 500)" />
      </svg>
    </div>
  );
}
