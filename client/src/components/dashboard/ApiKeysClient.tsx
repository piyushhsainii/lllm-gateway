"use client";

import { useState } from "react";
import { useApiKeys } from "./ApiKeysProvider";
import { ApiKeysTable } from "./ApiKeysTable";
import { CreateKeyModal } from "./CreateKeyModal";
import { RevealKeyModal } from "./RevealKeyModal";

function EmptyKeyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className="text-[#c94f1a]"
    >
      <circle cx="19" cy="24" r="10" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M27 20a5 5 0 100-8 5 5 0 000 8z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M27 24h12M35 21v6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type RevealState = { keyId: string; fullKey: string; keyName: string } | null;

export function ApiKeysClient() {
  const { state } = useApiKeys();
  const [showCreate, setShowCreate] = useState(false);
  const [revealState, setRevealState] = useState<RevealState>(null);

  const hasKeys = state.keys.length > 0;

  const handleKeyCreated = (keyId: string, fullKey: string) => {
    // Find key name from state
    const key = state.keys.find((k) => k.id === keyId);
    setShowCreate(false);
    setRevealState({ keyId, fullKey, keyName: key?.name ?? "" });
  };

  // After key is created, keyName will be in state — but creation is synchronous
  // so we need a version that gets called from CreateKeyModal which provides the name
  const handleKeyCreatedWithName = (keyId: string, fullKey: string, keyName: string) => {
    setShowCreate(false);
    setRevealState({ keyId, fullKey, keyName });
  };

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold text-[#1c1b18] mb-1"
            style={{ letterSpacing: "-0.04em" }}
          >
            API Keys
          </h1>
          <p className="text-sm text-[#9c9890] font-light">
            Manage keys that grant access to the gateway.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#c94f1a] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="7" y1="1" x2="7" y2="13" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="1" y1="7" x2="13" y2="7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Create API key
        </button>
      </div>

      {/* Info strip */}
      {hasKeys && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-[#fafaf9] border border-[#e4e2dd] rounded-xl">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#9c9890] flex-shrink-0">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
            <line x1="7" y1="6" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="7" cy="4.5" r="0.6" fill="currentColor" />
          </svg>
          <p className="text-xs text-[#9c9890] font-light">
            Keys are only shown once at creation. For security, we store only the masked version.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!hasKeys && (
        <div className="flex flex-col items-center justify-center py-24 empty-state-enter">
          <div className="w-16 h-16 bg-[#fdf1ec] rounded-2xl flex items-center justify-center mb-5">
            <EmptyKeyIcon />
          </div>
          <h2
            className="text-xl font-light text-[#1c1b18] mb-2"
            style={{ letterSpacing: "-0.04em" }}
          >
            No API keys yet
          </h2>
          <p className="text-sm text-[#6b6860] font-light text-center max-w-xs mb-6 leading-relaxed">
            Create your first key to start sending requests through the gateway.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#c94f1a] text-white rounded-lg px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="7" y1="1" x2="7" y2="13" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="1" y1="7" x2="13" y2="7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Create API key
          </button>
        </div>
      )}

      {/* Keys table */}
      {hasKeys && <ApiKeysTable />}

      {/* Modals */}
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onKeyCreated={handleKeyCreatedWithName}
        />
      )}

      {revealState && (
        <RevealKeyModal
          keyId={revealState.keyId}
          fullKey={revealState.fullKey}
          keyName={revealState.keyName}
          onClose={() => setRevealState(null)}
        />
      )}
    </>
  );
}
