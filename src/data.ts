import { Vehicle, MaintenanceEntry, Document, Alert, AppState } from './types'

export const INITIAL_FLEET: Vehicle[] = [
  {
    id: 'clio', brand: 'Renault', model: 'Clio V', cat: 'VL', catLabel: 'Voiture',
    plate: 'EX-482-RT', km: 84210, kmMonth: 1240, energy: 'Essence', energyIcon: 'fuel',
    gauge: { label: 'Carburant', value: 64, unit: '%' }, year: 2021, driver: 'A. Mercier',
    status: 'late', alerts: 2,
    next: { type: 'Vidange + filtre', detail: 'En retard de 800 km', icon: 'drop' },
  },
  {
    id: 'partner', brand: 'Peugeot', model: 'Partner', cat: 'VU', catLabel: 'Utilitaire',
    plate: 'GT-119-AB', km: 142800, kmMonth: 2110, energy: 'Diesel', energyIcon: 'fuel',
    gauge: { label: 'Gazole', value: 41, unit: '%' }, year: 2019, driver: 'L. Faure',
    status: 'soon', alerts: 1,
    next: { type: 'Contrôle technique', detail: 'Échéance 12 juin', icon: 'shield' },
  },
  {
    id: 'model3', brand: 'Tesla', model: 'Model 3', cat: 'EV', catLabel: 'Électrique',
    plate: 'FZ-903-KL', km: 51340, kmMonth: 1670, energy: 'Électrique', energyIcon: 'bolt',
    gauge: { label: 'Charge', value: 82, unit: '%' }, year: 2022, driver: 'S. Roche',
    status: 'ok', alerts: 0,
    next: { type: 'Révision annuelle', detail: 'Planifiée le 3 juil.', icon: 'wrench' },
  },
  {
    id: 'mt07', brand: 'Yamaha', model: 'MT-07', cat: 'MOTO', catLabel: 'Moto',
    plate: 'DK-77-MV', km: 23115, kmMonth: 420, energy: 'Essence', energyIcon: 'fuel',
    gauge: { label: 'Carburant', value: 55, unit: '%' }, year: 2023, driver: 'M. Petit',
    status: 'soon', alerts: 1,
    next: { type: 'Pneu arrière', detail: 'Usure — sous 600 km', icon: 'tire' },
  },
  {
    id: 'master', brand: 'Renault', model: 'Master', cat: 'PL', catLabel: 'Poids lourd',
    plate: 'AV-556-PC', km: 198450, kmMonth: 3050, energy: 'Diesel', energyIcon: 'fuel',
    gauge: { label: 'Gazole', value: 28, unit: '%' }, year: 2018, driver: 'K. Diallo',
    status: 'late', alerts: 2,
    next: { type: 'Plaquettes de frein', detail: 'En retard de 1 500 km', icon: 'wrench' },
  },
  {
    id: 'ec4', brand: 'Citroën', model: 'ë-C4', cat: 'EV', catLabel: 'Électrique',
    plate: 'HB-204-ZP', km: 38970, kmMonth: 980, energy: 'Électrique', energyIcon: 'bolt',
    gauge: { label: 'Charge', value: 73, unit: '%' }, year: 2022, driver: 'N. Lambert',
    status: 'ok', alerts: 0,
    next: { type: 'Filtre habitacle', detail: 'Dans ~2 000 km', icon: 'wrench' },
  },
]

export const INITIAL_HISTORY: Record<string, MaintenanceEntry[]> = {
  clio: [
    { id: 'c1', date: '14 mars 2026', km: 81100, type: 'Contrôle technique', garage: 'Norauto Lyon 7', cost: 78, tag: 'shield' },
    { id: 'c2', date: '2 nov. 2025', km: 76340, type: 'Pneus avant (x2)', garage: 'Euromaster', cost: 218, tag: 'tire' },
    { id: 'c3', date: '18 juin 2025', km: 71020, type: 'Vidange + filtre', garage: 'Garage Mercier', cost: 142, tag: 'drop' },
    { id: 'c4', date: '9 janv. 2025', km: 64880, type: 'Plaquettes avant', garage: 'Garage Mercier', cost: 196, tag: 'wrench' },
  ],
  master: [
    { id: 'm1', date: '21 févr. 2026', km: 193200, type: 'Vidange moteur', garage: 'Renault Pro+', cost: 264, tag: 'drop' },
    { id: 'm2', date: '4 déc. 2025', km: 186900, type: 'Embrayage', garage: 'Renault Pro+', cost: 1180, tag: 'wrench' },
    { id: 'm3', date: '30 août 2025', km: 179400, type: 'Contrôle technique', garage: 'Dekra', cost: 95, tag: 'shield' },
  ],
  partner: [
    { id: 'p1', date: '8 avr. 2026', km: 140100, type: 'Révision constructeur', garage: 'Peugeot Saint-P.', cost: 312, tag: 'wrench' },
    { id: 'p2', date: '15 oct. 2025', km: 131500, type: 'Distribution', garage: 'Peugeot Saint-P.', cost: 740, tag: 'wrench' },
  ],
  model3: [
    { id: 'e1', date: '3 juil. 2025', km: 44200, type: 'Révision annuelle', garage: 'Tesla Service', cost: 0, tag: 'wrench' },
    { id: 'e2', date: '12 févr. 2025', km: 39800, type: 'Pneus (x4)', garage: 'Tesla Service', cost: 880, tag: 'tire' },
  ],
  mt07: [
    { id: 'mo1', date: '20 mai 2025', km: 19400, type: 'Révision 20 000', garage: 'Yamaha Center', cost: 245, tag: 'wrench' },
  ],
  ec4: [
    { id: 'ec1', date: '11 janv. 2026', km: 33100, type: 'Contrôle technique', garage: 'Dekra', cost: 78, tag: 'shield' },
  ],
}

