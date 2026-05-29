import { useState } from 'react'
import { MaintenanceEntry, Vehicle, IconName, ScannedInvoice } from '../types'
import { genId } from '../data'
import { VIcon } from './VIcon'
import { InvoiceScanner } from './InvoiceScanner'

interface Props {
  vehicles: Vehicle[]
  preselectedVehicleId?: string
  onSave: (vehicleId: string, entry: MaintenanceEntry) => void
  onClose: () => void
  prefill?: ScannedInvoice
}

const SERVICE_TYPES: { label: string; icon: IconName }[] = [
  { label: 'Vidange + filtre', icon: 'drop' },
  { label: 'Contrôle technique', icon: 'shield' },
  { label: 'Changement de pneus', icon: 'tire' },
  { label: 'Plaquettes de frein', icon: 'wrench' },
  { label: 'Révision constructeur', icon: 'wrench' },
  { label: 'Remplacement distribution', icon: 'wrench' },
  { label: 'Remplacement embrayage', icon: 'wrench' },
  { label: 'Remplacement batterie', icon: 'bolt' },
  { label: 'Autre entretien', icon: 'wrench' },
]

function iconForService(label: string): IconName {
  return SERVICE_TYPES.find(s => s.label === label)?.icon ?? 'wrench'
}

export function AddMaintenanceForm({ vehicles, preselectedVehicleId, onSave, onClose, prefill }: Props) {
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId ?? (vehicles[0]?.id ?? ''))
  const [type, setType] = useState(prefill?.serviceType ?? '')
  const [customType, setCustomType] = useState('')
  const [garage, setGarage] = useState(prefill?.garage ?? '')
  const [cost, setCost] = useState(prefill?.amount !== undefined ? String(prefill.amount) : '')
  const [km, setKm] = useState(prefill?.km !== undefined ? String(prefill.km) : '')
  const [date, setDate] = useState(() => {
    if (prefill?.date) {
      // convert DD/MM/YYYY to YYYY-MM-DD for input[type=date]
      const p = prefill.date.split('/')
      if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`
    }
    return new Date().toISOString().slice(0, 10)
  })
  const [notes, setNotes] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const handleScanResult = (inv: ScannedInvoice) => {
    setShowScanner(false)
    if (inv.serviceType) setType(inv.serviceType)
    if (inv.garage) setGarage(inv.garage)
    if (inv.amount !== undefined) setCost(String(inv.amount))
    if (inv.km !== undefined) setKm(String(inv.km))
    if (inv.date) {
      const p = inv.date.split('/')
      if (p.length === 3) setDate(`${p[2]}-${p[1]}-${p[0]}`)
    }
  }

  const finalType = type === 'Autre entretien' ? (customType || 'Entretien') : type

  const handleSubmit = () => {
    if (!vehicleId || !finalType) return
    const v = vehicles.find(x => x.id === vehicleId)!
    const d = new Date(date)
    const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
    const entry: MaintenanceEntry = {
      id: genId(),
      date: label,
      km: parseInt(km) || v.km,
      type: finalType,
      garage: garage || 'Garage',
      cost: parseFloat(cost) || 0,
      tag: iconForService(type),
      notes,
    }
    onSave(vehicleId, entry)
    onClose()
  }

  if (showScanner) {
    return <InvoiceScanner onClose={() => setShowScanner(false)} onResult={handleScanResult} />
  }

  return (
    <div className="vform">
      {/* Scan CTA */}
      <button
        className="vsheet__row"
        onClick={() => setShowScanner(true)}
        style={{ background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', borderRadius: 14, border: '1px dashed color-mix(in srgb, var(--accent) 40%, var(--line))' }}
      >
        <div className="vsheet__ic"><VIcon name="scan" size={20} /></div>
        <div className="vsheet__txt">
          <div className="vsheet__lbl">Scanner une facture</div>
          <div className="vsheet__sub">Remplissage automatique par OCR</div>
        </div>
        <VIcon name="chevron" size={16} style={{ color: 'var(--ink-3)' }} />
      </button>

      {/* Vehicle */}
      <div className="vform__field">
        <label className="vform__label">Véhicule</label>
        <select className="vform__input vform__select" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div className="vform__field">
        <label className="vform__label">Type d'entretien</label>
        <select className="vform__input vform__select" value={type} onChange={e => setType(e.target.value)}>
          <option value="">Sélectionner…</option>
          {SERVICE_TYPES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
        </select>
      </div>

      {type === 'Autre entretien' && (
        <div className="vform__field">
          <label className="vform__label">Préciser</label>
          <input className="vform__input" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Ex: Remplacement courroie" />
        </div>
      )}

      {/* Garage */}
      <div className="vform__field">
        <label className="vform__label">Garage / Prestataire</label>
        <input className="vform__input" value={garage} onChange={e => setGarage(e.target.value)} placeholder="Ex: Garage Mercier" />
      </div>

      {/* Date + Km */}
      <div className="vform__row">
        <div className="vform__field">
          <label className="vform__label">Date</label>
          <input type="date" className="vform__input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="vform__field">
          <label className="vform__label">Kilométrage</label>
          <input type="number" className="vform__input" value={km} onChange={e => setKm(e.target.value)} placeholder="84 210" min="0" />
        </div>
      </div>

      {/* Cost */}
      <div className="vform__field">
        <label className="vform__label">Coût (€)</label>
        <input type="number" className="vform__input" value={cost} onChange={e => setCost(e.target.value)} placeholder="0,00" min="0" step="0.01" />
      </div>

      {/* Notes */}
      <div className="vform__field">
        <label className="vform__label">Notes (optionnel)</label>
        <textarea className="vform__input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Détails supplémentaires…" rows={2} style={{ resize: 'none', lineHeight: '1.5' }} />
      </div>

      <button className="vform__btn" onClick={handleSubmit} disabled={!vehicleId || !finalType}>
        Enregistrer l'entretien
      </button>
    </div>
  )
}
