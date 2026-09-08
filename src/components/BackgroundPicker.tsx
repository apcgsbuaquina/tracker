"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Image as ImageIcon, RotateCcw, Upload, X } from "lucide-react";

const STORAGE_KEY = "compound_background";

const PRESETS = [
  {
    id: "paper",
    label: "Warm paper",
    value: "linear-gradient(135deg, #f6f1e8 0%, #e9e0d2 52%, #d9d0c4 100%)",
  },
  {
    id: "sage",
    label: "Soft sage",
    value: "linear-gradient(135deg, #e8eee8 0%, #c9d8ce 50%, #aebfb7 100%)",
  },
  {
    id: "dusk",
    label: "Dusk blue",
    value: "linear-gradient(135deg, #dce5ee 0%, #b8c8da 48%, #899db4 100%)",
  },
  {
    id: "clay",
    label: "Clay",
    value: "linear-gradient(135deg, #f1e3dc 0%, #dfc0b3 50%, #bd958b 100%)",
  },
];

function setBackground(value: string | null) {
  const root = document.documentElement;
  if (value) {
    root.style.setProperty("--app-background-image", value);
    localStorage.setItem(STORAGE_KEY, value);
  } else {
    root.style.removeProperty("--app-background-image");
    localStorage.removeItem(STORAGE_KEY);
  }
}

export default function BackgroundPicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelected(stored);
      document.documentElement.style.setProperty("--app-background-image", stored);
    }
  }, []);

  function choose(value: string) {
    setSelected(value);
    setBackground(value);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") choose(`url("${reader.result}")`);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function reset() {
    setSelected(null);
    setBackground(null);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`p-2 rounded-lg transition-colors cursor-pointer ${
          open
            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
        }`}
        title="Change background"
        aria-label="Change background"
        aria-expanded={open}
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in zoom-in-95 duration-150">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Background</h2>
              <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">Choose a preset or upload an image.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              aria-label="Close background picker"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = selected === preset.value;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => choose(preset.value)}
                  className={`relative h-16 overflow-hidden rounded-xl border text-left transition-transform hover:scale-[1.02] cursor-pointer ${
                    isSelected ? "border-zinc-900 ring-2 ring-zinc-900/15 dark:border-zinc-100 dark:ring-zinc-100/15" : "border-zinc-200 dark:border-zinc-700"
                  }`}
                  style={{ backgroundImage: preset.value }}
                  title={preset.label}
                >
                  <span className="absolute inset-x-2 bottom-1.5 text-[10px] font-semibold text-zinc-800 drop-shadow-sm">
                    {preset.label}
                  </span>
                  {isSelected && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-zinc-900" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload image
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
              title="Reset background"
              aria-label="Reset background"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
