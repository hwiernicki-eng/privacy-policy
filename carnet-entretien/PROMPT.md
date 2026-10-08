# Prompts Claude Code

À copier tels quels dans Claude Code, lancé à la racine du dépôt (`claude`). `CLAUDE.md`, les skills `/implement-task` et `/check`, les sous-agents `reviewer` / `test-writer` et les hooks de `.claude/` sont chargés automatiquement.

## 1. Premier lancement (une seule fois)

```text
Tu démarres le projet « Carnet d'entretien ». Le dépôt ne contient encore que la documentation et l'outillage.

1. Lis CLAUDE.md, puis docs/ROADMAP.md, docs/ARCHITECTURE.md, docs/PRODUCT.md, docs/DESIGN.md et docs/DECISIONS.md en entier.
2. Ouvre docs/prototype.html (lecture du code) : repère computeDue, buildDigest, renderBoard, renderOnboarding. Ce sont les références de comportement.
3. Vérifie l'environnement : node -v (≥ 22), pnpm -v (sinon `corepack enable`), jq --version (requis par les hooks), git status. Signale tout manque sans l'installer globalement.
4. Résume en 10 lignes max ce que tu as compris : objectif MVP, stack, ordre des jalons M0 → M7 puis M8, et les 3 points de vigilance sécurité qui te paraissent les plus importants.
5. Puis exécute /implement-task M0-T1.

Règles pour toute la session :
- Une tâche = un commit Conventional Commits, tâche cochée dans docs/ROADMAP.md.
- Jamais de fonctionnalité hors de la tâche en cours ; toute décision non documentée va dans docs/DECISIONS.md.
- Si un critère d'acceptation est impossible ou contradictoire avec la doc : arrête-toi et explique, ne contourne pas.
```

## 2. Avancer tâche par tâche (usage courant)

```text
/implement-task
```

Ou une tâche précise : `/implement-task M3-T1`.

## 3. Enchaîner un jalon en autonomie

```text
Enchaîne les tâches du jalon M<N> dans l'ordre de docs/ROADMAP.md avec /implement-task, sans attendre de validation entre deux tâches.
Arrête-toi et fais-moi un point si : un test reste rouge après 3 tentatives, une tâche nécessite une dépendance hors docs/ARCHITECTURE.md, ou une action touche l'infrastructure réelle (Proxmox, DNS, VPS, envoi de vrais emails).
À la fin du jalon : liste des tâches faites, critères validés, décisions ajoutées, et la prochaine tâche disponible.
```

## 4. Revue avant mise en production (après M6)

```text
Lance le sous-agent reviewer sur l'ensemble de src/ (pas seulement le dernier diff) avec la grille de .claude/agents/reviewer.md, plus : isolation des données sur toutes les routes, suppression de compte complète (toutes les tables), secrets jamais renvoyés par l'API. Corrige les points BLOQUANT, liste les autres.
```

## 5. Déploiement (M7-T4) — avec moi

```text
On passe à M7-T4. Lis docs/DEPLOYMENT.md. Je suis en option <A|B>.
Prépare uniquement : un brouillon deploy/production.env.draft à partir de deploy/.env.example (valeurs à compléter marquées <À REMPLIR>, aucun secret réel ; je le copierai moi-même en .env sur le CT), la commande create-lxc.sh en --dry-run, et pour l'option A le Caddyfile adapté. N'exécute aucune commande sur Proxmox, le VPS ou le DNS : donne-les-moi dans l'ordre, je les lance moi-même.
```
