import { useState } from 'react'
import { Vehicle } from '../types'
import { COSTS_DATA, VCOSTS, fmtEur } from '../data'
import { VIcon } from '../components/VIcon'
import { VCatTile, VSeg, VTopbar } from '../components/UI'

interface Props {
  fleet: Vehicle[]
  onOpen: (id: string) => void
}

export function ScreenCouts({ fleet, onOpen }: Props) {
  const [period, setPeriod] = useState('mois')
  const maxBar = Math.max(...COSTS_DATA.months.map(m => m.v))
  const delta = COSTS_DATA.total - COSTS_DATA.prevTotal
  const maxCat = Math.max(...COSTS_DATA.cats.map(c => c.value))
  const topVeh = fleet
    .filter(v => VCOSTS[v.id])
    .map(v => ({ v, c: VCOSTS[v.id].total }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 4)
  const maxVeh = topVeh[0]?.c ?? 1

  return (
    <div className="scroll">
      <VTopbar title="Coûts" subtitle="Flotte Atlas" right={<button className="viconbtn"><VIcon name="arrowDown" size={20} /></button>} />

      <div className="vd-tabs">
        <VSeg
          tabs={[{ id: 'mois', label: 'Mois' }, { id: 'trim', label: 'Trimestre' }, { id: 'an', label: 'Année' }]}
          active={period} onChange={setPeriod}
        />
      </div>

      <div className="vtotal">
        <div className="vtotal__l">Dépenses · {COSTS_DATA.period}</div>
        <div className="vtotal__v mono">{fmtEur(COSTS_DATA.total)}</div>
        <div className={'vtotal__delta ' + (delta > 0 ? 'up' : 'down')}>
          <VIcon name={delta > 0 ? 'arrowUp' : 'arrowDown'} size={14} sw={2.2} />
          {fmtEur(Math.abs(delta))} vs mois préc.
        </div>
        <div className="vbars">
          {COSTS_DATA.months.map((m, i) => (
            <div className="vbars__col" key={i}>
              <div className="vbars__track">
                <div className={'vbars__fill' + (i === COSTS_DATA.months.length - 1 ? ' vbars__fill--on' : '')}
                  style={{ height: (m.v / maxBar * 100) + '%' }} />
              </div>
              <div className="vbars__lbl">{m.m}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="vsec-label">Par catégorie</div>
      <div className="vcard-plain">
        {COSTS_DATA.cats.map((c, i) => (
          <div className="vcatrow vcatrow--ic" key={i}>
            <div className="vcatrow__icon"><VIcon name={c.icon} size={17} /></div>
            <div className="vcatrow__main">
              <div className="vcatrow__top"><span>{c.name}</span><span className="mono">{fmtEur(c.value)}</span></div>
              <div className="vcatrow__track"><div className="vcatrow__fill" style={{ width: (c.value / maxCat * 100) + '%' }} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="vsec-label">Véhicules les plus coûteux</div>
      <div className="vcard-plain">
        {topVeh.map(({ v, c }) => (
          <button className="vtopveh" key={v.id} onClick={() => onOpen(v.id)}>
            <VCatTile cat={v.cat} size={40} radius={11} />
            <div className="vtopveh__txt">
              <div className="vtopveh__name">{v.brand} {v.model}</div>
              <div className="vtopveh__bar"><div className="vtopveh__fill" style={{ width: (c / maxVeh * 100) + '%' }} /></div>
            </div>
            <span className="vtopveh__v mono">{fmtEur(c)}</span>
          </button>
        ))}
      </div>
      <div className="scroll__pad" />
    </div>
  )
}
