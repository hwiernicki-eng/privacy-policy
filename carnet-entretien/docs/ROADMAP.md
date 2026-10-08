# ROADMAP — Carnet d'entretien (web)

Source de vérité de l'avancement. Une tâche = un commit (ou une PR). Cocher `[x]` une fois les critères d'acceptation validés et `pnpm typecheck && pnpm lint && pnpm test` au vert.
Convention : `Mx-Ty` ; « Dépend de » liste les tâches qui doivent être `[x]` avant de commencer.

## Vue d'ensemble

| Phase | Objectif | Jalons | Estimation solo |
|---|---|---|---|
| **MVP** | Ne plus oublier un entretien | M0 → M7 | 7-8 semaines (soirs/week-ends) |
| **M8** | Historique complet dès le départ | M8 | +2 semaines, juste après la mise en service |
| **V1** | Confort et historique complet | V1-* | +4 semaines |
| **V2** | Valeur à la revente, automatisation | V2-* | à planifier |
| **V3** | Ouverture / monétisation | V3-* | à planifier |

## Suivi MVP

- [ ] M0-T1 Initialisation du dépôt
- [ ] M0-T2 Outillage qualité et CI
- [ ] M0-T3 UI de base (Tailwind, shadcn, tokens)
- [ ] M0-T4 Base SQLite, schéma et migrations
- [ ] M0-T5 Config, erreurs, logs, healthcheck
- [ ] M1-T1 Fonctions partagées : dates, plaques, kilométrage
- [ ] M1-T2 Auth API (inscription, connexion, sessions)
- [ ] M1-T3 Protection API (CSRF Origin, helmet, rate-limit)
- [ ] M1-T4 Auth UI et routes protégées
- [ ] M2-T1 API véhicules
- [ ] M2-T2 API relevés kilométriques
- [ ] M2-T3 UI véhicules (fiche, compteur, formulaires)
- [ ] M3-T1 Moteur d'échéances partagé
- [ ] M3-T2 API plan d'entretien et modèles
- [ ] M3-T3 UI plan d'entretien
- [ ] M4-T1 API interventions
- [ ] M4-T2 UI carnet et action « Fait »
- [ ] M4-T3 Exports CSV et JSON
- [ ] M5-T1 API échéances agrégées
- [ ] M5-T2 UI tableau de bord
- [ ] M5-T3 Premier lancement (assistant 3 étapes)
- [ ] M6-T1 Mailer et gabarits
- [ ] M6-T2 Socle notifications (tables, chiffrement, digest, dispatcher)
- [ ] M6-T3 Canal email et API des canaux
- [ ] M6-T4 PWA installable et canal téléphone (Web Push)
- [ ] M6-T5 Canal ntfy
- [ ] M6-T6 Job de rappel multi-canal
- [ ] M6-T7 UI Notifications
- [ ] M6-T8 Paramètres du compte, mot de passe oublié et suppression du compte
- [ ] M7-T1 Finitions PWA
- [ ] M7-T2 Image Docker et compose
- [ ] M7-T3 Sauvegarde SQLite
- [ ] M7-T4 Déploiement LXC Proxmox
- [ ] M7-T5 Tests e2e du parcours principal
- [ ] M7-T6 Supervision et sauvegarde hors site
- [ ] M7-T7 Recette manuelle des notifications

## Suivi M8 (juste après la mise en service)

- [ ] M8-T1 Import CSV de l'historique
- [ ] M8-T2 Photos de factures et PV (pièces jointes)

---

## M0 — Socle

### M0-T1 Initialisation du dépôt
- Dépend de : —
- À faire : `package.json` unique (ESM, `"engines": { "node": ">=22" }`, `packageManager` pnpm), TypeScript strict (`tsconfig.json` + `tsconfig.server.json` si nécessaire, `noUncheckedIndexedAccess`), Vite + React dans `src/client`, Fastify dans `src/server/index.ts` avec route `/health` provisoire, alias `@shared/*`, `@client/*`, `@server/*`. Scripts `dev`, `build`, `start`. `.gitignore` (`node_modules`, `dist`, `data`, `.env`, `deploy/production.env.draft`). Copier `deploy/.env.example` à la racine si absent. Si pnpm ≥ 10 : autoriser les scripts de build natifs (`"pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "esbuild"] }`).
- Critères d'acceptation :
  - `pnpm dev` : la page Vite s'affiche sur :5173 et `GET /api/v1/ping` via proxy répond `{ "pong": true }`.
  - `pnpm build && pnpm start` : `http://localhost:3000/` sert le front, `/health` répond 200.
