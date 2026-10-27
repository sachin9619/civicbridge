"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageMode = "en" | "hi" | "mix";

interface LanguageContextType {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  t: (text: string, enOverride?: string, hiOverride?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "mix",
  setLanguage: () => {},
  t: (text: string) => text,
});

const DICTIONARY: Record<string, { en: string; hi: string; mix: string }> = {
  // Navigation
  Dashboard: { en: "Dashboard", hi: "डैशबोर्ड", mix: "Dashboard | डैशबोर्ड" },
  "Lodge Grievance": { en: "Lodge Grievance", hi: "शिकायत दर्ज करें", mix: "Lodge Grievance | शिकायत दर्ज करें" },
  "My Grievances": { en: "My Grievances", hi: "मेरी शिकायतें", mix: "My Grievances | मेरी शिकायतें" },
  "Ward Scorecard": { en: "Ward Scorecard", hi: "स्वच्छता रैंकिंग", mix: "Ward Scorecard | स्वच्छता रैंकिंग" },
  "Citizen Profile": { en: "Citizen Profile", hi: "नागरिक प्रोफ़ाइल", mix: "Citizen Profile | नागरिक प्रोफ़ाइल" },
  Overview: { en: "Command Center", hi: "कमान केंद्र", mix: "Overview | कमान केंद्र" },
  "All Grievances": { en: "All Grievances", hi: "सभी शिकायतें", mix: "All Grievances | सभी शिकायतें" },
  "Work Allocation": { en: "Work Allocation", hi: "कार्य आवंटन", mix: "Work Allocation | कार्य आवंटन" },
  "Grievance Map": { en: "GIS Map", hi: "मानचित्र", mix: "Grievance Map | मानचित्र" },
  Departments: { en: "Departments", hi: "विभाग", mix: "Departments | विभाग" },
  "Staff Roster": { en: "Staff Roster", hi: "कर्मचारी सूची", mix: "Staff Roster | कर्मचारी" },
  Analytics: { en: "Analytics", hi: "विश्लेषण", mix: "Analytics | विश्लेषण" },
  "Audit Trail": { en: "Audit Trail", hi: "ऑडिट लॉग", mix: "Audit Trail | ऑडिट लॉग" },
  "Assigned Tasks": { en: "Assigned Tasks", hi: "आवंटित कार्य", mix: "Assigned Tasks | आवंटित कार्य" },
  "Completed Proofs": { en: "Completed Proofs", hi: "पूर्ण कार्य साक्ष्य", mix: "Completed Proofs | पूर्ण कार्य" },
  "Officer Profile": { en: "Officer Profile", hi: "अधिकारी प्रोफ़ाइल", mix: "Officer Profile | प्रोफ़ाइल" },

  // Auth & Actions
  "Sign In": { en: "Sign In", hi: "लॉग इन करें", mix: "Sign In | लॉग इन" },
  "Sign Out": { en: "Sign Out", hi: "लॉग आउट", mix: "Sign Out | लॉग आउट" },
  Register: { en: "Register", hi: "पंजीकरण करें", mix: "Register | पंजीकरण" },
  Submit: { en: "Submit", hi: "जमा करें", mix: "Submit | जमा करें" },
  Cancel: { en: "Cancel", hi: "रद्द करें", mix: "Cancel | रद्द करें" },
  Back: { en: "Back", hi: "वापस जाएं", mix: "Back | वापस जाएं" },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageMode>("mix");

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("civicbridge_lang") as LanguageMode | null;
      if (saved && (saved === "en" || saved === "hi" || saved === "mix")) {
        setLanguageState(saved);
        document.documentElement.setAttribute("data-language", saved);
        document.documentElement.lang = saved === "hi" ? "hi" : "en";
      } else {
        document.documentElement.setAttribute("data-language", "mix");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = (newLang: LanguageMode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem("civicbridge_lang", newLang);
      document.documentElement.setAttribute("data-language", newLang);
      document.documentElement.lang = newLang === "hi" ? "hi" : "en";
    } catch {
      // Ignore
    }
  };

  const t = (text: string, enOverride?: string, hiOverride?: string): string => {
    if (!text) return "";

    if (language === "mix") {
      return text;
    }

    if (language === "en" && enOverride) return enOverride;
    if (language === "hi" && hiOverride) return hiOverride;

    // Check pre-defined dictionary
    if (DICTIONARY[text]) {
      return DICTIONARY[text][language];
    }

    // Auto-detect bilingual pattern: "Hindi | English"
    if (text.includes(" | ")) {
      const parts = text.split(" | ");
      if (parts.length === 2) {
        // usually first is Hindi, second is English
        return language === "hi" ? parts[0].trim() : parts[1].trim();
      }
    }

    // Auto-detect bilingual pattern: "Hindi / English"
    if (text.includes(" / ")) {
      const parts = text.split(" / ");
      if (parts.length === 2) {
        return language === "hi" ? parts[0].trim() : parts[1].trim();
      }
    }

    // Auto-detect bilingual pattern: "Hindi • English"
    if (text.includes(" • ")) {
      const parts = text.split(" • ");
      if (parts.length === 2) {
        return language === "hi" ? parts[0].trim() : parts[1].trim();
      }
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
