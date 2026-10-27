"use client";

import { useLanguage, type LanguageMode } from "@/components/providers/language-provider";
import { Globe, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LanguageSwitcherProps {
  variant?: "pill" | "compact" | "floating" | "dropdown";
  className?: string;
}

export function LanguageSwitcher({ variant = "pill", className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. FLOATING WIDGET VARIANT (Persistent on every page in bottom-right corner)
  if (variant === "floating") {
    return (
      <div className={`fixed bottom-5 right-5 z-50 flex items-center shadow-lg rounded-full border border-slate-300 bg-white/95 backdrop-blur-md p-1 ${className}`}>
        <div className="flex items-center gap-1 px-2 text-slate-500 font-semibold text-xs border-r border-slate-200">
          <Globe className="h-3.5 w-3.5 text-blue-600 animate-spin-slow" />
          <span className="hidden sm:inline text-[11px] font-bold text-slate-700">भाषा / Lang:</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              language === "en"
                ? "bg-[#002B49] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Switch website to English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              language === "hi"
                ? "bg-[#FF671F] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="वेबसाइट को हिन्दी में रखें"
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => setLanguage("mix")}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
              language === "mix"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="द्विभाषी (Bilingual / Mix Mode)"
          >
            Mix
          </button>
        </div>
      </div>
    );
  }

  // 2. COMPACT TOGGLE IN HEADER / NAVBAR
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-50 text-xs shadow-2xs ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
            language === "en"
              ? "bg-[#002B49] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("hi")}
          className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
            language === "hi"
              ? "bg-[#FF671F] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          हिन्दी
        </button>
        <button
          type="button"
          onClick={() => setLanguage("mix")}
          className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
            language === "mix"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Mix
        </button>
      </div>
    );
  }

  // 3. PILL VARIANT (Full with Globe Icon and Bilingual Labels)
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-lg border border-slate-300 bg-white shadow-xs text-xs ${className}`}
      role="group"
      aria-label="Language Mode Selector"
    >
      <div className="flex items-center gap-1 px-1.5 text-slate-500 font-medium text-[11px]">
        <Globe className="h-3.5 w-3.5 text-blue-600" />
        <span className="hidden md:inline font-bold text-slate-700">Language:</span>
      </div>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
          language === "en"
            ? "bg-[#002B49] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        English
      </button>

      <button
        type="button"
        onClick={() => setLanguage("hi")}
        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
          language === "hi"
            ? "bg-[#FF671F] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        हिन्दी
      </button>

      <button
        type="button"
        onClick={() => setLanguage("mix")}
        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
          language === "mix"
            ? "bg-emerald-700 text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        Mix (द्विभाषी)
      </button>
    </div>
  );
}
