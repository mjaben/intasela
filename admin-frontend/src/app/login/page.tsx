import LoginForm from "./LoginForm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  
  // If already logged in, redirect to dashboard
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand mx-auto rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,196,146,0.3)] mb-6">
            <span className="text-3xl font-black text-white leading-none">In</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Super Admin</h1>
          <p className="text-gray-400 mt-2">Sign in to manage the Intasela platform</p>
        </div>
        
        <div className="bg-brand-card border border-brand-border/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
