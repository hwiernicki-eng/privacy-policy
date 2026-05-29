import { useState, useRef, useCallback } from 'react'
import { ScannedInvoice } from '../types'
import { VIcon } from './VIcon'

interface Props {
  onClose: () => void
  onResult: (invoice: ScannedInvoice) => void
}

type ScanState = 'idle' | 'scanning' | 'done' | 'error'

function parseInvoiceText(text: string): ScannedInvoice {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const full = text.toLowerCase()

  // Amount — look for patterns like "142,00 €", "142.00 EUR", "Total : 142"
  let amount: number | undefined
  const amountPatterns = [
    /(\d[\d\s]*[,.]?\d*)\s*€/gi,
    /total\s*[:\s]*(\d[\d\s]*[,.]?\d*)/gi,
    /montant\s*[:\s]*(\d[\d\s]*[,.]?\d*)/gi,
    /(\d+)[,.](\d{2})\s*(€|eur)/gi,
  ]
  for (const pat of amountPatterns) {
    const matches = [...text.matchAll(pat)]
    if (matches.length) {
      const vals = matches.map(m => {
        const raw = (m[1] || m[0]).replace(/\s/g, '').replace(',', '.')
        return parseFloat(raw)
      }).filter(v => !isNaN(v) && v > 0 && v < 50000)
      if (vals.length) { amount = Math.max(...vals); break }
    }
  }

  // Date — French formats: "14 mars 2026", "14/03/2026", "2026-03-14"
  let date: string | undefined
  const FR_MONTHS: Record<string, string> = {
    janvier: '01', février: '02', fevrier: '02', mars: '03', avril: '04',
    mai: '05', juin: '06', juillet: '07', août: '08', aout: '08',
    septembre: '09', octobre: '10', novembre: '11', décembre: '12', decembre: '12',
  }
  const datePatternFr = /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/gi
  const dmFr = datePatternFr.exec(text)
  if (dmFr) {
    const d = dmFr[1].padStart(2, '0')
    const m = FR_MONTHS[dmFr[2].toLowerCase()] ?? '01'
    const y = dmFr[3]
    date = `${d}/${m}/${y}`
  }
  if (!date) {
    const dmSlash = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/.exec(text)
    if (dmSlash) date = `${dmSlash[1].padStart(2,'0')}/${dmSlash[2].padStart(2,'0')}/${dmSlash[3]}`
  }
  if (!date) {
    const dmIso = /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/.exec(text)
    if (dmIso) date = `${dmIso[3]}/${dmIso[2]}/${dmIso[1]}`
  }

  // Garage / vendor — look for known patterns
  let garage: string | undefined
  const garageKeywords = ['garage', 'norauto', 'midas', 'euromaster', 'speedy', 'dekra', 'contrôle technique', 'pneumatique', 'centre auto', 'auto', 'service', 'pro+', 'center']
  for (const line of lines) {
    const lc = line.toLowerCase()
    if (garageKeywords.some(k => lc.includes(k))) {
      garage = line.replace(/[^a-zA-ZÀ-ÿ0-9\s\-\.\+]/g, '').trim().slice(0, 40)
      if (garage.length > 2) break
    }
  }
  if (!garage) {
    // First substantial non-numeric line often is the vendor
    const candidate = lines.find(l => l.length > 4 && l.length < 50 && !/^\d/.test(l) && !/total|montant|tva|ht|ttc/i.test(l))
    if (candidate) garage = candidate.slice(0, 40)
  }

  // Service type — common keywords
  let serviceType: string | undefined
  const serviceMap: [RegExp, string][] = [
    [/vidange/i, 'Vidange + filtre'],
    [/filtre\s*(à\s*huile|huile)/i, 'Vidange + filtre'],
    [/contrôle\s*technique|ct\b/i, 'Contrôle technique'],
    [/plaquette|frein/i, 'Plaquettes de frein'],
    [/pneu|pneumatique|roue/i, 'Changement de pneus'],
    [/révision|revision/i, 'Révision constructeur'],
    [/distribution/i, 'Remplacement distribution'],
    [/embrayage/i, 'Remplacement embrayage'],
    [/batterie/i, 'Remplacement batterie'],
  ]
  for (const [re, label] of serviceMap) {
    if (re.test(full)) { serviceType = label; break }
  }

  // Km
  let km: number | undefined
  const kmMatch = /(\d[\d\s]{3,8})\s*km/i.exec(text)
  if (kmMatch) {
    const n = parseInt(kmMatch[1].replace(/\s/g, ''))
    if (n > 100 && n < 2000000) km = n
  }

  return { date, amount, garage, serviceType, km, rawText: text }
}

