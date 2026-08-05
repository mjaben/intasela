"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/store/useToastStore";

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
    <div className="w-full max-w-md bg-[#18181b] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-gray-400">
          {step === 1 ? "Enter your email or username to get a reset code" : "Enter the code sent to your email and your new password"}
        </p>
      </div>

      <div className="min-h-[44px] mb-2">
        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
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

          <Button type="submit" disabled={loading} className="w-full mt-6">
            {loading ? "Sending..." : "Send Reset Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">6-Digit Code</label>
            <Input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="123456"
              className="text-center tracking-widest text-lg font-bold"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-6">
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
          
          <button 
            type="button" 
            onClick={() => { setStep(1); setError(""); }}
            className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Go back and resend code
          </button>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/login" className="text-gray-400 text-sm hover:text-white transition-colors">
          Return to login
        </Link>
      </div>
    </div>
  );
}
