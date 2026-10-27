import Link from "next/link";
import { Building2, ShieldCheck, Lock, ExternalLink } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      {/* 1. TOP TRI-COLOR STRIPE */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* 2. GOV META HEADER */}
      <div className="bg-[#1f2937] text-slate-200 text-xs py-1.5 px-4 border-b border-slate-700">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className="text-amber-400 font-bold">भारत सरकार</span>
            <span className="text-slate-400">|</span>
            <span>Government of India</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">National Single Sign-On Gateway</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> 256-Bit SSL Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* 3. BRANDING HEADER */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {/* Ashoka Stambh Emblem SVG */}
            <div className="h-12 w-10 flex flex-col items-center justify-center shrink-0">
              <svg viewBox="0 0 100 120" className="h-full w-full text-amber-800" fill="currentColor">
                <path d="M50 5 C40 5 35 15 35 25 C35 30 38 35 42 38 C35 40 30 46 30 55 C30 65 38 72 45 74 L45 88 L30 92 L30 98 L70 98 L70 92 L55 88 L55 74 C62 72 70 65 70 55 C70 46 65 40 58 38 C62 35 65 30 65 25 C65 15 60 5 50 5 Z M50 12 C55 12 58 17 58 24 C58 30 54 34 50 34 C46 34 42 30 42 24 C42 17 45 12 50 12 Z M50 78 C54 78 57 81 57 85 C57 89 54 92 50 92 C46 92 43 89 43 85 C43 81 46 78 50 78 Z" />
                <rect x="20" y="102" width="60" height="4" rx="1" fill="#8B4513" />
                <text x="50" y="116" fontSize="9" textAnchor="middle" fontWeight="bold" fill="#8B4513" fontFamily="serif">सत्यमेव जयते</text>
              </svg>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#002d62]">CivicBridge</span>
                <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1 rounded">
                  .gov.in
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                National Citizen Redressal Service • राष्ट्रीय नागरिक सेवा
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/" className="text-xs font-semibold text-blue-800 hover:text-blue-900 flex items-center gap-1">
              Back to Home Portal <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* 4. MAIN AUTH CARD CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* 5. OFFICIAL GOV FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px]">
            Designed, Developed & Hosted by National Informatics Centre (NIC), Government of India.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="hover:underline cursor-pointer">Security Policy</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Privacy Statement</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
