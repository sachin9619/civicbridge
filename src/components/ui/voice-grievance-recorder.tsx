"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, Check, AlertCircle, RefreshCw, Languages, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ComplaintCategory } from "@/types";

interface VoiceGrievanceRecorderProps {
  onTranscriptProcessed: (result: {
    title: string;
    description: string;
    category?: ComplaintCategory;
  }) => void;
}

export function VoiceGrievanceRecorder({ onTranscriptProcessed }: VoiceGrievanceRecorderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [detectedCategory, setDetectedCategory] = useState<ComplaintCategory | null>(null);
  const [detectionReason, setDetectionReason] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const analyzeTranscript = (text: string) => {
    const lower = text.toLowerCase();

    // 1. Garbage / Waste
    if (
      lower.includes("kooda") ||
      lower.includes("kachra") ||
      lower.includes("garbage") ||
      lower.includes("waste") ||
      lower.includes("trash") ||
      lower.includes("safai") ||
      lower.includes("kuda") ||
      lower.includes("dustbin")
    ) {
      return {
        category: "GARBAGE_WASTE" as ComplaintCategory,
        reason: "Detected keywords: kooda / garbage / kachra (ठोस अपशिष्ट)",
      };
    }

    // 2. Potholes / Roads
    if (
      lower.includes("gaddha") ||
      lower.includes("gadha") ||
      lower.includes("pothole") ||
      lower.includes("road") ||
      lower.includes("sadak") ||
      lower.includes("footpath") ||
      lower.includes("divider")
    ) {
      return {
        category: "POTHOLE_ROADS" as ComplaintCategory,
        reason: "Detected keywords: sadak / road / pothole / gaddha (सड़क एवं गड्ढे)",
      };
    }

    // 3. Streetlights
    if (
      lower.includes("light") ||
      lower.includes("batti") ||
      lower.includes("streetlight") ||
      lower.includes("pole") ||
      lower.includes("andhera") ||
      lower.includes("bulb")
    ) {
      return {
        category: "STREETLIGHTS" as ComplaintCategory,
        reason: "Detected keywords: light / batti / andhera (मार्ग प्रकाश)",
      };
    }

    // 4. Drainage / Sewage
    if (
      lower.includes("naali") ||
      lower.includes("nali") ||
      lower.includes("gutter") ||
      lower.includes("drainage") ||
      lower.includes("sewage") ||
      lower.includes("sewer") ||
      lower.includes("overflow") ||
      lower.includes("ganda pani")
    ) {
      return {
        category: "DRAINAGE_SEWAGE" as ComplaintCategory,
        reason: "Detected keywords: naali / gutter / drainage (जल निकासी एवं सीवेज)",
      };
    }

    // 5. Water Supply
    if (
      lower.includes("paani") ||
      lower.includes("pani") ||
      lower.includes("water") ||
      lower.includes("pipeline") ||
      lower.includes("tanki") ||
      lower.includes("peene ka pani") ||
      lower.includes("leakage")
    ) {
      return {
        category: "WATER_SUPPLY" as ComplaintCategory,
        reason: "Detected keywords: paani / water / pipeline (जलापूर्ति)",
      };
    }

    // 6. Women Safety
    if (
      lower.includes("mahila") ||
      lower.includes("safety") ||
      lower.includes("suraksha") ||
      lower.includes("harassment") ||
      lower.includes("chhedchhad")
    ) {
      return {
        category: "WOMEN_SAFETY" as ComplaintCategory,
        reason: "Detected keywords: mahila / safety / suraksha (महिला सुरक्षा)",
      };
    }

    return { category: undefined, reason: null };
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalStr = "";
        let interimStr = "";

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalStr += item[0].transcript + " ";
          } else {
            interimStr += item[0].transcript;
          }
        }

        const fullText = (finalStr + " " + interimStr).trim();
        setTranscript(finalStr);
        setInterimTranscript(interimStr);

        const { category, reason } = analyzeTranscript(fullText);
        setDetectedCategory(category ?? null);
        setDetectionReason(reason);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup error:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleApplyVoiceData = () => {
    const fullText = (transcript + " " + interimTranscript).trim();
    if (!fullText) return;

    // Generate a punchy title from the first sentence or first 8-10 words
    const words = fullText.split(" ");
    let generatedTitle = words.slice(0, 8).join(" ");
    if (words.length > 8) generatedTitle += "...";

    // Format title capitalizing first letter
    generatedTitle = generatedTitle.charAt(0).toUpperCase() + generatedTitle.slice(1);

    onTranscriptProcessed({
      title: generatedTitle,
      description: fullText,
      category: detectedCategory ?? undefined,
    });

    stopListening();
    setIsOpen(false);
  };

  const handleReset = () => {
    stopListening();
    setTranscript("");
    setInterimTranscript("");
    setDetectedCategory(null);
    setDetectionReason(null);
  };

  return (
    <>
      {/* Trigger Button inside filing form */}
      <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-emerald-50/80 border border-amber-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#FF671F] to-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 animate-pulse">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                भाषिणी AI सुविधा
              </span>
              <span className="text-xs font-bold text-slate-800">बोलकर शिकायत दर्ज करें</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              अपनी समस्या बोलें (हिंदी या अंग्रेजी में) — AI स्वतः श्रेणी एवं विवरण भर देगा।
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => startListening(), 300);
          }}
          className="bg-[#002B49] hover:bg-[#00385f] text-white text-xs font-bold gap-1.5 shadow-xs shrink-0"
        >
          <Mic className="h-3.5 w-3.5 text-amber-300" />
          माइक्रोफोन शुरू करें | Voice Input
        </Button>
      </div>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative">
            {/* Top Tricolor Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF671F] via-slate-200 to-[#046A38]" />

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ध्वनि इनपुट सहायक <span className="text-xs text-slate-500 font-normal">| Voice Grievance Assistant</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">MoHUA Multilingual Speech-to-Grievance Engine</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="px-5 pt-4 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-blue-600" /> भाषा चुनें (Language):
              </span>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("hi-IN");
                    if (isListening) {
                      stopListening();
                      setTimeout(() => startListening(), 200);
                    }
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    language === "hi-IN" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🇮🇳 हिन्दी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("en-IN");
                    if (isListening) {
                      stopListening();
                      setTimeout(() => startListening(), 200);
                    }
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    language === "en-IN" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  English (India)
                </button>
              </div>
            </div>

            {/* Mic Center Stage */}
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isListening
                      ? "bg-red-600 text-white shadow-red-200"
                      : "bg-[#002B49] text-white hover:bg-[#00385f]"
                  }`}
                >
                  {isListening ? (
                    <Mic className="h-8 w-8 animate-pulse" />
                  ) : (
                    <MicOff className="h-8 w-8 text-slate-300" />
                  )}
                </button>
              </div>

              <p className="text-xs font-bold text-slate-800">
                {isListening ? "हम सुन रहे हैं... कृपया बोलें" : "बोलने के लिए माइक्रोफोन बटन दबाएं"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isListening ? "Listening live... Tap mic to pause" : "Tap the mic button to resume speaking"}
              </p>

              {/* Transcript Display Box */}
              <div className="w-full mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left min-h-[90px] max-h-[140px] overflow-y-auto">
                {transcript || interimTranscript ? (
                  <p className="text-xs text-slate-800 leading-relaxed">
                    <span>{transcript}</span>
                    <span className="text-slate-400 italic">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    उदाहरण: &ldquo;वार्ड 4 मेन रोड पर गड्ढा है और पानी भरा हुआ है...&rdquo;
                  </p>
                )}
              </div>

              {/* AI Detection Insight */}
              {detectedCategory && (
                <div className="w-full mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-left flex items-start gap-2 animate-in fade-in">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-emerald-800">
                    <span className="font-bold">AI श्रेणी पहचानी गई (Detected): </span>
                    <Badge variant="success" className="text-[10px] uppercase font-bold ml-1">
                      {detectedCategory.replace(/_/g, " ")}
                    </Badge>
                    {detectionReason && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">{detectionReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs gap-1 text-slate-600"
              >
                <RefreshCw className="h-3 w-3" /> साफ़ करें (Clear)
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopListening();
                    setIsOpen(false);
                  }}
                  className="text-xs"
                >
                  रद्द करें
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyVoiceData}
                  disabled={!transcript.trim() && !interimTranscript.trim()}
                  className="bg-[#046A38] hover:bg-[#03532c] text-white text-xs font-bold gap-1.5 shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" /> प्रपत्र में भरें (Apply to Form)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
