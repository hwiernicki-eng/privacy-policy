# PRODUCT — Carnet d'entretien

## Problème

Les échéances d'entretien (vidange, contrôle technique, assurance, freins…) sont oubliées, les factures se perdent, et l'historique du véhicule n'est pas consultable au moment d'agir ou de revendre.

## Promesse MVP

> Je ne veux plus oublier un entretien.

L'utilisateur déclare ses véhicules, son plan d'entretien (intervalles km et/ou durée) et ses interventions. L'application calcule les échéances, les classe par urgence et envoie un rappel email.

## Personas

- **Particulier multi-véhicules** (foyer, 1 à 4 véhicules) : veut une liste « à faire » fiable, sur téléphone.
- **Bricoleur** : saisit ses propres interventions (garage « Fait soi-même »), veut l'historique détaillé et l'export.

## Périmètre MVP

| # | Fonction | Règles métier |
|---|---|---|
| F1 | Compte | Inscription email + mot de passe (≥ 12 caractères), connexion, déconnexion, mot de passe oublié par email. Inscriptions fermables (`REGISTRATION_OPEN=false`) pour un usage privé. |
| F2 | Véhicules | Ajout / modification / suppression. Champs : immatriculation (format SIV `AB-123-CD`, unique par compte), marque, modèle, motorisation, année, énergie, VIN facultatif, date d'achat facultative. Kilométrage initial obligatoire à la création (crée un relevé). Option « plan de base » à la création. |
| F3 | Relevés kilométriques | Ajout manuel (date ≤ aujourd'hui). **Monotonie** : un relevé ne peut pas être inférieur à un relevé de date antérieure ou égale, ni supérieur à un relevé de date postérieure. Le kilométrage courant = max des relevés. |
| F4 | Plan d'entretien | Règles par véhicule : libellé, catégorie, intervalle km et/ou mois (au moins un), seuils d'alerte (défaut 1 500 km / 30 j), référence initiale facultative (date + km de la dernière fois). Création depuis modèles indicatifs. |
| F5 | Carnet (interventions) | Libellé, catégorie, date, km, coût TTC, garage, notes, règle liée facultative. Une intervention liée à une règle remet son échéance à zéro. Chaque intervention crée un relevé kilométrique (source `intervention`). |
| F6 | Échéances | Calcul par règle (voir `ARCHITECTURE.md` §5). Statuts : `overdue` (en retard), `soon` (à prévoir), `ok`, `unknown` (sans référence). Tri : statut puis jours restants effectifs. Action « Fait » ⇒ formulaire d'intervention pré-rempli. |
| F7 | Tableau de bord | Toutes les échéances `overdue` et `soon` de tous les véhicules, puis résumé par véhicule (pastille du pire statut). |
| F8 | Notifications | Digest quotidien envoyé **à l'heure choisie par l'utilisateur** (créneaux de 15 min, défaut 07:30, Europe/Paris) sur un ou plusieurs canaux : **email**, **notification téléphone** (Web Push de la PWA, plusieurs appareils), **ntfy** (application ntfy ou serveur auto-hébergé). Contenu : échéances passées en `soon` ou `overdue` **depuis le dernier envoi sur ce canal pour cette échéance** (un envoi par règle, par cycle, par statut et par canal). Rien à signaler ⇒ aucun envoi. Bouton « Envoyer un test » par canal. Au moins un canal actif conseillé (avertissement si aucun). Voir F8-détail. |
| F9 | Export | CSV par véhicule (séparateur `;`, UTF-8 avec BOM pour Excel FR) et sauvegarde JSON complète du compte. |
| F10 | PWA | Installable (manifest + icônes), mobile-first. Service worker limité à la réception des notifications push (pas de cache, pas de mode hors ligne au MVP). |
| F11 | Premier lancement | Compte sans véhicule ⇒ assistant en 3 étapes : (1) véhicule + km actuel ; (2) opérations à suivre parmi les modèles, plan de base pré-coché ; (3) date et km de la dernière fois pour chaque opération (vide autorisé ⇒ « sans référence » ; km obligatoire si date saisie pour une opération au km ; km ≤ km actuel ; date ≤ aujourd'hui). Création atomique, puis tableau de bord et invitation à activer les notifications. Objectif : aucune échéance « sans référence » subie. |
| F12 | Suppression du compte (RGPD) | Depuis Paramètres : export proposé d'abord, puis confirmation par mot de passe + saisie de « SUPPRIMER ». Suppression **définitive et immédiate** de toutes les données du compte (véhicules, relevés, règles, interventions, canaux, historique de notifications, sessions, fichiers joints). Email de confirmation envoyé avant suppression. Les sauvegardes expirent par rotation (14 jours, hors site 30 jours), ce que la page indique. |

### F8-détail — Canaux de notification

| Canal | Mise en place côté utilisateur | Contenu | Limites connues |
|---|---|---|---|
| Email | Adresse du compte par défaut, modifiable dans Notifications (vérification par lien si différente du login) | Liste complète par véhicule, bouton « Ouvrir le carnet », lien de désinscription en un clic | Délivrabilité dépendante du SMTP |
| Téléphone (Web Push) | « Activer sur cet appareil » ⇒ autorisation du navigateur ; un abonnement par appareil, renommable, révocable | Titre « Entretien : 1 en retard, 4 à prévoir », 3 lignes max + « + N autres », clic ⇒ ouvre le tableau de bord | iPhone/iPad : uniquement si l'application est ajoutée à l'écran d'accueil (iOS 16.4+). Abonnement expiré (410/404) ⇒ appareil retiré automatiquement |
| ntfy | Serveur (`https://ntfy.sh` ou serveur autorisé par l'admin) + sujet (8-64 car. `[A-Za-z0-9_-]`, généré aléatoirement) + jeton d'accès facultatif ; l'utilisateur s'abonne au sujet dans l'application ntfy | Même texte court que le push, priorité haute si au moins un `overdue`, lien de clic vers l'application | Sujet public sur ntfy.sh : contenu limité (modèle + opération, pas de plaque) |

Règles communes :
- Le texte court n'affiche jamais l'immatriculation (écran verrouillé) : « 308 SW · Vidange — dans 13 j ».
- Un canal en échec 5 fois de suite est désactivé et signalé dans l'interface (bandeau sur le tableau de bord + email si l'email est actif).
- Désactiver un canal n'efface pas l'historique d'envoi : le réactiver n'entraîne pas de rafale de rappels déjà envoyés.

## Juste après le MVP (M8)

| # | Fonction | Règles métier |
|---|---|---|
| F13 | Import CSV de l'historique | Par véhicule, format de l'export (F9) ; aperçu obligatoire avec erreurs par ligne avant écriture ; seules les lignes valides sont importées, en une transaction ; rattachement aux règles par libellé exact ; monotonie km vérifiée sur l'ensemble (existant + importé). |
| F14 | Photos de factures et PV | Jusqu'à 5 fichiers par intervention (PDF, JPEG, PNG, WebP, HEIC ; 10 Mo chacun ; 200 Mo par compte), prise de photo directe sur mobile, métadonnées de localisation retirées, visibles uniquement par le propriétaire, inclus dans l'export et supprimés avec l'intervention ou le compte. |

## Modèles de règles (valeurs indicatives, éditables)

| Opération | Catégorie | km | mois |
|---|---|---|---|
| Vidange + filtre à huile | Entretien | 15 000 | 12 |
| Contrôle technique | Contrôle technique | — | 24 |
| Assurance (échéance) | Administratif | — | 12 |
| Liquide de frein | Freinage | — | 24 |
| Plaquettes de frein AV (contrôle) | Freinage | 30 000 | — |
| Filtre à air | Entretien | 30 000 | 24 |
| Filtre d'habitacle | Entretien | 15 000 | 12 |
| Courroie de distribution | Distribution | 150 000 | 120 |
| Recharge climatisation | Entretien | — | 24 |

« Plan de base » à la création d'un véhicule = les 4 premières lignes. Afficher systématiquement : *valeurs indicatives, à aligner sur le carnet constructeur*.

Contrôle technique (véhicule léger, France) : premier contrôle avant le 4e anniversaire de la première mise en circulation, puis tous les 2 ans. Au MVP l'utilisateur saisit la date du dernier CT ; le calcul de la première échéance à partir de la date de mise en circulation est en V1.

Catégories (enum) : `Entretien`, `Freinage`, `Pneumatiques`, `Distribution`, `Contrôle technique`, `Administratif`, `Réparation`, `Autre`.

## Hors périmètre MVP (ne pas implémenter)

Connexion Google, import CSV et pièces jointes (M8, juste après), suivi carburant, graphiques, export PDF, SMS, Telegram, partage de véhicule entre comptes, archivage de véhicule vendu, pré-remplissage par immatriculation (SIV), plans constructeur, historique certifié / QR code, OCR, annuaire de garages, paiement / abonnements, application Android.

## Indicateurs de réussite MVP

- Ajouter un véhicule avec son plan de base en < 1 min sur mobile.
- 0 échéance manquée sur 2 mois d'usage personnel (Hugo + entourage, ≤ 10 comptes).
- Temps de réponse API p95 < 150 ms sur LXC 1 vCPU / 512 Mo.
