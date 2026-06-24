"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  maskedKey: string;
  fullKey: string;
  createdAt: string;
  lastUsed: string | null;
  status: "active" | "revoked";
};

type State = {
  keys: ApiKey[];
  newlyCreatedKey: string | null;
};

type Action =
  | { type: "CREATE_KEY"; payload: ApiKey }
  | { type: "CLEAR_FULL_KEY"; payload: { id: string } }
  | { type: "REVOKE_KEY"; payload: { id: string } }
  | { type: "SET_NEWLY_CREATED"; payload: string | null };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CREATE_KEY":
      return {
        ...state,
        keys: [action.payload, ...state.keys],
        newlyCreatedKey: action.payload.fullKey,
      };

    case "CLEAR_FULL_KEY":
      return {
        ...state,
        keys: state.keys.map((k) =>
          k.id === action.payload.id ? { ...k, fullKey: "" } : k
        ),
        newlyCreatedKey: null,
      };

    case "REVOKE_KEY":
      return {
        ...state,
        keys: state.keys.map((k) =>
          k.id === action.payload.id ? { ...k, status: "revoked" } : k
        ),
      };

    case "SET_NEWLY_CREATED":
      return { ...state, newlyCreatedKey: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type ContextValue = {
  state: State;
  createKey: (name: string) => ApiKey;
  clearFullKey: (id: string) => void;
  revokeKey: (id: string) => void;
};

const ApiKeysContext = createContext<ContextValue | null>(null);

export function useApiKeys() {
  const ctx = useContext(ApiKeysContext);
  if (!ctx) throw new Error("useApiKeys must be used within ApiKeysProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const INITIAL_STATE: State = {
  keys: [],
  newlyCreatedKey: null,
};

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const createKey = useCallback((name: string): ApiKey => {
    const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    const fullKey = "gw_live_" + raw;
    const prefix = "gw_live_";
    // Show first 8 chars of the random part + mask + last 4
    const last4 = raw.slice(-4);
    const maskedKey = `gw_live_••••••••••••${last4}`;

    const key: ApiKey = {
      id: crypto.randomUUID(),
      name,
      prefix,
      maskedKey,
      fullKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: "active",
    };

    dispatch({ type: "CREATE_KEY", payload: key });
    return key;
  }, []);

  const clearFullKey = useCallback((id: string) => {
    dispatch({ type: "CLEAR_FULL_KEY", payload: { id } });
  }, []);

  const revokeKey = useCallback((id: string) => {
    dispatch({ type: "REVOKE_KEY", payload: { id } });
  }, []);

  return (
    <ApiKeysContext.Provider value={{ state, createKey, clearFullKey, revokeKey }}>
      {children}
    </ApiKeysContext.Provider>
  );
}
