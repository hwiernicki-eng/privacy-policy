import { useState, useEffect, useCallback } from 'react'
import { AppState, Vehicle, MaintenanceEntry } from './types'
import { loadState, saveState, ALERTS } from './data'
import { IOSDevice } from './components/IOSDevice'
import { VIcon } from './components/VIcon'
import { VSheet } from './components/UI'
import { AddMaintenanceForm } from './components/AddMaintenanceForm'
import { AddVehicleForm } from './components/AddVehicleForm'
import { ScreenParc } from './screens/ScreenParc'
import { ScreenVehicle } from './screens/ScreenVehicle'
import { ScreenAlertes } from './screens/ScreenAlertes'
import { ScreenCouts } from './screens/ScreenCouts'
import { ScreenDocs } from './screens/ScreenDocs'

type TabId = 'parc' | 'alertes' | 'couts' | 'docs'

const TABS = [
  { id: 'parc' as TabId, label: 'Parc', icon: 'grid' as const },
  { id: 'alertes' as TabId, label: 'Alertes', icon: 'bell' as const, badge: ALERTS.late.length + ALERTS.soon.length },
  { id: 'couts' as TabId, label: 'Coûts', icon: 'euro' as const },
  { id: 'docs' as TabId, label: 'Documents', icon: 'doc' as const },
]

