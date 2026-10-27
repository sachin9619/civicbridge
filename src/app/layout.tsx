import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicBridge — One City. One Platform. Accountable Action.",
  description: "Bridge the gap between citizens and government. Report civic issues, track progress, and hold your city accountable.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CivicBridge" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" data-language="mix">
      <head>
        <meta name="theme-color" content="#1e40af" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){for(var r of regs){r.unregister();}});if('caches' in window){caches.keys().then(function(names){for(var n of names){caches.delete(n);}});}}` }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <AuthProvider>
          <LanguageProvider>
            {children}
            {/* Global Language Switcher Button on every page */}
            <LanguageSwitcher variant="floating" />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
