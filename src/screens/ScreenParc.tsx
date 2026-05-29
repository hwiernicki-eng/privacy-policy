import { useState } from 'react'
import { Vehicle } from '../types'
import { FLEET_SUMMARY, fmtKm, fmtEur } from '../data'
import { VIcon } from '../components/VIcon'
import { VStatusPill, VCatTile, VChip, VStat, VTopbar } from '../components/UI'

interface Props {
  fleet: Vehicle[]
  onOpen: (id: string) => void
  onTab: (t: string) => void
}

export function ScreenParc({ fleet, onOpen, onTab }: Props) {
  const [filter, setFilter] = useState('all')
  const filters = [
    { id: 'all', label: 'Tous' },
    { id: 'VL', label: 'Voitures' },
    { id: 'VU', label: 'Utilitaires' },
    { id: 'EV', label: 'Électriques' },
    { id: 'MOTO', label: 'Motos' },
    { id: 'PL', label: 'Poids lourds' },
  ]
  const list = fleet.filter(v => filter === 'all' || v.cat === filter)
  const late = fleet.filter(v => v.status === 'late').length
  const soon = fleet.filter(v => v.status === 'soon').length
  const total = late + soon

  return (
    <div className="scroll">
      <VTopbar
        subtitle="Flotte Atlas"
        title="Parc"
        right={<>
          <button className="viconbtn"><VIcon name="search" size={20} /></button>
          <div className="vavatar">AT</div>
        </>}
      />

      <div className="vhero">
        <div className="vhero__row">
          <div>
            <div className="vhero__label">Entretiens à traiter</div>
            <div className="vhero__big">{total}</div>
          </div>
          <button className="vhero__cta" onClick={() => onTab('alertes')}>
            Voir les alertes <VIcon name="chevron" size={15} sw={2.2} />
          </button>
        </div>
        <div className="vhero__chips">
          <span className="vhero__chip vhero__chip--late"><span className="vpill__dot" />{late} en retard</span>
          <span className="vhero__chip vhero__chip--soon"><span className="vpill__dot" />{soon} à venir</span>
        </div>
      </div>

      <div className="vstats3">
        <VStat value={`${FLEET_SUMMARY.active}/${FLEET_SUMMARY.total}`} label="Véhicules actifs" />
        <VStat value={fmtEur(FLEET_SUMMARY.monthSpend)} label="Dépenses · mois" accent />
        <VStat value={FLEET_SUMMARY.monthKm.toLocaleString('fr-FR')} label="Km ce mois" />
      </div>

      <div className="vchips">
        {filters.map(f => (
          <VChip key={f.id} label={f.label} active={filter === f.id} onClick={() => setFilter(f.id)} />
        ))}
      </div>

      <div className="vlist">
        {list.map(v => <VehicleCard key={v.id} v={v} onOpen={onOpen} />)}
        {list.length === 0 && <div className="vempty">Aucun véhicule dans cette catégorie.</div>}
      </div>
      <div className="scroll__pad" />
    </div>
  )
}

function VehicleCard({ v, onOpen }: { v: Vehicle; onOpen: (id: string) => void }) {
  const STATUS_MAP = { late: 'late', soon: 'soon', ok: 'ok' }
  const cls = STATUS_MAP[v.status]
  return (
    <button className="vcard" onClick={() => onOpen(v.id)}>
      <div className="vcard__head">
        <VCatTile cat={v.cat} />
        <div className="vcard__id">
          <div className="vcard__name">{v.brand} {v.model}</div>
          <div className="vcard__meta">
            <span className="vplate">{v.plate}</span>
            <span className="vcard__dot">·</span>
            <span>{v.driver}</span>
          </div>
        </div>
        <div className="vcard__status">
          <VStatusPill status={v.status} small />
          {v.alerts > 0 && <span className="vcard__alerts"><VIcon name="bell" size={12} sw={2} /> {v.alerts}</span>}
        </div>
      </div>
      <div className="vcard__foot">
        <div className="vcard__km">
          <VIcon name="gauge" size={16} />
          <span className="mono">{fmtKm(v.km)}</span>
        </div>
        <div className={`vcard__next vcard__next--${cls}`}>
          <VIcon name={v.next.icon} size={15} />
          <span className="vcard__nexttype">{v.next.type}</span>
          <span className="vcard__nextdetail">{v.next.detail}</span>
        </div>
        <VIcon name="chevron" size={16} style={{ color: 'var(--ink-3)' }} />
      </div>
    </button>
  )
}
