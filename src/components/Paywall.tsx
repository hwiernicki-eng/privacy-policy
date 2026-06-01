import { useEffect, useRef, useState } from 'react'
import { PLANS } from '../data'
import { VIcon } from './VIcon'

interface Props {
  currentPlan: 'free' | 'pro' | 'fleet'
  onUpgrade: (plan: 'pro' | 'fleet') => void
  onClose: () => void
  reason?: string
}

// Remplacez ces IDs par vos vrais Plan IDs PayPal (depuis developer.paypal.com)
const PAYPAL_PLAN_IDS = {
  pro:   'P-XXXXXXXXXXXXXXXXXXXXXXXX_PRO',
  fleet: 'P-XXXXXXXXXXXXXXXXXXXXXXXX_FLEET',
}

const FEATURES = {
  pro: [
    "Jusqu'à 10 véhicules",
    'Scanner OCR de factures',
    'Export PDF des rapports',
    'Historique illimité',
    'Rappels entretien',
  ],
  fleet: [
    'Véhicules illimités',
    'Multi-utilisateurs',
    'Tableau de bord équipe',
    'API & intégrations',
    'Support prioritaire',
  ],
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: object) => { render: (el: HTMLElement) => void }
    }
  }
}

function PayPalButton({ planKey, onSuccess }: { planKey: 'pro' | 'fleet'; onSuccess: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!ref.current || !window.paypal) {
      setError(true)
      return
    }
    ref.current.innerHTML = ''
    window.paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'blue',
        layout: 'vertical',
        label: 'subscribe',
      },
      createSubscription: (_data: unknown, actions: { subscription: { create: (o: object) => Promise<string> } }) => {
        return actions.subscription.create({
          plan_id: PAYPAL_PLAN_IDS[planKey],
        })
      },
      onApprove: (_data: { subscriptionID: string }) => {
        onSuccess()
      },
      onError: () => setError(true),
    }).render(ref.current!)
  }, [planKey, onSuccess])

  if (error) {
    return (
      <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: '8px 0' }}>
        Configurez votre Client ID PayPal dans index.html
      </div>
    )
  }
  return <div ref={ref} style={{ marginTop: 12 }} />
}

export function Paywall({ currentPlan, onUpgrade, onClose, reason }: Props) {
  const [selected, setSelected] = useState<'pro' | 'fleet'>('pro')

  return (
    <div className="paywall-backdrop">
      <div className="paywall">
        <div className="paywall__grip" />
        <button className="paywall__close" onClick={onClose}>
          <VIcon name="close" size={18} />
        </button>

        {reason && (
          <div className="paywall__reason">
            <VIcon name="alert" size={16} />
            {reason}
          </div>
        )}

        <div className="paywall__hero">
          <div className="paywall__crown">⭐</div>
          <h2 className="paywall__title">Passez à la vitesse supérieure</h2>
          <p className="paywall__sub">Gérez votre flotte sans limite</p>
        </div>

        {/* Sélecteur de plan */}
        <div className="paywall__tabs">
          <button
            className={'paywall__tab' + (selected === 'pro' ? ' paywall__tab--on' : '')}
            onClick={() => setSelected('pro')}
          >
            Pro — {PLANS.pro.price}€/mois
          </button>
          <button
            className={'paywall__tab' + (selected === 'fleet' ? ' paywall__tab--on' : '')}
            onClick={() => setSelected('fleet')}
          >
            Flotte — {PLANS.fleet.price}€/mois
          </button>
        </div>

        {/* Features */}
        <ul className="paywall__features paywall__features--full">
          {FEATURES[selected].map(f => (
            <li key={f}><VIcon name="check" size={14} />{f}</li>
          ))}
        </ul>

        {/* Bouton PayPal */}
        <PayPalButton
          planKey={selected}
          onSuccess={() => onUpgrade(selected)}
        />

        <p className="paywall__legal">
          Paiement sécurisé PayPal · Sans engagement · Résiliable à tout moment
        </p>
      </div>
    </div>
  )
}
