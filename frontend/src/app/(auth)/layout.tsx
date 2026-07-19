export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full bg-[#09090b] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
