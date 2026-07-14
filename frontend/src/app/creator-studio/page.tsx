"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";

type TabType = "overview" | "analytics" | "settings";
type PeriodType = "today" | "yesterday" | "7days" | "month" | "all";

export default function CreatorStudioPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [period, setPeriod] = useState<PeriodType>("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`http://localhost:3001/users/me/creator-studio?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load studio data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router, period]);

  if (!isAuthenticated) return null;

  const threshold = data?.payoutThreshold || 50000;
  const balance = data?.walletBalance || 0;
  const progressPercent = Math.min((balance / threshold) * 100, 100);

  return (
    <main className="flex-1 min-h-screen pb-20 sm:pb-0 bg-background flex flex-col w-full">
      <div className="sticky top-0 z-10 flex flex-col bg-background/95 backdrop-blur-md border-b border-border">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between max-w-5xl mx-auto w-full gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Creator Studio</h1>
              <p className="text-xs text-muted-foreground">Revenue & Analytics</p>
            </div>
          </div>

          <div className="flex bg-muted p-1 rounded-lg">
            {(["overview", "analytics", "settings"] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors relative z-10 ${
                  activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="creatorStudioMainTab"
                    className="absolute inset-0 bg-background shadow rounded-md -z-10"
                  />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        {/* Time Filters - only show if not on settings */}
        {activeTab !== "settings" && (
          <div className="flex px-4 overflow-x-auto no-scrollbar border-t border-border/50 max-w-5xl mx-auto w-full">
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "month", label: "This Month" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as PeriodType)}
                className={`whitespace-nowrap px-6 py-3 font-semibold text-[13px] transition-colors relative ${
                  period === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {tab.label}
                {period === tab.id && (
                  <motion.div
                    layoutId="creatorStudioPeriodTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" 
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full flex-1">
        {error && <div className="p-4 mb-6 text-center text-red-500 bg-red-500/10 rounded-xl">{error}</div>}

        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Balance Card - Liquid Glass UI */}
            <div className="relative rounded-2xl p-6 overflow-hidden group shadow-lg">
              {/* Liquid Orbs Background */}
              <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[48px] group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand/20 rounded-full mix-blend-screen filter blur-[48px] group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#151B24]/40"></div>
              </div>

              {/* Glass Card Surface */}
              <div className="absolute inset-0 z-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"></div>
              
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 hidden md:block z-20">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="6" y1="15" x2="10" y2="15" />
                </svg>
              </div>
              
              <div className="relative z-20">
                <h2 className="text-white/60 font-medium mb-1 uppercase tracking-wider text-[10px]">Available Balance</h2>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold text-white tracking-tight">
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(balance)}
                  </span>
                  <span className="text-white/40 text-sm font-medium tracking-wide">NGN</span>
                </div>

                <div className="mb-6 max-w-sm">
                  <div className="flex justify-between text-[10px] text-white/50 mb-2 font-medium tracking-wide">
                    <span>Progress to payout</span>
                    <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(balance)} / {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(threshold)}</span>
                  </div>
                  <div className="h-1 w-full bg-[#0F141C] rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-white/20 transition-all duration-1000 ease-out rounded-full" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                
                <button 
                  disabled={balance < threshold}
                  onClick={() => alert("Withdrawals coming soon!")}
                  className={`text-sm font-medium py-2.5 px-6 rounded-full transition-colors flex items-center gap-2 ${
                    balance >= threshold 
                      ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10" 
                      : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  Withdraw Funds
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 border border-border rounded-2xl p-5">
                <h3 className="text-muted-foreground text-sm font-medium mb-1">Period Earnings</h3>
                <p className="text-2xl font-bold text-[#3BC492]">
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(data?.periodEarned || 0)}
                </p>
              </div>
              <div className="bg-muted/30 border border-border rounded-2xl p-5">
                <h3 className="text-muted-foreground text-sm font-medium mb-1">Monetization Events</h3>
                <p className="text-2xl font-bold text-foreground">
                  {data?.periodMonetizedPosts || 0}
                </p>
              </div>
            </div>

            {/* Earning History */}
            <div className="pt-2">
              <h2 className="text-lg font-bold mb-4 px-1">Recent Transactions</h2>
              <div className="bg-muted/10 border border-border rounded-2xl overflow-hidden min-h-[200px] relative">
                {loading && (
                   <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                   </div>
                )}
                
                {data?.history && data.history.length > 0 ? (
                  <div className="divide-y divide-border">
                    {data.history.slice(0, 10).map((item: any) => (
                      <div key={item.id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                            <p className="text-foreground font-medium truncate">
                              {item.post?.content || "Media content"}
                            </p>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-[#3BC492]/10 px-3 py-1.5 rounded-full border border-[#3BC492]/20 shrink-0">
                          <span className="text-[#3BC492] font-bold text-sm">
                            +{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(item.amount || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !loading && (
                    <div className="p-12 text-center text-muted-foreground">
                      <p>No transactions in this period.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {loading && (
               <div className="flex justify-center p-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
               </div>
             )}
             
             {!loading && data?.metrics && (
                <>
                  {/* Analytics Chart */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="text-lg font-bold mb-6">Performance Over Time</h3>
                    <div className="h-[300px] w-full">
                      {data.chartData && data.chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                              itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Area type="monotone" name="Views" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            <Area type="monotone" name="Engagements" dataKey="engagements" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagements)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
                          No performance data to display for this period.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Views Metric */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mb-4 text-brand">
                        <div 
                          className="w-[20px] h-[20px] bg-current"
                          style={{
                            WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAENklEQVR4nO2ZaWxVRRTHf/BK371zW0PQ4G4iBkQwBhKg9bG5oCIkAiEBl4h+0KARNMbdELdPVbSiokKNRhOWD4LKJ1AoiLSlBY2IH9xQNEpcsAJCqyHgM6c9bcbJvffxAd97g/6SF2buTCdnlnPOfwb4n/8WV3ACcBLwFzAQzxkP5IFaPGeeTuR6PKcB+B5YgOdsA14FXsNjMkAHMAvYhMecB/wIDAa+w2OuBDYD/YDDQBZPuU2dHd2RIXjKQuA+LYuPTMZT3gKmaVki1+14yg7gQi1LHnmKMuVa4JGU9t+BKi1fB6wuEKpFl5WERuCjhDYRiXutumitj1PGugF4mxJwGtAO7AdMTPvFwHZnYgdSxnsc+IkSicE3gGZgQky7HKU3nW8HgVMSxlum4vIciswWYCrwEnBXTPtDGn5tdgKjE8bbqjsykyJylp7/Sk16ElpdlgJ3ON/eAWYnjPkL8ALwJEXkHuAVyxc+jOnzru6YTT3wQEzfaj12VwEbj4eBgTHm+TAM9gVBcMAY86yuepw0n6TlCOgEKpw+XwDDnW/zgSUx443QnDNAA0LfAnZWGmMWZbPZg/KLokhkUNjbGkXRi+PH5TpbmtfnW5rey9fWju6oquqajM25wM+O4bsco/vo5GSSNlN1p1xmqgoQvgKGpc2iujpqGJur6RQbt7VuzF926YROnUw3YRjuk0l8s+uTrp+UgyAr94kpwEjgDM3Q4uA2q52r7OlODunhAuDLmO/3W4FhBXCT1fYgUKdHUn5zM5nMke1tm3rtbNvaKHZK8u1GjlNrS2NvB+lcUVFxBFirW78H+APIOYY86kSo2gS/CfXv+8YEBgkawt3AYi2PAb7VCFingWBpEASH3QWXTegdLYqiJZdMHNd1tJo+WJfP5Wo6oihyVz+O6cB6J4esSui7R6OezQbr7Wus+qCwCHjMHcAY80z9mFEdYuOWzevycszEt/+xYmJ4GAb7ZXeCIKhPcHZi/OZXqy4r+HRK/pEnIpvdwKAeO+m+Hsu/PwDnx4zRL4rChbILxph2Y0z98bq09dFoc7bWXwbuTOgramCOVa/U42YHjx3Aw47EKRqy0tdoea1VjtNU4lM9DNaoZ9Ogyln8peg8Z0n6z4CLEvrdArxu1SfHhORbgaPAmZSAOSrDe3JI/5QHifetusgYN6AMUhVQEoar04q8/y2l31Dga6ter5KnbMgAh4CrgbaUfhKN/tSdE9Zo+C4rmlVLLS/QT7L+qVr+NMWfSkadGimRKQ25Ho/SXTlk3evLhsv1lndjgX4SFGaodpMn1bKjUldY7iiFQvV8zfBNlCnTj0Eu3KtvXDdrpveW2cBK4Akny3vHRD1SK/Q9y1uGafJsPQZ/KmsGqozZ6/t/W2dUFMrLife0F3gL9obPU67DXtFU7FfFfwt5Pp3LCcBI4ORSG0G58jfEiSNbtKMSxAAAAABJRU5ErkJggg==)',
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAENklEQVR4nO2ZaWxVRRTHf/BK371zW0PQ4G4iBkQwBhKg9bG5oCIkAiEBl4h+0KARNMbdELdPVbSiokKNRhOWD4LKJ1AoiLSlBY2IH9xQNEpcsAJCqyHgM6c9bcbJvffxAd97g/6SF2buTCdnlnPOfwb4n/8WV3ACcBLwFzAQzxkP5IFaPGeeTuR6PKcB+B5YgOdsA14FXsNjMkAHMAvYhMecB/wIDAa+w2OuBDYD/YDDQBZPuU2dHd2RIXjKQuA+LYuPTMZT3gKmaVki1+14yg7gQi1LHnmKMuVa4JGU9t+BKi1fB6wuEKpFl5WERuCjhDYRiXutumitj1PGugF4mxJwGtAO7AdMTPvFwHZnYgdSxnsc+IkSicE3gGZgQky7HKU3nW8HgVMSxlum4vIciswWYCrwEnBXTPtDGn5tdgKjE8bbqjsykyJylp7/Sk16ElpdlgJ3ON/eAWYnjPkL8ALwJEXkHuAVyxc+jOnzru6YTT3wQEzfaj12VwEbj4eBgTHm+TAM9gVBcMAY86yuepw0n6TlCOgEKpw+XwDDnW/zgSUx443QnDNAA0LfAnZWGmMWZbPZg/KLokhkUNjbGkXRi+PH5TpbmtfnW5rey9fWju6oquqajM25wM+O4bsco/vo5GSSNlN1p1xmqgoQvgKGpc2iujpqGJur6RQbt7VuzF926YROnUw3YRjuk0l8s+uTrp+UgyAr94kpwEjgDM3Q4uA2q52r7OlODunhAuDLmO/3W4FhBXCT1fYgUKdHUn5zM5nMke1tm3rtbNvaKHZK8u1GjlNrS2NvB+lcUVFxBFirW78H+APIOYY86kSo2gS/CfXv+8YEBgkawt3AYi2PAb7VCFingWBpEASH3QWXTegdLYqiJZdMHNd1tJo+WJfP5Wo6oihyVz+O6cB6J4esSui7R6OezQbr7Wus+qCwCHjMHcAY80z9mFEdYuOWzevycszEt/+xYmJ4GAb7ZXeCIKhPcHZi/OZXqy4r+HRK/pEnIpvdwKAeO+m+Hsu/PwDnx4zRL4rChbILxph2Y0z98bq09dFoc7bWXwbuTOgramCOVa/U42YHjx3Aw47EKRqy0tdoea1VjtNU4lM9DNaoZ9Ogyln8peg8Z0n6z4CLEvrdArxu1SfHhORbgaPAmZSAOSrDe3JI/5QHifetusgYN6AMUhVQEoar04q8/y2l31Dga6ter5KnbMgAh4CrgbaUfhKN/tSdE9Zo+C4rmlVLLS/QT7L+qVr+NMWfSkadGimRKQ25Ho/SXTlk3evLhsv1lndjgX4SFGaodpMn1bKjUldY7iiFQvV8zfBNlCnTj0Eu3KtvXDdrpveW2cBK4Akny3vHRD1SK/Q9y1uGafJsPQZ/KmsGqozZ6/t/W2dUFMrLife0F3gL9obPU67DXtFU7FfFfwt5Pp3LCcBI4ORSG0G58jfEiSNbtKMSxAAAAABJRU5ErkJggg==)',
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                          }}
                        />
                      </div>
                      <h3 className="text-muted-foreground font-medium mb-1">Total Views</h3>
                      <p className="text-3xl font-bold mb-4">{data.metrics.totalViews.toLocaleString()}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Eligible</span>
                          <span className="font-semibold text-[#3BC492]">{data.metrics.eligibleViews.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-[#3BC492]" style={{ width: `${(data.metrics.eligibleViews / Math.max(data.metrics.totalViews, 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Comments Metric */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                        <div 
                          className="w-[20px] h-[20px] bg-currentColor"
                          style={{
                            WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADh0lEQVR4nO3Ze4inUxzH8dfuGLus2qzrbmMtxcS65bpbbsuuW2E3/CGS61JbaFxWJKuEtca6RRapdSv+4A/l9geNP+S2YluXGCyLRSktalPo1Ef9mmKfZ+Y383vUvOvUNHOec84z5zyf7/f7OYwzzv+WbvTgIOyJ3bGNhjMBc3EdXsD32Ixv8B4G8RV+w+d4HldjlobQgxuz0A/Qj4WYkZcbSvndTJyB+/Oib+McTOzA+u2IlfgJ9+b4DIcunIwX8REWGUMuwY+4Gzu1cdzjsAarMdUosj2ezZnfexQFoh9foHc0Jihnfl2O09ZGn4URh4PbOWiRzc9wjbHlJPyA2e0YbLvsxBU6wyJ8gmkjHehJPKKz3IyX/0XOK3Eu3sdknaUb7+LC4Ty8Lb7GHM1gX2xI/KrF9Xhas7gT99V5oKQK63FAxf6TE2NmRfsPwbE4EWcl/Vic1oelycluTytxo0rM2AEb6wThBQl6VV+66P3P+BIf5zy/hpfwTATjobS7Wl5gadqVmF5xvnuwrOqLlNzpWs1kv2TPlXgHR2omXfi9ipJ2p+MUzWVdlWi/czLbJvNclXS/t84Z7BAP4rIqH1PZujpMivzOSG2+fyT4cMxvaQsix63t4tQ3u9SY77ao3X8yPVptGPL7bUreDyPBpYR9taW9EjlubQ9HlmfXmLPEoFu31KnUGn90qn6uSDEtVlTpODha1VmbWIabqnR8ChdoLitwVZWOl+NRzeUJnFel426xecaiNh8Oa3Bo1c5v4NQag09NWTwWKcqvdeZaHFtzS0yM7Bb53YQ/8/P6xKO3hkjwSHO4o1K11gpypSI7sOZEExIcexIci51zREtQHKnx1l9VsVrpiyHXFLqz0yVzqMUpcdWH7V60mfNzPGuxB77DMZrBJHyaEroyRRHWYonmcEfdYz4x+X5J5prC/AhPMR8qsxwDDQqGc+L/1pLtJblsGbHP2sad2IgT6tr4Gxpyp7dVrvPKeo6u8+Dc1Omlqus08yI0xRPbte7Da3OReSn2MvYUgSlmwuu5hzl9uAMVC/JsPJbtLOb144ns85JytJspqeEfSNAdwJlJCttGb/zalZlgU+70ynavwg25cihKsk9yqmlDMtJ/cq6ZybVOS4m6KvX8L7FV+8byu+zKYo/HRbglfu5AFjWY/2pZ3F9pm5MFl7+9mdi0PK7JYfmgxxlnHKPP3/f5ueKem89DAAAAAElFTkSuQmCC)',
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADh0lEQVR4nO3Ze4inUxzH8dfuGLus2qzrbmMtxcS65bpbbsuuW2E3/CGS61JbaFxWJKuEtca6RRapdSv+4A/l9geNP+S2YluXGCyLRSktalPo1Ef9mmKfZ+Y383vUvOvUNHOec84z5zyf7/f7OYwzzv+WbvTgIOyJ3bGNhjMBc3EdXsD32Ixv8B4G8RV+w+d4HldjlobQgxuz0A/Qj4WYkZcbSvndTJyB+/Oib+McTOzA+u2IlfgJ9+b4DIcunIwX8REWGUMuwY+4Gzu1cdzjsAarMdUosj2ezZnfexQFoh9foHc0Jihnfl2O09ZGn4URh4PbOWiRzc9wjbHlJPyA2e0YbLvsxBU6wyJ8gmkjHehJPKKz3IyX/0XOK3Eu3sdknaUb7+LC4Ty8Lb7GHM1gX2xI/KrF9Xhas7gT99V5oKQK63FAxf6TE2NmRfsPwbE4EWcl/Vic1oelycluTytxo0rM2AEb6wThBQl6VV+66P3P+BIf5zy/hpfwTATjobS7Wl5gadqVmF5xvnuwrOqLlNzpWs1kv2TPlXgHR2omXfi9ipJ2p+MUzWVdlWi/czLbJvNclXS/t84Z7BAP4rIqH1PZujpMivzOSG2+fyT4cMxvaQsix63t4tQ3u9SY77ao3X8yPVptGPL7bUreDyPBpYR9taW9EjlubQ9HlmfXmLPEoFu31KnUGn90qn6uSDEtVlTpODha1VmbWIabqnR8ChdoLitwVZWOl+NRzeUJnFel426xecaiNh8Oa3Bo1c5v4NQag09NWTwWKcqvdeZaHFtzS0yM7Bb53YQ/8/P6xKO3hkjwSHO4o1K11gpypSI7sOZEExIcexIci51zREtQHKnx1l9VsVrpiyHXFLqz0yVzqMUpcdWH7V60mfNzPGuxB77DMZrBJHyaEroyRRHWYonmcEfdYz4x+X5J5prC/AhPMR8qsxwDDQqGc+L/1pLtJblsGbHP2sad2IgT6tr4Gxpyp7dVrvPKeo6u8+Dc1Omlqus08yI0xRPbte7Da3OReSn2MvYUgSlmwuu5hzl9uAMVC/JsPJbtLOb144ns85JytJspqeEfSNAdwJlJCttGb/zalZlgU+70ynavwg25cihKsk9yqmlDMtJ/cq6ZybVOS4m6KvX8L7FV+8byu+zKYo/HRbglfu5AFjWY/2pZ3F9pm5MFl7+9mdi0PK7JYfmgxxlnHKPP3/f5ueKem89DAAAAAElFTkSuQmCC)',
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                          }}
                        />
                      </div>
                      <h3 className="text-muted-foreground font-medium mb-1">Total Comments</h3>
                      <p className="text-3xl font-bold mb-4">{data.metrics.totalComments.toLocaleString()}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Eligible</span>
                          <span className="font-semibold text-[#3BC492]">{data.metrics.eligibleComments.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-[#3BC492]" style={{ width: `${(data.metrics.eligibleComments / Math.max(data.metrics.totalComments, 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Posts Metric */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mb-4 text-brand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <h3 className="text-muted-foreground font-medium mb-1">Total Posts</h3>
                      <p className="text-3xl font-bold mb-4">{data.metrics.totalPosts.toLocaleString()}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Eligible</span>
                          <span className="font-semibold text-[#3BC492]">{data.metrics.eligiblePosts.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-[#3BC492]" style={{ width: `${(data.metrics.eligiblePosts / Math.max(data.metrics.totalPosts, 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-2xl p-6">
                    <h3 className="font-bold mb-2">About Eligibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Content marked as spam, deleted, or violating community guidelines is ineligible for monetization. 
                      Views and interactions on ineligible content will not generate revenue. Keep your content high-quality to maximize earnings!
                    </p>
                  </div>
                </>
             )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
             <div className="bg-card border border-border rounded-2xl p-6">
               <h2 className="text-xl font-bold mb-6">Payment Configuration</h2>
               
               <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Settings saved!"); }}>
                 <div>
                   <label className="block text-sm font-medium mb-2">Preferred Payout Method</label>
                   <div className="relative">
                     <select className="w-full bg-background border border-border rounded-lg p-3 pr-10 outline-none focus:border-primary appearance-none cursor-pointer hover:border-muted-foreground/50 transition-colors">
                       <option value="bank">Local Bank Transfer (NGN)</option>
                       <option value="crypto">Crypto Wallet (USDT/USDC)</option>
                       <option value="paystack">Paystack</option>
                     </select>
                     <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-muted-foreground">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                     </div>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">Account Number / Wallet Address</label>
                   <input 
                    type="text" 
                    placeholder="e.g. 0123456789"
                    className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:border-primary"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium mb-2">Bank Name (if applicable)</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Guaranty Trust Bank"
                    className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:border-primary"
                   />
                 </div>

                 <button type="submit" className="bg-foreground text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 w-full sm:w-auto mt-4">
                   Save Settings
                 </button>
               </form>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