export function InvoiceScanner({ onClose, onResult }: Props) {
  const [state, setState] = useState<ScanState>('idle')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ScannedInvoice | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const runOCR = useCallback(async (file: File) => {
    setState('scanning')
    setProgress(0)
    setStatus('Chargement du moteur OCR…')

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    try {
      // Dynamic import to keep initial bundle light
      const { createWorker } = await import('tesseract.js')
      setProgress(10)
      setStatus('Initialisation…')

      const worker = await createWorker('fra', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(20 + Math.round(m.progress * 75))
            setStatus('Reconnaissance du texte…')
          } else if (m.status === 'loading tesseract core') {
            setProgress(5)
            setStatus('Chargement du moteur…')
          } else if (m.status === 'loading language traineddata') {
            setProgress(12)
            setStatus('Chargement du dictionnaire français…')
          } else if (m.status === 'initializing tesseract') {
            setProgress(18)
          }
        },
      })

      setProgress(20)
      setStatus('Analyse de la facture…')

      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      setProgress(100)
      setStatus('Terminé !')

      const parsed = parseInvoiceText(text)
      setResult(parsed)
      setState('done')
    } catch (err) {
      console.error('OCR error', err)
      setState('error')
      setStatus('Erreur lors de la lecture. Réessayez.')
    }
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) runOCR(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) runOCR(file)
  }

  return (
    <div className="scanner-backdrop">
      <div className="scanner-header">
        <h2>Scanner une facture</h2>
        <button className="viconbtn" onClick={onClose} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <VIcon name="close" size={20} />
        </button>
      </div>

      <div className="scanner-body">
        {state === 'idle' && (
          <div
            className="scanner-dropzone"
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <div className="scanner-dropzone__icon">
              <VIcon name="scan" size={28} style={{ color: 'rgba(255,255,255,0.85)' }} />
            </div>
            <div className="scanner-dropzone__title">Importer une facture</div>
            <div className="scanner-dropzone__sub">
              Photo ou scan au format JPG, PNG ou PDF<br/>
              Les données seront extraites automatiquement
            </div>
            <div style={{ marginTop: 8, padding: '8px 20px', background: 'var(--accent)', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14 }}>
              Choisir un fichier
            </div>
          </div>
        )}

        {(state === 'scanning') && (
          <>
            {previewUrl && <img src={previewUrl} className="scanner-preview" alt="Aperçu facture" />}
            <div style={{ width: '100%' }}>
              <div className="scanner-progress">
                <div className="scanner-progress__fill" style={{ width: progress + '%' }} />
              </div>
              <div className="scanner-status" style={{ marginTop: 10 }}>{status}</div>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="scanner-status">{status}</div>
            <button className="scanner-btn scanner-btn--secondary" onClick={() => setState('idle')}>
              Réessayer
            </button>
          </>
        )}

        {state === 'done' && result && (
          <>
            {previewUrl && <img src={previewUrl} className="scanner-preview" alt="Aperçu" />}
            <div className="scanner-result">
              <div className="scanner-result__title">Informations extraites</div>
              {result.serviceType && (
                <div className="scanner-result__row">
                  <span className="scanner-result__key">Type d'entretien</span>
                  <span className="scanner-result__val">{result.serviceType}</span>
                </div>
              )}
              {result.amount !== undefined && (
                <div className="scanner-result__row">
                  <span className="scanner-result__key">Montant</span>
                  <span className="scanner-result__val">{result.amount.toLocaleString('fr-FR')} €</span>
                </div>
              )}
              {result.date && (
                <div className="scanner-result__row">
                  <span className="scanner-result__key">Date</span>
                  <span className="scanner-result__val">{result.date}</span>
                </div>
              )}
              {result.garage && (
                <div className="scanner-result__row">
                  <span className="scanner-result__key">Garage / Prestataire</span>
                  <span className="scanner-result__val">{result.garage}</span>
                </div>
              )}
              {result.km !== undefined && (
                <div className="scanner-result__row">
                  <span className="scanner-result__key">Kilométrage</span>
                  <span className="scanner-result__val">{result.km.toLocaleString('fr-FR')} km</span>
                </div>
              )}
              {!result.serviceType && !result.amount && !result.date && (
                <div className="scanner-result__row">
                  <span className="scanner-result__key" style={{ color: 'rgba(255,255,255,0.5)' }}>Aucune donnée reconnue</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="scanner-footer">
        {state === 'done' && result && (
          <>
            <button className="scanner-btn scanner-btn--primary" onClick={() => onResult(result)}>
              Utiliser ces données
            </button>
            <button className="scanner-btn scanner-btn--secondary" onClick={() => { setState('idle'); setResult(null); setPreviewUrl(null) }}>
              Scanner une autre facture
            </button>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={handleFile}
        capture="environment"
      />
    </div>
  )
}
