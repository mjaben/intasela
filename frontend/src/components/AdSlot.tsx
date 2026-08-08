"use client";

import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/store/useUserStore";

interface AdSlotProps {
  format?: "horizontal" | "vertical" | "in-feed" | "reply" | "header" | "hero";
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        // Get decision from Ad Engine
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/decide`, {
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
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
      <div className={`w-full bg-card/40 border border-border/40 animate-pulse rounded-2xl my-3 flex items-center justify-between px-4 ${format === "vertical" ? "h-[600px]" : "h-[80px]"}`}>
        <span className="text-[10px] text-muted-foreground/60 bg-muted/40 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/30">Ads</span>
        <span className="text-muted-foreground/40 text-xs font-medium">Loading...</span>
      </div>
    );
  }

  // --- RENDER INTERNAL BUSINESS AD ---
  if (adData?.type === 'internal') {
    const { creative } = adData;
    
    if (format === 'hero') {
      return (
        <div 
          ref={containerRef}
          onClick={handleAdClick}
          className="w-full relative cursor-pointer group overflow-hidden border-b border-border"
        >
          {creative.mediaUrl ? (
             <div className="w-full h-[300px] sm:h-[400px] relative">
               {creative.mediaType === 'VIDEO' ? (
                 <video src={creative.mediaUrl} autoPlay muted loop className="w-full h-full object-cover" />
               ) : (
                 <img src={creative.mediaUrl} alt="Ad Creative" className="w-full h-full object-cover transition-transform duration-500" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />
             </div>
          ) : (
             <div className="w-full h-[200px] bg-gradient-to-tr from-primary/80 to-primary/40 relative">
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
             </div>
          )}
          
          <div className="absolute bottom-0 left-0 w-full p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/80 bg-black/60 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/20">Ads</span>
              <div className="bg-black/50 text-white rounded-full p-1.5 backdrop-blur-md hover:bg-black/70 transition-colors cursor-pointer" title="Ad options">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </div>
            </div>
            
            {creative.headline && <h3 className="font-bold text-2xl sm:text-3xl mb-1 text-white leading-tight">{creative.headline}</h3>}
            {creative.description && <p className="text-white/90 text-sm mb-3 max-w-[80%]">{creative.description}</p>}
            
            <div className="flex items-center gap-2 text-[13px] font-bold text-white/90">
              <div className="bg-white text-black rounded-sm p-[1px]">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
              </div>
              Promoted {creative.advertiserName ? `by ${creative.advertiserName}` : ''}
            </div>
          </div>
        </div>
      );
    }

    const isReplyFormat = format === "reply";
    const isVertical = format === "vertical";

    return (
      <div 
        ref={containerRef}
        onClick={handleAdClick}
        className={`w-full bg-card/70 border border-border flex flex-col rounded-2xl my-3 overflow-hidden cursor-pointer hover:border-primary/40 transition-all group shadow-sm ${
          isVertical 
            ? "h-auto min-h-[500px]" 
            : isReplyFormat 
            ? "p-3 sm:flex-row gap-3" 
            : "p-4 sm:flex-row gap-4"
        }`}
      >
        {/* Creative Image/Video */}
        {creative.mediaUrl && (
          <div className={`${isVertical ? "w-full h-[220px]" : isReplyFormat ? "w-full sm:w-[120px] h-[100px] sm:h-auto" : "w-full sm:w-[140px] h-[120px] sm:h-auto"} rounded-xl bg-muted shrink-0 relative overflow-hidden`}>
            {creative.mediaType === 'VIDEO' ? (
              <video src={creative.mediaUrl} autoPlay muted loop className="w-full h-full object-cover" />
            ) : (
              <img src={creative.mediaUrl} alt="Ad Creative" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            )}
          </div>
        )}
        
        {/* Ad Content */}
        <div className="flex flex-col flex-1 justify-between relative pt-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] text-muted-foreground/80 bg-muted/40 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/40">Ads</span>
            {creative.advertiserName && (
              <span className="text-[11px] text-muted-foreground/70 font-medium truncate">by {creative.advertiserName}</span>
            )}
          </div>

          {creative.headline && <h4 className="font-bold text-[14px] text-foreground mb-1 line-clamp-2 leading-snug">{creative.headline}</h4>}
          {creative.description && <p className="text-muted-foreground text-[12px] line-clamp-2 mb-2 leading-relaxed">{creative.description}</p>}
          
          {creative.ctaText && creative.ctaText !== "None" && (
            <div className="mt-2 self-start bg-primary/15 text-primary font-bold text-xs px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {creative.ctaText}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER GOOGLE ADSENSE FALLBACK ---
  const isVertical = format === "vertical";
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`w-full my-3 bg-card/60 border border-border/50 rounded-xl flex flex-col justify-between ${isVertical ? 'h-[500px]' : 'min-h-[80px]'}`}>
        <div className="flex items-center justify-between w-full px-3 pt-2">
          <span className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest">Ads</span>
          <span className="text-[10px] text-muted-foreground/40 font-medium">Google AdSense Placeholder</span>
        </div>
        <div className="flex-1 flex items-center justify-center my-2">
          <span className="text-muted-foreground/30 text-xs font-semibold">Promoted Content</span>
        </div>
      </div>
    );
  }
  
  return (
    <AdSenseNative slotId={slotId} format={format} />
  );
}

// Native AdSense component with layout, visibility, and fill status inspection
function AdSenseNative({ slotId, format }: { slotId: string, format: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef<boolean>(false);
  const [isFilled, setIsFilled] = useState<boolean>(false);

  useEffect(() => {
    const el = insRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    // Helper to check if AdSense loaded content into <ins>
    const checkFillStatus = () => {
      const status = el.getAttribute("data-ad-status");
      const hasIframe = el.querySelector("iframe") !== null;
      if (status === "filled" || hasIframe) {
        setIsFilled(true);
      } else if (status === "unfilled") {
        setIsFilled(false);
      }
    };

    // Watch for AdSense DOM changes (iframe injection or attribute updates)
    const mutationObserver = new MutationObserver(() => {
      checkFillStatus();
    });

    mutationObserver.observe(el, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
      childList: true,
      subtree: true,
    });

    const tryPushAd = () => {
      if (pushedRef.current) return;

      if (el.getAttribute("data-adsbygoogle-status")) {
        pushedRef.current = true;
        checkFillStatus();
        return;
      }

      if (el.offsetWidth > 0 && container.offsetWidth > 0) {
        pushedRef.current = true;
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error("AdSense error:", e);
        }
      }
    };

    tryPushAd();

    let resizeObserver: ResizeObserver | null = null;
    if (!pushedRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        tryPushAd();
        if (pushedRef.current && resizeObserver) {
          resizeObserver.disconnect();
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      mutationObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [slotId]);

  const adSlotId = slotId === 'feed' ? '5819377787' : slotId === 'sidebar' ? '8871150173' : slotId === 'reply' ? '9641689755' : '5819377787';

  return (
    <div className={`w-full my-3 flex flex-col items-center overflow-hidden ${pushedRef.current && !isFilled ? 'min-h-0' : ''}`}>
      <div className={`flex flex-col border border-border/50 rounded-xl overflow-hidden ${isFilled ? 'w-full' : 'min-h-[90px] w-full'}`}>
        <span className={`text-muted-foreground/40 text-[9px] uppercase tracking-widest font-bold px-2 pt-1.5 text-left ${!isFilled ? 'hidden' : 'block'}`}>Ads</span>
        <div ref={containerRef} className="w-full min-w-[250px] max-w-full overflow-hidden block">
          <ins ref={insRef}
               className="adsbygoogle"
               style={{ display: "block", minWidth: "250px", width: "100%" }}
               data-ad-client="ca-pub-1173851541726956"
               data-ad-slot={adSlotId}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
      </div>
    </div>
  );
}
