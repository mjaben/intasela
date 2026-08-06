"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useUserStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      login(data.user);
      
      // Store token (in a real app, use secure httpOnly cookies or localStorage)
      localStorage.setItem("access_token", data.access_token);
      
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-black/40 backdrop-blur-3xl p-5 sm:p-10 rounded-[2rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col sm:min-h-[550px]">
      <div className="text-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Welcome back</h1>
        <p className="text-white/70">Log in to your Intasela account</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertCircle size={16} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 flex flex-col flex-1">
        <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Email or Username</label>
          <Input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="you@example.com or username"
            className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="block text-sm font-semibold text-white/80">Password</label>
            <Link href="/forgot-password" className="text-sm text-[#ACC8A2] hover:text-white transition-colors font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-1 focus:ring-[#ACC8A2]/20 transition-all pr-10"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        </div>
        
        <div className="shrink-0 pt-4 mt-2 border-t border-white/10">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ACC8A2] text-[#1A2517] hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 rounded-full h-10 font-bold text-[15px] shadow-[0_4px_14px_rgba(172,200,162,0.4)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Logging in...
              </>
            ) : "Log In"}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-center pb-2 shrink-0">
        <p className="text-white/60 text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#ACC8A2] hover:text-white transition-colors font-bold ml-1">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
