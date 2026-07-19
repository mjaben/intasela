export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg my-auto flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
