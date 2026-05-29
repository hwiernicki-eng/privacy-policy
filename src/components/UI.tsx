import { VehicleStatus, IconName } from '../types'
import { VIcon } from './VIcon'

const STATUS_MAP = {
  late: { label: 'En retard', cls: 'late' },
  soon: { label: 'Entretien proche', cls: 'soon' },
  ok:   { label: 'À jour', cls: 'ok' },
}

export function VStatusPill({ status, small = false }: { status: VehicleStatus; small?: boolean }) {
  const s = STATUS_MAP[status]
  return (
    <span className={`vpill vpill--${s.cls}` + (small ? ' vpill--sm' : '')}>
      <span className="vpill__dot" />
      {s.label}
    </span>
  )
}

export function VCatTile({ cat, size = 56, radius = 16 }: { cat: string; size?: number; radius?: number }) {
  return (
    <div className="vtile" style={{ width: size, height: size, borderRadius: radius }}>
      <span className="vtile__code">{cat}</span>
    </div>
  )
}

export function VChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button className={'vchip' + (active ? ' vchip--on' : '')} onClick={onClick}>{label}</button>
  )
}

export function VStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="vstat">
      <div className={'vstat__v' + (accent ? ' vstat__v--accent' : '')}>{value}</div>
      <div className="vstat__l">{label}</div>
    </div>
  )
}

export function VSeg({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="vseg">
      {tabs.map(t => (
        <button key={t.id} className={'vseg__btn' + (active === t.id ? ' vseg__btn--on' : '')} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function VGauge({ value, label, unit, icon, ev }: { value: number; label: string; unit: string; icon: IconName; ev?: boolean }) {
  return (
    <div className="vgauge">
      <div className="vgauge__top">
        <span className="vgauge__lbl"><VIcon name={icon} size={15} /> {label}</span>
        <span className="vgauge__val">{value}{unit}</span>
      </div>
      <div className="vgauge__track">
        <div className={'vgauge__fill' + (ev ? ' vgauge__fill--ev' : '')} style={{ width: value + '%' }} />
      </div>
    </div>
  )
}

export function VSheet({ open, onClose, title, children, tall }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; tall?: boolean }) {
  if (!open) return null
  return (
    <div className="vsheet-wrap" onClick={onClose}>
      <div className={'vsheet' + (tall ? ' vsheet--tall' : '')} onClick={e => e.stopPropagation()}>
        <div className="vsheet__grip" />
        {title && <div className="vsheet__title">{title}</div>}
        {children}
      </div>
    </div>
  )
}

export function VTopbar({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="vtop">
      <div>
        {subtitle && <div className="vtop__sub">{subtitle}</div>}
        <h1 className="vtop__title">{title}</h1>
      </div>
      <div className="vtop__right">{right}</div>
    </div>
  )
}
