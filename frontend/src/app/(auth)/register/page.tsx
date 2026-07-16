"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { useStates, useLGAs } from "nigeria-location-kit/react";
import SearchableOccupationSelect from "@/components/SearchableOccupationSelect";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  
  // Hooks for location
  const states = useStates();
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "",
    state: "",
    lga: "",
    occupation: "",
    creatorType: "",
    interests: [] as string[],
  });

  const lgas = useLGAs(formData.state);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInterestToggle = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter((i) => i !== interest),
      });
    } else {
      if (formData.interests.length < 3) {
        setFormData({ ...formData, interests: [...formData.interests, interest] });
      }
    }
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.username) {
        setError("Please fill in all required fields");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) {
      nextStep();
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...submitData } = formData;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await res.json();
      login(data.user);
      localStorage.setItem("access_token", data.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-[#18181b] p-8 rounded-xl border border-gray-800 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Step {step} of 3</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-2 rounded-full mt-4">
          <div 
            className="bg-[#3BC492] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492]" />
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username *</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492]" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Country (Optional)</label>
                <div className="relative">
                  <select 
                    name="country" 
                    value={formData.country} 
                    onChange={handleChange} 
                    className="w-full bg-[#09090b] border border-gray-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-[#3BC492] appearance-none cursor-pointer"
                  >
                    <option value="">Select a country...</option>
                    <option value="Nigeria">Nigeria</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {formData.country === "Nigeria" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                    <div className="relative">
                      <select 
                        name="state" 
                        value={formData.state} 
                        onChange={(e) => {
                          handleChange(e);
                          // Reset LGA when state changes
                          setFormData(prev => ({ ...prev, lga: "" }));
                        }}
                        className="w-full bg-[#09090b] border border-gray-700 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:border-[#3BC492] appearance-none cursor-pointer"
                      >
                        <option value="">Select State</option>
                        {states.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">LGA</label>
                    <div className="relative">
                      <select 
                        name="lga" 
                        value={formData.lga} 
                        onChange={handleChange} 
                        disabled={!formData.state}
                        className="w-full bg-[#09090b] border border-gray-700 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:border-[#3BC492] disabled:opacity-50 appearance-none cursor-pointer"
                      >
                        <option value="">Select LGA</option>
                        {lgas.map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <SearchableOccupationSelect 
                value={formData.occupation}
                onChange={(val) => setFormData({ ...formData, occupation: val })}
              />
            </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">What is your current educational or professional status?</label>
              <div className="relative">
                <select name="creatorType" value={formData.creatorType} onChange={handleChange} className="w-full bg-[#09090b] border border-gray-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-[#3BC492] appearance-none cursor-pointer">
                  <option value="">Select an option...</option>
                  <option value="Secondary School">Secondary School</option>
                  <option value="Pre-Uni">Pre-Uni</option>
                  <option value="Under-graduate">Under-graduate</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                  <option value="Entrepreneur">Entrepreneur</option>
                  <option value="Out of School">Out of School</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Interests (Select top 3)</label>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-3 border border-gray-800 bg-[#09090b]/50 rounded-xl">
                {[
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
                ].map((interest) => (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                      formData.interests.includes(interest) 
                      ? "bg-[#3BC492] text-black border-[#3BC492]" 
                      : "bg-[#09090b] text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#3BC492] hover:bg-[#2fa076] text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {step === 3 ? (loading ? "Creating..." : "Complete Setup") : "Continue"}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3BC492] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
