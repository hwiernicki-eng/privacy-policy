import { useState } from 'react'
import { Vehicle, VehicleCat } from '../types'
import { genId } from '../data'

interface Props {
  onSave: (v: Vehicle) => void
  onClose: () => void
}

const CATS: { id: VehicleCat; label: string }[] = [
  { id: 'VL', label: 'Voiture' },
  { id: 'VU', label: 'Utilitaire' },
  { id: 'EV', label: 'Électrique' },
  { id: 'MOTO', label: 'Moto' },
  { id: 'PL', label: 'Poids lourd' },
]

const ENERGIES = ['Essence', 'Diesel', 'Électrique', 'GPL', 'Hybride']

export function AddVehicleForm({ onSave, onClose }: Props) {
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [plate, setPlate] = useState('')
  const [cat, setCat] = useState<VehicleCat>('VL')
  const [km, setKm] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [driver, setDriver] = useState('')
  const [energy, setEnergy] = useState('Essence')

  const handleSubmit = () => {
    if (!brand || !model || !plate) return
    const catEntry = CATS.find(c => c.id === cat)!
    const isEv = energy === 'Électrique'
    const v: Vehicle = {
      id: genId(),
      brand, model, plate, cat,
      catLabel: catEntry.label,
      km: parseInt(km) || 0,
      kmMonth: 0,
      energy,
      energyIcon: isEv ? 'bolt' : 'fuel',
      gauge: { label: isEv ? 'Charge' : energy === 'Diesel' ? 'Gazole' : 'Carburant', value: 100, unit: '%' },
      year: parseInt(year) || new Date().getFullYear(),
      driver: driver || 'Non assigné',
      status: 'ok',
      alerts: 0,
      next: { type: 'Aucun entretien planifié', detail: 'À configurer', icon: 'wrench' },
    }
    onSave(v)
    onClose()
  }

  return (
    <div className="vform">
      <div className="vform__row">
        <div className="vform__field">
          <label className="vform__label">Marque</label>
          <input className="vform__input" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Renault" />
        </div>
        <div className="vform__field">
          <label className="vform__label">Modèle</label>
          <input className="vform__input" value={model} onChange={e => setModel(e.target.value)} placeholder="Clio V" />
        </div>
      </div>

      <div className="vform__field">
        <label className="vform__label">Immatriculation</label>
        <input className="vform__input" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="EX-482-RT" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }} />
      </div>

      <div className="vform__field">
        <label className="vform__label">Catégorie</label>
        <select className="vform__input vform__select" value={cat} onChange={e => setCat(e.target.value as VehicleCat)}>
          {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div className="vform__field">
        <label className="vform__label">Énergie</label>
        <select className="vform__input vform__select" value={energy} onChange={e => setEnergy(e.target.value)}>
          {ENERGIES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="vform__row">
        <div className="vform__field">
          <label className="vform__label">Kilométrage</label>
          <input type="number" className="vform__input" value={km} onChange={e => setKm(e.target.value)} placeholder="0" min="0" />
        </div>
        <div className="vform__field">
          <label className="vform__label">Année</label>
          <input type="number" className="vform__input" value={year} onChange={e => setYear(e.target.value)} placeholder="2024" min="1980" max="2030" />
        </div>
      </div>

      <div className="vform__field">
        <label className="vform__label">Conducteur</label>
        <input className="vform__input" value={driver} onChange={e => setDriver(e.target.value)} placeholder="Nom du conducteur" />
      </div>

      <button className="vform__btn" onClick={handleSubmit} disabled={!brand || !model || !plate}>
        Ajouter le véhicule
      </button>
    </div>
  )
}
