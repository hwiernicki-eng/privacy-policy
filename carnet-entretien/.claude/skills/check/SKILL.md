---
name: check
description: Vérifie le projet (typecheck, lint, tests, build) et corrige les erreurs. À utiliser avant tout commit.
argument-hint: "[--no-build]"
allowed-tools: Bash(pnpm typecheck) Bash(pnpm lint) Bash(pnpm test) Bash(pnpm build)
---

Exécuter dans cet ordre et s'arrêter au premier échec pour corriger :

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build` (sauf si `$ARGUMENTS` contient `--no-build`)

Règles de correction :
- Corriger la cause, jamais le symptôme : pas de `any`, pas de `// @ts-ignore`, pas de `eslint-disable`, pas de `.skip` / `.only` sur un test.
- Un test qui échoue après une modification métier : vérifier d'abord la spécification (`docs/ARCHITECTURE.md`, `docs/PRODUCT.md`) avant de modifier le test.
- Relancer l'étape après correction, puis continuer.

Rapport final : une ligne par étape (OK / corrigé : raison).
