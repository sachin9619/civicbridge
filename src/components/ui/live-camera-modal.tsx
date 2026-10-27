"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, SwitchCamera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function LiveCameraModal({ isOpen, onClose, onCapture }: LiveCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isStarting, setIsStarting] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startStream = async (mode: "environment" | "user") => {
    stopStream();
    setIsStarting(true);
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setError(err.message || "Unable to access camera device.");
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startStream(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `live_capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.9
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 text-white z-10">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">Live Camera</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-400 flex flex-col items-center gap-2 max-w-xs">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-xs">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startStream(facingMode)}
                className="mt-2 text-white border-slate-600 hover:bg-slate-800"
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-medium">
                  Initializing camera...
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-950 flex items-center justify-around gap-4 border-t border-slate-800">
          <button
            type="button"
            onClick={toggleCamera}
            disabled={!!error || isStarting}
            className="p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Switch Camera"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>

          {/* Capture Trigger */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={!!error || isStarting}
            className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
          >
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <Camera className="h-6 w-6" />
            </div>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
