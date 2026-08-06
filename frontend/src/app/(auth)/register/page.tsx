"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { useStates, useLGAs } from "nigeria-location-kit/react";
import SearchableOccupationSelect from "@/components/SearchableOccupationSelect";
import CustomSelect from "@/components/CustomSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    otp: "",
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

  const nextStep = async () => {
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
      if (formData.phone) {
        const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (!phoneRegex.test(formData.phone)) {
          setError("Please enter a valid phone number");
          return;
        }
      }

      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/check-availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, username: formData.username, phone: formData.phone }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          let errorMessage = errorData.message || "Validation failed";
          if (Array.isArray(errorMessage)) errorMessage = errorMessage.join(", ");
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setLoading(false);
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
    if (step < 4) {
      nextStep();
      return;
    }

    if (step === 4) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!formData.password) {
        setError("Password is required");
        return;
      }
      
      const strengthScore = [
        formData.password.length >= 8,
        /[A-Z]/.test(formData.password),
        /[a-z]/.test(formData.password),
        /[0-9]/.test(formData.password),
        /[^A-Za-z0-9]/.test(formData.password)
      ].filter(Boolean).length;

      if (strengthScore < 5) {
        setError("Password is not strong enough. Please meet all criteria.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/send-registration-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to send verification code");
        }

        setStep(5);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 5) {
      if (!formData.otp || formData.otp.length !== 6) {
        setError("Please enter a valid 6-digit code");
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
          const errorData = await res.json().catch(() => ({}));
          let errorMessage = errorData.message || "Registration failed";
          if (Array.isArray(errorMessage)) {
            errorMessage = errorMessage[0];
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
    }
  };

  return (
    <div className="w-full h-full max-h-full sm:h-auto sm:max-h-[85vh] bg-black/40 backdrop-blur-3xl p-5 sm:p-10 rounded-[2rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col min-h-0">
      <div className="text-center mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Create an account</h1>
        <p className="text-white/70 text-sm">Join Intasela and start connecting</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 shrink-0">
        <div className="flex justify-between items-end mb-2">
          <div className="text-sm font-bold text-[#ACC8A2]">
            Step {step} of 5
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#ACC8A2] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((step) / 5) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertCircle size={16} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-y-contain pr-1 sm:pr-3 pb-2 space-y-4">
        {step === 1 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">First Name <span className="text-red-500">*</span></label>
                <Input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Last Name <span className="text-red-500">*</span></label>
                <Input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Username <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium">@</span>
                <Input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="johndoe" className="pl-8 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Email <span className="text-red-500">*</span></label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Phone Number (Optional)</label>
              <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1234567890" className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20" />
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
              <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Interests (Select at least 5) <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-3 border border-white/5 bg-white/5 rounded-xl shadow-inner">
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
                      ? "bg-[#ACC8A2] text-[#1A2517] border-[#ACC8A2]" 
                      : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
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
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              <div className="mt-3 bg-white/5 p-3 rounded-lg border border-white/10 space-y-2">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const score = [
                      formData.password.length >= 8,
                      /[A-Z]/.test(formData.password),
                      /[a-z]/.test(formData.password),
                      /[0-9]/.test(formData.password),
                      /[^A-Za-z0-9]/.test(formData.password)
                    ].filter(Boolean).length;
                    
                    let bg = "bg-gray-700";
                    if (score >= level) {
                      if (score <= 2) bg = "bg-red-500";
                      else if (score <= 4) bg = "bg-yellow-500";
                      else bg = "bg-[#ACC8A2]";
                    }
                    return <div key={level} className={`flex-1 rounded-full ${bg} transition-colors duration-300`} />
                  })}
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs">
                  <span className={formData.password.length >= 8 ? "text-[#ACC8A2]" : "text-gray-500"}>✓ Min 8 characters</span>
                  <span className={/[A-Z]/.test(formData.password) ? "text-[#ACC8A2]" : "text-gray-500"}>✓ One uppercase</span>
                  <span className={/[a-z]/.test(formData.password) ? "text-[#ACC8A2]" : "text-gray-500"}>✓ One lowercase</span>
                  <span className={/[0-9]/.test(formData.password) ? "text-[#ACC8A2]" : "text-gray-500"}>✓ One number</span>
                  <span className={/[^A-Za-z0-9]/.test(formData.password) ? "text-[#ACC8A2]" : "text-gray-500"}>✓ One special char</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Confirm Password <span className="text-red-500">*</span></label>
              <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-white mb-2">Verify your email</h2>
            <p className="text-gray-400 text-sm mb-4">We've sent a 6-digit code to {formData.email}. Please enter it below.</p>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">6-Digit Code <span className="text-red-500">*</span></label>
              <Input type="text" maxLength={6} name="otp" value={formData.otp} onChange={handleChange} placeholder="123456" className="text-center tracking-widest text-lg font-bold" required />
            </div>
            
            <button 
              type="button" 
              onClick={async () => {
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/send-registration-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: formData.email }),
                  });
                  if (!res.ok) throw new Error("Failed to resend code");
                  alert("Code resent to your email.");
                } catch (err: any) {
                  setError(err.message);
                }
              }}
              className="w-full mt-4 py-2 text-sm text-[#ACC8A2] hover:underline transition-colors"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        )}

        </div>
        
        <div className="flex gap-4 pt-4 mt-2 shrink-0 border-t border-white/10">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/5 hover:text-white rounded-full h-10 font-bold"
            >
              Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#ACC8A2] text-[#1A2517] hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 rounded-full h-10 font-bold text-[15px] shadow-[0_4px_14px_rgba(172,200,162,0.4)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {step === 4 ? "Sending..." : step === 5 ? "Creating Account..." : "Processing..."}
              </>
            ) : step < 4 ? "Continue" : step === 4 ? "Send Code" : "Create Account"}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-center pb-2 shrink-0">
        <p className="text-white/60 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#ACC8A2] hover:text-white transition-colors font-bold ml-1">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
