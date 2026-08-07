"use client";

import { useState } from "react";
import { Send, Bell, Info } from "lucide-react";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [audience, setAudience] = useState("all");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null, message: string }>({ type: null, message: "" });

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatus({ type: null, message: "" });

    try {
      // MOCK API CALL: Here you would make a POST request to your real backend
      // which uses the Firebase Admin SDK to actually send the notification.
      console.log("Sending Push:", { title, body, url, audience });
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay
      
      setStatus({ type: "success", message: "Push notification queued successfully!" });
      setTitle("");
      setBody("");
    } catch (err) {
      setStatus({ type: "error", message: "Failed to send push notification." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Push Notifications</h1>
          <p className="text-muted-foreground mt-1">Broadcast messages to your users' devices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSendPush} className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Notification Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Feature Update!"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Notification Body</label>
              <textarea 
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Briefly describe what's new..."
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Target Audience</label>
                <select 
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
                >
                  <option value="all">All Subscribed Users</option>
                  <option value="active">Active this week</option>
                  <option value="test">Test Devices Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Action URL (On Tap)</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. /spaces"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            </div>

            {status.type && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                <Info className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            <div className="pt-4 border-t border-border flex justify-end">
              <button 
                type="submit" 
                disabled={isSending || !title || !body}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isSending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Push
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</h3>
            
            {/* iOS Style Notification Preview */}
            <div className="bg-[#f2f2f7] dark:bg-[#1c1c1e] rounded-3xl p-4 shadow-xl border border-black/5 dark:border-white/10 relative overflow-hidden h-[300px]">
              
              <div className="absolute top-12 left-4 right-4 bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-black/5 dark:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-foreground">In</span>
                    </div>
                    <span className="text-xs font-semibold text-black/60 dark:text-white/60">INTASELA</span>
                  </div>
                  <span className="text-[10px] text-black/40 dark:text-white/40">now</span>
                </div>
                
                <h4 className="text-[15px] font-bold text-black dark:text-white leading-tight">
                  {title || "Notification Title"}
                </h4>
                <p className="text-[14px] text-black/80 dark:text-white/80 leading-snug mt-1 line-clamp-3">
                  {body || "This is how your message will appear on a user's lock screen."}
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
