"use client";
import { useEffect, useState } from "react";
import { Camera, FolderOpen } from "lucide-react";
import { inApp, nativeBridge } from "@/lib/native";

/** Shown only inside the Android app: quick access to the scanner and the saved scans above the tool list. */
export default function AppHome() {
  const [app, setApp] = useState(false);
  useEffect(() => setApp(inApp()), []);
  if (!app) return null;
  return (
    <>
      {/* in the app, go straight to the tools instead of the marketing hero */}
      <style>{"#web-hero{display:none}"}</style>
      <section aria-label="Scanner" className="mx-auto mt-6 max-w-6xl px-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="card flex items-center gap-4 text-left transition active:translate-y-px" onClick={() => nativeBridge()?.scanToLibrary()}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-brand-500 text-white"><Camera size={24} aria-hidden /></span>
            <span><span className="block font-display text-xl font-bold">Scan a document</span><span className="block text-sm text-slate-600 dark:text-slate-300">Capture, crop, name and save as a PDF</span></span>
          </button>
          <button className="card flex items-center gap-4 text-left transition active:translate-y-px" onClick={() => nativeBridge()?.openScans()}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-yellow-200 text-ink"><FolderOpen size={24} aria-hidden /></span>
            <span><span className="block font-display text-xl font-bold">My scans</span><span className="block text-sm text-slate-600 dark:text-slate-300">Open, edit, share or delete saved scans</span></span>
          </button>
        </div>
      </section>
    </>
  );
}
