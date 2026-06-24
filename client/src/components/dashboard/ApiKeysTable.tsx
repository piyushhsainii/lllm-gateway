"use client";

import { useState } from "react";
import { useApiKeys } from "./ApiKeysProvider";
import { RevokeConfirmModal } from "./RevokeConfirmModal";
import type { ApiKey } from "./ApiKeysProvider";

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function StatusBadge({ status }: { status: ApiKey["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#f0fdf4] text-[#16a34a] border border-[rgba(22,163,74,0.2)] text-[9.5px] px-2 py-0.5 rounded-md font-mono font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#f4f3f0] text-[#9c9890] border border-[#e4e2dd] text-[9.5px] px-2 py-0.5 rounded-md font-mono font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[#ccc9c2] inline-block" />
      Revoked
    </span>
  );
}

function RevokeButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        border border-[#e4e2dd] text-[#6b6860] rounded-md px-3 py-1.5 text-xs font-light
        hover:border-red-200 hover:text-red-600 hover:bg-red-50
        transition-all duration-150
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#e4e2dd] disabled:hover:text-[#6b6860] disabled:hover:bg-transparent
      "
    >
      Revoke
    </button>
  );
}

export function ApiKeysTable() {
  const { state } = useApiKeys();
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  return (
    <>
      <div className="bg-white border border-[#e4e2dd] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f4f3f0] border-b border-[#e4e2dd]">
              {["Name", "Key", "Created", "Last used", "Status", "Actions"].map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-3 font-mono text-[10.5px] font-medium text-[#9c9890] uppercase tracking-[0.12em] whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.keys.map((key, i) => (
              <tr
                key={key.id}
                className={`
                  border-b border-[#e4e2dd] last:border-0
                  hover:bg-[#fafaf9] transition-colors duration-100
                  ${key.status === "revoked" ? "opacity-60" : ""}
                `}
              >
                {/* Name */}
                <td className="px-4 py-3.5">
                  <span
                    className="text-sm font-medium text-[#1c1b18]"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {key.name}
                  </span>
                </td>

                {/* Masked key */}
                <td className="px-4 py-3.5">
                  <span className="font-mono text-sm text-[#6b6860]">
                    {key.maskedKey}
                  </span>
                </td>

                {/* Created */}
                <td className="px-4 py-3.5">
                  <span className="text-sm text-[#6b6860] font-light">
                    {relativeDate(key.createdAt)}
                  </span>
                </td>

                {/* Last used */}
                <td className="px-4 py-3.5">
                  <span className="text-sm text-[#9c9890] font-light">
                    {key.lastUsed ? relativeDate(key.lastUsed) : "Never"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <StatusBadge status={key.status} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <RevokeButton
                    onClick={() => setRevokeTarget(key)}
                    disabled={key.status === "revoked"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revoke confirm modal */}
      {revokeTarget && (
        <RevokeConfirmModal
          apiKey={revokeTarget}
          onClose={() => setRevokeTarget(null)}
        />
      )}
    </>
  );
}
