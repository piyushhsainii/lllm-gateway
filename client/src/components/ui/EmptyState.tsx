// components/ui/EmptyState.tsx

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  snippet?: string
}

export function EmptyState({ title, description, action, snippet }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[#fdf1ec] flex items-center justify-center mb-4">
        <span className="text-[#c94f1a] text-xl">◇</span>
      </div>
      <h3 className="text-sm font-medium text-[#1c1b18] mb-2">{title}</h3>
      <p className="text-xs text-[#9c9890] font-light max-w-xs mb-4">{description}</p>

      {snippet && (
        <div className="bg-[#1c1b18] rounded-lg p-4 text-left mb-4 w-full max-w-sm">
          <pre className="font-mono text-[11px] text-[#9c9890] whitespace-pre-wrap">
            <span className="text-[#9c9890]">// Change your base URL</span>{'\n'}
            <span className="text-white">base_url</span>{' = '}<span className="text-[#c94f1a]">"https://api.llmgateway.io/v1"</span>
          </pre>
        </div>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="bg-[#c94f1a] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
