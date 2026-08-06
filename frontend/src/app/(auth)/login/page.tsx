"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="w-full max-w-md bg-black/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-white/70">Log in to your Intasela account</p>
      </div>

      <div className="min-h-[44px] mb-2">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm text-center font-medium">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Email or Username</label>
          <Input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="you@example.com or username"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="block text-sm font-semibold text-white/80">Password</label>
            <Link href="/forgot-password" className="text-sm text-[#ACC8A2] hover:text-white transition-colors font-medium">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-8 bg-[#ACC8A2] text-[#1A2517] hover:bg-white transition-colors rounded-full h-12 font-bold text-[15px] shadow-[0_4px_14px_rgba(172,200,162,0.4)]"
        >
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <div className="mt-8 text-center">
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
