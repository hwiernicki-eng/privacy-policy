# ARCHITECTURE — Carnet d'entretien

## 1. Principes

- **Un seul dépôt, un seul `package.json`, un seul conteneur.** Fastify sert l'API `/api/v1/*` et les fichiers statiques du build Vite.
- **SQLite** (fichier dans `DATA_DIR`) : zéro service externe, sauvegarde = copie de fichier / Proxmox Backup Server. Migration vers PostgreSQL possible plus tard via Drizzle (voir DECISIONS).
- **Logique métier partagée et pure** dans `src/shared/` (utilisée par l'API, le job de rappel et l'UI).

## 2. Stack (figée)

| Couche | Choix |
|---|---|
| Runtime | Node.js 22 LTS, pnpm 9+, TypeScript 5 strict, ESM |
| Front | React 18, Vite, React Router (mode SPA), TanStack Query v5, react-hook-form + @hookform/resolvers + zod |
| UI | Tailwind CSS v4, shadcn/ui, lucide-react, polices Saira / Saira Condensed / JetBrains Mono (auto-hébergées via `@fontsource`) |
| API | Fastify 5, `fastify-type-provider-zod`, `@fastify/cookie`, `@fastify/static`, `@fastify/helmet`, `@fastify/rate-limit`, pino |
| BDD | SQLite via `better-sqlite3`, Drizzle ORM + drizzle-kit (migrations SQL versionnées dans `drizzle/`) |
| Auth | Sessions serveur maison : `@node-rs/argon2` (argon2id), token aléatoire 32 octets en cookie, hash SHA-256 en base |
| Notifications | nodemailer (SMTP), `web-push` (VAPID, RFC 8030/8291), ntfy via `fetch` natif |
| Planification | `node-cron` dans le process serveur, tick toutes les 15 min (fuseau `TZ`) |
| Chiffrement secrets | AES-256-GCM (`node:crypto`), clé `SECRETS_KEY` |
| Tests | Vitest (unitaires + API via `app.inject()` sur SQLite `:memory:`), Playwright (smoke e2e, M7) |
| Qualité | ESLint (flat config, typescript-eslint, react-hooks), Prettier, GitHub Actions |
| Build serveur | tsup → `dist/server/index.js` |

## 3. Arborescence cible

```
.
├── CLAUDE.md
├── docs/                     # PRODUCT, ARCHITECTURE, ROADMAP, DESIGN, DECISIONS, prototype.html
├── drizzle/                  # migrations SQL générées (immutables une fois commitées)
├── deploy/                   # Dockerfile, docker-compose.yml, proxmox/create-lxc.sh
├── public/                   # manifest.webmanifest, icônes PWA, sw.js (push uniquement)
├── index.html
├── src/
│   ├── shared/               # PUR : aucune dépendance node/DOM
│   │   ├── dates.ts          # addDays, addMonths (clamp fin de mois), diffDays, isISODate
│   │   ├── due-engine.ts     # computeDue, avgKmPerDay, currentKm, sortDue, worstStatus
│   │   ├── mileage.ts        # checkReading (monotonie)
│   │   ├── plate.ts          # normalizePlate, isValidPlate
│   │   ├── templates.ts      # RULE_TEMPLATES, BASE_PLAN, CATEGORIES
│   │   └── schemas.ts        # schémas Zod (entrées/sorties API, formulaires)
│   ├── server/
│   │   ├── index.ts          # bootstrap : config → migrations → app → listen → cron
│   │   ├── app.ts            # buildApp(deps) : plugins + routes (testable avec inject)
│   │   ├── config.ts         # env validé par Zod
│   │   ├── db/
│   │   │   ├── client.ts     # ouverture SQLite (WAL, foreign_keys=ON, busy_timeout)
│   │   │   ├── schema.ts     # tables Drizzle
│   │   │   └── migrate.ts
│   │   ├── auth/             # password.ts, sessions.ts, plugin.ts (decorate req.user), routes.ts
│   │   ├── routes/           # vehicles.ts, readings.ts, rules.ts, interventions.ts, due.ts, export.ts, settings.ts
│   │   ├── services/         # due.service.ts (charge les données + appelle shared/due-engine)
│   │   ├── jobs/reminders.ts # tick 15 min : sélection des utilisateurs dus, digest, envoi multi-canal
│   │   ├── notifications/
│   │   │   ├── digest.ts     # buildDigest(dueItems) → { title, shortBody, items } (texte court sans plaque)
│   │   │   ├── dispatcher.ts # envoi sur les canaux actifs, journalisation, compteur d'échecs
│   │   │   ├── crypto.ts     # seal/open AES-256-GCM des secrets de canal
│   │   │   └── channels/     # email.ts, webpush.ts, ntfy.ts — interface NotificationChannel
│   │   ├── mail/             # mailer.ts, templates/*.ts (texte + HTML simple)
│   │   └── lib/              # errors.ts, require-vehicle.ts, csv.ts
│   └── client/
│       ├── main.tsx, App.tsx, router.tsx
│       ├── lib/api.ts        # fetch wrapper (credentials: 'include', erreurs typées)
│       ├── components/ui/    # shadcn
│       ├── components/       # PlateBadge, WarningLamps, ArcOdometer, DueGauge, StatusChip, JournalRow, EmptyState
│       └── features/
│           ├── auth/  vehicles/  readings/  rules/  interventions/  dashboard/  settings/  notifications/
└── tests/
    ├── unit/                 # shared/*
    ├── api/                  # routes via inject
    └── e2e/                  # playwright
```

