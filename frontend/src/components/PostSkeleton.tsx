"use client";

export default function PostSkeleton() {
  return (
    <article className="px-4 py-4 border-b border-white/10 bg-transparent">
      <div className="flex items-start gap-3 animate-pulse">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-muted/60 shrink-0" />
        
        <div className="flex-1 min-w-0 pt-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3.5 bg-muted/60 rounded-md w-28" />
            <div className="h-3 bg-muted/40 rounded-md w-16" />
          </div>
          
          {/* Content */}
          <div className="space-y-2.5 mt-3 mb-4">
            <div className="h-3.5 bg-muted/60 rounded-md w-full" />
            <div className="h-3.5 bg-muted/60 rounded-md w-[85%]" />
            <div className="h-3.5 bg-muted/60 rounded-md w-[60%]" />
          </div>
          
          {/* Engagement Bar */}
          <div className="flex justify-between items-center mt-4 max-w-md">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-muted/40" />
                <div className="h-2.5 bg-muted/40 rounded-md w-6 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