export const INITIAL_DOCS: Record<string, Document[]> = {
  clio: [
    { id: 'd1', name: 'Carte grise', meta: 'PDF · 1,2 Mo', tag: 'doc', vehicleId: 'clio' },
    { id: 'd2', name: 'Attestation assurance', meta: 'Exp. 31/12/2026', tag: 'shield', vehicleId: 'clio' },
    { id: 'd3', name: 'Facture — Contrôle technique', meta: '14 mars 2026 · 78 €', tag: 'euro', vehicleId: 'clio' },
    { id: 'd4', name: 'Procès-verbal CT', meta: 'PDF · 0,4 Mo', tag: 'doc', vehicleId: 'clio' },
  ],
  master: [
    { id: 'd5', name: 'Carte grise', meta: 'PDF · 1,1 Mo', tag: 'doc', vehicleId: 'master' },
    { id: 'd6', name: 'Attestation assurance', meta: 'Exp. 30/09/2026', tag: 'shield', vehicleId: 'master' },
    { id: 'd7', name: 'Facture — Embrayage', meta: '4 déc. 2025 · 1 180 €', tag: 'euro', vehicleId: 'master' },
  ],
}

export const ALERTS: { late: Alert[]; soon: Alert[] } = {
  late: [
    { vid: 'clio', type: 'Vidange + filtre', meta: 'En retard de 800 km', icon: 'drop' },
    { vid: 'master', type: 'Plaquettes de frein', meta: 'En retard de 1 500 km', icon: 'wrench' },
    { vid: 'master', type: 'Contrôle technique', meta: 'Échéance dépassée (4 j)', icon: 'shield' },
  ],
  soon: [
    { vid: 'partner', type: 'Contrôle technique', meta: 'Dans 14 jours · 12 juin', icon: 'shield' },
    { vid: 'mt07', type: 'Pneu arrière', meta: 'Usure — sous 600 km', icon: 'tire' },
    { vid: 'model3', type: 'Révision annuelle', meta: 'Planifiée le 3 juil.', icon: 'wrench' },
    { vid: 'ec4', type: 'Filtre habitacle', meta: 'Dans ~2 000 km', icon: 'wrench' },
  ],
}

export const COSTS_DATA = {
  total: 4280, prevTotal: 3960, period: 'Mai 2026',
  months: [
    { m: 'Déc', v: 3120 }, { m: 'Jan', v: 4480 }, { m: 'Fév', v: 3820 },
    { m: 'Mar', v: 5240 }, { m: 'Avr', v: 3960 }, { m: 'Mai', v: 4280 },
  ],
  cats: [
    { name: 'Carburant & énergie', value: 1540, icon: 'fuel' as const },
    { name: 'Entretien', value: 1120, icon: 'wrench' as const },
    { name: 'Assurance', value: 890, icon: 'shield' as const },
    { name: 'Réparations', value: 730, icon: 'alert' as const },
  ],
}

export const VCOSTS: Record<string, { total: number; cats: Record<string, number> }> = {
  clio:    { total: 1840, cats: { Entretien: 760, Carburant: 720, Assurance: 360 } },
  master:  { total: 4120, cats: { Entretien: 2280, Carburant: 1380, Assurance: 460 } },
  partner: { total: 2360, cats: { Entretien: 1180, Carburant: 820, Assurance: 360 } },
  model3:  { total: 1320, cats: { Entretien: 120, Carburant: 760, Assurance: 440 } },
  mt07:    { total: 690,  cats: { Entretien: 245, Carburant: 240, Assurance: 205 } },
  ec4:     { total: 980,  cats: { Entretien: 180, Carburant: 420, Assurance: 380 } },
}

export const FLEET_SUMMARY = { total: 24, active: 21, late: 3, soon: 4, monthSpend: 4280, monthKm: 38420 }

export const STORAGE_KEY = 'carnet_entretien_v1'

export const PLANS = {
  free:  { label: 'Gratuit',  price: 0,     vehicleLimit: 2,  ocr: false, export: false, multi: false },
  pro:   { label: 'Pro',      price: 9.99,  vehicleLimit: 10, ocr: true,  export: true,  multi: false },
  fleet: { label: 'Flotte',   price: 29.99, vehicleLimit: Infinity, ocr: true, export: true, multi: true },
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (!s.plan) s.plan = 'free'
      return s
    }
  } catch {}
  return {
    fleet: INITIAL_FLEET,
    history: INITIAL_HISTORY,
    docs: INITIAL_DOCS,
    dark: false,
    accent: '#E8702A',
    radius: 20,
    font: 'Hanken Grotesk',
    plan: 'free',
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function fmtKm(n: number) { return n.toLocaleString('fr-FR') + ' km' }
export function fmtEur(n: number) { return n.toLocaleString('fr-FR') + ' €' }

export function genId() { return Math.random().toString(36).slice(2, 9) }