Scripts `package.json` : `dev` (concurrently `vite` + `tsx watch src/server/index.ts`), `build` (`vite build && tsup`), `start`, `typecheck`, `lint`, `format`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:backup`.
Vite : `build.outDir = dist/client`, proxy `/api` → `http://localhost:3000`.

## 4. Modèle de données (SQLite / Drizzle)

Identifiants : `TEXT` UUID v4 (`crypto.randomUUID()`). `created_at` / `updated_at` : `INTEGER` epoch ms. Toutes les FK `ON DELETE CASCADE` sauf mention.

```sql
users (
  id TEXT PK,
  email TEXT NOT NULL UNIQUE,              -- stocké en minuscules, trim
  password_hash TEXT NOT NULL,             -- argon2id
  display_name TEXT,
  notify_time TEXT NOT NULL DEFAULT '07:30',  -- HH:MM, multiple de 15 min, fuseau TZ
  last_digest_date TEXT,                     -- YYYY-MM-DD du dernier passage du job (envoi ou rien à signaler)
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
)

sessions (
  id TEXT PK,                              -- sha256(token) en hex ; le token brut n'est jamais stocké
  user_id TEXT NOT NULL → users,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  user_agent TEXT
)  INDEX (user_id)

password_resets (
  id TEXT PK,                              -- sha256(token)
  user_id TEXT NOT NULL → users,
  expires_at INTEGER NOT NULL,             -- +1 h
  used_at INTEGER
)

vehicles (
  id TEXT PK,
  user_id TEXT NOT NULL → users,
  plate TEXT NOT NULL,                     -- normalisé AB-123-CD
  make TEXT NOT NULL, model TEXT NOT NULL, engine TEXT,
  year INTEGER NOT NULL,
  fuel TEXT NOT NULL CHECK (fuel IN ('essence','diesel','hybride','electrique','gpl','autre')),
  vin TEXT, purchase_date TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  UNIQUE (user_id, plate)
)

mileage_readings (
  id TEXT PK,
  vehicle_id TEXT NOT NULL → vehicles,
  date TEXT NOT NULL,                      -- YYYY-MM-DD
  km INTEGER NOT NULL CHECK (km >= 0),
  source TEXT NOT NULL CHECK (source IN ('manual','intervention','initial')),
  intervention_id TEXT → interventions ON DELETE SET NULL,
  created_at INTEGER NOT NULL
)  INDEX (vehicle_id, date)

maintenance_rules (
  id TEXT PK,
  vehicle_id TEXT NOT NULL → vehicles,
  label TEXT NOT NULL, category TEXT NOT NULL,
  interval_km INTEGER CHECK (interval_km IS NULL OR interval_km > 0),
  interval_months INTEGER CHECK (interval_months IS NULL OR interval_months > 0),
  warn_km INTEGER NOT NULL DEFAULT 1500,
  warn_days INTEGER NOT NULL DEFAULT 30,
  baseline_date TEXT, baseline_km INTEGER,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  CHECK (interval_km IS NOT NULL OR interval_months IS NOT NULL)
)  INDEX (vehicle_id)

interventions (
  id TEXT PK,
  vehicle_id TEXT NOT NULL → vehicles,
  rule_id TEXT → maintenance_rules ON DELETE SET NULL,
  category TEXT NOT NULL, title TEXT NOT NULL,
  date TEXT NOT NULL, km INTEGER NOT NULL CHECK (km >= 0),
  cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (cost_cents >= 0),
  garage TEXT, notes TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
)  INDEX (vehicle_id, date), INDEX (rule_id)

notification_channels (
  id TEXT PK,
  user_id TEXT NOT NULL → users,
  type TEXT NOT NULL CHECK (type IN ('email','webpush','ntfy')),
  label TEXT NOT NULL,                     -- « Email », « Pixel 8 · Chrome », « ntfy »
  enabled INTEGER NOT NULL DEFAULT 1,
  config TEXT NOT NULL,                    -- JSON scellé AES-256-GCM (voir ci-dessous)
  dedupe_key TEXT NOT NULL,                -- email normalisé | endpoint push | server+topic : évite les doublons
  verified_at INTEGER,                     -- email : adresse vérifiée ; webpush/ntfy : à la création
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_success_at INTEGER, last_error TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  UNIQUE (user_id, dedupe_key)
)  INDEX (user_id)

-- config (avant scellement) :
--   email   { "address": "x@y.fr" }
--   webpush { "endpoint": "https://…", "keys": { "p256dh": "…", "auth": "…" }, "userAgent": "…" }
--   ntfy    { "server": "https://ntfy.sh", "topic": "carnet-7f3k…", "token": "tk_…" | null }

notification_log (
  id TEXT PK,
  channel_id TEXT NOT NULL → notification_channels,
  rule_id TEXT NOT NULL → maintenance_rules,
  due_key TEXT NOT NULL,                   -- `${due_km ?? ''}|${due_date ?? ''}`
  status TEXT NOT NULL CHECK (status IN ('soon','overdue')),
  sent_at INTEGER NOT NULL,
  UNIQUE (channel_id, rule_id, due_key, status)
)
```

