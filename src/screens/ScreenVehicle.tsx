import { useState } from 'react'
import { Vehicle, MaintenanceEntry, Document } from '../types'
import { VCOSTS, fmtKm, fmtEur } from '../data'
import { VIcon } from '../components/VIcon'
import { VStatusPill, VCatTile, VSeg, VGauge, VTopbar } from '../components/UI'

interface Props {
  vehicle: Vehicle
  history: MaintenanceEntry[]
  docs: Document[]
  onBack: () => void
  onAddMaintenance: () => void
}

export function ScreenVehicle({ vehicle: v, history, docs, onBack, onAddMaintenance }: Props) {
  const [tab, setTab] = useState('hist')
  const cls = v.status

  return (
    <div className="scroll">
      <div className="vdetail-head">
        <button className="viconbtn viconbtn--solid" onClick={onBack}><VIcon name="back" size={20} /></button>
        <div className="vdetail-head__title">
          <div className="vdetail-head__name">{v.brand} {v.model}</div>
          <div className="vplate vplate--sm">{v.plate}</div>
        </div>
        <button className="viconbtn viconbtn--solid" onClick={onAddMaintenance}><VIcon name="plus" size={20} /></button>
      </div>

      <div className="vd-hero">
        <div className="vd-hero__top">
          <VCatTile cat={v.cat} size={72} radius={20} />
          <div className="vd-hero__meta">
            <VStatusPill status={v.status} />
            <div className="vd-hero__sub">{v.catLabel} · {v.year} · {v.driver}</div>
          </div>
        </div>
        <div className="vd-hero__stats">
          <div className="vd-stat"><div className="vd-stat__v mono">{v.km.toLocaleString('fr-FR')}</div><div className="vd-stat__l">km au compteur</div></div>
          <div className="vd-stat__sep" />
          <div className="vd-stat"><div className="vd-stat__v mono">{v.kmMonth > 0 ? '+' + v.kmMonth.toLocaleString('fr-FR') : '—'}</div><div className="vd-stat__l">km ce mois</div></div>
          <div className="vd-stat__sep" />
          <div className="vd-stat"><div className="vd-stat__v">{v.energy}</div><div className="vd-stat__l">énergie</div></div>
        </div>
        <VGauge value={v.gauge.value} label={v.gauge.label} unit={v.gauge.unit} icon={v.energyIcon} ev={v.energy === 'Électrique'} />
      </div>

      <div className={`vd-next vd-next--${cls}`}>
        <div className={`vd-next__ic vd-next__ic--${cls}`}><VIcon name={v.next.icon} size={20} /></div>
        <div className="vd-next__txt">
          <div className="vd-next__lbl">Prochain entretien</div>
          <div className="vd-next__type">{v.next.type}</div>
          <div className="vd-next__detail">{v.next.detail}</div>
        </div>
        <button className="vd-next__btn" onClick={onAddMaintenance}>Planifier</button>
      </div>

      <div className="vd-tabs">
        <VSeg
          tabs={[{ id: 'hist', label: 'Entretiens' }, { id: 'cost', label: 'Coûts' }, { id: 'doc', label: 'Documents' }]}
          active={tab} onChange={setTab}
        />
      </div>

      {tab === 'hist' && <DetailHistory history={history} onAdd={onAddMaintenance} />}
      {tab === 'cost' && <DetailCosts id={v.id} />}
      {tab === 'doc' && <DetailDocs docs={docs} />}
      <div className="scroll__pad" />
    </div>
  )
}

function DetailHistory({ history, onAdd }: { history: MaintenanceEntry[]; onAdd: () => void }) {
  if (history.length === 0) {
    return (
      <div className="vd-sec">
        <div className="vempty">
          Aucun entretien enregistré.<br />
          <button onClick={onAdd} style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 8, display: 'block', margin: '8px auto 0' }}>
            + Ajouter le premier entretien
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="vd-sec">
      <div className="vtl">
        {history.map((it, i) => (
          <div className="vtl__item" key={it.id}>
            <div className="vtl__rail">
              <div className="vtl__dot"><VIcon name={it.tag} size={14} /></div>
              {i < history.length - 1 && <div className="vtl__line" />}
            </div>
            <div className="vtl__body">
              <div className="vtl__row">
                <span className="vtl__type">{it.type}</span>
                <span className="vtl__cost mono">{it.cost === 0 ? 'Inclus' : fmtEur(it.cost)}</span>
              </div>
              <div className="vtl__meta">{it.date} · <span className="mono">{fmtKm(it.km)}</span></div>
              <div className="vtl__garage"><VIcon name="pin" size={13} /> {it.garage}</div>
              {it.notes && <div className="vtl__garage" style={{ marginTop: 2 }}><VIcon name="doc" size={13} /> {it.notes}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailCosts({ id }: { id: string }) {
  const c = VCOSTS[id]
  if (!c) return <div className="vd-sec vempty">Données de coûts non disponibles.</div>
  const max = Math.max(...Object.values(c.cats))
  const colors: Record<string, string> = { Entretien: 'var(--accent)', Carburant: 'var(--c-soon)', Assurance: 'var(--ink-2)' }
  return (
    <div className="vd-sec">
      <div className="vd-costtotal">
        <span className="vd-costtotal__l">Coût total · 12 mois</span>
        <span className="vd-costtotal__v mono">{fmtEur(c.total)}</span>
      </div>
      <div className="vcatlist">
        {Object.entries(c.cats).map(([k, val]) => (
          <div className="vcatrow" key={k}>
            <div className="vcatrow__top"><span>{k}</span><span className="mono">{fmtEur(val)}</span></div>
            <div className="vcatrow__track"><div className="vcatrow__fill" style={{ width: (val / max * 100) + '%', background: colors[k] ?? 'var(--accent)' }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailDocs({ docs }: { docs: Document[] }) {
  if (!docs || docs.length === 0) {
    return <div className="vd-sec vempty">Aucun document pour ce véhicule.<br />Ajoutez une carte grise ou une facture.</div>
  }
  return (
    <div className="vd-sec">
      <div className="vdoclist">
        {docs.map(d => (
          <div className="vdocrow" key={d.id}>
            <div className="vdocrow__ic"><VIcon name={d.tag} size={18} /></div>
            <div className="vdocrow__txt">
              <div className="vdocrow__name">{d.name}</div>
              <div className="vdocrow__meta">{d.meta}</div>
            </div>
            <VIcon name="chevron" size={16} style={{ color: 'var(--ink-3)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
