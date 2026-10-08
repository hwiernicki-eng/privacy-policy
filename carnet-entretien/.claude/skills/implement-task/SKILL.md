---
name: implement-task
description: Implémente une tâche de docs/ROADMAP.md (ID fourni ou prochaine tâche disponible), teste, coche et commit.
disable-model-invocation: true
argument-hint: "[ID de tâche, ex. M2-T1 — vide = prochaine tâche]"
---

Tâche demandée : `$ARGUMENTS`

## 1. Sélection
- Lire `docs/ROADMAP.md`.
- Si un ID est fourni : vérifier que toutes ses dépendances sont cochées `[x]`. Sinon, s'arrêter et lister les dépendances manquantes.
- Si aucun ID : prendre la **première** tâche `[ ]` de la liste « Suivi MVP » dont toutes les dépendances sont `[x]`.

## 2. Contexte
- Relire `CLAUDE.md`, puis les sections de `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/DESIGN.md` citées par la tâche.
- Pour toute tâche touchant aux échéances : lire `computeDue` dans `docs/prototype.html`.
- Inspecter le code existant concerné avant d'écrire.

## 3. Plan (afficher, ne pas attendre de validation)
- 3 à 5 lignes : fichiers créés/modifiés, tests prévus, points d'attention sécurité.

## 4. Implémentation
- Respecter strictement « À faire » et « Hors périmètre ».
- Tests d'abord pour la logique de `src/shared/` et les règles API (isolation par utilisateur, validations, codes HTTP).

## 5. Vérification
- Exécuter le skill `/check` (typecheck, lint, test, build). Corriger jusqu'au vert, sans désactiver de test ni de règle.
- Pour les tâches M1, M2-T1, M2-T2, M4-T1, M6-T2 à M6-T5, M6-T8 : lancer le sous-agent `reviewer` sur le diff et traiter ses remarques bloquantes.

## 6. Clôture
- Vérifier chaque critère d'acceptation un par un et l'indiquer (✔/✘).
- Cocher la tâche dans `docs/ROADMAP.md`.
- Ajouter dans `docs/DECISIONS.md` toute décision prise hors documentation.
- Commit : `git add -A && git commit -m "<type>(<jalon>): <résumé> (<ID>)"` (types : feat, fix, chore, test, docs, refactor).
- Terminer par : tâche réalisée, critères validés, prochaine tâche disponible.
