import { useState, useRef, useEffect } from "react";

interface Props {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string, value: string }[] | string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CustomSelect({ label, value, onChange, options, placeholder = "Select an option...", disabled = false, required = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const displayValue = options.find(o => typeof o === 'string' ? o === value : o.value === value) 
    ? (typeof options[0] === 'string' ? value : (options as {label: string, value: string}[]).find(o => o.value === value)?.label)
    : "";

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white flex justify-between items-center cursor-pointer min-h-[42px] focus-within:border-[#3BC492]"
      >
        <span className={displayValue ? "text-white" : "text-gray-400"}>
          {displayValue || placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-[#09090b] border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-1">
            {options.map((opt, i) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <div 
                  key={i} 
                  onClick={() => handleSelect(optValue)}
                  className={`px-3 py-2 text-sm cursor-pointer rounded ${value === optValue ? 'bg-[#3BC492] text-black font-medium' : 'text-gray-200 hover:bg-gray-800'}`}
                >
                  {optLabel}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
