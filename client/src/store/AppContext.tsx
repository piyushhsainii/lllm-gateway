import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { User, ApiKey, RequestRecord, ProviderHealth } from '../lib/types'
import { MOCK_USER, MOCK_KEYS, MOCK_REQUESTS, MOCK_PROVIDER_HEALTH } from '../lib/mockData'

interface AppState {
  user: User
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  keys: ApiKey[]
  monthlySpend: number
  monthlyBudget: number
  requestCount: number
  requests: RequestRecord[]
  providerHealth: Record<'openai' | 'anthropic' | 'google', ProviderHealth>
  sidebarCollapsed: boolean
  setKeys: (keys: ApiKey[]) => void
  revokeKey: (id: string) => void
  createKey: (name: string, budget: number, rpm: number, models: string[]) => ApiKey
  setSidebarCollapsed: (v: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const revokeKey = useCallback((id: string) => {
    setKeys(ks => ks.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k))
  }, [])

  const createKey = useCallback((name: string, budget: number, rpm: number, models: string[]): ApiKey => {
    const suffix = Math.random().toString(36).slice(2, 20)
    const newKey: ApiKey = {
      id: `key_${Date.now()}`, name, key: `gw_live_${suffix}`,
      monthlyBudgetUsd: budget, requestsPerMinute: rpm, allowedModels: models,
      createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(),
      status: 'active', totalSpendUsd: 0, totalRequests: 0,
    }
    setKeys(ks => [...ks, newKey])
    return newKey
  }, [])

  return (
    <AppContext.Provider value={{
      user: MOCK_USER, plan: MOCK_USER.plan, keys, monthlySpend: 47.23,
      monthlyBudget: 200, requestCount: 8420, requests: MOCK_REQUESTS,
      providerHealth: MOCK_PROVIDER_HEALTH, sidebarCollapsed,
      setKeys, revokeKey, createKey, setSidebarCollapsed,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