- Hors périmètre : UI, BDD.

### M0-T2 Outillage qualité et CI
- Dépend de : M0-T1
- À faire : ESLint flat config (typescript-eslint strict-type-checked, react-hooks, import order), Prettier, Vitest (config multi-projets `unit`/`api`), script `typecheck`. Workflow `.github/workflows/ci.yml` : install (cache pnpm), typecheck, lint, test, build sur push/PR.
- Critères : un test factice passe ; la CI passe sur une branche ; `pnpm lint` échoue sur un `any` volontaire.

### M0-T3 UI de base
- Dépend de : M0-T1
- À faire : Tailwind v4 + `shadcn init` ; composants : button, input, label, select, textarea, dialog, sheet, tabs, badge, card, dropdown-menu, sonner (toasts), form. Tokens de `docs/DESIGN.md` en variables CSS (clair + sombre via `prefers-color-scheme` et classe `.dark`). Polices `@fontsource`. Layout `AppShell` (barre haute + contenu) responsive. Composants maison `PlateBadge`, `WarningLamps`, `ArcOdometer`, `DueGauge`, `StatusChip`, `JournalRow`, `EmptyState` (rendus identiques à `docs/prototype.html`, spécifiés dans `docs/DESIGN.md`).
- Critères : page `/styleguide` (dev uniquement) affichant tous les composants en clair et sombre ; aucun débordement horizontal à 360 px.

### M0-T4 Base SQLite, schéma et migrations
- Dépend de : M0-T1
- À faire : `src/server/db/schema.ts` conforme à `ARCHITECTURE.md` §4 (toutes les tables, index, CHECK, **sauf** `notification_channels`, `notification_log` et les colonnes `users.notify_time` / `last_digest_date`, ajoutées en M6-T2), `client.ts` avec pragmas, `drizzle.config.ts`, première migration générée, `migrate.ts` exécuté au démarrage, scripts `db:generate`/`db:migrate`. Helper de test `createTestDb()` (SQLite `:memory:` migrée).
- Critères : test vérifiant `foreign_keys = 1`, cascade véhicule → relevés/règles/interventions, refus d'une règle sans intervalle (CHECK), unicité `(user_id, plate)`.

### M0-T5 Config, erreurs, logs, healthcheck
- Dépend de : M0-T4
- À faire : `config.ts` (Zod sur `process.env`, valeurs par défaut de `.env.example`), `buildApp(deps)` séparé de `index.ts`, gestionnaire d'erreurs central (format `{ error: { code, message, details } }`, Zod → 400), 404 JSON sous `/api`, fallback SPA (`index.html`) pour les autres routes GET, pino avec `redact` (password, token, cookie, authorization), `/health` vérifie `SELECT 1`, arrêt propre (SIGTERM : close app + db).
- Critères : tests inject : 404 API au bon format ; erreur Zod → 400 ; `/health` 200 ; démarrage refusé avec `APP_URL` invalide (test sur `loadConfig`).

## M1 — Comptes

