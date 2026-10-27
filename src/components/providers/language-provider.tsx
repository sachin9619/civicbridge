"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

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

// Comprehensive English -> Hindi Dictionary
const EN_TO_HI: Record<string, string> = {
  // Navigation & Core Sections
  Dashboard: "डैशबोर्ड",
  "Lodge Grievance": "शिकायत दर्ज करें",
  "My Complaints": "मेरी शिकायतें",
  "My Grievances": "मेरी शिकायतें",
  "Ward Scorecard": "वार्ड स्वच्छता रैंकिंग",
  "Citizen Profile": "नागरिक प्रोफ़ाइल",
  Overview: "कमान केंद्र",
  "Command Center": "कमान एवं नियंत्रण केंद्र",
  "All Grievances": "सभी शिकायतें",
  "All Complaints": "सभी शिकायतें",
  "Work Allocation": "कार्य आवंटन",
  "Grievance Map": "भू-स्थानिक मानचित्र",
  "GIS Map": "मानचित्र",
  Departments: "नगर निगम विभाग",
  "Staff Roster": "कर्मचारी सूची",
  Analytics: "विश्लेषण एवं सांख्यिकी",
  "Audit Trail": "ऑडिट लॉग",
  "Assigned Tasks": "आवंटित कार्य",
  "Completed Proofs": "पूर्ण कार्य साक्ष्य",
  "Officer Profile": "अधिकारी प्रोफ़ाइल",
  "File a Grievance": "शिकायत दर्ज करें",

  // Actions & Buttons
  "Sign In": "लॉग इन करें",
  "Sign Out": "लॉग आउट",
  Register: "पंजीकरण करें",
  Submit: "जमा करें",
  Cancel: "रद्द करें",
  Back: "वापस",
  "Go Back": "वापस जाएं",
  Search: "खोजें",
  Refresh: "ताज़ा करें",
  Assign: "आवंटित करें",
  Reassign: "पुनः आवंटित करें",
  Approve: "स्वीकार करें",
  Reject: "अस्वीकार करें",
  Confirm: "पुष्टि करें",
  Dispute: "आपत्ति दर्ज करें",
  Reopen: "पुनः खोलें",
  Apply: "लागू करें",
  Dismiss: "खारिज करें",
  Close: "बंद करें",
  "View My Complaints": "मेरी शिकायतें देखें",
  "Report Another Issue": "एक और शिकायत दर्ज करें",
  "Inspect Ticket": "टिकट देखें",
  "Scan for Duplicates": "डुप्लिकेट शिकायत जांच",
  "Run Auto-Escalate": "स्वतः एस्केलेशन चलाएं",

  // Priorities & Statuses
  URGENT: "अति आवश्यक",
  HIGH: "उच्च",
  MEDIUM: "मध्यम",
  LOW: "कम",
  SUBMITTED: "प्रस्तुत",
  UNDER_REVIEW: "समीक्षाधीन",
  ASSIGNED: "आवंटित",
  IN_PROGRESS: "प्रगति पर",
  PENDING_VERIFICATION: "सत्यापन लंबित",
  RESOLVED: "निस्तारित",
  ESCALATED: "एस्केलेटेड",
  REOPENED: "पुनः खोला गया",
  REJECTED: "अस्वीकृत",

  // Categories
  "Garbage & Waste": "कचरा एवं स्वच्छता",
  "Potholes & Roads": "सड़क एवं गड्ढे",
  Streetlights: "स्ट्रीट लाइट",
  "Drainage & Sewage": "नाली एवं सीवेज",
  "Water Supply": "पेयजल आपूर्ति",
  "Women's Safety": "महिला सुरक्षा",
  "Public Infrastructure": "सार्वजनिक बुनियादी ढांचा",
  "Other Issues": "अन्य नागरिक समस्याएं",
  "All Categories": "सभी श्रेणियां",

  // Key Headers & Government Phrases
  "Government of India": "भारत सरकार",
  "Ministry of Housing & Urban Affairs": "आवासन और शहरी कार्य मंत्रालय",
  "National Civic Grievance & Urban Governance Platform": "राष्ट्रीय नागरिक शिकायत एवं शहरी शासन मंच",
  "National Civic Redressal Portal": "राष्ट्रीय नागरिक समाधान पोर्टल",
  "One City. One Platform. Accountable Action.": "एक शहर। एक मंच। जवाबदेह कार्रवाई।",
  "Issue Details": "समस्या का विवरण",
  "Issue Category": "समस्या की श्रेणी",
  "Photos & Live Camera": "तस्वीरें एवं लाइव कैमरा",
  "Location & Address": "स्थान एवं पता",
  "Status Timeline": "स्थिति समय रेखा",
  "Resolution Evidence": "समाधान साक्ष्य",
  "Recent Complaints": "हालिया शिकायतें",
  "By Category": "श्रेणीवार",
  "Total Complaints": "कुल शिकायतें",
  "Awaiting Review": "समीक्षाधीन",
  "Assigned / Active": "आवंटित / सक्रिय",
  "Resolved / Closed": "सत्यापित एवं निस्तारित",
};

