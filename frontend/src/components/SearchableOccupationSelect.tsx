import { useState, useRef, useEffect } from "react";

const PREDEFINED_OCCUPATIONS = [
  "Software Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Data Scientist",
  "Marketing Specialist",
  "Sales Representative",
  "Content Creator",
  "Digital Marketer",
  "Teacher / Educator",
  "Medical Professional",
  "Legal Professional",
  "Financial Analyst",
  "Consultant",
  "Entrepreneur / Founder",
  "Student",
  "Freelancer",
  "Artist",
  "Other"
];

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchableOccupationSelect({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isOther, setIsOther] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = PREDEFINED_OCCUPATIONS.filter((occ) => 
    occ.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleSelect = (occ: string) => {
    if (occ === "Other") {
      setIsOther(true);
      onChange("");
    } else {
      setIsOther(false);
      onChange(occ);
    }
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Occupation (Optional)</label>
      
      {!isOther ? (
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white flex justify-between items-center cursor-pointer min-h-[40px] focus-within:border-[#ACC8A2]/50 focus-within:ring-1 focus-within:ring-[#ACC8A2]/20 transition-all"
        >
          <span className={value ? "text-white" : "text-gray-400"}>
            {value || "Select Occupation..."}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      ) : (
        <div className="flex gap-2">
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder="Type your occupation..."
            className="w-full bg-white/5 border border-[#ACC8A2]/50 ring-1 ring-[#ACC8A2]/20 rounded-xl px-4 py-2 text-white h-[40px] focus:outline-none transition-all" 
            autoFocus
          />
          <button 
            type="button" 
            onClick={() => { setIsOther(false); onChange(""); }}
            className="text-xs text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {isOpen && !isOther && (
        <div className="absolute z-10 w-full mt-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-60 flex flex-col animate-in zoom-in-95 fade-in duration-200">
          <div className="p-2 border-b border-white/10">
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ACC8A2]/50 focus:ring-1 focus:ring-[#ACC8A2]/20 transition-all"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((occ) => (
                <div 
                  key={occ} 
                  onClick={() => handleSelect(occ)}
                  className="px-3 py-2.5 hover:bg-white/10 text-sm text-gray-200 cursor-pointer rounded-lg transition-colors"
                >
                  {occ}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
