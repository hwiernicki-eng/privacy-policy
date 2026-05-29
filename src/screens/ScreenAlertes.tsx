import { Vehicle, Alert } from '../types'
import { ALERTS } from '../data'
import { VIcon } from '../components/VIcon'
import { VTopbar } from '../components/UI'

const STATUS_CLS = { late: 'late', soon: 'soon', ok: 'ok' } as const

interface Props {
  fleet: Vehicle[]
  onOpen: (id: string) => void
}

export function ScreenAlertes({ fleet, onOpen }: Props) {
  const vById = (id: string) => fleet.find(v => v.id === id)

  return (
    <div className="scroll">
      <VTopbar title="Alertes" subtitle="Flotte Atlas" right={<button className="viconbtn"><VIcon name="filter" size={20} /></button>} />

      <div className="vgroup">
        <div className="vgroup__head">
          <span className="vgroup__dot vgroup__dot--late" /> En retard
          <span className="vgroup__n">{ALERTS.late.length}</span>
        </div>
        <div className="vlist vlist--tight">
          {ALERTS.late.map((a, i) => {
            const v = vById(a.vid)
            if (!v) return null
            return <AlertRow key={i} a={a} v={v} onOpen={onOpen} />
          })}
        </div>
      </div>

      <div className="vgroup">
        <div className="vgroup__head">
          <span className="vgroup__dot vgroup__dot--soon" /> À venir
          <span className="vgroup__n">{ALERTS.soon.length}</span>
        </div>
        <div className="vlist vlist--tight">
          {ALERTS.soon.map((a, i) => {
            const v = vById(a.vid)
            if (!v) return null
            return <AlertRow key={i} a={a} v={v} onOpen={onOpen} />
          })}
        </div>
      </div>
      <div className="scroll__pad" />
    </div>
  )
}

function AlertRow({ a, v, onOpen }: { a: Alert; v: Vehicle; onOpen: (id: string) => void }) {
  const cls = STATUS_CLS[v.status]
  return (
    <button className="valert" onClick={() => onOpen(a.vid)}>
      <div className={`valert__ic valert__ic--${cls}`}><VIcon name={a.icon} size={19} /></div>
      <div className="valert__txt">
        <div className="valert__type">{a.type}</div>
        <div className="valert__veh">{v.brand} {v.model} · <span className="vplate vplate--xs">{v.plate}</span></div>
        <div className="valert__meta">{a.meta}</div>
      </div>
      <span className="valert__action">Planifier</span>
    </button>
  )
}
