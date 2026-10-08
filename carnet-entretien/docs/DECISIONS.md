# DECISIONS — registre des choix figés

Format : ADR court. Ajouter une entrée pour toute décision non couverte par `ARCHITECTURE.md`.

## ADR-001 — Web uniquement, abandon d'Android natif
- Contexte : la spec initiale (juillet 2026) prévoyait Next.js + React Native/Expo pour Android.
- Décision : une seule application web responsive, installable en PWA. Aucun code natif.
- Conséquences : un seul code à maintenir et déployer ; notifications par email au MVP, Web Push en V1. Une publication Play Store reste possible plus tard via TWA sans réécriture.

## ADR-002 — Vite + React SPA servie par Fastify (pas de Next.js)
- Décision : SPA Vite, API Fastify, un seul process Node et un seul conteneur.
- Raisons : pas de SEO nécessaire (application authentifiée), déploiement self-hosted trivial, stack déjà maîtrisée.

## ADR-003 — SQLite plutôt que PostgreSQL
- Décision : SQLite (better-sqlite3, WAL) dans `DATA_DIR`.
- Raisons : volume faible (≤ quelques centaines d'utilisateurs), zéro service externe, sauvegarde par fichier + PBS.
- Réversibilité : Drizzle ; migration vers PostgreSQL en V2 si besoin de plusieurs instances.

## ADR-004 — Sessions serveur maison
- Décision : cookie opaque + table `sessions` (hash SHA-256), argon2id. Pas de JWT, pas de fournisseur tiers.
- Raisons : révocation immédiate, surface réduite, aucune dépendance d'auth à suivre. OAuth Google en V1.

## ADR-005 — Rappels multi-canal avec planificateur interne
- Décision : tick `node-cron` toutes les 15 min dans le process ; heure de digest choisie par utilisateur ; idempotence via `notification_log` par canal et `users.last_digest_date`.
- Contrainte : une seule instance de l'application (cohérent avec ADR-003).

## ADR-009 — Notifications téléphone : Web Push + ntfy, pas de SMS au MVP
- Contexte : l'application Android native est abandonnée (ADR-001), il faut quand même notifier le téléphone.
- Décision : Web Push standard (VAPID) depuis la PWA, plus ntfy en canal alternatif.
- Raisons : Web Push ne dépend d'aucun compte tiers ni service payant et fonctionne sur Android et sur iOS 16.4+ (PWA ajoutée à l'écran d'accueil). ntfy couvre les cas où le push navigateur est peu fiable (iOS sans installation, économie d'énergie Android) et s'auto-héberge sur le homelab.
- Écarté : SMS (coût par envoi, fournisseur, numéro de téléphone = donnée personnelle supplémentaire) et Telegram ; candidats V1 via la même interface de canal.

## ADR-010 — Secrets de canal chiffrés applicativement
- Décision : AES-256-GCM avec `SECRETS_KEY` (env), en plus du chiffrement disque éventuel.
- Raison : une copie de `carnet.db` (sauvegarde, export) ne doit pas permettre d'envoyer des notifications aux appareils ni d'utiliser les jetons ntfy.
- Conséquence : perdre `SECRETS_KEY` = re-créer les canaux (les données métier restent intactes). La clé est sauvegardée hors de la base.

## ADR-006 — Dates métier en chaînes ISO, calcul UTC
- Décision : `YYYY-MM-DD` partout dans le métier, aucune heure ; date du jour calculée côté serveur dans `TZ` (Europe/Paris) et injectée dans le moteur.
- Raison : éviter les décalages de fuseau sur les échéances.

## ADR-007 — Export CSV au format Excel FR
- Décision : UTF-8 avec BOM, séparateur `;`, montants avec virgule décimale (`12,50`), dates `YYYY-MM-DD`.

## ADR-008 — Valeurs d'entretien indicatives
- Décision : les modèles de règles sont génériques et éditables, toujours signalés comme indicatifs. Aucun plan constructeur au MVP.

