"use client";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullHeight?: boolean;
}

export default function ErrorState({ 
  message = "Something went wrong while loading this content.", 
  onRetry,
  fullHeight = false
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${fullHeight ? 'min-h-[50vh]' : ''}`}>
      <div className="w-16 h-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <h3 className="text-lg font-bold mb-2">Oops!</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-full font-semibold transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Tap to Retry
        </button>
      )}
    </div>
  );
}