// Comprehensive Hindi -> English Dictionary
const HI_TO_EN: Record<string, string> = {
  "भारत सरकार": "Government of India",
  "कमान एवं नियंत्रण केंद्र": "Command & Control Center",
  "कमान केंद्र": "Command Center",
  "नागरिक शिकायत पंजीकरण प्रपत्र": "Grievance Registration Form",
  "शहरी परिचालन मानचित्र": "City Operational GIS Map",
  "स्मार्ट नागरिक हीटमैप एवं घटना मानचित्र": "Smart Civic Heatmap & Incident Map",
  "राष्ट्रीय भू-स्थानिक पोर्टल": "National Geospatial Portal",
  "नागरिक अधिकार पत्र": "Citizen Charter",
  "शिकायत सफलतापूर्वक दर्ज की गई": "Grievance Registered Successfully",
  "सत्यापित एवं निस्तारित": "Resolved & Verified",
  "समीक्षाधीन": "Awaiting Review",
  "आवंटित / प्रगति पर": "Assigned / Active",
  "सत्यापन लंबित": "Pending Verification",
  "कुल शिकायतें": "Total Complaints",
  "श्रेणीवार वितरण": "Category Distribution",
  "हालिया पंजीकृत शिकायतें": "Recent Complaints",
  "मेरी शिकायतें": "My Grievances",
  "शिकायत दर्ज करें": "Lodge Grievance",
  "डैशबोर्ड": "Dashboard",
  "लॉग इन": "Sign In",
  "लॉग इन करें": "Sign In",
  "लॉग आउट": "Sign Out",
  "ताज़ा करें": "Refresh",
  "वापस जाएं": "Go Back",
  "गोपनीय": "Confidential / Sensitive",
  "सभी शिकायतें": "All Complaints",
  "कार्य आवंटन": "Work Allocation",
  "मानचित्र": "GIS Map",
  "विभाग": "Departments",
  "कर्मचारी": "Staff Roster",
  "कर्मचारी सूची": "Staff Roster",
  "विश्लेषण": "Analytics",
  "ऑडिट लॉग": "Audit Trail",
  "स्वच्छता रैंकिंग": "Ward Scorecard",
  "स्वच्छ रैंकिंग": "Ward Scores",
  "अति आवश्यक": "URGENT",
  "उच्च": "HIGH",
  "मध्यम": "MEDIUM",
  "कम": "LOW",
  "प्रस्तुत": "SUBMITTED",
  "आवंटित": "ASSIGNED",
  "प्रगति पर": "IN PROGRESS",
  "निस्तारित": "RESOLVED",
  "पुनः खोला गया": "REOPENED",
  "अस्वीकृत": "REJECTED",
  "कचरा एवं स्वच्छता": "Garbage & Waste",
  "सड़क एवं गड्ढे": "Potholes & Roads",
  "स्ट्रीट लाइट": "Streetlights",
  "नाली एवं सीवेज": "Drainage & Sewage",
  "पेयजल आपूर्ति": "Water Supply",
  "महिला सुरक्षा": "Women's Safety",
  "सार्वजनिक बुनियादी ढांचा": "Public Infrastructure",
  "अन्य नागरिक समस्याएं": "Other Issues",
  "सभी श्रेणियां": "All Categories",
};

// WeakMap preserving initial text of every DOM text node
const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();

