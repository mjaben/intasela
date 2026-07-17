"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import PostCard from "@/components/PostCard";

const TagInput = ({ label, placeholder, tags, setTags, description }: { label: string, placeholder: string, tags: string[], setTags: (tags: string[]) => void, description?: string }) => {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setInput("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="bg-muted/10 border border-border rounded-xl p-4">
      <div className="flex items-end justify-between mb-1.5">
        <label className="block text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</label>
        {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
      </div>
      
      <div className="w-full bg-background border border-border rounded-lg p-2 focus-within:border-primary flex flex-wrap gap-2 min-h-[46px] items-center">
        {tags.map((tag, index) => (
          <span key={index} className="bg-muted text-foreground text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
            {tag}
            <button type="button" onClick={() => removeTag(index)} className="text-muted-foreground hover:text-red-500 font-bold ml-1">
              &times;
            </button>
          </span>
        ))}
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent focus:outline-none text-sm font-medium" 
        />
      </div>
    </div>
  );
};

const AutocompleteTagInput = ({ label, placeholder, tags, setTags, description, options }: { label: string, placeholder: string, tags: string[], setTags: (tags: string[]) => void, description?: string, options: string[] }) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredOptions = options.filter(o => 
    o.toLowerCase().includes(input.toLowerCase()) && !tags.includes(o)
  );

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInput("");
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="bg-muted/10 border border-border rounded-xl p-4 relative">
      <div className="flex items-end justify-between mb-1.5">
        <label className="block text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</label>
        {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
      </div>
      
      <div className="w-full bg-background border border-border rounded-lg p-2 focus-within:border-primary flex flex-wrap gap-2 min-h-[46px] items-center">
        {tags.map((tag, index) => (
          <span key={index} className="bg-muted text-foreground text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
            {tag}
            <button type="button" onClick={() => removeTag(index)} className="text-muted-foreground hover:text-red-500 font-bold ml-1">
              &times;
            </button>
          </span>
        ))}
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent focus:outline-none text-sm font-medium" 
        />
      </div>

      {isFocused && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-[calc(100%-2rem)] left-4 mt-1 bg-card border border-border rounded-lg shadow-md max-h-48 overflow-y-auto">
          {filteredOptions.map(option => (
            <div 
              key={option} 
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                addTag(option);
              }}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-muted font-medium"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { Suspense } from "react";

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [minCpm, setMinCpm] = useState(100);
  const [minBudget, setMinBudget] = useState(2000);
  const [maxBudget, setMaxBudget] = useState(5000000);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const initPostId = searchParams.get("postId") || "";

  // Form State: Step 1
  const [formData, setFormData] = useState({
    name: initPostId ? "Promoted Post Campaign" : "",
    objective: "AWARENESS",
    durationDays: 4,
    dailyBudget: 500,
    startDate: new Date().toISOString().split('T')[0],
  });

  const getEndDate = () => {
    const d = new Date(formData.startDate);
    d.setDate(d.getDate() + formData.durationDays);
    return d.toISOString().split('T')[0];
  };

  const handleEndDateChange = (e: any) => {
    const selected = new Date(e.target.value);
    const start = new Date(formData.startDate);
    const diffTime = selected.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      setFormData({...formData, durationDays: diffDays});
    }
  };

  // Form State: Step 2
  const [targeting, setTargeting] = useState({
    targetCountry: "",
    targetStates: [] as string[],
    targetAgeMin: "18",
    targetAgeMax: "65",
    targetGender: "ALL",
    interests: [] as string[],
    keywords: [] as string[],
  });

  // Form State: Step 3
  const [creativeData, setCreativeData] = useState({
    postId: initPostId,
    headline: "",
    description: "",
    ctaText: "None",
    ctaLink: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoadingPosts(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers = { "Authorization": `Bearer ${token}` };
        
        // 1. Fetch Posts
        const resPosts = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/user/${user.username}`, { headers });
        if (resPosts.ok) setUserPosts(await resPosts.json());

        // 2. Fetch Wallet Balance (mocking structure if endpoint doesn't exist perfectly)
        try {
          const resWallet = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/wallet/balance`, { headers });
          if (resWallet.ok) {
            const wData = await resWallet.json();
            setWalletBalance(wData.balance || 0);
          }
        } catch(e){}

        // 3. Fetch Settings
        try {
          const resSettings = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/settings/public`);
          if (resSettings.ok) {
            const sData = await resSettings.json();
            if (sData.min_cpm_rate) setMinCpm(Number(sData.min_cpm_rate));
            if (sData.min_budget) setMinBudget(Number(sData.min_budget));
            if (sData.max_budget) setMaxBudget(Number(sData.max_budget));
          }
        } catch(e) {}
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchData();
  }, [user]);

  const selectedPost = userPosts.find(p => p.id === Number(creativeData.postId));
  const [isSelectingPost, setIsSelectingPost] = useState(!initPostId);

  // Derived Financials & Estimates
  const totalBudget = Number(formData.dailyBudget) * Number(formData.durationDays) || 0;
  const targetCpm = minCpm || 100; // Use floor for baseline estimation
  const vatAmount = totalBudget * 0.075;
  const totalAmountDue = totalBudget + vatAmount;
  const hasEnoughBalance = walletBalance >= totalAmountDue;
  
  const estimatedViews = targetCpm > 0 ? Math.floor((totalBudget / targetCpm) * 1000) : 0;
  const estimatedDailyViews = targetCpm > 0 ? Math.floor((Number(formData.dailyBudget) / targetCpm) * 1000) : 0;
  const estimatedDailyClicks = Math.floor(estimatedDailyViews * 0.015);
  
  const isCpc = formData.objective !== 'AWARENESS';
  const estimateMetricName = isCpc ? "Clicks" : "Impressions";
  const estimateMetricValue = isCpc ? estimatedDailyClicks : estimatedDailyViews;

  let targetCount = 0;
  if (targeting.targetCountry) targetCount++;
  if (targeting.targetStates && targeting.targetStates.length > 0) targetCount++;
  if (targeting.targetAgeMin || targeting.targetAgeMax) targetCount++;
  if (targeting.targetGender !== "ALL") targetCount++;
  if (targeting.interests) targetCount++;
  if (targeting.keywords) targetCount++;
  const audienceSize = targetCount >= 3 ? "Specific" : targetCount >= 1 ? "Defined" : "Broad";
  const gaugeColor = audienceSize === "Specific" ? "bg-green-500" : audienceSize === "Defined" ? "bg-blue-500" : "bg-yellow-500";

  const handleNext = () => {
    if (step === 1) {
      if (Number(formData.dailyBudget) < minBudget || Number(formData.dailyBudget) > maxBudget) {
        alert(`Daily Budget must be between ₦${minBudget.toLocaleString()} and ₦${maxBudget.toLocaleString()}.`);
        return;
      }
    }
    setStep(step + 1);
  };
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/campaigns`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          campaignData: {
            ...formData,
            ...targeting,
            targetStates: targeting.targetStates.length > 0 ? targeting.targetStates : null,
            targetAge: `${targeting.targetAgeMin}-${targeting.targetAgeMax}`,
            interests: targeting.interests.join(", "),
            keywords: targeting.keywords.join(", "),
            endDate: getEndDate(),
            budget: totalBudget,
            dailyBudget: Number(formData.dailyBudget),
            bid: 0
          },
          creativeData
        }),
      });

      if (res.ok) {
        router.push("/ads");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create campaign. Check wallet balance.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-screen p-4 sm:p-8 flex flex-col xl:flex-row gap-8">
      
      {/* LEFT COLUMN: WIZARD */}
      <div className="flex-1 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Campaign Builder</h1>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </header>

        <div className="bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm">
          
          {/* STEP 1: Objective & Schedule */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b border-border pb-4">1. Objective & Budget</h2>
              
              <div className="bg-muted/10 border border-border rounded-xl p-4">
                <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Campaign Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Summer Promo 2026"
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium" 
                />
              </div>
              <div className="bg-muted/10 border border-border rounded-xl p-4">
                <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Objective</label>
                <select 
                  value={formData.objective}
                  onChange={(e) => setFormData({...formData, objective: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium appearance-none"
                >
                  <option value="AWARENESS">Brand Awareness</option>
                  <option value="ENGAGEMENT">Post Engagement</option>
                  <option value="CONVERSION">Website Conversions</option>
                </select>
              </div>

              {/* Duration */}
              <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-sm">Duration</h3>
                    <p className="text-xs text-muted-foreground mt-1">Choose end date</p>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-primary bg-background"></div>
                </div>
                
                {formData.durationDays < 4 && (
                  <div className="bg-[#FFF4E5] dark:bg-yellow-500/10 border border-[#FBE3C3] dark:border-yellow-500/20 text-[#A66200] dark:text-yellow-500 p-3 rounded-lg text-sm flex items-start gap-2">
                    <span className="font-bold mt-0.5">⚠️</span>
                    Ads that run for at least 4 days tend to get better results.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Days</label>
                    <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                      <button onClick={() => setFormData({...formData, durationDays: Math.max(1, formData.durationDays - 1)})} className="px-3 py-2.5 hover:bg-muted text-muted-foreground transition-colors">-</button>
                      <input 
                        type="number" 
                        value={formData.durationDays}
                        onChange={(e) => setFormData({...formData, durationDays: Math.max(1, parseInt(e.target.value) || 1)})}
                        className="w-full text-center bg-transparent py-2.5 focus:outline-none font-medium" 
                      />
                      <button onClick={() => setFormData({...formData, durationDays: formData.durationDays + 1})} className="px-3 py-2.5 hover:bg-muted text-muted-foreground transition-colors">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground font-semibold mb-1 uppercase tracking-wider">End date</label>
                    <input 
                      type="date" 
                      value={getEndDate()}
                      onChange={handleEndDateChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium" 
                    />
                  </div>
                </div>
              </div>

              {/* Daily Budget */}
              <div className="bg-muted/10 border border-border rounded-xl p-4 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-sm">Daily budget</h3>
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">i</span>
                </div>
                
                <div className="text-center mb-8">
                  <p className="text-sm text-foreground font-medium mb-3">
                    Estimated {estimateMetricValue > 0 ? `${Math.floor(estimateMetricValue * 0.8).toLocaleString()} - ${Math.floor(estimateMetricValue * 1.2).toLocaleString()}` : "-"} {estimateMetricName.toLowerCase()} per day
                  </p>
                  <div className="flex items-center justify-center gap-1 group">
                    <span className="text-primary font-bold text-3xl">₦</span>
                    <input 
                      type="number" 
                      value={formData.dailyBudget}
                      onChange={(e) => setFormData({...formData, dailyBudget: Number(e.target.value)})}
                      className="text-4xl font-bold text-primary bg-transparent w-[140px] text-center focus:outline-none border-b-2 border-transparent focus:border-primary transition-colors hover:border-border"
                    />
                    <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✏️</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mb-4">
                  <span>₦{minBudget.toLocaleString()}</span>
                  <input 
                    type="range" 
                    min={minBudget} 
                    max={maxBudget} 
                    value={formData.dailyBudget}
                    onChange={(e) => setFormData({...formData, dailyBudget: Number(e.target.value)})}
                    className="flex-1 accent-primary cursor-pointer h-1.5 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <span>₦{maxBudget.toLocaleString()}</span>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  You will spend a total of ₦{totalBudget.toLocaleString(undefined, {minimumFractionDigits: 2})} over {formData.durationDays} days.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={handleNext} disabled={!formData.name || !formData.dailyBudget} className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Audience Targeting */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b border-border pb-4">2. Audience Targeting</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 border border-border rounded-xl p-4">
                  <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Target Country</label>
                  <select 
                    value={targeting.targetCountry}
                    onChange={(e) => setTargeting({...targeting, targetCountry: e.target.value, targetStates: []})}
                    className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium text-sm appearance-none" 
                  >
                    <option value="">All Countries</option>
                    <option value="Nigeria">Nigeria</option>
                  </select>
                </div>
                <div className="bg-muted/10 border border-border rounded-xl p-4">
                  <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Age Range</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="13"
                      value={targeting.targetAgeMin}
                      onChange={(e) => setTargeting({...targeting, targetAgeMin: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg py-2 px-3 focus:outline-none focus:border-primary font-medium text-sm text-center" 
                    />
                    <span className="text-muted-foreground font-bold">-</span>
                    <input 
                      type="number" 
                      max="65"
                      value={targeting.targetAgeMax}
                      onChange={(e) => setTargeting({...targeting, targetAgeMax: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg py-2 px-3 focus:outline-none focus:border-primary font-medium text-sm text-center" 
                    />
                  </div>
                </div>
                {targeting.targetCountry === "Nigeria" && (
                  <div className="col-span-2 bg-muted/10 border border-border rounded-xl p-4">
                    <AutocompleteTagInput 
                      label="Target States (Nigeria)"
                      placeholder="Search and select states..."
                      description="Leave empty to target all of Nigeria."
                      tags={targeting.targetStates}
                      setTags={(tags) => setTargeting({...targeting, targetStates: tags})}
                      options={[
                        "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
                        "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
                        "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
                        "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
                        "Taraba", "Yobe", "Zamfara"
                      ]}
                    />
                  </div>
                )}
                
                <div className="col-span-2 bg-muted/10 border border-border rounded-xl p-4">
                  <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Gender</label>
                  <select 
                    value={targeting.targetGender}
                    onChange={(e) => setTargeting({...targeting, targetGender: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium text-sm appearance-none"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <AutocompleteTagInput 
                  label="Interests"
                  placeholder="Type to search interests..."
                  description="Target users by content affinity"
                  tags={targeting.interests}
                  setTags={(tags) => setTargeting({...targeting, interests: tags})}
                  options={[
                    "Arts & Entertainment", "Movies & TV", "Action Movies", "Comedy", "Drama", "Sci-Fi & Fantasy", "Music", "Pop", "Hip-Hop & Rap", "Afrobeats", "Rock", "Electronic / EDM", "Classical", "Books & Literature", "Theater & Performing Arts", "Visual Arts & Design",
                    "Business & Finance", "Entrepreneurship", "Investing & Stocks", "Marketing & Advertising", "Small Business", "Economics", "Cryptocurrency & Blockchain",
                    "Careers & Education", "Job Searching & Careers", "Higher Education", "Online Learning", "Professional Development",
                    "Family & Parenting", "Parenting", "Motherhood", "Fatherhood", "Family Activities", "Pregnancy & Newborns",
                    "Food & Drink", "Cooking & Recipes", "Restaurants", "Healthy Eating & Nutrition", "Coffee & Tea", "Wine & Beer",
                    "Health & Fitness", "Fitness & Exercise", "Mental Health", "Nutrition & Diet", "Yoga & Meditation", "Weight Loss",
                    "Hobbies & Interests", "Gaming", "Video Games", "Esports", "Board Games", "Photography", "Gardening", "DIY & Crafts", "Travel", "Pets & Animals",
                    "News & Politics", "World News", "Technology News", "Science News", "Business News", "Breaking News", "Local News", "National News", "Politics News", "Current Events", "Opinion Piece",
                    "Science & Technology", "Gadgets & Consumer Tech", "Artificial Intelligence", "Space & Astronomy", "Environment & Climate", "Programming & Software",
                    "Sports", "Football (Soccer)", "American Football", "Basketball", "Baseball", "Tennis", "Motorsports", "Combat Sports",
                    "Style & Fashion", "Men's Fashion", "Women's Fashion", "Beauty & Makeup", "Streetwear", "Luxury Fashion",
                    "Travel & Events", "Destinations", "Adventure Travel", "Luxury Travel", "Festivals & Events",
                    "Lifestyle Stages", "College Students", "New Parents", "Empty Nesters", "Newlyweds",
                    "Automotive", "Car Enthusiasts", "Electric Vehicles",
                    "Shopping & Retail", "Online Shoppers", "Luxury Buyers"
                  ]}
                />
                
                <TagInput 
                  label="Keywords"
                  placeholder="e.g. startup (press Enter)"
                  description="Target exact mentions in posts"
                  tags={targeting.keywords}
                  setTags={(tags) => setTargeting({...targeting, keywords: tags})}
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button onClick={handlePrev} className="bg-muted text-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-80 transition-opacity">
                  Back
                </button>
                <button onClick={handleNext} className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Creative Assets */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b border-border pb-4">3. Creative Assets</h2>
              
              <div className="bg-muted/10 border border-border rounded-xl p-4">
                <label className="block text-[11px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Select Post to Promote</label>
                {loadingPosts ? (
                  <div className="animate-pulse bg-muted h-32 rounded-lg w-full"></div>
                ) : userPosts.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">You have no posts to promote. Please create a post first.</div>
                ) : !isSelectingPost && selectedPost ? (
                  <div className="border border-border rounded-lg p-4 bg-muted/30">
                    <p className="text-sm line-clamp-2 text-foreground/90 font-medium mb-3">"{selectedPost.content}"</p>
                    <button onClick={() => setIsSelectingPost(true)} className="text-sm font-bold text-primary hover:underline">Change Post</button>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {userPosts.map(post => (
                      <div 
                        key={post.id} 
                        onClick={() => {
                          setCreativeData({...creativeData, postId: post.id.toString()});
                          setIsSelectingPost(false);
                        }}
                        className={`cursor-pointer border-2 rounded-lg p-3 transition-colors ${Number(creativeData.postId) === post.id ? 'border-brand bg-brand/5' : 'border-border bg-background hover:border-brand/50'}`}
                      >
                        <p className="text-sm line-clamp-2 text-foreground/90">{post.content}</p>
                        {post.mediaUrl && <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2 inline-block bg-muted px-2 py-1 rounded">Has Media</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted/10 border border-border rounded-xl p-4">
                <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Ad Headline <span className="lowercase font-normal opacity-70">(Optional)</span></label>
                <input 
                  type="text" 
                  value={creativeData.headline}
                  onChange={(e) => setCreativeData({...creativeData, headline: e.target.value})}
                  placeholder="Catchy title for the ad slot..."
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium text-sm" 
                />
              </div>

              <div className="bg-muted/10 border border-border rounded-xl p-4">
                <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Ad Description <span className="lowercase font-normal opacity-70">(Optional)</span></label>
                <textarea 
                  value={creativeData.description}
                  onChange={(e) => setCreativeData({...creativeData, description: e.target.value})}
                  placeholder="Additional text for the ad slot..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium text-sm resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 border border-border rounded-xl p-4">
                  <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Call to Action (CTA)</label>
                  <select 
                    value={creativeData.ctaText}
                    onChange={(e) => setCreativeData({...creativeData, ctaText: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium text-sm appearance-none" 
                  >
                    <option>None</option>
                    <option>Learn More</option>
                    <option>Buy Now</option>
                    <option>Sign Up</option>
                    <option>Download</option>
                  </select>
                </div>
                <div className="bg-muted/10 border border-border rounded-xl p-4">
                  <label className="block text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Destination Link</label>
                  <input 
                    type="url" 
                    value={creativeData.ctaLink}
                    onChange={(e) => setCreativeData({...creativeData, ctaLink: e.target.value})}
                    placeholder="https://yourwebsite.com/promo"
                    className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary font-medium text-sm" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button onClick={handlePrev} className="bg-muted text-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-80 transition-opacity">
                  Back
                </button>
                <button onClick={handleNext} disabled={!creativeData.postId} className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
                  Review & Pay
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review, Billing & Submit */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b border-border pb-4">4. Billing & Launch</h2>
              
              <div className="bg-muted/30 p-6 rounded-xl border border-border/50 mb-6">
                <h3 className="font-bold text-lg mb-2">Ready to Launch!</h3>
                <p className="text-sm text-muted-foreground">Review your payment summary on the right. If everything looks good, ensure your wallet is funded and launch your campaign.</p>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Ad Wallet Balance</p>
                  <p className={`font-bold text-xl ${hasEnoughBalance ? 'text-green-500' : 'text-red-500'}`}>
                    ₦{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
                {!hasEnoughBalance && (
                  <button onClick={() => router.push('/ads/wallet')} className="bg-red-500/10 text-red-500 font-bold px-4 py-2 rounded-lg text-sm hover:bg-red-500/20">
                    Top Up Balance
                  </button>
                )}
              </div>

              <div className="pt-8 flex justify-between border-t border-border mt-6">
                <button onClick={handlePrev} className="bg-muted text-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-80 transition-opacity">
                  Edit Details
                </button>
                
                {hasEnoughBalance ? (
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                  >
                    {loading ? "Launching..." : "Pay & Launch Campaign"}
                  </button>
                ) : (
                  <button 
                    disabled
                    className="bg-muted text-muted-foreground font-bold px-8 py-2.5 rounded-lg opacity-50 cursor-not-allowed"
                  >
                    Insufficient Funds
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW & ESTIMATION */}
      <div className="hidden xl:flex flex-col w-[400px] gap-8 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar pr-2 pb-8">
        
        {/* Live Ad Preview */}
        <div>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Preview</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden pointer-events-none shadow-sm">
            {selectedPost ? (
              <>
                <PostCard 
                  id={selectedPost.id}
                  content={selectedPost.content}
                  author={{
                    name: selectedPost.author?.firstName || selectedPost.author?.username || user?.username || "You",
                    username: selectedPost.author?.username || user?.username || "you",
                    avatarUrl: selectedPost.author?.avatarUrl || user?.avatarUrl
                  }}
                  stats={selectedPost.stats}
                  earned={selectedPost.earned || 0}
                  mediaUrl={selectedPost.mediaUrl}
                  mediaUrls={selectedPost.mediaUrls}
                  thumbnailUrl={selectedPost.thumbnailUrl}
                  mediaType={selectedPost.mediaType}
                  isBoosted={true}
                />
                
                {/* CTA Overlay Preview */}
                {(creativeData.headline || creativeData.description || (creativeData.ctaText && creativeData.ctaText !== "None")) && (
                  <div className="bg-background/80 py-2 px-3 border-t border-border flex justify-between items-center backdrop-blur-sm">
                    <div>
                      {creativeData.headline && <div className="font-bold text-sm text-foreground leading-tight">{creativeData.headline}</div>}
                      {creativeData.description && <div className="text-xs text-muted-foreground line-clamp-1 leading-tight">{creativeData.description}</div>}
                    </div>
                    {creativeData.ctaText && creativeData.ctaText !== "None" && (
                      <div className="bg-primary text-primary-foreground font-bold text-[11px] px-3 py-1 rounded-full shrink-0">
                        {creativeData.ctaText}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-border/50 rounded-xl m-4">
                <div className="w-12 h-12 bg-muted rounded-full mb-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <div className="text-sm font-semibold">No Post Selected</div>
                <div className="text-xs text-muted-foreground mt-1">Select a post in Step 3 to view preview</div>
              </div>
            )}
          </div>
        </div>

        {/* Audience & Estimation Card */}
        <div>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Estimated daily results</h3>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="mb-5">
              <div className="flex justify-between text-[11px] font-bold mb-2 uppercase tracking-wider">
                <span className={audienceSize === "Specific" ? "text-green-500" : "text-muted-foreground"}>Specific</span>
                <span className={audienceSize === "Defined" ? "text-blue-500" : "text-muted-foreground"}>Defined</span>
                <span className={audienceSize === "Broad" ? "text-yellow-500" : "text-muted-foreground"}>Broad</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex">
                <div className={`h-full ${gaugeColor} transition-all duration-500`} style={{ width: audienceSize === "Specific" ? "33%" : audienceSize === "Defined" ? "66%" : "100%" }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-muted/30 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold">{estimateMetricName}</div>
                </div>
                <div className="text-xl font-bold text-primary">
                  {estimateMetricValue > 0 ? `${Math.floor(estimateMetricValue * 0.8).toLocaleString()} - ${Math.floor(estimateMetricValue * 1.2).toLocaleString()}` : "-"}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Estimates are based on your Daily Budget and current auction activity. Actual results may vary.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Payment summary</h3>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Budget ({formData.durationDays} days)</span>
                <span className="font-semibold">₦{totalBudget.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (7.5%)</span>
                <span className="font-semibold">₦{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border border-dashed font-bold text-lg">
                <span>Total Amount Due</span>
                <span className="text-primary">₦{totalAmountDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CreateCampaignWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateCampaignForm />
    </Suspense>
  );
}
