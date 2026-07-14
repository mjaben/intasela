"use client";

import { useState, useTransition } from "react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Email Address</label>
        <input 
          type="email" 
          name="email" 
          required 
          className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Password</label>
        <input 
          type="password" 
          name="password" 
          required 
          className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-brand hover:bg-brand/90 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Authenticating..." : "Sign In to Admin"}
      </button>
    </form>
  );
}
