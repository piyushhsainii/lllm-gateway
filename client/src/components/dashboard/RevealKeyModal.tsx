"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiKeys } from "./ApiKeysProvider";

type Props = {
  keyId: string;
  fullKey: string;
  keyName: string;
  onClose: () => void;
};

export function RevealKeyModal({ keyId, fullKey, keyName, onClose }: Props) {
  const { clearFullKey } = useApiKeys();
  const [copied, setCopied] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Fallback: allow closing after 5 seconds even without copy
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullKey);
    } catch {
      // Fallback for non-HTTPS / older browsers
      const ta = document.createElement("textarea");
      ta.value = fullKey;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setCanClose(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullKey]);

  const handleDone = useCallback(() => {
    clearFullKey(keyId);
    onClose();
  }, [clearFullKey, keyId, onClose]);

  // Prevent accidental Escape close — user must click Done
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { e.key === "Escape" && e.preventDefault(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter">
      {/* Backdrop — not clickable to prevent accidental close */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg modal-enter">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#e4e2dd]">
          <div className="flex items-center gap-2.5 mb-1">
            {/* Shield icon */}
            <div className="w-7 h-7 bg-[#fdf1ec] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L12.5 3.5v4C12.5 10.5 9.5 13 7 13 4.5 13 1.5 10.5 1.5 7.5v-4L7 1Z" stroke="#c94f1a" strokeWidth="1.3" fill="none" />
              </svg>
            </div>
            <h2
              className="text-base font-semibold text-[#1c1b18]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Save your API key
            </h2>
          </div>
          <p className="text-xs text-[#9c9890] font-light">
            Key created: <span className="font-medium text-[#6b6860]">{keyName}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Warning banner */}
          <div className="flex items-start gap-3 bg-[#fffbeb] border border-amber-200 rounded-lg px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
              <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#d97706" strokeWidth="1.4" strokeLinejoin="round" />
              <line x1="8" y1="6" x2="8" y2="9.5" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.6" fill="#d97706" />
            </svg>
            <p className="text-xs text-amber-800 font-light leading-relaxed">
              <span className="font-medium">This key will only be shown once.</span> Copy it now — you won&apos;t be able to see it again.
            </p>
          </div>

          {/* Key display */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10.5px] font-medium text-[#c94f1a] uppercase tracking-[0.12em]">
                Your API key
              </span>
              {copied && (
                <span className="flex items-center gap-1 text-[11px] text-[#16a34a] font-mono font-medium">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 4.5,8.5 10,3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied!
                </span>
              )}
            </div>

            {/* Dark code box */}
            <div className="bg-[#1c1b18] rounded-xl overflow-hidden">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="px-4 py-4">
                <code
                  className="font-mono text-sm text-[#c94f1a] break-all block select-all"
                  style={{ letterSpacing: "0.03em", lineHeight: 1.6 }}
                >
                  {fullKey}
                </code>
              </div>
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 border border-[#e4e2dd] rounded-lg py-2.5 text-sm font-light text-[#6b6860] hover:border-[#ccc9c2] hover:text-[#1c1b18] hover:bg-[#fafaf9] transition-all"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <polyline points="2,7 5,10 12,3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[#16a34a]">Copied to clipboard</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="4" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 5H1.5A1.5 1.5 0 000 6.5v6A1.5 1.5 0 001.5 14h6A1.5 1.5 0 009 12.5V12" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                Copy key
              </>
            )}
          </button>

          {/* Store safely reminder */}
          <p className="text-[11px] text-[#9c9890] font-light text-center leading-relaxed">
            Store this key somewhere safe — a password manager or secrets vault. After closing this dialog, it cannot be recovered.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <span className="text-[11px] text-[#9c9890] font-mono">
            {!canClose && !copied && countdown > 0 && (
              <>Available in {countdown}s</>
            )}
          </span>
          <button
            onClick={handleDone}
            disabled={!canClose}
            className="bg-[#c94f1a] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
