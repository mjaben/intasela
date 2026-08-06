export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full bg-[#1A2517] relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 min-h-[100dvh]">
      <div className="absolute top-0 right-0 w-[50vw] max-w-[500px] h-[500px] bg-[#ACC8A2] rounded-full blur-[120px] opacity-20 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] max-w-[400px] h-[400px] bg-[#ACC8A2] rounded-full blur-[100px] opacity-10 -translate-x-1/3 translate-y-1/3 pointer-events-none" />
      
      <div className="w-full max-w-lg z-10 flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
