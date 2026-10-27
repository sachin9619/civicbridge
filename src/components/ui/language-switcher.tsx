"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      data-no-translate="true"
      className={`inline-flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 bg-slate-50/90 shadow-2xs ${className}`}
      role="group"
      aria-label="Language Mode Selector"
    >
      <div className="flex items-center gap-1 pl-1.5 pr-0.5 text-slate-500 font-semibold text-[11px]">
        <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        {!compact && <span className="hidden md:inline text-[11px] font-bold text-slate-700">भाषा:</span>}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${
            language === "en"
              ? "bg-[#002B49] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          title="Switch entire page to English"
        >
          {compact ? "EN" : "English"}
        </button>

        <button
          type="button"
          onClick={() => setLanguage("hi")}
          className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${
            language === "hi"
              ? "bg-[#FF671F] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          title="पूरा पेज हिन्दी में बदलें"
        >
          हिन्दी
        </button>

        <button
          type="button"
          onClick={() => setLanguage("mix")}
          className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${
            language === "mix"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          title="द्विभाषी (Bilingual / Mix Mode)"
        >
          Mix
        </button>
      </div>
    </div>
  );
}
