"use client";

import { useState } from "react";
import AuthBackground from "@/components/AuthBackground";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Check, AlertCircle, X } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="fixed inset-0 bg-[#0a0a0a] w-full flex flex-col overflow-hidden overscroll-none z-50">
      <AuthBackground />
      <div className="w-full h-full max-w-sm mx-auto px-6 pt-[8vh] sm:pt-12 pb-6 flex flex-col relative z-10">
        <Link href="/" className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors z-50">
          <X size={24} />
        </Link>
        <div className="text-center mb-10 shrink-0 relative z-10">
          <h1 className="text-[32px] leading-tight font-bold text-white mb-1 tracking-tight">Welcome Back<br/>to Intasela</h1>
        </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-in slide-in-from-top-2 fade-in duration-300 relative z-10">
          <AlertCircle size={16} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 flex flex-col flex-1 relative z-10">
        <div className="space-y-3">
          <div>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Email address"
                className="h-[52px] bg-[#161616] border-transparent text-white placeholder:text-white/40 rounded-full px-6 focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20 text-[15px]"
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="h-[52px] bg-[#161616] border-transparent text-white placeholder:text-white/40 rounded-full px-6 focus:border-[#ACC8A2]/50 focus:ring-1 focus:ring-[#ACC8A2]/20 transition-all pr-12 text-[15px]"
                />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-1 pb-8">
          <label className="flex items-center gap-2.5 cursor-pointer group" onClick={(e) => { e.preventDefault(); setRememberMe(!rememberMe); }}>
            <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#ACC8A2] border-[#ACC8A2]' : 'border-white/30 bg-transparent group-hover:border-white/50'}`}>
              {rememberMe && <Check size={12} strokeWidth={4} className="text-[#1A2517]" />}
            </div>
            <span className="text-[13px] text-white/60 group-hover:text-white/80 transition-colors select-none">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-[13px] text-white/60 hover:text-white transition-colors font-medium">
            Forgot Password?
          </Link>
        </div>
        
        <div className="shrink-0">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ACC8A2] text-[#1A2517] hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 rounded-full h-[52px] font-semibold text-[15px] shadow-[0_4px_20px_rgba(172,200,162,0.2)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Logging in...
              </>
            ) : "Log in"}
          </Button>
        </div>
      </form>

      {/* Arched image collage */}
      <div 
        className="mt-6 mb-auto h-[160px] relative flex justify-center items-end opacity-90 shrink-0 group/collage w-[130%] -ml-[15%]"
        style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
      >
        <div className="relative w-full max-w-[420px] h-full">
          {/* Avatar 1 - Far Left */}
          <div className="absolute -left-2 bottom-16 w-[60px] h-[84px] rounded-[18px] overflow-hidden shadow-lg ring-1 ring-[#ACC8A2] transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:z-30 cursor-pointer">
            <Image src="/avatars/avatar_1.png" alt="User" fill className="object-cover" />
          </div>
          {/* Avatar 2 - Mid Left */}
          <div className="absolute left-[18%] bottom-10 w-[68px] h-[96px] rounded-[20px] overflow-hidden shadow-lg ring-1 ring-[#ACC8A2] z-10 transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:z-30 cursor-pointer">
            <Image src="/avatars/avatar_2.png" alt="User" fill className="object-cover" />
          </div>
          {/* Avatar 3 - Center */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[76px] h-[108px] rounded-[24px] overflow-hidden shadow-xl ring-2 ring-[#ACC8A2] z-20 transition-all duration-300 hover:scale-110 hover:-translate-y-3 hover:z-30 cursor-pointer">
            <Image src="/avatars/avatar_3.png" alt="User" fill className="object-cover" />
          </div>
          {/* Avatar 4 - Mid Right */}
          <div className="absolute right-[18%] bottom-10 w-[68px] h-[96px] rounded-[20px] overflow-hidden shadow-lg ring-1 ring-[#ACC8A2] z-10 transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:z-30 cursor-pointer">
            <Image src="/avatars/avatar_4.png" alt="User" fill className="object-cover" />
          </div>
          {/* Avatar 5 - Far Right */}
          <div className="absolute -right-2 bottom-16 w-[60px] h-[84px] rounded-[18px] overflow-hidden shadow-lg ring-1 ring-[#ACC8A2] transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:z-30 cursor-pointer">
            <Image src="/avatars/avatar_5.png" alt="User" fill className="object-cover" />
          </div>
        </div>
      </div>

        <div className="mt-8 text-center shrink-0 relative z-10 pb-4">
          <p className="text-white/60 text-[13px] font-medium">
            New to Intasela?{" "}
            <Link href="/register" className="text-[#ACC8A2] hover:text-white transition-colors ml-1">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
