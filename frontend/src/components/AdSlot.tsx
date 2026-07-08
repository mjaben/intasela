export default function AdSlot({ format = "horizontal" }: { format?: "horizontal" | "vertical" | "in-feed" }) {
  const isVertical = format === "vertical";
  
  return (
    <div 
      className={`w-full bg-muted/30 border border-border flex items-center justify-center rounded-lg my-4
        ${isVertical ? "h-[600px]" : "h-[90px]"}`}
    >
      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
        Advertisement
      </span>
      {/* 
        Google AdSense Script will be injected here.
        e.g., <ins className="adsbygoogle" ... />
      */}
    </div>
  );
}
