"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/store/useToastStore";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError("Please enter your email or username");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      if (!res.ok) {
        throw new Error("Failed to send reset code. Please try again.");
      }

      setStep(2);
      addToast("Password reset code sent to your email", "success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The backend uses identifier to find user, but the reset-password expects { email, otp, newPassword }
        // The backend might need email specifically. Let's send the identifier as email
        body: JSON.stringify({ email: identifier, otp, newPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to reset password. Invalid OTP.");
      }

      addToast("Password reset successfully. You can now log in.", "success");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-black/40 backdrop-blur-3xl p-5 sm:p-10 rounded-[2rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col sm:min-h-[550px]">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Reset Password</h1>
        <p className="text-white/60">
          {step === 1 ? "Enter your email or username to get a reset code" : "Enter the code sent to your email and your new password"}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-in slide-in-from-top-2 fade-in duration-300">
          <AlertCircle size={16} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="flex flex-col flex-1">
          <div className="space-y-4 flex-1">
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
          </div>

          <div className="mt-auto pt-8 space-y-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#ACC8A2] text-[#1A2517] hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 rounded-full h-10 font-bold text-[15px] shadow-[0_4px_14px_rgba(172,200,162,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </Button>
            
            <div className="text-center">
              <Link href="/login" className="text-white/50 text-sm font-medium hover:text-white transition-colors inline-block mt-2">
                Return to login
              </Link>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col flex-1">
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">6-Digit Code</label>
              <Input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="123456"
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20 text-center tracking-widest text-lg font-bold"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 ml-1">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ACC8A2]/50 focus:ring-[#ACC8A2]/20"
              />
            </div>
          </div>

          <div className="mt-auto pt-8 space-y-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#ACC8A2] text-[#1A2517] hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 rounded-full h-10 font-bold text-[15px] shadow-[0_4px_14px_rgba(172,200,162,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
            
            <button 
              type="button" 
              onClick={() => { setStep(1); setError(""); }}
              className="w-full py-2 text-sm font-medium text-white/50 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Go back and resend code
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
