# DESIGN — Carnet d'entretien

Direction retenue : **Cockpit clair** (ADR-011). Références :
- `docs/prototype.html` : comportement et rendu de référence (ouvrir dans un navigateur, thème clair et sombre).
- `docs/maquettes/` : sources des maquettes Claude Design de la ligne **B · Cockpit** (voir `docs/maquettes/README.md`) — accueil et véhicule mobiles 390 px, tableau de bord desktop, premier lancement.

L'implémentation React reproduit la structure, les tokens et les comportements du prototype ; les composants shadcn/ui sont stylés via ces tokens.

## Direction

L'application se lit comme un **tableau de bord de voiture** : des **témoins** s'allument par famille d'entretien, chaque échéance est une **jauge circulaire** de l'intervalle consommé, le kilométrage est un **compteur en arc** qui avance vers la prochaine échéance au km. Fond clair, panneaux blancs, couleurs de statut foncées pour rester lisibles. Le thème sombre reprend le cockpit nocturne (fond graphite, rétro-éclairage cyan).

## Tokens (CSS custom properties)

| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--paper` | `#EEF1F4` | `#111419` | fond de page |
| `--sheet` | `#FFFFFF` | `#1A1F27` | surfaces (cartes, panneaux, modales) |
| `--ink` | `#131820` | `#E8EBF0` | texte principal |
| `--muted` | `#59636F` | `#A0A9B8` | texte secondaire (≥ 4,5:1 sur `--sheet`) |
| `--line` | `#D5DBE3` | `#2A313C` | séparateurs, bordures de panneaux |
| `--line-strong` | `#B7C0CC` | `#3A4352` | bordures de champs et boutons |
| `--track` | `#E3E8EE` | `#2A313C` | piste des jauges, liseré bas des blocs instruments |
| `--stamp` (accent) | `#0B7398` | `#6FC3DF` | actions primaires, onglet actif, jauges « à jour » |
| `--stamp-ink` | `#FFFFFF` | `#0B0D11` | texte sur l'accent |
| `--stamp-soft` | `#E0F0F5` | `#16313B` | sélection |
| `--ok` / `--ok-soft` | = accent / `#E0F0F5` | = accent / `#16313B` | statut à jour |
| `--warn` / `--warn-soft` / `--warn-halo` | `#B06A00` / `#FFF1DA` / `rgba(176,106,0,.14)` | `#F2A93B` / `#3A2A10` / `rgba(242,169,59,.28)` | statut à prévoir |
| `--late` / `--late-soft` / `--late-halo` | `#C7372B` / `#FCE6E3` / `rgba(199,55,43,.16)` | `#F26B5E` / `#3A1714` / `rgba(242,107,94,.32)` | statut en retard |
| `--late-border` | `#F0B8B1` | `#5A2621` | bordure d'une tuile en retard |
| `--lamp-off` | `#A6AFBB` | `#4A5363` | témoin éteint (décoratif, toujours accompagné du libellé) |

Mapping shadcn : `--background`=`--paper`, `--card`/`--popover`=`--sheet`, `--foreground`=`--ink`, `--muted-foreground`=`--muted`, `--border`/`--input`=`--line`/`--line-strong`, `--primary`=`--stamp`, `--primary-foreground`=`--stamp-ink`, `--destructive`=`--late`, `--ring`=`--stamp`. Rayon `--radius: 14px` (panneaux), 10 px (boutons, lignes).

## Typographie

- Titres, onglets, nom du véhicule : **Saira Condensed** 600/700, en capitales, `letter-spacing: .03–.04em`.
- Texte courant : **Saira** 400/500/600, 15 px, interligne 1,5.
- Kilométrages, montants, dates, pourcentages des jauges, immatriculation : **JetBrains Mono** 500/700 avec `tabular-nums`.
- Petits libellés en capitales (RYTHME, KM) : 11 px, `letter-spacing: .08–.14em`.

## Écrans MVP