## ADR-011 — Direction visuelle « Cockpit clair »
- Contexte : 4 directions comparées sur le canevas Claude Design (Atelier, Cockpit, Agenda, Fiche technique).
- Décision : Cockpit, sur fond clair : témoins par famille d'entretien, jauges circulaires par échéance, compteur en arc ; thème sombre = cockpit nocturne.
- Conséquences : polices Saira / Saira Condensed / JetBrains Mono ; composants `WarningLamps`, `ArcOdometer`, `DueGauge`, `JournalRow` (voir `DESIGN.md`) ; l'onglet « Carnet » devient « Journal ».

## ADR-012 — Exposition : public via le VPS et Tailscale par défaut
- Décision : option A de `DEPLOYMENT.md` (Caddy + Let's Encrypt sur le VPS, trafic vers le CT par Tailscale, port du CT filtré) ; option B (Tailscale uniquement, `tailscale serve`) documentée pour un usage strictement personnel.
- Raisons : liens des emails et notifications utilisables partout, pas d'application Tailscale imposée à l'entourage, aucune ouverture de port sur la box du homelab.
- Conséquences : `TRUST_PROXY` = IP du proxy (jamais `true`), `APP_BIND` configurable, inscriptions fermées par défaut.

## ADR-013 — Suppression de compte immédiate et définitive
- Décision : `DELETE /me` supprime tout en une transaction, sans délai de grâce ni suppression logique.
- Raisons : RGPD (droit à l'effacement) avec le moins de code possible ; l'export JSON est proposé juste avant.
- Conséquence : les données subsistent seulement dans les sauvegardes jusqu'à leur rotation (14 jours locales, 30 jours hors site), ce que l'interface indique.

## ADR-014 — Import CSV et pièces jointes avancés en M8
- Décision : juste après la mise en service, avant V1.
- Raison : sans historique ni factures, le carnet a peu de valeur au départ et à la revente ; ce sont les deux fonctions qui rendent l'outil utile dès le premier mois.

## ADR-015 — Projet hébergé dans le sous-dossier `carnet-entretien/` du dépôt `privacy-policy`
- Contexte : le kit a été appliqué dans le dépôt `privacy-policy`, dont le `README.md` racine est la politique de confidentialité publiée.
- Décision : tout le projet vit dans `carnet-entretien/` ; la racine du dépôt n'est pas modifiée.
- Conséquences : lancer Claude Code et les commandes `pnpm` depuis `carnet-entretien/` (hooks `.claude/` résolus via `CLAUDE_PROJECT_DIR`). Le workflow CI (M0-T2) se place obligatoirement dans `.github/workflows/` à la racine du dépôt avec `defaults.run.working-directory: carnet-entretien` et un filtre `paths: carnet-entretien/**`. Migration vers un dépôt dédié possible par `git subtree split --prefix=carnet-entretien`.

## ADR-016 — Versions d'outillage M0-T1
- Décision : Vite 6 + `@vitejs/plugin-react` 5 (la v6 du plugin exige Vite 8), React 18 et `@fastify/static` 8 (compatible Fastify 5) conformément à la stack figée.
- Adresse d'écoute provisoire (avant `config.ts`, M0-T5) : `HOST` sinon `0.0.0.0` en production (conteneur) et `127.0.0.1` en développement.
- Le service des fichiers statiques n'est activé que si `dist/client/index.html` existe : en dev, Vite sert le front et Fastify n'expose jamais `src/`.

## ADR-017 — Outillage qualité (M0-T2)
- ESLint 9 flat config : `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked` (`parserOptions.project` sur `tsconfig.json` et `tsconfig.server.json`), `eslint-plugin-react-hooks` limité à `src/client`, ordre des imports par `eslint-plugin-import-x` + `eslint-import-resolver-typescript` (alias `@shared/@client/@server` classés « internal ») ; `globals` pour les environnements navigateur/Node.
- Prettier : `singleQuote`, `printWidth` 100 ; appliqué au code uniquement (`docs/`, `deploy/`, `.claude/` et `*.md` exclus pour ne pas réécrire la spécification).
- Vitest 3 en projets `unit` (`tests/unit`) et `api` (`tests/api`) ; les tests sont typés via `tsconfig.server.json`.
- CI : `.github/workflows/ci.yml` à la racine du dépôt (ADR-015), filtrée sur `carnet-entretien/**`, étapes install (cache pnpm) → typecheck → lint → format:check → test → build.