const ACCENT_OPTIONS = ['#E8702A', '#D9A406', '#2F6BD8', '#1F9D63', '#7A5AE0', '#E8395A']

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<TabId>('parc')
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'fab' | 'add-maintenance' | 'add-vehicle' | 'settings' | null>(null)
  const [maintenanceVehicleId, setMaintenanceVehicleId] = useState<string | undefined>(undefined)

  useEffect(() => { saveState(state) }, [state])

  useEffect(() => {
    const el = document.querySelector('.device-scaler') as HTMLElement
    if (!el) return
    function fit() {
      const s = Math.min((window.innerWidth - 24) / 402, (window.innerHeight - 24) / 874, 1)
      el.style.transform = `scale(${s})`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const patchState = useCallback((patch: Partial<AppState>) => setState(s => ({ ...s, ...patch })), [])

  const addMaintenance = (vehicleId: string, entry: MaintenanceEntry) => {
    setState(s => ({
      ...s,
      history: {
        ...s.history,
        [vehicleId]: [entry, ...(s.history[vehicleId] ?? [])],
      },
    }))
  }

  const addVehicle = (v: Vehicle) => {
    setState(s => ({ ...s, fleet: [...s.fleet, v] }))
  }

  const openVehicle = (id: string) => { setVehicleId(id); setTab('parc') }
  const goTab = (id: string) => { setVehicleId(null); setTab(id as TabId) }
  const openAddMaintenance = (preVehicleId?: string) => {
    setMaintenanceVehicleId(preVehicleId)
    setSheet('add-maintenance')
  }

  const { fleet, history, docs, dark, accent, radius, font } = state

  const fontStack = font === 'System'
    ? 'system-ui,-apple-system,sans-serif'
    : `"${font}",system-ui,sans-serif`

  const rootStyle = {
    '--accent': accent,
    '--radius': radius + 'px',
    '--font-ui': fontStack,
  } as React.CSSProperties

  const currentVehicle = vehicleId ? fleet.find(v => v.id === vehicleId) : null
  const inDetail = !!vehicleId && !!currentVehicle
  const alertBadge = fleet.filter(v => v.status === 'late' || v.status === 'soon').length

  let screen: React.ReactNode
  if (inDetail && currentVehicle) {
    screen = (
      <ScreenVehicle
        vehicle={currentVehicle}
        history={history[currentVehicle.id] ?? []}
        docs={docs[currentVehicle.id] ?? []}
        onBack={() => setVehicleId(null)}
        onAddMaintenance={() => openAddMaintenance(currentVehicle.id)}
      />
    )
  } else if (tab === 'parc') {
    screen = <ScreenParc fleet={fleet} onOpen={openVehicle} onTab={goTab} />
  } else if (tab === 'alertes') {
    screen = <ScreenAlertes fleet={fleet} onOpen={openVehicle} />
  } else if (tab === 'couts') {
    screen = <ScreenCouts fleet={fleet} onOpen={openVehicle} />
  } else {
    screen = <ScreenDocs fleet={fleet} docs={docs} onOpen={openVehicle} />
  }

  return (
    <div className="stage">
      <div className="device-scaler">
        <IOSDevice dark={dark}>
          <div className={'app' + (dark ? ' dark' : '')} style={rootStyle}>
            <div className="app__screen">{screen}</div>

            {!inDetail && (
              <button className="vfab" onClick={() => setSheet('fab')} aria-label="Ajouter">
                <VIcon name="plus" size={26} sw={2.2} />
              </button>
            )}

            {!inDetail && (
              <nav className="vtabbar">
                {TABS.map(tb => (
                  <button key={tb.id} className={'vtab' + (tab === tb.id ? ' vtab--on' : '')} onClick={() => goTab(tb.id)}>
                    <div className="vtab__ico">
                      <VIcon name={tb.icon} size={23} sw={tab === tb.id ? 2 : 1.7} />
                      {tb.id === 'alertes' && alertBadge > 0 && <span className="vtab__badge">{alertBadge}</span>}
                    </div>
                    <span className="vtab__lbl">{tb.label}</span>
                  </button>
                ))}
              </nav>
            )}

            {/* FAB sheet */}
            <VSheet open={sheet === 'fab'} onClose={() => setSheet(null)} title="Ajouter au carnet">
              {([
                { icon: 'wrench' as const, label: 'Saisir un entretien', sub: 'Vidange, révision, réparation…', action: () => { setSheet(null); openAddMaintenance(vehicleId ?? undefined) } },
                { icon: 'scan' as const, label: 'Scanner une facture', sub: 'OCR automatique de vos factures', action: () => { setSheet(null); openAddMaintenance(vehicleId ?? undefined) } },
                { icon: 'car' as const, label: 'Ajouter un véhicule', sub: 'Voiture, utilitaire, moto…', action: () => setSheet('add-vehicle') },
                { icon: 'settings' as const, label: 'Paramètres', sub: 'Thème, couleur, police…', action: () => setSheet('settings') },
              ]).map((a, i) => (
                <button className="vsheet__row" key={i} onClick={a.action}>
                  <div className="vsheet__ic"><VIcon name={a.icon} size={20} /></div>
                  <div className="vsheet__txt"><div className="vsheet__lbl">{a.label}</div><div className="vsheet__sub">{a.sub}</div></div>
                  <VIcon name="chevron" size={16} style={{ color: 'var(--ink-3)' }} />
                </button>
              ))}
            </VSheet>

            {/* Add maintenance sheet */}
            <VSheet open={sheet === 'add-maintenance'} onClose={() => setSheet(null)} title="Saisir un entretien" tall>
              {sheet === 'add-maintenance' && (
                <AddMaintenanceForm
                  vehicles={fleet}
                  preselectedVehicleId={maintenanceVehicleId}
                  onSave={addMaintenance}
                  onClose={() => setSheet(null)}
                />
              )}
            </VSheet>

            {/* Add vehicle sheet */}
            <VSheet open={sheet === 'add-vehicle'} onClose={() => setSheet(null)} title="Ajouter un véhicule" tall>
              {sheet === 'add-vehicle' && (
                <AddVehicleForm onSave={addVehicle} onClose={() => setSheet(null)} />
              )}
            </VSheet>

            {/* Settings sheet */}
            <VSheet open={sheet === 'settings'} onClose={() => setSheet(null)} title="Paramètres">
              <div style={{ paddingBottom: 4 }}>
                <div className="settings-row">
                  <div><div className="settings-row__label">Mode sombre</div><div className="settings-row__sub">Thème sombre pour l'interface</div></div>
                  <button className={'toggle-btn' + (dark ? ' toggle-btn--on' : '')} onClick={() => patchState({ dark: !dark })}>
                    <i />
                  </button>
                </div>
                <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                  <div className="settings-row__label">Couleur d'accent</div>
                  <div className="color-swatches">
                    {ACCENT_OPTIONS.map(c => (
                      <button key={c} className={'color-swatch' + (accent === c ? ' color-swatch--on' : '')}
                        style={{ background: c, '--accent': c } as React.CSSProperties}
                        onClick={() => patchState({ accent: c })} />
                    ))}
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-row__label">Rayon des cartes</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min={8} max={28} value={radius} onChange={e => patchState({ radius: Number(e.target.value) })}
                      style={{ width: 100, accentColor: accent }} />
                    <span style={{ fontSize: 13, color: 'var(--ink-2)', minWidth: 28 }}>{radius}px</span>
                  </div>
                </div>
                <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div className="settings-row__label">Police</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Hanken Grotesk', 'Space Grotesk', 'System'].map(f => (
                      <button key={f} onClick={() => patchState({ font: f })}
                        style={{ padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: f === 'System' ? 'system-ui' : `"${f}"`, background: font === f ? 'var(--accent)' : 'var(--surface-2)', color: font === f ? '#fff' : 'var(--ink-2)', border: `1px solid ${font === f ? 'var(--accent)' : 'var(--line)'}` }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </VSheet>
          </div>
        </IOSDevice>
      </div>
    </div>
  )
}
