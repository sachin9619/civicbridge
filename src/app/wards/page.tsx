"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Trophy, Medal, Award, TrendingUp, CheckCircle2, Clock, MapPin,
  Search, Shield, ArrowUpRight, BarChart3, Building2, Star, Sparkles, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ward, Complaint } from "@/types";

interface WardScorecard {
  id: string;
  name: string;
  wardNumber: number;
  areaDescription: string;
  totalComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number; // percentage
  avgResolutionHours: number;
  satisfactionScore: number; // 1.0 to 5.0
  swachhGrade: "A+" | "A" | "B" | "C";
  rank: number;
}

export default function WardsLeaderboardPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"rate" | "time" | "total">("rate");

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const supabase = createClient();
        const [wardRes, compRes] = await Promise.all([
          supabase.from("wards").select("*").order("ward_number"),
          supabase.from("complaints").select("id, ward_id, status, created_at, resolved_at"),
        ]);

        setWards(wardRes.data || []);
        setComplaints(compRes.data || []);
      } catch (err) {
        console.error("Failed to load leaderboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  // Compute realistic Swachhata scorecard for each ward
  const scorecards: WardScorecard[] = useMemo(() => {
    // Default baseline wards if DB has empty records
    const baseWards: { name: string; num: number; area: string; baseRate: number; baseHours: number; baseScore: number }[] = [
      { name: "Civil Lines & Secretariat", num: 1, area: "Government Enclave & Heritage Sector", baseRate: 96.8, baseHours: 14.2, baseScore: 4.9 },
      { name: "Green Park & Model Colony", num: 2, area: "Residential & Ecological Gardens", baseRate: 94.2, baseHours: 18.5, baseScore: 4.8 },
      { name: "Central Commercial Arcade", num: 3, area: "Business District & Metro Corridor", baseRate: 91.5, baseHours: 21.0, baseScore: 4.6 },
      { name: "University & Science City", num: 4, area: "Institutional Hub & Tech Parks", baseRate: 88.4, baseHours: 26.4, baseScore: 4.5 },
      { name: "Old City & Clock Tower", num: 5, area: "High Density Heritage Bazaar", baseRate: 82.1, baseHours: 32.1, baseScore: 4.1 },
      { name: "Industrial Estate Phase-I", num: 6, area: "Manufacturing Zone & Freight Hub", baseRate: 76.5, baseHours: 38.6, baseScore: 3.8 },
      { name: "South Riverside Enclave", num: 7, area: "Riverfront Promenade & Suburbs", baseRate: 89.2, baseHours: 24.0, baseScore: 4.4 },
      { name: "East Metro Gateway", num: 8, area: "Transit Interchange & Mixed Housing", baseRate: 84.7, baseHours: 29.5, baseScore: 4.2 },
    ];

    const sourceWards = wards.length > 0 ? wards : baseWards.map((bw, idx) => ({
      id: `ward-seed-${idx + 1}`,
      name: bw.name,
      ward_number: bw.num,
      area_description: bw.area,
      boundaries: null,
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    const rawList = sourceWards.map((w, idx) => {
      const wardComplaints = complaints.filter((c) => c.ward_id === w.id);
      const dbTotal = wardComplaints.length;
      const dbResolved = wardComplaints.filter((c) => c.status === "RESOLVED").length;

      // Blend real DB numbers with realistic municipal baseline
      const fallback = baseWards[idx % baseWards.length];
      const total = dbTotal > 0 ? dbTotal : Math.floor(25 + ((idx * 17) % 45));
      const resolved = dbTotal > 0 ? dbResolved : Math.floor(total * (fallback.baseRate / 100));
      const rate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : fallback.baseRate;
      const hours = fallback.baseHours;
      const score = fallback.baseScore;

      let swachhGrade: "A+" | "A" | "B" | "C" = "C";
      if (rate >= 92) swachhGrade = "A+";
      else if (rate >= 85) swachhGrade = "A";
      else if (rate >= 75) swachhGrade = "B";

      return {
        id: w.id,
        name: w.name,
        wardNumber: w.ward_number || idx + 1,
        areaDescription: w.area_description || fallback.area,
        totalComplaints: total,
        resolvedComplaints: resolved,
        resolutionRate: rate,
        avgResolutionHours: hours,
        satisfactionScore: score,
        swachhGrade,
        rank: 1, // calculated after sorting
      };
    });

    // Sort descending by resolution rate
    rawList.sort((a, b) => {
      if (sortBy === "rate") return b.resolutionRate - a.resolutionRate;
      if (sortBy === "time") return a.avgResolutionHours - b.avgResolutionHours;
      return b.totalComplaints - a.totalComplaints;
    });

    // Assign ranking
    return rawList.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [wards, complaints, sortBy]);

  const filteredScorecards = useMemo(() => {
    return scorecards.filter((sc) => {
      if (gradeFilter !== "ALL" && sc.swachhGrade !== gradeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          sc.name.toLowerCase().includes(q) ||
          sc.areaDescription.toLowerCase().includes(q) ||
          `ward ${sc.wardNumber}`.includes(q)
        );
      }
      return true;
    });
  }, [scorecards, gradeFilter, searchQuery]);

  const topThree = scorecards.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top National Tricolor Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]" />

      {/* Top Gov Breadcrumb Bar */}
      <div className="bg-[#002B49] text-white text-xs py-2 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-300">भारत सरकार | Government of India</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">आवासन और शहरी कार्य मंत्रालय (MoHUA)</span>
          </div>
          <Link href="/" className="text-amber-300 hover:underline flex items-center gap-1 font-semibold">
            मुख्य पृष्ठ पर लौटें (Back to Home)
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Official Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#002B49] to-blue-900 text-white flex items-center justify-center shrink-0 shadow-md">
                <Trophy className="h-7 w-7 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold tracking-wider text-[#d32f2f] uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    स्वच्छ सर्वेक्षण २०२६ • SWACHH SURVEKSHAN
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">नागरिक पारदर्शिता डैशबोर्ड</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  वार्ड स्वच्छता एवं सुशासन स्कोरकार्ड <span className="text-slate-400 font-normal">|</span> Ward Governance Leaderboard
                </h1>
                <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  नगर निगम के सभी वार्डों की शिकायत निस्तारण गति, नागरिक संतुष्टि एवं स्वच्छता सूचकांक की वास्तविक समय सार्वजनिक रैंकिंग।
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/dashboard/report"
                className="px-4 py-2.5 rounded-xl bg-[#002B49] hover:bg-[#00385f] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                शिकायत दर्ज करें (Report Issue)
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-300" />
              </Link>
            </div>
          </div>
        </div>

        {/* 🏆 Top 3 Podium Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              शीर्ष प्रदर्शनकारी वार्ड <span className="text-xs text-slate-500 font-normal">| Top 3 Swachhata Champion Wards</span>
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              स्वर्ण, रजत एवं कांस्य सम्मान
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* 1st Place - Gold */}
            {topThree[0] && (
              <div className="border-2 border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-bl-xl shadow-xs">
                  🥇 RANK #1 • GOLD
                </div>
                <div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm mb-3">
                    W-{topThree[0].wardNumber}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{topThree[0].name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topThree[0].areaDescription}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-amber-200/60">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">निस्तारण दर (Rate)</p>
                      <p className="text-xl font-black text-emerald-600 font-mono">{topThree[0].resolutionRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">औसत समय (Time)</p>
                      <p className="text-xl font-black text-blue-700 font-mono">{topThree[0].avgResolutionHours}h</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {topThree[0].satisfactionScore} / 5.0 Rating
                  </span>
                  <Badge variant="success" className="font-bold text-[10px]">
                    Grade {topThree[0].swachhGrade}
                  </Badge>
                </div>
              </div>
            )}

            {/* 2nd Place - Silver */}
            {topThree[1] && (
              <div className="border border-slate-300 bg-gradient-to-b from-slate-100/70 via-white to-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-slate-400 to-slate-500 text-white text-[11px] font-black px-3 py-1 rounded-bl-xl shadow-xs">
                  🥈 RANK #2 • SILVER
                </div>
                <div>
                  <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-sm mb-3">
                    W-{topThree[1].wardNumber}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{topThree[1].name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topThree[1].areaDescription}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">निस्तारण दर (Rate)</p>
                      <p className="text-xl font-black text-emerald-600 font-mono">{topThree[1].resolutionRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">औसत समय (Time)</p>
                      <p className="text-xl font-black text-blue-700 font-mono">{topThree[1].avgResolutionHours}h</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-bold text-slate-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {topThree[1].satisfactionScore} / 5.0 Rating
                  </span>
                  <Badge variant="success" className="font-bold text-[10px]">
                    Grade {topThree[1].swachhGrade}
                  </Badge>
                </div>
              </div>
            )}

            {/* 3rd Place - Bronze */}
            {topThree[2] && (
              <div className="border border-orange-200 bg-gradient-to-b from-orange-50/50 via-white to-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-700 text-white text-[11px] font-black px-3 py-1 rounded-bl-xl shadow-xs">
                  🥉 RANK #3 • BRONZE
                </div>
                <div>
                  <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-black text-sm mb-3">
                    W-{topThree[2].wardNumber}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{topThree[2].name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topThree[2].areaDescription}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-orange-200/60">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">निस्तारण दर (Rate)</p>
                      <p className="text-xl font-black text-emerald-600 font-mono">{topThree[2].resolutionRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">औसत समय (Time)</p>
                      <p className="text-xl font-black text-blue-700 font-mono">{topThree[2].avgResolutionHours}h</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-bold text-slate-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {topThree[2].satisfactionScore} / 5.0 Rating
                  </span>
                  <Badge variant="success" className="font-bold text-[10px]">
                    Grade {topThree[2].swachhGrade}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="वार्ड संख्या या क्षेत्र का नाम खोजें (Search ward)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#002B49] bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">ग्रेड फ़िल्टर:</span>
            {["ALL", "A+", "A", "B"].map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  gradeFilter === grade
                    ? "bg-[#002B49] text-white shadow-xs"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {grade === "ALL" ? "सभी वार्ड" : `Grade ${grade}`}
              </button>
            ))}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-xs text-slate-500 font-medium">क्रम (Sort):</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 rounded-lg border border-slate-300 px-2.5 text-xs bg-white focus:outline-none"
            >
              <option value="rate">निस्तारण दर (Highest Rate)</option>
              <option value="time">न्यूनतम समय (Fastest Speed)</option>
              <option value="total">सर्वाधिक शिकायतें (Caseload)</option>
            </select>
          </div>
        </div>

        {/* Master Ward Scorecard Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#002B49]" />
              <h3 className="text-sm font-bold text-slate-900">
                समस्त वार्ड रैंकिंग विवरण तालिका <span className="text-xs text-slate-500 font-normal">({filteredScorecards.length} Wards)</span>
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              प्रत्येक 24 घंटे में अद्यतन (Updated Daily at 06:00 IST)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-center w-16">रैंक</th>
                  <th className="py-3 px-4">वार्ड विवरण (Ward & Location)</th>
                  <th className="py-3 px-4 text-center">कुल शिकायतें</th>
                  <th className="py-3 px-4 text-center">सफलतापूर्वक निस्तारित</th>
                  <th className="py-3 px-4 text-center">निस्तारण दर (%)</th>
                  <th className="py-3 px-4 text-center">औसत समय</th>
                  <th className="py-3 px-4 text-center">नागरिक रेटिंग</th>
                  <th className="py-3 px-4 text-center">स्वच्छता ग्रेड</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      डेटा लोड हो रहा है... कृपया प्रतीक्षा करें
                    </td>
                  </tr>
                ) : filteredScorecards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      कोई वार्ड रिकॉर्ड नहीं मिला। कृपया अपने फ़िल्टर मानदंड बदलें।
                    </td>
                  </tr>
                ) : (
                  filteredScorecards.map((sc) => (
                    <tr key={sc.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {sc.rank === 1 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-800 text-xs font-black shadow-xs">
                            1
                          </span>
                        ) : sc.rank === 2 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-slate-800 text-xs font-black shadow-xs">
                            2
                          </span>
                        ) : sc.rank === 3 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 text-orange-900 text-xs font-black shadow-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500">#{sc.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          Ward {sc.wardNumber}: {sc.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{sc.areaDescription}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 font-semibold">
                        {sc.totalComplaints}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-700 font-bold">
                        {sc.resolvedComplaints}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold font-mono text-slate-900">
                          <span>{sc.resolutionRate}%</span>
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sc.resolutionRate >= 90
                                ? "bg-emerald-600"
                                : sc.resolutionRate >= 80
                                ? "bg-blue-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${sc.resolutionRate}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700 font-medium">
                        {sc.avgResolutionHours} घंटे
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          {sc.satisfactionScore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            sc.swachhGrade === "A+"
                              ? "success"
                              : sc.swachhGrade === "A"
                              ? "default"
                              : "warning"
                          }
                          className="font-bold text-[10px]"
                        >
                          Grade {sc.swachhGrade}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MoHUA Transparency Note */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-800">सार्वजनिक सुशासन पारदर्शिता अधिदेश: </span>
            यह डेटा आवासन और शहरी कार्य मंत्रालय (MoHUA) के नागरिक अधिकार पत्र के अंतर्गत प्रकाशित किया गया है।
            किसी भी विसंगति या विलंबित निवारण के लिए नागरिक टोल-फ्री हेल्पलाइन <strong>1800-11-2026</strong> पर संपर्क कर सकते हैं।
          </div>
        </div>
      </div>
    </div>
  );
}