function transformString(originalText: string, mode: LanguageMode): string {
  if (mode === "mix" || !originalText || !originalText.trim()) return originalText;

  const trimmed = originalText.trim();
  const hasDev = /[\u0900-\u097F]/.test(trimmed);
  const hasLat = /[a-zA-Z]/.test(trimmed);

  // 1. Bilingual with separator " | "
  if (trimmed.includes(" | ")) {
    const parts = trimmed.split(/\s*\|\s*/);
    if (parts.length >= 2) {
      if (mode === "hi") {
        const hiPart = parts.find((p) => /[\u0900-\u097F]/.test(p));
        if (hiPart) return originalText.replace(trimmed, hiPart);
      } else if (mode === "en") {
        const enPart = parts.find((p) => /[a-zA-Z]/.test(p));
        if (enPart) return originalText.replace(trimmed, enPart);
      }
    }
  }

  // 2. Bilingual with separator " / "
  if (trimmed.includes(" / ")) {
    const parts = trimmed.split(/\s*\/\s*/);
    if (parts.length >= 2) {
      if (mode === "hi") {
        const hiPart = parts.find((p) => /[\u0900-\u097F]/.test(p));
        if (hiPart) return originalText.replace(trimmed, hiPart);
      } else if (mode === "en") {
        const enPart = parts.find((p) => /[a-zA-Z]/.test(p));
        if (enPart) return originalText.replace(trimmed, enPart);
      }
    }
  }

  // 3. Bilingual with separator " • "
  if (trimmed.includes(" • ")) {
    const parts = trimmed.split(/\s*•\s*/);
    if (parts.length >= 2) {
      if (mode === "hi") {
        const hiPart = parts.find((p) => /[\u0900-\u097F]/.test(p));
        if (hiPart) return originalText.replace(trimmed, hiPart);
      } else if (mode === "en") {
        const enPart = parts.find((p) => /[a-zA-Z]/.test(p));
        if (enPart) return originalText.replace(trimmed, enPart);
      }
    }
  }

  // 4. Bilingual with parentheses: e.g. "शिकायत दर्ज करें (Lodge)" or "Ward Scorecard (स्वच्छ रैंकिंग)"
  const parenMatch = trimmed.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const outside = parenMatch[1].trim();
    const inside = parenMatch[2].trim();
    const outHasDev = /[\u0900-\u097F]/.test(outside);
    const inHasDev = /[\u0900-\u097F]/.test(inside);
    const outHasLat = /[a-zA-Z]/.test(outside);
    const inHasLat = /[a-zA-Z]/.test(inside);

    if (mode === "hi") {
      if (outHasDev) return originalText.replace(trimmed, outside);
      if (inHasDev) return originalText.replace(trimmed, inside);
    } else if (mode === "en") {
      if (outHasLat) return originalText.replace(trimmed, outside);
      if (inHasLat) return originalText.replace(trimmed, inside);
    }
  }

  // 5. Dictionary exact match
  if (mode === "hi" && EN_TO_HI[trimmed]) {
    return originalText.replace(trimmed, EN_TO_HI[trimmed]);
  }
  if (mode === "en" && HI_TO_EN[trimmed]) {
    return originalText.replace(trimmed, HI_TO_EN[trimmed]);
  }

  // 6. Case-insensitive dictionary match
  const lower = trimmed.toLowerCase();
  if (mode === "hi") {
    const found = Object.keys(EN_TO_HI).find((k) => k.toLowerCase() === lower);
    if (found) return originalText.replace(trimmed, EN_TO_HI[found]);
  } else if (mode === "en") {
    const found = Object.keys(HI_TO_EN).find((k) => k.toLowerCase() === lower);
    if (found) return originalText.replace(trimmed, HI_TO_EN[found]);
  }

  return originalText;
}

function applyLanguageToPage(mode: LanguageMode) {
  if (typeof document === "undefined") return;

  // 1. Walk through all visible text nodes in the page
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (["script", "style", "textarea", "input", "noscript", "svg", "code", "pre"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip elements marked not to translate (such as language switcher itself)
        if (parent.closest("[data-no-translate='true']")) {
          return NodeFilter.FILTER_REJECT;
        }
        const text = node.nodeValue || "";
        if (!text.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  textNodes.forEach((node) => {
    let original = originalTextMap.get(node);
    if (original === undefined) {
      original = node.nodeValue || "";
      originalTextMap.set(node, original);
    }

    if (mode === "mix") {
      if (node.nodeValue !== original) {
        node.nodeValue = original;
      }
    } else {
      const transformed = transformString(original, mode);
      if (node.nodeValue !== transformed) {
        node.nodeValue = transformed;
      }
    }
  });

  // 2. Also transform input placeholders
  const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
  inputs.forEach((el) => {
    if (el.closest("[data-no-translate='true']")) return;
    let orig = originalPlaceholderMap.get(el);
    if (orig === undefined) {
      orig = el.getAttribute("placeholder") || "";
      originalPlaceholderMap.set(el, orig);
    }

    if (mode === "mix") {
      el.setAttribute("placeholder", orig);
    } else {
      const transformed = transformString(orig, mode);
      el.setAttribute("placeholder", transformed);
    }
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageMode>("mix");
  const isUpdatingRef = useRef(false);

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

  // Whenever language changes or page changes, apply transformation to entire DOM
  useEffect(() => {
    applyLanguageToPage(language);

    // Watch for dynamic DOM additions (e.g. Next.js navigation, modals, lists)
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingRef.current) return;
      let hasNewContent = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length > 0) {
          hasNewContent = true;
          break;
        }
      }
      if (hasNewContent) {
        isUpdatingRef.current = true;
        setTimeout(() => {
          applyLanguageToPage(language);
          isUpdatingRef.current = false;
        }, 50);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

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
    if (language === "mix") return text;
    if (language === "en" && enOverride) return enOverride;
    if (language === "hi" && hiOverride) return hiOverride;
    return transformString(text, language);
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
