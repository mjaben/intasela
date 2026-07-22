"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { useStates, useLGAs } from "nigeria-location-kit/react";
import SearchableOccupationSelect from "@/components/SearchableOccupationSelect";
import CustomSelect from "@/components/CustomSelect";

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
      setFormData({ ...formData, interests: [...formData.interests, interest] });
    }
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.username) {
        setError("Please fill in all required fields");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }
    }
    if (step === 2) {
      if (!formData.country) {
        setError("Please select a country");
        return;
      }
      if (formData.country === "Nigeria") {
        if (!formData.state || !formData.lga) {
          setError("Please select a State and LGA");
          return;
        }
      }
    }
    if (step === 3) {
      if (formData.interests.length < 5) {
        setError("Please select at least 5 interests");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) {
      nextStep();
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
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
        let errorMessage = errorData.message || "Registration failed";
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage[0]; // Display the first error in the list
        }
        throw new Error(errorMessage);
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
    <div className="w-full max-w-lg bg-[#18181b] p-6 sm:p-8 rounded-xl border border-gray-800 shadow-2xl">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Create Account</h1>
        <p className="text-gray-400">Step {step} of 4</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-2 rounded-full mt-4">
          <div 
            className="bg-[#3BC492] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="min-h-[44px] mb-2">
        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        {step === 1 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492] placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492] placeholder-gray-600" />
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username <span className="text-red-500">*</span></label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="johndoe123" required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492] placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492] placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 800 000 0000" className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492] placeholder-gray-600" />
            </div>
          </div>
        )}

        {step === 2 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <CustomSelect 
                  label="Country"
                  value={formData.country}
                  onChange={(val) => setFormData({ ...formData, country: val })}
                  options={["Nigeria"]}
                  placeholder="Select a country..."
                  required
                />
              </div>

              {formData.country === "Nigeria" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <CustomSelect 
                      label="State"
                      value={formData.state}
                      onChange={(val) => {
                        setFormData(prev => ({ ...prev, state: val, lga: "" }));
                      }}
                      options={states.map(s => s.name)}
                      placeholder="Select State"
                      required
                    />
                  </div>
                  <div>
                    <CustomSelect 
                      label="LGA"
                      value={formData.lga}
                      onChange={(val) => setFormData({ ...formData, lga: val })}
                      options={lgas.map(l => l.name)}
                      placeholder="Select LGA"
                      disabled={!formData.state}
                      required
                    />
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
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <CustomSelect 
                label="What is your current educational or professional status?"
                value={formData.creatorType}
                onChange={(val) => setFormData({ ...formData, creatorType: val })}
                options={[
                  "Secondary School",
                  "Pre-Uni",
                  "Under-graduate",
                  "Graduate",
                  "Post Graduate",
                  "Entrepreneur",
                  "Out of School",
                  "Other"
                ]}
                placeholder="Select an option..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Interests (Select at least 5) <span className="text-red-500">*</span></label>
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

        {step === 4 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-white mb-2">Secure your account</h2>
            <p className="text-gray-400 text-sm mb-4">Choose a strong password to protect your account.</p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password <span className="text-red-500">*</span></label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492] placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password <span className="text-red-500">*</span></label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required className="w-full bg-[#09090b] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3BC492] placeholder-gray-600" />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-6">
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
            {step === 4 ? (loading ? "Creating..." : "Complete Setup") : "Continue"}
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
