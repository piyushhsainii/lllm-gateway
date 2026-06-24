"use client";

import { useState, useEffect, useRef } from "react";
import { useApiKeys } from "./ApiKeysProvider";

type Props = {
  onClose: () => void;
  onKeyCreated: (keyId: string, fullKey: string, keyName: string) => void;
};

export function CreateKeyModal({ onClose, onKeyCreated }: Props) {
  const { createKey } = useApiKeys();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Key name is required.");
      inputRef.current?.focus();
      return;
    }
    const newKey = createKey(trimmed);
    onKeyCreated(newKey.id, newKey.fullKey, trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e4e2dd]">
          <div>
            <h2
              className="text-base font-semibold text-[#1c1b18]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Create API key
            </h2>
            <p className="text-xs text-[#9c9890] font-light mt-0.5">
              Name your key to identify it later.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9c9890] hover:text-[#1c1b18] transition-colors p-1 rounded-lg hover:bg-[#f4f3f0]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label className="block text-xs font-medium text-[#6b6860] mb-1.5">
              Key name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Production, Local dev, Testing"
              className="w-full border border-[#e4e2dd] rounded-lg px-3 py-2.5 text-sm font-light focus:outline-none focus:border-[#c94f1a] focus:ring-1 focus:ring-[#c94f1a] bg-white text-[#1c1b18] placeholder:text-[#9c9890] transition-colors"
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5 font-light">{error}</p>
            )}
            <p className="text-[11px] text-[#9c9890] font-light mt-1.5">
              This label is only visible to you — it won't appear in API requests.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#e4e2dd] text-[#6b6860] rounded-lg px-5 py-2.5 text-sm font-light hover:border-[#ccc9c2] hover:text-[#1c1b18] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#c94f1a] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={!name.trim()}
            >
              Generate key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
