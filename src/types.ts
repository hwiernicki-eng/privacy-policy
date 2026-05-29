export type VehicleStatus = 'late' | 'soon' | 'ok'
export type VehicleCat = 'VL' | 'VU' | 'EV' | 'MOTO' | 'PL'
export type DocTag = 'doc' | 'shield' | 'euro' | 'wrench' | 'drop' | 'tire'
export type IconName =
  | 'grid' | 'bell' | 'euro' | 'doc' | 'plus' | 'chevron' | 'back'
  | 'search' | 'wrench' | 'gauge' | 'fuel' | 'bolt' | 'calendar'
  | 'check' | 'alert' | 'clock' | 'drop' | 'tire' | 'shield' | 'route'
  | 'dots' | 'arrowUp' | 'arrowDown' | 'pin' | 'settings' | 'filter'
  | 'x' | 'camera' | 'upload' | 'scan' | 'close' | 'car' | 'edit'

export interface NextMaintenance {
  type: string
  detail: string
  icon: IconName
}

export interface Vehicle {
  id: string
  brand: string
  model: string
  cat: VehicleCat
  catLabel: string
  plate: string
  km: number
  kmMonth: number
  energy: string
  energyIcon: IconName
  gauge: { label: string; value: number; unit: string }
  year: number
  driver: string
  status: VehicleStatus
  alerts: number
  next: NextMaintenance
}

export interface MaintenanceEntry {
  id: string
  date: string
  km: number
  type: string
  garage: string
  cost: number
  tag: IconName
  notes?: string
}

export interface CostCat {
  name: string
  value: number
  icon: IconName
}

export interface Document {
  id: string
  name: string
  meta: string
  tag: IconName
  vehicleId: string
  imageData?: string
}

export interface Alert {
  vid: string
  type: string
  meta: string
  icon: IconName
}

export interface AppState {
  fleet: Vehicle[]
  history: Record<string, MaintenanceEntry[]>
  docs: Record<string, Document[]>
  dark: boolean
  accent: string
  radius: number
  font: string
}

export interface ScannedInvoice {
  date?: string
  amount?: number
  garage?: string
  serviceType?: string
  km?: number
  rawText: string
}
