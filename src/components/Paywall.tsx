import { PLANS } from '../data'
import { VIcon } from './VIcon'

interface Props {
  currentPlan: 'free' | 'pro' | 'fleet'
  onUpgrade: (plan: 'pro' | 'fleet') => void
  onClose: () => void
  reason?: string
}

const FEATURES = {
  pro: [
    'Jusqu\'à 10 véhicules',
    'Scanner OCR de factures',
    'Export PDF des rapports',
    'Historique illimité',
    'Rappels push',
  ],
  fleet: [
    'Véhicules illimités',
    'Multi-utilisateurs',
    'Tableau de bord équipe',
    'API & intégrations',
    'Support prioritaire',
    'White-label disponible',
  ],
}

export function Paywall({ currentPlan, onUpgrade, onClose, reason }: Props) {
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

        <div className="paywall__plans">
          {/* Pro */}
          <div className="paywall__plan paywall__plan--highlight">
            <div className="paywall__plan-badge">Populaire</div>
            <div className="paywall__plan-name">Pro</div>
            <div className="paywall__plan-price">
              <span className="paywall__plan-amount">{PLANS.pro.price}€</span>
              <span className="paywall__plan-period">/mois</span>
            </div>
            <ul className="paywall__features">
              {FEATURES.pro.map(f => (
                <li key={f}><VIcon name="check" size={14} />{f}</li>
              ))}
            </ul>
            <button
              className="paywall__btn paywall__btn--primary"
              onClick={() => onUpgrade('pro')}
            >
              Choisir Pro
            </button>
          </div>

          {/* Fleet */}
          <div className="paywall__plan">
            <div className="paywall__plan-name">Flotte</div>
            <div className="paywall__plan-price">
              <span className="paywall__plan-amount">{PLANS.fleet.price}€</span>
              <span className="paywall__plan-period">/mois</span>
            </div>
            <ul className="paywall__features">
              {FEATURES.fleet.map(f => (
                <li key={f}><VIcon name="check" size={14} />{f}</li>
              ))}
            </ul>
            <button
              className="paywall__btn paywall__btn--secondary"
              onClick={() => onUpgrade('fleet')}
            >
              Choisir Flotte
            </button>
          </div>
        </div>

        <p className="paywall__legal">
          Sans engagement · Résiliable à tout moment · Paiement sécurisé
        </p>
      </div>
    </div>
  )
}
