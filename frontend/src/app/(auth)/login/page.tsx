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
    <div className="w-full max-w-md bg-[#18181b] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Welcome Back</h1>
        <p className="text-gray-400">Log in to your Intasela account</p>
      </div>

      <div className="min-h-[44px] mb-2">
        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Email or Username</label>
          <Input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="you@example.com or username"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 ml-1">
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <Link href="/forgot-password" className="text-sm text-[#3BC492] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-6"
        >
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#3BC492] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
