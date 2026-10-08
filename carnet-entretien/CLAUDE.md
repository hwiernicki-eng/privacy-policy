# CLAUDE.md — Carnet d'entretien (web)

Application web de carnet d'entretien de véhicules. Objectif MVP unique : **« Je ne veux plus oublier un entretien. »**
Cible : particuliers multi-véhicules, usage mobile (PWA) et desktop. **Pas d'application Android native** (abandonnée, voir `docs/DECISIONS.md`).

## Documents de référence (à lire avant toute tâche)

| Fichier | Contenu | Quand le lire |
|---|---|---|
| `docs/ROADMAP.md` | Tâches numérotées (M0-T1…), dépendances, critères d'acceptation, cases à cocher | **Toujours**, c'est la source de vérité de l'avancement |
| `docs/ARCHITECTURE.md` | Stack, arborescence, schéma BDD, contrat API, algorithme d'échéances, sécurité | Avant toute tâche technique |
| `docs/PRODUCT.md` | Périmètre fonctionnel, règles métier, hors-périmètre | Avant toute tâche UI ou métier |
| `docs/DESIGN.md` + `docs/prototype.html` | Tokens visuels, écrans, comportement de référence (ouvrir le prototype dans un navigateur) | Avant toute tâche UI |
| `docs/maquettes/` | Maquettes Claude Design (mobile, desktop, premier lancement) — spécification visuelle, non servies | Tâches UI M2-T3, M3-T3, M4-T2, M5-T2, M5-T3 |
| `docs/DECISIONS.md` | ADR courts (choix figés) | Avant de proposer un changement de stack |
| `docs/DEPLOYMENT.md` | Exposition (options A/B), sauvegardes, supervision, restauration | Tâches M7 |
| `docs/TESTING-NOTIFICATIONS.md` | Recette manuelle des canaux de notification | M6-T7, M7-T7 |

`docs/prototype.html` contient les **implémentations de référence en JS** du moteur d'échéances (`computeDue`), du texte des notifications (`buildDigest`), du tableau de bord (`renderBoard`) et du premier lancement (`renderOnboarding` / `finishOnboarding`). `src/shared/due-engine.ts` et `src/server/notifications/digest.ts` doivent produire les mêmes résultats ; les écrans React reproduisent le comportement des fonctions de rendu (pas leur technique : pas d'`innerHTML`).

## Commandes

```bash
pnpm install
pnpm dev            # Vite :5173 + API Fastify :3000 (proxy /api)
pnpm build          # dist/client + dist/server
pnpm start          # node dist/server/index.js (sert API + front)
pnpm typecheck      # tsc --noEmit (client + server)
pnpm lint           # eslint .
pnpm test           # vitest run
pnpm test:e2e       # playwright (à partir de M7)
pnpm db:generate    # drizzle-kit generate → nouvelle migration SQL
pnpm db:migrate     # applique les migrations (aussi fait au démarrage du serveur)
```

## Workflow de tâche (obligatoire)

1. Lire `docs/ROADMAP.md`, prendre la première tâche `[ ]` dont toutes les dépendances sont `[x]` (ou celle demandée).
2. Annoncer en 3-5 lignes le plan et les fichiers touchés.
3. Implémenter **uniquement** le périmètre de la tâche. Rien de la section « Hors périmètre ».
4. Écrire/mettre à jour les tests listés dans les critères d'acceptation.
5. `pnpm typecheck && pnpm lint && pnpm test` doivent passer.
6. Cocher la tâche dans `docs/ROADMAP.md`, commit Conventional Commits : `feat(m2): api véhicules (M2-T1)`.
7. Si une décision non couverte par les docs est nécessaire : la prendre au plus simple, l'ajouter dans `docs/DECISIONS.md`.

Skills projet : `/implement-task [ID]`, `/check`. Sous-agents : `reviewer` (revue avant commit d'une tâche API/sécurité), `test-writer`.

## Règles de code

- TypeScript `strict`, pas de `any`, pas de `as` pour masquer une erreur de type. `noUncheckedIndexedAccess` activé.
- **Validation Zod à toutes les frontières** : body/params/query côté API (via `fastify-type-provider-zod`), formulaires côté client (react-hook-form + zodResolver). Schémas partagés dans `src/shared/schemas.ts`, jamais dupliqués.
- Logique métier pure dans `src/shared/` (dates, moteur d'échéances, validation kilométrique) : aucune dépendance Node/DOM, 100 % testée.
- **Isolation des données** : toute requête BDD sur une ressource utilisateur filtre par `userId` (via `vehicles.user_id`). Ressource d'un autre utilisateur → **404**, jamais 403. Helper unique `requireVehicle(req, vehicleId)`.
- Montants en **centimes entiers** (`cost_cents`), kilométrages en **entiers**, dates métier en `TEXT` ISO `YYYY-MM-DD`, horodatages en `INTEGER` epoch ms.
- Calcul de date en UTC sur des chaînes `YYYY-MM-DD` (pas de `new Date()` local dans `src/shared`, la date du jour est **injectée**).
- Écritures multiples (intervention + relevé km) dans une **transaction**.
- Aucun secret en dur. Config lue et validée par Zod dans `src/server/config.ts`.
- Secrets de canaux de notification (abonnements push, jetons ntfy, adresses) toujours scellés via `notifications/crypto.ts` ; jamais renvoyés par l'API ni journalisés.
- Tout appel réseau sortant vers une URL fournie par l'utilisateur passe par une allowlist (`NTFY_ALLOWED_SERVERS`), `redirect: 'error'` et un timeout.
- UI : composants shadcn/ui dans `src/client/components/ui`, composants métier dans `src/client/features/<domaine>/`. Icônes `lucide-react` uniquement. Textes UI en français.
- Accessibilité : labels sur tous les champs, focus visible, contraste AA, navigation clavier des modales.
- Pas de nouvelle dépendance hors `docs/ARCHITECTURE.md` sans l'ajouter à `docs/DECISIONS.md`.

## Interdits

- Modifier une migration déjà commitée dans `drizzle/` (créer une nouvelle migration). Ne jamais utiliser `drizzle-kit push`.
- Lire ou écrire `.env` (utiliser `.env.example`).
- Implémenter des fonctionnalités V1/V2/V3 pendant le MVP.
- Désactiver un test ou une règle ESLint pour faire passer la CI.