### M1-T1 Fonctions partagées : dates, plaques, kilométrage
- Dépend de : M0-T2
- À faire : `src/shared/dates.ts` (`isISODate`, `addDays`, `addMonths` avec borne fin de mois, `diffDays`, `todayInTz(tz)` côté serveur uniquement dans `src/server/lib`), `plate.ts` (`normalizePlate` : majuscules, espaces/sans tirets → `AB-123-CD` ; `isValidPlate` format SIV `^[A-Z]{2}-\d{3}-[A-Z]{2}$` ; le contrôle des lettres interdites I/O/U n'est pas requis au MVP), `mileage.ts` (`checkReading(readings, {date, km})` → `null | { code: 'TOO_LOW' | 'TOO_HIGH', boundKm }`).
- Critères : tests unitaires couvrant fins de mois, années bissextiles, plaques avec/sans tirets/espaces/minuscules, relevé égal à la borne accepté, inférieur refusé.

### M1-T2 Auth API
- Dépend de : M0-T5, M1-T1
- À faire : `auth/password.ts` (argon2id hash/verify), `auth/sessions.ts` (création token 32 octets base64url, stockage sha256, lecture, renouvellement glissant, suppression), plugin `authenticate` décorant `req.user` et `requireAuth` pour toutes les routes sauf `/auth/*` publiques et `/health`. Routes register/login/logout/me selon le contrat. `REGISTRATION_OPEN`.
- Critères (tests API) : inscription → cookie posé → `/auth/me` 200 ; email en double 409 ; mot de passe < 12 → 400 ; login mauvais mot de passe → 401 message générique ; logout → `/auth/me` 401 ; session expirée → 401 ; aucun token brut en base.

### M1-T3 Protection API
- Dépend de : M1-T2
- À faire : hook `onRequest` vérifiant `Origin` (ou `Referer`) = `APP_URL` pour POST/PUT/PATCH/DELETE ; `@fastify/helmet` (CSP `default-src 'self'`, polices locales) ; `@fastify/rate-limit` (global + routes auth) ; `TRUST_PROXY`.
- Critères : POST sans Origin ou avec Origin étrangère → 403 ; 11e tentative de login en 15 min → 429 ; en-têtes CSP présents.

### M1-T4 Auth UI et routes protégées
- Dépend de : M0-T3, M1-T2
- À faire : `lib/api.ts` (fetch JSON, `credentials: 'include'`, erreurs typées), hook `useSession` (TanStack Query sur `/auth/me`), pages `/connexion`, `/inscription`, garde de route (redirection vers `/connexion?retour=…`), menu utilisateur (déconnexion).
- Critères : parcours inscription → arrivée sur le tableau de bord vide ; refresh conserve la session ; erreurs serveur affichées sous le champ concerné.

## M2 — Véhicules et kilométrage

### M2-T1 API véhicules
- Dépend de : M1-T2, M0-T4
- À faire : routes `/vehicles` selon contrat ; création transactionnelle (véhicule + relevé `initial` + plan de base si `withBasePlan`, à partir de `BASE_PLAN` de `src/shared/templates.ts`) ; `requireVehicle` ; liste enrichie de `currentKm` (sans échéances tant que M3 n'est pas fait : `worstStatus: null`).
- Critères : un utilisateur B reçoit 404 sur le véhicule de A (GET, PATCH, DELETE) ; plaque normalisée et unique par compte (409) ; plan de base = 4 règles.

### M2-T2 API relevés kilométriques
- Dépend de : M2-T1
- À faire : GET/POST `/vehicles/:id/readings`, DELETE `/readings/:id` ; validation `checkReading` → 409 `{ code: 'CONFLICT', details: { reason, boundKm } }` ; date ≤ aujourd'hui (Europe/Paris).
- Critères : tests monotonie (avant/après/égal) ; suppression d'un relevé `initial` refusée (409).

### M2-T3 UI véhicules
- Dépend de : M1-T4, M2-T2
- À faire : sélecteur de véhicule (barre haute, pastille du pire statut prévue), fiche véhicule (plaque, compteur, rythme km/mois si disponible, dépenses 12 mois prévues à 0), formulaires création/édition (Sheet sur mobile, Dialog sur desktop), relevé km, suppression avec confirmation explicite (saisie de la plaque).
- Critères : création d'un véhicule en < 1 min sur 375 px ; erreurs 409 affichées en français ; état vide guidé « Ajoutez votre premier véhicule ».

## M3 — Plan d'entretien et échéances

### M3-T1 Moteur d'échéances partagé
- Dépend de : M1-T1
- À faire : `src/shared/due-engine.ts` conforme à `ARCHITECTURE.md` §5 et au comportement de `computeDue` dans `docs/prototype.html`.
- Critères : **tous** les cas du tableau §5 en tests ; couverture 100 % lignes/branches de `due-engine.ts`.

### M3-T2 API plan d'entretien et modèles
- Dépend de : M2-T1, M3-T1
- À faire : `src/shared/templates.ts` (catégories, `RULE_TEMPLATES`, `BASE_PLAN`), routes rules + `/rule-templates`, `services/due.service.ts` (charge relevés/règles/interventions d'un véhicule en 3 requêtes, appelle le moteur), `GET /vehicles/:id/due`, `worstStatus` et `counts` dans `GET /vehicles`.
- Critères : règle sans intervalle → 400 ; `baselineKm` sans `baselineDate` → 400 ; `/vehicles/:id/due` trié selon §5.10.

### M3-T3 UI plan d'entretien
- Dépend de : M2-T3, M3-T2
- À faire : onglet « Plan d'entretien » (table desktop, liste mobile), formulaire règle avec sélection de modèle, édition, retrait avec confirmation, mention « valeurs indicatives ».
- Critères : ajout d'une règle depuis un modèle en 2 clics + enregistrer ; `unknown` affiché avec invitation à saisir la dernière intervention.

## M4 — Carnet

### M4-T1 API interventions
- Dépend de : M3-T2, M2-T2
- À faire : routes interventions ; POST/PATCH/DELETE transactionnels avec le relevé lié ; `ruleId` doit appartenir au véhicule (sinon 400) ; `costCents` entier.
- Critères : création → échéance de la règle liée recalculée (test via `/vehicles/:id/due`) ; suppression → relevé lié supprimé ; km incohérent → 409 sans écriture partielle.

### M4-T2 UI carnet et action « Fait »
- Dépend de : M3-T3, M4-T1
- À faire : onglet « Journal » (lignes `JournalRow`, total dépensé), formulaire intervention (règle liée → pré-remplit libellé/catégorie, km par défaut = courant, coût en euros converti en centimes), bouton « Fait » sur chaque échéance ouvrant le formulaire pré-rempli, édition/suppression, onglet « Échéances » du véhicule (grille de `DueGauge`).
- Critères : depuis une échéance `overdue`, « Fait » + Enregistrer → l'échéance passe `ok` sans rechargement manuel (invalidation TanStack Query).

### M4-T3 Exports CSV et JSON
- Dépend de : M4-T1
- À faire : `GET /vehicles/:id/export.csv` (BOM, séparateur `;`, échappement des guillemets, montants en euros avec virgule décimale `12,50` pour Excel FR — ADR-007), `GET /export.json` ; boutons dans l'UI (téléchargement via lien `href` vers l'API).
- Critères : test CSV avec virgule, guillemet et retour ligne dans les notes ; export JSON ne contient ni `password_hash` ni sessions.

## M5 — Tableau de bord

### M5-T1 API échéances agrégées
- Dépend de : M3-T2
- À faire : `GET /due` sur tous les véhicules de l'utilisateur, une passe de requêtes groupées (pas de N+1 : 3 requêtes `IN (...)`).
- Critères : test avec 2 véhicules et 2 comptes : uniquement les règles du compte courant ; tri global correct.

### M5-T2 UI tableau de bord
- Dépend de : M5-T1, M4-T2
- À faire : page d'accueil `/` conforme à la vue « Bord » de `docs/prototype.html` et aux maquettes `docs/maquettes/B-Bord-Desktop.dc.html` / `B-Accueil.dc.html` : en-tête (date, nombre de véhicules, pastilles de statut globales), cartes véhicule (nom, plaque, `WarningLamps` compacts, km, prochaine échéance ; clic ⇒ fiche), carte « + Ajouter un véhicule », section « À faire » (grille de `DueGauge` `overdue` puis `soon`, tous véhicules, modèle en surtitre, bouton « Fait » qui ouvre le formulaire du bon véhicule), section « Ensuite » (5 prochaines échéances `ok`), mention des règles « sans référence ». Sélecteur haut : « Bord » + un onglet par véhicule. Accès rapide « + Intervention ».
- Critères : affichage complet sans scroll horizontal à 360 px ; état « Tout est à jour » quand aucune échéance proche ; « Fait » depuis le tableau de bord sur la Clio pré-sélectionne la Clio.

### M5-T3 Premier lancement (assistant 3 étapes)
- Dépend de : M5-T2, M3-T2
- Spécification : `PRODUCT.md` F11, fonction `renderOnboarding` / `finishOnboarding` de `docs/prototype.html`, maquette `docs/maquettes/B-Bienvenue.dc.html`.
- À faire : API : `POST /vehicles` accepte un champ facultatif `rules: RuleInput[]` (avec `baselineDate` / `baselineKm`), exclusif de `withBasePlan`, tout dans la même transaction. UI : route `/bienvenue` affichée automatiquement quand le compte n'a aucun véhicule (redirection depuis `/`) ; étape 1 véhicule + km actuel, étape 2 cases à cocher des modèles (les 4 du plan de base cochées), étape 3 date + km de la dernière fois pour chaque opération cochée (vide = « sans référence ») ; boutons Retour / Continuer / Créer mon carnet ; état conservé entre étapes (pas de perte au retour arrière) ; fin ⇒ tableau de bord + invitation à activer les notifications.
- Critères : opération au km avec date mais sans km ⇒ erreur « indiquez aussi le kilométrage » ; km de référence > km actuel ⇒ erreur ; date future ⇒ erreur ; création atomique (échec d'une règle ⇒ rien n'est créé) ; un compte avec véhicule n'est jamais redirigé vers `/bienvenue`.

## M6 — Notifications (email, téléphone, ntfy)

Spécification : `PRODUCT.md` F8 + F8-détail, `ARCHITECTURE.md` §4 (`notification_channels`, `notification_log`), §6 (routes `/notifications/*`), §7 (sécurité), §8. Référence visuelle et texte des messages : panneau « Notifications » et `buildDigest` de `docs/prototype.html`.

### M6-T1 Mailer et gabarits
- Dépend de : M0-T5
- À faire : `mail/mailer.ts` (nodemailer, transport injecté pour les tests, `SMTP_*`), gabarits texte + HTML minimal : digest d'échéances (groupé par véhicule, bouton « Ouvrir le carnet », lien de désinscription), vérification d'adresse, réinitialisation de mot de passe, notification de test.
- Critères : tests avec transport `jsonTransport` : sujet, destinataire, contenu attendu ; échappement HTML des libellés utilisateur ; en-têtes `List-Unsubscribe` présents sur le digest.

### M6-T2 Socle notifications
- Dépend de : M6-T1, M5-T1
- À faire : tables `notification_channels` / `notification_log` et colonnes `users.notify_time` / `last_digest_date` (nouvelle migration), `notifications/crypto.ts` (seal/open AES-256-GCM, `SECRETS_KEY`), interface `NotificationChannel`, `digest.ts` (`buildDigest` : titre, texte court ≤ 3 lignes sans immatriculation, `urgent`), `dispatcher.ts` (envoi d'un message sur une liste de canaux, mise à jour succès/échecs, désactivation après 5 échecs ou échec permanent, journalisation par canal). Canal factice `fake` pour les tests (non exposé à l'API). Ajout à `config.ts` : `SECRETS_KEY` obligatoire ; `VAPID_*` et `NTFY_ALLOWED_SERVERS` facultatifs (canal correspondant indisponible et masqué dans l'UI s'ils manquent).
- Critères : seal → open restitue la config, ciphertext altéré → erreur ; mauvaise `SECRETS_KEY` au démarrage → refus ; `buildDigest` reproduit les sorties du prototype (« Entretien : 1 en retard, 4 à prévoir », « + 2 autres ») ; dispatcher : un canal en échec n'empêche pas les autres, 5e échec ⇒ `enabled = 0`.
- Hors périmètre : canaux réels, job.

### M6-T3 Canal email et API des canaux
- Dépend de : M6-T2, M1-T3
- À faire : `channels/email.ts` ; routes `/notifications/channels` (GET, POST, PATCH, DELETE, `/:id/test`), `/notifications/verify-email`, `/notifications/unsubscribe` (token HMAC-SHA256 avec `SECRETS_KEY`, sans session) ; canal email créé automatiquement à l'inscription avec l'adresse du compte (vérifiée d'office) ; limites (10 canaux, 5 tests / 10 min).
- Critères (tests API) : réponses sans aucun secret ; isolation par compte (404) ; doublon 409 ; adresse secondaire non vérifiée ⇒ jamais utilisée par le dispatcher ; lien de désinscription désactive le seul canal visé ; test sur SMTP en panne ⇒ 502 `CHANNEL_FAILED`.

### M6-T4 PWA installable et canal téléphone (Web Push)
- Dépend de : M6-T3, M5-T2
- À faire : `public/manifest.webmanifest` (nom, `display: standalone`, `start_url: /`, couleurs des tokens), icônes 192/512 + maskable + apple-touch-icon, balises meta ; `public/sw.js` (push + notificationclick uniquement, aucun `fetch`), enregistrement du SW au démarrage du client ; `channels/webpush.ts` (`web-push`, VAPID depuis l'env), route `vapid-public-key` ; côté client `features/notifications/usePush.ts` : détection du support (`'PushManager' in window`), cas iOS hors écran d'accueil (message d'aide au lieu du bouton), `Notification.requestPermission()` puis `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`, envoi de l'abonnement, libellé par défaut « <OS> · <navigateur> ».
- Critères : test unitaire `webpush.send` avec réponse 410 ⇒ résultat permanent ⇒ canal supprimé par le dispatcher ; endpoint `http:` refusé (400) ; manuel : notification de test reçue sur Android (Chrome) et sur iPhone avec la PWA installée ; clic ⇒ ouvre le tableau de bord.
- Hors périmètre : cache hors ligne.

### M6-T5 Canal ntfy
- Dépend de : M6-T3
- À faire : `channels/ntfy.ts` (POST `{server}/{topic}`, en-têtes `Title`, `Priority`, `Tags`, `Click`, `Authorization` facultatif, `redirect: 'error'`, timeout 5 s), validation : https, origine ∈ `NTFY_ALLOWED_SERVERS`, sujet `^[A-Za-z0-9_-]{8,64}$` ; sujet aléatoire proposé par l'API si absent ; jeton scellé, jamais renvoyé.
- Critères : serveur hors liste ⇒ 400 ; redirection ⇒ échec sans suivi ; 403 ⇒ échec permanent ; en-têtes et corps conformes (test avec serveur HTTP local injecté via `fetch` mocké).

### M6-T6 Job de rappel multi-canal
- Dépend de : M6-T2, M6-T3 (les canaux push/ntfy s'ajoutent sans changer le job)
- À faire : `jobs/reminders.ts` conforme à §8.2, tick `node-cron` dans `index.ts` (`REMINDER_CRON`, `off` possible), options `--dry-run`, `--user`, `--force`.
- Critères : utilisateur à 07:30 traité au premier tick ≥ 07:30, une seule fois par jour ; redémarrage à 09:00 ⇒ rattrapage ; email OK + push KO ⇒ log seulement sur l'email, le push retente au digest suivant ; passage `soon` → `overdue` ⇒ nouvel envoi ; intervention liée (nouveau `due_key`) ⇒ cycle réinitialisé ; aucun item ⇒ aucun envoi mais `last_digest_date` mis à jour ; canal réactivé ⇒ pas de renvoi des items déjà journalisés.

### M6-T7 UI Notifications
- Dépend de : M6-T4, M6-T5, M6-T6
- À faire : page `/parametres/notifications` reproduisant le panneau du prototype : heure du rappel (créneaux de 15 min), cartes Email / Téléphone (liste des appareils, renommer, retirer, « Activer sur cet appareil ») / ntfy (serveur parmi la liste autorisée, sujet, jeton, bouton copier le sujet), « Envoyer un test » par canal, état `failing`/`disabled` avec dernière erreur lisible, aperçu téléphone et email générés par `buildDigest`. Bandeau sur le tableau de bord si aucun canal actif ou si un canal est désactivé pour échecs.
- Critères : parcours complet à 375 px ; le jeton ntfy n'apparaît jamais après enregistrement (champ « •••• remplacé ») ; erreurs API affichées sous le bon champ.

### M6-T8 Paramètres du compte, mot de passe oublié et suppression du compte
- Dépend de : M6-T1, M1-T4, M4-T3
- À faire : page `/parametres` (nom, changer de mot de passe, lien vers Notifications, « Exporter mes données » = `/export.json`, zone « Supprimer mon compte »), `forgot-password` / `reset-password` (token 32 octets, sha256 en base, 1 h, usage unique, invalide les sessions), `DELETE /me` (voir `PRODUCT.md` F12 et `ARCHITECTURE.md` §6) : mot de passe exigé, saisie de « SUPPRIMER » côté UI, suppression définitive en une transaction (cascade véhicules, relevés, règles, interventions, canaux, journal de notifications, sessions, resets ; fichiers joints quand M8-T2 existe), cookie effacé, email de confirmation envoyé à l'adresse du compte **avant** suppression.
- Critères : forgot sur email inconnu → 204 sans email ; token réutilisé → 400 ; après reset, ancienne session → 401 ; `DELETE /me` sans mot de passe ou mauvais mot de passe → 401 sans rien supprimer ; après suppression : plus aucune ligne liée à l'utilisateur dans aucune table (test qui parcourt toutes les tables), login impossible, l'email est réutilisable pour une nouvelle inscription.

## M7 — Livraison

### M7-T1 Finitions PWA
- Dépend de : M6-T4
- À faire : icônes définitives, écrans de démarrage iOS, invite d'installation discrète sur mobile (après le premier véhicule ajouté), lien d'aide « Installer sur iPhone » depuis la carte Téléphone.
- Critères : Lighthouse « Installable » OK en production derrière HTTPS ; notifications push reçues avec la PWA installée sur Android et iOS.

### M7-T2 Image Docker et compose
- Dépend de : M0-T5
- À faire : valider/adapter `deploy/Dockerfile` et `deploy/docker-compose.yml` fournis (build multi-étapes, utilisateur non root, `HEALTHCHECK`, volume `/data`, `read_only`).
- Critères : `docker compose --env-file .env -f deploy/docker-compose.yml up -d --build` → `/health` 200 ; redémarrage conserve les données ; l'image < 250 Mo.

### M7-T3 Sauvegarde SQLite
- Dépend de : M0-T4
- À faire : script `db:backup` (`src/server/db/backup.ts`) : `db.backup()` vers `DATA_DIR/backups/carnet-YYYYMMDD-HHmm.db`, rotation des 14 plus récentes, code de sortie ≠ 0 en cas d'échec ; documenter le cron hôte (voir `docs/DEPLOYMENT.md` §3).
- Critères : test d'intégration : sauvegarde restaurable (ouverture + `PRAGMA integrity_check` = ok).

### M7-T4 Déploiement LXC Proxmox
- Dépend de : M7-T2
- À faire : suivre `docs/DEPLOYMENT.md` (option A par défaut : accès public via le VPS et Tailscale ; option B : Tailscale uniquement). Valider `deploy/proxmox/create-lxc.sh` en `--dry-run`, puis déploiement réel ; `APP_URL`, `TRUST_PROXY` (IP du proxy), `APP_BIND` ; job de sauvegarde PBS du CT.
- Critères : application accessible en HTTPS ; rappel email reçu en conditions réelles (SMTP configuré) ; restauration testée depuis PBS.

### M7-T5 Tests e2e du parcours principal
- Dépend de : M5-T3, M6-T7, M6-T8
- À faire : Playwright (Chromium, viewport mobile 390×844) : inscription → premier lancement (véhicule, plan de base, dernière vidange) → échéance visible sur le tableau de bord → « Fait » → échéance `ok` → export CSV → suppression du compte.
- Critères : test vert en CI (serveur lancé sur SQLite temporaire).

### M7-T6 Supervision et sauvegarde hors site
- Dépend de : M7-T3, M7-T4
- À faire : sonde HTTP sur `/health` (Uptime Kuma ou équivalent du homelab, toutes les 60 s, alerte via ntfy) ; copie quotidienne des sauvegardes `DATA_DIR/backups` hors du nœud Proxmox (`deploy/backup-offsite.sh` : rsync/rclone vers une cible configurée, vérification `PRAGMA integrity_check` de la copie, code de sortie ≠ 0 en échec) ; `SECRETS_KEY` et `.env` sauvegardés dans le gestionnaire de mots de passe, **jamais** à côté de la base ; procédure de restauration écrite dans `docs/DEPLOYMENT.md` et testée une fois.
- Critères : arrêt du conteneur ⇒ alerte reçue en < 3 min ; restauration complète sur un CT vierge depuis la copie hors site, notifications fonctionnelles avec la `SECRETS_KEY` sauvegardée.

### M7-T7 Recette manuelle des notifications
- Dépend de : M6-T7, M7-T4
- À faire : dérouler `docs/TESTING-NOTIFICATIONS.md` en production (email, Android, iPhone avec la PWA installée, ntfy) et cocher chaque cas ; ouvrir une tâche pour chaque écart.
- Critères : tous les cas cochés ou un écart documenté avec sa tâche.

## M8 — Historique complet (juste après la mise en service)

### M8-T1 Import CSV de l'historique
- Dépend de : M4-T3, M6-T8
- Spécification : `PRODUCT.md` F13.
- À faire : `POST /vehicles/:id/import/preview` (corps `text/csv`, ≤ 1 Mo, ≤ 2 000 lignes) ⇒ lignes analysées avec erreurs par ligne, sans écriture ; `POST /vehicles/:id/import` (mêmes données + `confirm: true`) ⇒ insertion transactionnelle des interventions et relevés, rattachement automatique aux règles par libellé exact (sinon « hors plan »). Format accepté = celui de l'export (`date;km;categorie;intervention;garage;cout_eur;notes`, BOM toléré, `;` ou `,` détecté, montants `12,50` ou `12.50`, dates `YYYY-MM-DD` ou `JJ/MM/AAAA`). UI : bouton « Importer » dans l'onglet Journal, aperçu tableau avec lignes en erreur surlignées, import des lignes valides seulement sur confirmation. Modèle téléchargeable.
- Critères : un export réimporté sur un véhicule vide donne le même journal ; ligne violant la monotonie km ⇒ erreur sur la ligne, aucune écriture ; cellules commençant par `=`, `+`, `-`, `@` traitées comme texte et neutralisées à l'export (injection de formules).

### M8-T2 Photos de factures et PV (pièces jointes)
- Dépend de : M4-T1, M6-T8
- Spécification : `PRODUCT.md` F14, `ARCHITECTURE.md` §4 (`attachments`).
- À faire : table `attachments`, stockage `DATA_DIR/files/<aa>/<uuid>` (nom de fichier jamais issu de l'utilisateur), upload `@fastify/multipart` 10 Mo max, types PDF/JPEG/PNG/WebP/HEIC vérifiés par signature (magic bytes), JPEG/PNG ré-encodés côté serveur sans métadonnées EXIF (localisation), téléchargement authentifié avec `Content-Disposition: attachment` et `X-Content-Type-Options: nosniff` ; quota 200 Mo par compte ; prise de photo mobile via `<input type="file" accept="image/*,application/pdf" capture="environment">` ; vignettes dans le journal. Suppression d'intervention ou de compte ⇒ fichiers supprimés. Export JSON + archive ZIP des fichiers.
- Critères : fichier renommé `.pdf` contenant du HTML ⇒ 400 ; accès au fichier d'un autre compte ⇒ 404 ; EXIF GPS absent après upload ; quota dépassé ⇒ 413 explicite ; suppression du compte ⇒ dossier vide.

---

## V1 — Confort (après mise en service du MVP)

| ID | Fonction | Notes |
|---|---|---|
| V1-01 | Archivage d'un véhicule vendu | `archived_at`, exclu des rappels, historique consultable |
| V1-02 | ~~Pièces jointes~~ | Avancé en M8-T2 |
| V1-03 | Suivi carburant | Pleins (date, km, litres, prix, plein complet), L/100 km entre deux pleins complets |
| V1-04 | Dépenses et graphiques | Par mois et catégorie, coût au km |
| V1-05 | Export PDF de l'historique | Rendu serveur (gabarit HTML → PDF) |
| V1-06 | Canaux supplémentaires | Telegram (bot), SMS via fournisseur payant (coût par envoi à évaluer), Gotify ; même interface `NotificationChannel` |
| V1-07 | Flux calendrier ICS | URL secrète par compte, échéances datées |
| V1-08 | Connexion Google (OIDC) | Liaison au compte existant par email vérifié |
| V1-09 | Partage foyer | Rôles `owner` / `editor` / `viewer` par véhicule |
| V1-10 | Premier CT calculé | À partir de la date de première mise en circulation |
| V1-11 | Mode hors ligne lecture | Cache service worker des dernières données |

## V2 — Valeur à la revente

| ID | Fonction | Notes |
|---|---|---|
| V2-01 | Pré-remplissage par immatriculation | API tierce payante à évaluer (coût, RGPD) |
| V2-02 | Plans constructeur pré-chargés | Jeu de données maison par motorisation |
| V2-03 | Historique certifié | Chaînage SHA-256 des interventions + page publique lecture seule + QR code |
| V2-04 | Score d'entretien | Respect des échéances sur la période de possession |
| V2-05 | Transfert du carnet | Invitation du nouveau propriétaire |
| V2-06 | Migration PostgreSQL (si multi-instance) | Drizzle, même schéma |

## V3 — Ouverture

OCR des factures, annuaire de garages et avis, offre payante (Stripe), offre flotte B2B, enveloppe TWA pour le Play Store (réutilise la PWA, pas de code natif).
