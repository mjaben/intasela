export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full flex-1 relative flex flex-col p-4 sm:p-8 overflow-hidden bg-[#0a0a0a]">
      {/* Background geometric lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.03] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/[0.03] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] border border-white/[0.03] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] border border-white/[0.02] rounded-full pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] border border-white/[0.02] rounded-full pointer-events-none -translate-x-1/4 translate-y-1/4" />

      <div className="w-full h-full max-h-full max-w-lg z-10 mx-auto flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
