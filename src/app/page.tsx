import Link from "next/link";
import {
  Building2, ArrowRight, Shield, MapPin, Clock, CheckCircle2,
  Trash2, Construction, Lightbulb, Waves, Droplets, CircleDot, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { icon: Trash2, label: "Garbage & Waste", color: "text-green-600 bg-green-50", desc: "Overflowing bins, illegal dumping" },
  { icon: Construction, label: "Potholes & Roads", color: "text-amber-600 bg-amber-50", desc: "Road damage, broken footpaths" },
  { icon: Lightbulb, label: "Streetlights", color: "text-yellow-600 bg-yellow-50", desc: "Non-functional street lights" },
  { icon: Waves, label: "Drainage & Sewage", color: "text-blue-600 bg-blue-50", desc: "Blocked drains, waterlogging" },
  { icon: Droplets, label: "Water Supply", color: "text-cyan-600 bg-cyan-50", desc: "Water shortage, pipe leaks" },
  { icon: Shield, label: "Women's Safety", color: "text-pink-600 bg-pink-50", desc: "Handled with strict confidentiality" },
  { icon: Building2, label: "Public Infrastructure", color: "text-slate-600 bg-slate-100", desc: "Parks, bus stops, bridges" },
  { icon: CircleDot, label: "Other Issues", color: "text-gray-600 bg-gray-50", desc: "Any other civic concern" },
];

const steps = [
  { num: "1", title: "Report an Issue", desc: "Describe the problem, add a photo and location." },
  { num: "2", title: "Auto-Routed", desc: "Your complaint is assigned to the right department automatically." },
  { num: "3", title: "Track Progress", desc: "Follow real-time status updates from submission to resolution." },
  { num: "4", title: "Verified Resolution", desc: "Completed work is verified before the case is closed." },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">CivicBridge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 to-white">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <Shield className="h-3 w-3" /> Trusted Civic Platform
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-4 max-w-3xl mx-auto leading-[1.1]">
            One City. One Platform.{" "}
            <span className="text-blue-600">Accountable Action.</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Report civic issues with a photo and location. Track progress from submission to verified resolution. Hold your city accountable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button variant="primary" size="xl">
                Report an Issue <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="xl">Track my Complaints</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-600 max-w-md mx-auto">A simple, transparent process from report to resolution</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="relative p-6 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-4">{step.num}</div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Issue Categories</h2>
            <p className="text-slate-600 max-w-md mx-auto">Report any civic issue — we&apos;ll route it to the right department</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat.label} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                <div className={`rounded-lg p-2.5 ${cat.color}`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{cat.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Verified Resolutions</h3>
              <p className="text-sm text-slate-500">Every resolution is reviewed and verified before being marked complete.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Location-Aware</h3>
              <p className="text-sm text-slate-500">Complaints are routed to the correct ward and department based on location.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Real-Time Tracking</h3>
              <p className="text-sm text-slate-500">Follow every step from submission through assignment to final resolution.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to make your city better?</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8">Join CivicBridge and start reporting civic issues in your neighborhood today.</p>
          <Link href="/register">
            <Button size="xl" className="bg-blue-600 text-white hover:bg-blue-700">
              Get Started Free <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900">CivicBridge</span>
            </div>
            <p className="text-xs text-slate-400">
              This is a demonstration platform. For real emergencies, contact your local emergency services.
            </p>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} CivicBridge</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