Pragmas à l'ouverture : `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`, `synchronous = NORMAL`.

## 5. Moteur d'échéances (`src/shared/due-engine.ts`)

Fonctions pures, `today: string` (YYYY-MM-DD) toujours injecté.

```ts
type DueStatus = 'overdue' | 'soon' | 'ok' | 'unknown';
interface DueResult {
  ruleId: string; status: DueStatus;
  last: { date: string; km: number } | null;
  dueKm: number | null; dueDate: string | null;
  kmLeft: number | null; daysLeft: number | null;
  projectedDate: string | null;   // date estimée d'atteinte de dueKm
  effectiveDate: string | null;   // min(dueDate, projectedDate)
  effectiveDays: number | null;
  progress: number;               // 0..1, part de l'intervalle consommée
}
```

Algorithme (identique à `computeDue` de `docs/prototype.html`) :

1. **currentKm** = max(km) des relevés du véhicule (0 si aucun).
2. **avgKmPerDay** : relevés triés par date ; si ≥ 2 relevés dans les 365 derniers jours, n'utiliser que ceux-là. Si < 2 relevés ou écart < 30 jours → `null`. Sinon `(kmDernier − kmPremier) / jours` ; `null` si ≤ 0.
3. **last** = intervention liée à la règle la plus récente (date desc, puis km desc) ; sinon `baseline_date/baseline_km` (km = 0 si absent) ; sinon `null` → statut `unknown`.
4. `dueKm = last.km + interval_km` (si défini) ; `dueDate = addMonths(last.date, interval_months)` (si défini). `addMonths` borne au dernier jour du mois (31/01 + 1 mois = 28 ou 29/02).
5. `kmLeft = dueKm − currentKm` ; `daysLeft = diffDays(today, dueDate)`.
6. `projectedDate = today + ceil(max(0, kmLeft) / avg)` si `kmLeft` et `avg` non nuls.
7. `effectiveDate` = plus petite des dates disponibles parmi `dueDate`, `projectedDate`.
8. Statut :
   - `overdue` si `kmLeft ≤ 0` ou `daysLeft < 0` ;
   - sinon `soon` si `kmLeft ≤ warn_km` ou `effectiveDays ≤ warn_days` ;
   - sinon `ok`.