1. **Tableau de bord** `/` (vue « Bord » du prototype, maquettes `B-Bord-Desktop` et `B-Accueil`) : en-tête date + pastilles globales ; cartes véhicule (nom, plaque, témoins compacts, km, prochaine échéance) ; « À faire » = grille de jauges `overdue` puis `soon` de tous les véhicules avec le modèle en surtitre ; « Ensuite » = 5 prochaines échéances `ok` en liste.
1 bis. **Premier lancement** `/bienvenue` (prototype : « Tester le premier lancement », maquette `B-Bienvenue`) : panneau centré 640 px max, indicateur d'étapes (1 Véhicule, 2 Plan d'entretien, 3 Dernières interventions), un `fieldset` par opération à l'étape 3, Retour / Continuer / Créer mon carnet.
2. **Véhicule** `/vehicules/:id` : colonne gauche fiche (nom, plaque, témoins, compteur en arc, rythme / dépenses 12 mois / nombre d'entrées, actions) ; colonne droite onglets **Échéances / Journal / Plan d'entretien**. Une colonne sous 860 px, la fiche passe au-dessus.
3. **Formulaires** : Dialog ≥ 640 px, Sheet bas d'écran en dessous. Bouton primaire à droite, libellé d'action explicite (« Enregistrer », « Supprimer »).
4. **Connexion / inscription / paramètres** : formulaire centré, largeur 420 px max.
5. **Notifications** `/parametres/notifications` : colonne gauche, heure du rappel puis une carte par canal (Email, Téléphone, ntfy) avec interrupteur, réglages, « Envoyer un test » ; colonne droite (sous 760 px : en dessous), aperçu téléphone et aperçu email générés depuis les échéances réelles. Voir le panneau « Notifications » du prototype (icône cloche).

Navigation mobile : barre basse 5 entrées (Bord, Véhicule, **+** central plein en accent, Journal, Réglages), cibles ≥ 44 px.

## Composants métier

| Composant | Spécification |
|---|---|
| `WarningLamps` | 4 témoins (Freins = `Freinage`, Entretien = `Entretien`, CT = `Contrôle technique`, Assurance = `Administratif`). Allumé `overdue` : fond `--late-soft`, icône `--late`, halo 5 px `--late-halo` ; `soon` : équivalents `--warn` ; éteint : fond `--paper`, icône `--lamp-off`. Libellé sous chaque témoin, `aria-label` « Freins : en retard ». Bloc bordé `--line` avec liseré bas `inset 0 -3px 0 var(--track)` |
| `ArcOdometer` | Demi-cercle SVG (rayon 120, trait 14, extrémités arrondies) : piste `--track`, valeur couleur du statut de l'échéance suivie. Échéance suivie = plus petite `kmLeft > 0` parmi les règles au km, sinon la plus dépassée. Centre : km courant (mono 30 px), « KM · RELEVÉ LE 2 OCT. », phrase « Vidange à 105 100 km · 3 750 km ». Bornes (km de départ / km cible) aux extrémités |
| `DueGauge` (tuile) | Anneau 58 px en `conic-gradient` (statut sur `--track`), pourcentage en mono au centre, libellé, texte court (« 13 j · 3 750 km », « −1 250 km », « 2 janv. 27 »), pied « Dernière : date » + bouton « Fait » (primaire si overdue/soon). Tuile `overdue` bordée `--late-border`. Grille `auto-fill, minmax(240px, 1fr)` |
| `StatusChip` | pastille arrondie fond `*-soft`, texte statut ; libellés : « en retard », « à prévoir », « à jour », « sans référence » |
| `JournalRow` | ligne bordée : date `JJ.MM.AA` + km en mono à gauche, intitulé + « catégorie · garage · notes », coût en mono à droite |
| `PlateBadge` | immatriculation en mono 13 px dans un cadre `--line-strong` (pas de reproduction de plaque) |

## Règles

- Le statut est toujours codé par **forme + couleur + texte** (témoin allumé + libellé, anneau + texte court, pastille + mot), jamais par la couleur seule.
- Couleurs de texte de statut et accent ≥ 4,5:1 sur `--sheet` dans les deux thèmes ; ne jamais réutiliser les teintes du thème sombre sur fond clair.
- Aucune largeur fixe > 360 px hors tableaux (scroll horizontal dans leur conteneur).
- `prefers-reduced-motion` respecté ; seules animations : apparition des toasts.
- Textes : voix active, verbes d'action, erreurs qui disent comment corriger (« Kilométrage incohérent : 101 350 km déjà relevé à cette date ou avant. »).
