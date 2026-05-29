import { IconName } from '../types'

interface Props {
  name: IconName | string
  size?: number
  sw?: number
  style?: React.CSSProperties
}

export function VIcon({ name, size = 22, sw = 1.7, style = {} }: Props) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="2" {...p}/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" {...p}/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" {...p}/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" {...p}/></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5Z" {...p}/><path d="M10 19a2 2 0 0 0 4 0" {...p}/></>,
    euro: <><circle cx="12" cy="12" r="9" {...p}/><path d="M15.5 8.6A4.2 4.2 0 0 0 8.5 12a4.2 4.2 0 0 0 7 3.4M6.7 10.8h6M6.7 13.2h5" {...p}/></>,
    doc: <><path d="M6 3h7l5 5v13H6Z" {...p}/><path d="M13 3v5h5" {...p}/><path d="M9 13h6M9 16.5h6" {...p}/></>,
    plus: <path d="M12 5v14M5 12h14" {...p}/>,
    chevron: <path d="M9 5l7 7-7 7" {...p}/>,
    back: <path d="M15 5l-7 7 7 7" {...p}/>,
    search: <><circle cx="11" cy="11" r="7" {...p}/><path d="M16.5 16.5 21 21" {...p}/></>,
    wrench: <path d="M14.5 6.5a3.8 3.8 0 0 1-5 4.8L4.8 16a2 2 0 1 0 2.8 2.8l4.7-4.7a3.8 3.8 0 0 0 5-4.8l-2.6 2.6-2.3-.6-.6-2.3Z" {...p}/>,
    gauge: <><path d="M4 16a8 8 0 1 1 16 0" {...p}/><path d="M12 16l4-4" {...p}/><circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none"/></>,
    fuel: <><rect x="4" y="4" width="9" height="17" rx="2" {...p}/><path d="M4 11h9" {...p}/><path d="M13 8h3.5a2 2 0 0 1 2 2v6a1.6 1.6 0 0 0 3.2 0V9l-2.5-2.5" {...p}/></>,
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...p}/>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" {...p}/><path d="M3.5 9.5h17M8 3v4M16 3v4" {...p}/></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...p}/>,
    alert: <><path d="M12 3.5 21.5 20H2.5L12 3.5Z" {...p}/><path d="M12 10v4.5" {...p}/><circle cx="12" cy="17.6" r="1.1" fill="currentColor" stroke="none"/></>,
    clock: <><circle cx="12" cy="12" r="8.5" {...p}/><path d="M12 7.5V12l3 2" {...p}/></>,
    drop: <path d="M12 3.5c3 4 6 6.8 6 10.2A6 6 0 0 1 6 13.7C6 10.3 9 7.5 12 3.5Z" {...p}/>,
    tire: <><circle cx="12" cy="12" r="9" {...p}/><circle cx="12" cy="12" r="3.4" {...p}/><path d="M12 3v3.6M12 17.4V21M3 12h3.6M17.4 12H21" {...p}/></>,
    shield: <><path d="M12 3 5 6v5.5c0 4.3 3 7.6 7 9.5 4-1.9 7-5.2 7-9.5V6l-7-3Z" {...p}/><path d="M9 12l2 2 4-4" {...p}/></>,
    route: <><circle cx="6" cy="18" r="2.4" {...p}/><circle cx="18" cy="6" r="2.4" {...p}/><path d="M8.4 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.6" {...p}/></>,
    dots: <><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></>,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" {...p}/>,
    arrowDown: <path d="M12 5v14M6 13l6 6 6-6" {...p}/>,
    pin: <><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" {...p}/><circle cx="12" cy="10" r="2.5" {...p}/></>,
    settings: <><circle cx="12" cy="12" r="3" {...p}/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1M18.6 18.6l-2.1-2.1M7.5 7.5 5.4 5.4" {...p}/></>,
    filter: <path d="M4 6h16M7 12h10M10 18h4" {...p}/>,
    x: <path d="M6 6l12 12M18 6 6 18" {...p}/>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" {...p}/><circle cx="12" cy="13" r="4" {...p}/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...p}/><polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth={sw} fill="none"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth={sw}/></>,
    scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" {...p}/><path d="M3 12h18" stroke="currentColor" strokeWidth={sw} fill="none" strokeLinecap="round"/></>,
    close: <path d="M18 6L6 18M6 6l12 12" {...p}/>,
    car: <><path d="M5 17H3a2 2 0 0 1-2-2v-4a9 9 0 0 1 18 0v4a2 2 0 0 1-2 2h-2" {...p}/><rect x="7" y="14" width="10" height="6" rx="2" {...p}/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" {...p}/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" {...p}/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, ...style }}>
      {paths[name] ?? null}
    </svg>
  )
}