9. `progress = clamp(max((currentKm − last.km) / interval_km, diffDays(last.date, today) / diffDays(last.date, dueDate)), 0, 1)`.
10. **Tri** : `overdue` < `soon` < `ok` < `unknown`, puis `effectiveDays` croissant (null en dernier).

Cas de test obligatoires (tests/unit/due-engine.test.ts) — `today = 2026-10-07` :

| Cas | Données | Attendu |
|---|---|---|
| Km dépassé | interval 30 000 km, last 70 100 km, current 101 350 | `overdue`, kmLeft = −1 250 |
| Date proche | 24 mois, last 2024-10-28 | `soon`, daysLeft = 21 |
| Projection km | 20 000 km / 12 mois, last 2025-10-20 @ 85 100, current 101 350, avg ≈ 47 km/j | `soon` (daysLeft 13), kmLeft 3 750 |
| Égalité seuil | 24 mois, dueDate = today + 30, warn 30 | `soon` |
| Le jour J | dueDate = today | `soon` (daysLeft 0 n'est pas < 0) |
| Lendemain | dueDate = today − 1 | `overdue` |
| Sans référence | ni intervention ni baseline | `unknown` |
| Fin de mois | addMonths('2025-01-31', 1) | '2025-02-28' ; addMonths('2024-01-31', 1) = '2024-02-29' |
| Rythme indisponible | relevés sur 10 jours | avg null, projectedDate null |
| Intervention remet à zéro | intervention liée postérieure à la baseline | last = intervention |

## 6. Contrat API (`/api/v1`, JSON, cookies de session)

Erreurs : `{ "error": { "code": "VALIDATION" | "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "INTERNAL", "message": string, "details"?: unknown } }`.
Codes HTTP : 400 validation, 401 non authentifié, 404 absent **ou appartenant à un autre compte**, 409 conflit (plaque, email, monotonie km), 429, 500.

| Méthode | Route | Corps / réponse |
|---|---|---|
| GET | `/health` | `{ ok: true, db: true }` (hors `/api/v1`, non authentifié) |
| POST | `/auth/register` | `{ email, password, displayName? }` → 201 `{ user }` + cookie. 403 si `REGISTRATION_OPEN=false` |
| POST | `/auth/login` | `{ email, password }` → `{ user }` + cookie. Message d'erreur identique email/mot de passe |
| POST | `/auth/logout` | 204, supprime la session |
| GET | `/auth/me` | `{ user }` ou 401 |
| POST | `/auth/forgot-password` | `{ email }` → 204 **toujours** (pas d'énumération) |
| POST | `/auth/reset-password` | `{ token, password }` → 204, invalide toutes les sessions |
| GET/PATCH | `/me/settings` | `{ displayName, notifyTime }` (`notifyTime` `HH:MM`, minutes ∈ 00/15/30/45) |
| GET | `/notifications/channels` | `Channel[]` **sans secrets** : `{ id, type, label, enabled, verified, status: 'ok'\|'failing'\|'disabled', lastSuccessAt, lastError }` ; ntfy expose `server` et `topic`, jamais `token` |
| POST | `/notifications/channels` | `{ type:'email', address }` (envoie un lien de vérification si ≠ email du compte) \| `{ type:'webpush', subscription, label? }` \| `{ type:'ntfy', server, topic, token? }` → 201 ; doublon → 409 ; max 10 canaux par compte |
| PATCH/DELETE | `/notifications/channels/:id` | PATCH `{ label?, enabled? }` (réactivation remet `consecutive_failures` à 0) |
| POST | `/notifications/channels/:id/test` | Envoie « Notification de test » → 200 `{ ok: true }` ou 502 `{ error: { code: 'CHANNEL_FAILED', message } }` ; 5 tests / 10 min / compte |
| GET | `/notifications/vapid-public-key` | `{ key }` (clé publique VAPID base64url) |
| GET | `/notifications/verify-email?token=` | valide l'adresse, redirige vers `/parametres/notifications?verifie` |
| GET | `/notifications/unsubscribe?token=` | lien d'email signé (HMAC) : désactive ce canal email sans connexion, page de confirmation |
| GET | `/vehicles` | `Vehicle[]` avec `currentKm`, `worstStatus`, `counts` |
| POST | `/vehicles` | `{ plate, make, model, engine?, year, fuel, vin?, purchaseDate?, initialKm, withBasePlan?, rules? }` → 201 (transaction : véhicule + relevé `initial` + règles). `rules` (premier lancement, M5-T3) = `RuleInput[]` avec `baselineDate` / `baselineKm`, exclusif de `withBasePlan` (les deux ⇒ 400) ; `baselineKm` ≤ `initialKm` |
| GET/PATCH/DELETE | `/vehicles/:id` | PATCH sans `initialKm` ; DELETE 204 (cascade) |
| GET/POST | `/vehicles/:id/readings` | POST `{ date, km }` → 409 si non monotone |
| DELETE | `/readings/:id` | 204 ; refusé (409) si `source = 'intervention'` ou `'initial'` |
| GET/POST | `/vehicles/:id/rules` | POST `{ label, category, intervalKm?, intervalMonths?, warnKm?, warnDays?, baselineDate?, baselineKm? }` |
| PATCH/DELETE | `/rules/:id` | |
| GET | `/rule-templates` | `RULE_TEMPLATES` |
| GET/POST | `/vehicles/:id/interventions` | POST `{ ruleId?, category, title, date, km, costCents, garage?, notes? }` (transaction : intervention + relevé `intervention` ; 409 si non monotone ; `ruleId` doit appartenir au même véhicule) |
| PATCH/DELETE | `/interventions/:id` | PATCH met à jour le relevé lié ; DELETE supprime le relevé lié |
| GET | `/due` | `{ items: (DueResult & { vehicleId, ruleLabel, category })[] }` tous véhicules, trié |
| GET | `/vehicles/:id/due` | idem pour un véhicule |
| GET | `/vehicles/:id/export.csv` | `text/csv; charset=utf-8`, BOM, `;`, colonnes `date;km;categorie;intervention;garage;cout_eur;notes` |
| GET | `/export.json` | sauvegarde complète du compte (sans hash ni sessions) |
| DELETE | `/me` | `{ password }` → 204 ; suppression définitive en une transaction (toutes tables liées + fichiers joints après commit), cookie effacé, email de confirmation envoyé avant. Rate-limit des routes auth. 401 si mot de passe faux, rien supprimé |
| POST | `/vehicles/:id/import/preview` | (M8-T1) corps `text/csv` ≤ 1 Mo → `{ rows: [{ line, data?, errors[] }], valid, invalid }`, aucune écriture |
| POST | `/vehicles/:id/import` | (M8-T1) `{ csv, confirm: true }` → 201 `{ imported }` ; lignes valides seulement, transaction |
| POST/GET/DELETE | `/interventions/:id/attachments`, `/attachments/:id` | (M8-T2) multipart 10 Mo ; GET en `Content-Disposition: attachment` + `nosniff` ; 404 si autre compte ; 413 quota |

Limites : tailles max des chaînes définies dans `schemas.ts` (title 120, notes 2 000, garage 120) ; `km` 0–2 000 000 ; `costCents` 0–10 000 000 ; dates ≤ aujourd'hui (Europe/Paris) sauf `baselineDate`.

## 7. Sécurité

- Mots de passe : argon2id (paramètres par défaut de `@node-rs/argon2`), longueur ≥ 12, ≤ 128.
- Cookie `sid` : `HttpOnly`, `Secure` (si `APP_URL` en https), `SameSite=Lax`, `Path=/`, durée `SESSION_TTL_DAYS` (30), renouvellement glissant si < 50 % restant. Nouvelle session à chaque login (pas de fixation).
- CSRF : SameSite=Lax + vérification `Origin`/`Referer` = `APP_URL` sur toute méthode non GET/HEAD.
- `@fastify/helmet` avec CSP stricte (`default-src 'self'`), `@fastify/rate-limit` global 300 req/min/IP et 10 req/15 min/IP sur `/auth/login`, `/auth/register`, `/auth/forgot-password`.
- `trustProxy` = valeur de `TRUST_PROXY` : liste d'IP/CIDR du reverse proxy (validée par Zod), `false` sans proxy ; `true` refusé au démarrage en production.
- Logs pino : jamais de mot de passe, token, cookie (`redact`), ni endpoint push complet, ni jeton ntfy.
- **Secrets de canal** scellés en base (AES-256-GCM, IV aléatoire 12 octets, format `v1.<iv>.<tag>.<ciphertext>` base64url, clé `SECRETS_KEY` 32 octets base64). Clé absente ou de mauvaise taille ⇒ refus de démarrer.
- **SSRF ntfy** : le serveur appelle l'URL fournie par l'utilisateur ⇒ `https:` obligatoire, origine dans `NTFY_ALLOWED_SERVERS` (liste séparée par des virgules, défaut `https://ntfy.sh`), pas de redirection suivie (`redirect: 'error'`), timeout 5 s, corps ≤ 4 Ko.
- **Web Push** : endpoint accepté seulement en `https:` ; VAPID `VAPID_SUBJECT` = `mailto:` de l'admin ; réponse 404/410 ⇒ suppression du canal.
- Email secondaire : vérification obligatoire (token 32 octets, sha256 en base, 24 h) avant tout envoi de rappel.
- Toutes les routes métier passent par `requireVehicle` / contrôle `user_id`.

## 8. Notifications (`src/server/notifications/`, `src/server/jobs/reminders.ts`)

### 8.1 Interface de canal

```ts
interface NotificationMessage {
  title: string;            // « Entretien : 1 en retard, 4 à prévoir »
  shortBody: string;        // ≤ 3 lignes « 308 SW · Vidange — dans 13 j » + « + N autres », sans immatriculation
  url: string;              // `${APP_URL}/`
  urgent: boolean;          // au moins un overdue
  items: DigestItem[];      // pour l'email détaillé
  isTest?: boolean;
}
type SendResult = { ok: true } | { ok: false; permanent: boolean; error: string };
interface NotificationChannel<C> {
  type: 'email' | 'webpush' | 'ntfy';
  validateConfig(input: unknown): C;                 // Zod ; lève 400
  send(config: C, msg: NotificationMessage): Promise<SendResult>;
}
```

| Canal | Envoi | Échec permanent |
|---|---|---|
| email | nodemailer, texte + HTML, en-têtes `List-Unsubscribe` + `List-Unsubscribe-Post` | adresse rejetée (5xx destinataire) |
| webpush | `webpush.sendNotification(sub, JSON.stringify({ title, body: shortBody, url, tag: 'digest' }), { TTL: 86400, urgency: urgent ? 'high' : 'normal' })` | statut 404 ou 410 ⇒ canal supprimé |
| ntfy | `POST {server}/{topic}`, corps = `shortBody`, en-têtes `Title`, `Priority: high\|default`, `Tags: wrench`, `Click: url`, `Authorization: Bearer <token>` si présent | 401/403/404 |

`public/sw.js` : `push` → `self.registration.showNotification(title, { body, tag, data: { url }, icon, badge })` ; `notificationclick` → focus d'un onglet existant de l'app ou `clients.openWindow(url)`. Aucun handler `fetch` (pas de cache).

### 8.2 Job

Tick `REMINDER_CRON` (défaut `*/15 * * * *`, `off` pour désactiver). `now` et `today` injectés (fuseau `TZ`).
1. Sélection : utilisateurs ayant ≥ 1 canal `enabled` et vérifié, `notify_time ≤ HH:MM courant` et `last_digest_date IS NULL OR last_digest_date < today` (rattrape les ticks manqués après un redémarrage, jamais deux digests le même jour).
2. Pour chaque utilisateur : `DueResult` de tous ses véhicules (même service que `GET /due`), filtre `soon`/`overdue`.
3. Pour chaque canal actif : items **sans** ligne `notification_log (channel_id, rule_id, due_key, status)`. Liste vide ⇒ rien à envoyer sur ce canal.
4. `buildDigest(items)` → message ; `send()` ; succès ⇒ insertion des lignes de log du canal + `last_success_at`, `consecutive_failures = 0` ; échec ⇒ `last_error`, `consecutive_failures + 1`, pas de log (nouvel essai au digest suivant) ; échec permanent ou 5 échecs ⇒ `enabled = 0` (webpush 404/410 ⇒ suppression).
5. `last_digest_date = today` dès que l'utilisateur a été traité (même sans envoi).
6. Canaux envoyés en parallèle par utilisateur (`Promise.allSettled`), utilisateurs traités séquentiellement ; un échec n'interrompt jamais le job.
Exécution manuelle : `node dist/server/jobs/reminders.js --dry-run [--user <email>] [--force]` (affiche les messages sans envoyer ; `--force` ignore `notify_time` et `last_digest_date`).

## 9. Configuration (`.env`)

Voir `.env.example`. Toute variable manquante ou invalide → arrêt au démarrage avec message explicite.

## 10. Déploiement

Image Docker unique (`deploy/Dockerfile`), volume `/data` (SQLite), port 3000 derrière un reverse proxy TLS. Cible : LXC Debian non privilégié sur Proxmox VE (`deploy/proxmox/create-lxc.sh`). Exposition : `docs/DEPLOYMENT.md` (option A par défaut : Caddy sur le VPS → Tailscale → CT ; option B : Tailscale uniquement). Sauvegarde : `pnpm db:backup` (API `backup()` de better-sqlite3 → `DATA_DIR/backups/`, rotation 14) + sauvegarde PBS du conteneur + copie hors site (`deploy/backup-offsite.sh`, M7-T6).

## 11. Pièces jointes (M8-T2)

```sql
attachments (
  id TEXT PK,
  intervention_id TEXT NOT NULL → interventions,
  user_id TEXT NOT NULL → users,          -- dénormalisé pour le quota et la suppression du compte
  storage_key TEXT NOT NULL UNIQUE,        -- `<aa>/<uuid>` sous DATA_DIR/files, jamais dérivé du nom fourni
  original_name TEXT NOT NULL,             -- affichage uniquement, ≤ 200 caractères, nettoyé
  mime TEXT NOT NULL CHECK (mime IN ('application/pdf','image/jpeg','image/png','image/webp','image/heic')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  sha256 TEXT NOT NULL,
  created_at INTEGER NOT NULL
)  INDEX (intervention_id), INDEX (user_id)
```

Écriture : fichier temporaire dans `DATA_DIR/files/.tmp`, vérification des magic bytes, ré-encodage des images (`sharp`, suppression EXIF), `rename` atomique, puis insertion. Suppression : ligne d'abord (transaction), fichier ensuite ; un job hebdomadaire supprime les fichiers orphelins.
