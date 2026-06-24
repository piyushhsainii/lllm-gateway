"use client";

import { useEffect } from "react";
import { useApiKeys } from "./ApiKeysProvider";
import type { ApiKey } from "./ApiKeysProvider";

type Props = {
  apiKey: ApiKey;
  onClose: () => void;
};

export function RevokeConfirmModal({ apiKey, onClose }: Props) {
  const { revokeKey } = useApiKeys();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleRevoke = () => {
    revokeKey(apiKey.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-sm modal-enter">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          {/* Icon */}
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16.5 15H1.5L9 2Z" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="9" y1="7" x2="9" y2="10.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="12.5" r="0.75" fill="#dc2626" />
            </svg>
          </div>
          <h2
            className="text-base font-semibold text-[#1c1b18] mb-1.5"
            style={{ letterSpacing: "-0.03em" }}
          >
            Revoke this key?
          </h2>
          <p className="text-sm text-[#6b6860] font-light leading-relaxed">
            Any requests using{" "}
            <span className="font-mono font-medium text-[#1c1b18]">
              {apiKey.name}
            </span>{" "}
            will immediately stop working. This action cannot be undone.
          </p>

          {/* Key preview */}
          <div className="mt-3 px-3 py-2 bg-[#f4f3f0] rounded-lg">
            <span className="font-mono text-xs text-[#6b6860]">
              {apiKey.maskedKey}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-[#e4e2dd] text-[#6b6860] rounded-lg px-5 py-2.5 text-sm font-light hover:border-[#ccc9c2] hover:text-[#1c1b18] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleRevoke}
            className="bg-red-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Revoke key
          </button>
        </div>
      </div>
    </div>
  );
}
