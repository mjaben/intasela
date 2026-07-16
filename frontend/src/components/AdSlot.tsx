"use client";

import { useEffect, useState, useRef } from "react";
import { AdUnit } from "next-google-adsense";
import { useUserStore } from "@/store/useUserStore";

interface AdSlotProps {
  format?: "horizontal" | "vertical" | "in-feed" | "reply" | "header";
  slotId: string;
}

export default function AdSlot({ format = "horizontal", slotId }: AdSlotProps) {
  const [adData, setAdData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  useEffect(() => {
    let isMounted = true;

    const fetchAdDecision = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Get decision from Ad Engine
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/decide`, {
          headers
        });
        
        if (!res.ok) throw new Error("Failed to fetch ad decision");
        const data = await res.json();
        
        if (isMounted) {
          setAdData(data);
          setLoading(false);
        }
      } catch (e) {
        console.error("Ad Engine Error:", e);
        // Fallback to Google if internal engine fails
        if (isMounted) {
          setAdData({ type: 'google' });
          setLoading(false);
        }
      }
    };

    fetchAdDecision();

    return () => { isMounted = false; };
  }, [slotId]); // Re-fetch if slot changes (e.g. route change re-using component)

  // Intersection Observer for Impression Tracking
  useEffect(() => {
    if (!adData || adData.type !== 'internal' || impressionTracked.current || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          impressionTracked.current = true;
          // Fire impression tracking beacon
          const token = localStorage.getItem("access_token");
          const headers: any = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/track/impression`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              campaignId: adData.campaignId,
              cost: adData.cpm 
            })
          }).catch(console.error);

          observer.disconnect();
        }
      },
      { threshold: 0.5 } // 50% visible
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [adData]);

  const handleAdClick = () => {
    if (!adData || adData.type !== 'internal') return;
    
    const token = localStorage.getItem("access_token");
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Fire click tracking beacon
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/track/click`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ campaignId: adData.campaignId })
    }).catch(console.error);

    if (adData.creative?.ctaLink) {
      window.open(adData.creative.ctaLink, "_blank");
    }
  };

  if (loading) {
    return (
      <div className={`w-full bg-muted/20 animate-pulse rounded-lg my-4 flex items-center justify-center ${format === "vertical" ? "h-[600px]" : "h-[90px]"}`}>
        <span className="text-muted-foreground/50 text-xs">Loading Ad...</span>
      </div>
    );
  }

  // --- RENDER INTERNAL BUSINESS AD ---
  if (adData?.type === 'internal') {
    const { creative } = adData;
    return (
      <div 
        ref={containerRef}
        onClick={handleAdClick}
        className={`w-full bg-card border border-border flex flex-col rounded-xl my-4 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group ${format === "vertical" ? "h-auto min-h-[600px]" : "h-auto min-h-[90px] sm:flex-row"}`}
      >
        {/* Creative Image/Video */}
        {creative.mediaUrl && (
          <div className={`${format === "vertical" ? "w-full h-[250px]" : "w-full sm:w-[150px] h-[150px] sm:h-auto"} bg-muted shrink-0 relative overflow-hidden`}>
            {creative.mediaType === 'VIDEO' ? (
              <video src={creative.mediaUrl} autoPlay muted loop className="w-full h-full object-cover" />
            ) : (
              <img src={creative.mediaUrl} alt="Ad Creative" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            )}
          </div>
        )}
        
        {/* Ad Content */}
        <div className="p-4 flex flex-col flex-1 justify-center relative">
          <span className="absolute top-2 right-2 text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Promoted</span>
          {creative.headline && <h4 className="font-bold text-[15px] mb-1 line-clamp-2 pr-12">{creative.headline}</h4>}
          {creative.description && <p className="text-muted-foreground text-[13px] line-clamp-2 mb-3">{creative.description}</p>}
          
          {creative.ctaText && (
            <div className="mt-auto self-start bg-primary/10 text-primary font-bold text-xs px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {creative.ctaText}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER GOOGLE ADSENSE FALLBACK ---
  const isVertical = format === "vertical";
  const dummySize = isVertical ? "LARGE_RECTANGLE" : (format === "horizontal" ? "LEADERBOARD" : "BANNER");
  
  // NOTE: In production, you would use actual slotIds from AdSense.
  // For development, next-google-adsense will render a dummy block.
  
  return (
    <div className={`w-full my-4 flex flex-col items-center justify-center overflow-hidden min-h-[50px]`}>
      <span className="text-muted-foreground/40 text-[10px] uppercase tracking-widest font-bold mb-1 w-full text-center">Advertisement</span>
      <div className="w-full max-w-full overflow-x-auto no-scrollbar flex justify-center">
        <AdUnit 
          publisherId="pub-1173851541726956"
          slotId="0000000000" // Replace with real slot ID from Google AdSense dashboard later
          layout={format === 'in-feed' ? 'in-article' : 'display'}
          dummySize={dummySize as any}
        />
      </div>
    </div>
  );
}
