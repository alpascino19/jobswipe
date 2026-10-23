type P = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconX = ({ size = 28 }: P) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconCheck = ({ size = 30 }: P) => (
  <svg {...base(size)}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </svg>
)

export const IconStar = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
  </svg>
)

export const IconUndo = ({ size = 20 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 010 12h-3" />
  </svg>
)

export const IconPin = ({ size = 15 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
)

export const IconHouse = ({ size = 15 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="M4 11l8-7 8 7v9H4z" />
    <path d="M10 20v-5h4v5" />
  </svg>
)

export const IconSliders = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
)
