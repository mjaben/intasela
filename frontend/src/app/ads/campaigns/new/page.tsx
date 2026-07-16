"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    objective: "AWARENESS",
    budget: "",
    bid: "",
    startDate: new Date().toISOString().split('T')[0],
    targetCountry: "",
  });

  const [creativeData, setCreativeData] = useState({
    mediaType: "IMAGE",
    mediaUrl: "",
    headline: "",
    description: "",
    ctaText: "Learn More",
    ctaLink: ""
  });

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/campaigns`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          campaignData: {
            ...formData,
            budget: Number(formData.budget),
            bid: Number(formData.bid)
          },
          creativeData
        }),
      });

      if (res.ok) {
        router.push("/ads");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create campaign. Check wallet balance.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen p-6 sm:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Ad Campaign</h1>
        <div className="flex items-center gap-4 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </header>

      <div className="bg-card border border-border p-6 sm:p-10 rounded-xl">
        
        {/* STEP 1: Campaign Details */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold border-b border-border pb-4">1. Campaign Details</h2>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Campaign Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Summer Promo 2026"
                className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Total Budget (USD)</label>
                <input 
                  type="number" 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  placeholder="100"
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Target CPM Bid (USD)</label>
                <input 
                  type="number" 
                  step="0.10"
                  value={formData.bid}
                  onChange={(e) => setFormData({...formData, bid: e.target.value})}
                  placeholder="2.50"
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button onClick={handleNext} disabled={!formData.name || !formData.budget || !formData.bid} className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Creative Assets */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold border-b border-border pb-4">2. Creative Assets</h2>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Media URL (Image or Video)</label>
              <input 
                type="url" 
                value={creativeData.mediaUrl}
                onChange={(e) => setCreativeData({...creativeData, mediaUrl: e.target.value})}
                placeholder="https://example.com/banner.jpg"
                className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Headline</label>
              <input 
                type="text" 
                value={creativeData.headline}
                onChange={(e) => setCreativeData({...creativeData, headline: e.target.value})}
                placeholder="Catchy title..."
                className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea 
                value={creativeData.description}
                onChange={(e) => setCreativeData({...creativeData, description: e.target.value})}
                placeholder="Tell users why they should click..."
                rows={3}
                className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary resize-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Call to Action (CTA)</label>
                <select 
                  value={creativeData.ctaText}
                  onChange={(e) => setCreativeData({...creativeData, ctaText: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary" 
                >
                  <option>Learn More</option>
                  <option>Buy Now</option>
                  <option>Sign Up</option>
                  <option>Download</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Destination Link</label>
                <input 
                  type="url" 
                  value={creativeData.ctaLink}
                  onChange={(e) => setCreativeData({...creativeData, ctaLink: e.target.value})}
                  placeholder="https://yourwebsite.com/promo"
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={handlePrev} className="bg-muted text-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-80 transition-opacity">
                Back
              </button>
              <button onClick={handleNext} disabled={!creativeData.mediaUrl} className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
                Review Campaign
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold border-b border-border pb-4">3. Review & Submit</h2>
            
            <div className="bg-muted/30 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Ad Preview</h3>
              {/* Simple Ad Preview */}
              <div className="bg-card border border-border rounded-xl flex sm:flex-row flex-col overflow-hidden">
                <div className="w-full sm:w-[150px] h-[150px] bg-muted shrink-0">
                  {creativeData.mediaUrl && <img src={creativeData.mediaUrl} className="w-full h-full object-cover" alt="Preview" />}
                </div>
                <div className="p-4 flex flex-col justify-center relative flex-1">
                  <span className="absolute top-2 right-2 text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Promoted</span>
                  <h4 className="font-bold text-[15px] mb-1 line-clamp-2">{creativeData.headline || "Your Headline Here"}</h4>
                  <p className="text-muted-foreground text-[13px] line-clamp-2 mb-3">{creativeData.description || "Your ad description will appear here."}</p>
                  <div className="mt-auto self-start bg-primary/10 text-primary font-bold text-xs px-3 py-1.5 rounded-full">
                    {creativeData.ctaText}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">Campaign Name</div>
              <div className="font-semibold text-right">{formData.name}</div>
              
              <div className="text-muted-foreground">Total Budget</div>
              <div className="font-semibold text-right text-primary">${Number(formData.budget).toFixed(2)}</div>
              
              <div className="text-muted-foreground">Max Bid (CPM)</div>
              <div className="font-semibold text-right">${Number(formData.bid).toFixed(2)}</div>
            </div>

            <div className="pt-8 flex justify-between border-t border-border mt-6">
              <button onClick={handlePrev} className="bg-muted text-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-80 transition-opacity">
                Edit Details
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {loading ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
