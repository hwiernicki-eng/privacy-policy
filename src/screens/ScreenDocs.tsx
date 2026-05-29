import { useState } from 'react'
import { Vehicle, Document } from '../types'
import { VIcon } from '../components/VIcon'
import { VChip, VTopbar } from '../components/UI'

interface Props {
  fleet: Vehicle[]
  docs: Record<string, Document[]>
  onOpen: (id: string) => void
}

const TAG_ORDER = ['euro', 'shield', 'doc', 'wrench']

export function ScreenDocs({ fleet, docs, onOpen }: Props) {
  const [filter, setFilter] = useState('all')
  const vById = (id: string) => fleet.find(v => v.id === id)

  const feed: Document[] = []
  Object.entries(docs).forEach(([vid, ds]) => ds.forEach(d => feed.push({ ...d, vehicleId: vid })))
  feed.sort((a, b) => TAG_ORDER.indexOf(a.tag) - TAG_ORDER.indexOf(b.tag))

  const filtered = filter === 'all' ? feed
    : filter === 'factures' ? feed.filter(d => d.tag === 'euro')
    : filter === 'assurances' ? feed.filter(d => d.tag === 'shield')
    : feed.filter(d => d.tag === 'doc')

  return (
    <div className="scroll">
      <VTopbar title="Documents" subtitle="Flotte Atlas" right={<button className="viconbtn"><VIcon name="search" size={20} /></button>} />

      <div className="vchips">
        <VChip label="Tous" active={filter === 'all'} onClick={() => setFilter('all')} />
        <VChip label="Cartes grises" active={filter === 'cartes'} onClick={() => setFilter('cartes')} />
        <VChip label="Assurances" active={filter === 'assurances'} onClick={() => setFilter('assurances')} />
        <VChip label="Factures" active={filter === 'factures'} onClick={() => setFilter('factures')} />
      </div>

      <div className="vsec-label">Récents</div>
      {filtered.length === 0 && <div className="vempty">Aucun document trouvé.</div>}
      <div className="vcard-plain">
        {filtered.map((d) => {
          const v = vById(d.vehicleId)
          return (
            <button className="vdocrow" key={d.id} onClick={() => v && onOpen(v.id)}>
              <div className="vdocrow__ic"><VIcon name={d.tag} size={18} /></div>
              <div className="vdocrow__txt">
                <div className="vdocrow__name">{d.name}</div>
                <div className="vdocrow__meta">{v ? `${v.brand} ${v.model}` : ''} · {d.meta}</div>
              </div>
              <VIcon name="chevron" size={16} style={{ color: 'var(--ink-3)' }} />
            </button>
          )
        })}
      </div>
      <div className="scroll__pad" />
    </div>
  )
}
