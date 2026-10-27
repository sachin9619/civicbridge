export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CivicBridge. All rights reserved.
      </footer>
    </div>
  );
}
