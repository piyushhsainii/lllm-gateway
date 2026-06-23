interface PinSvgProps {
  gradientId: string
}

export default function PinSvg({ gradientId }: PinSvgProps) {
  return (
    <svg
      className="pin-svg"
      width="28"
      height="44"
      viewBox="0 0 28 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="14" cy="13" r="11" fill={`url(#${gradientId})`} />
      <circle cx="10" cy="9" r="3.5" fill="rgba(255,255,255,0.28)" />
      <line
        x1="14" y1="22" x2="14" y2="44"
        stroke="#7a3010"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e8693a" />
          <stop offset="100%" stopColor="#a03010" />
        </radialGradient>
      </defs>
    </svg>
  )
}
