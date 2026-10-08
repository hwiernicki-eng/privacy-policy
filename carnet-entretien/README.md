# Carnet d'entretien

Application web (PWA) de suivi d'entretien de véhicules : plan d'entretien km/durée, journal d'interventions, échéances calculées, tableau de bord multi-véhicules et rappels par email, notification téléphone (Web Push) ou ntfy. Auto-hébergeable : un conteneur, SQLite, LXC Proxmox.

## État

Kit de démarrage pour Claude Code : spécification, design, prototype et outillage prêts ; le code est généré tâche par tâche (`docs/ROADMAP.md`, 36 tâches MVP + 2 en M8).

```
PROMPT.md                         prompts à coller dans Claude Code (démarrage, jalon, revue, déploiement)
CLAUDE.md                         consignes permanentes pour Claude Code
docs/PRODUCT.md                   périmètre et règles métier (F1 à F14)
docs/ARCHITECTURE.md              stack, schéma BDD, API, moteur d'échéances, notifications, sécurité
docs/ROADMAP.md                   tâches M0 → M8 avec dépendances et critères d'acceptation, puis V1/V2/V3
docs/DESIGN.md                    direction « Cockpit clair », tokens, composants
docs/DECISIONS.md                 ADR-001 à ADR-014
docs/DEPLOYMENT.md                exposition (public via VPS + Tailscale, ou Tailscale seul), sauvegardes, restauration
docs/TESTING-NOTIFICATIONS.md     recette manuelle des notifications
docs/prototype.html               prototype cliquable + implémentations de référence (échéances, digest, tableau de bord, premier lancement)
docs/maquettes/                   maquettes Claude Design (mobile, desktop, premier lancement)
.claude/settings.json             permissions + hooks (protection fichiers, garde bash, formatage)
.claude/skills/                   /implement-task, /check
.claude/agents/                   reviewer, test-writer
deploy/                           Dockerfile, docker-compose.yml, .env.example, caddy/, proxmox/create-lxc.sh, backup-offsite.sh
```

## Démarrer avec Claude Code

```bash
unzip carnet-entretien-kit.zip && cd carnet-entretien
chmod +x .claude/hooks/*.sh deploy/proxmox/create-lxc.sh deploy/backup-offsite.sh
git init && git add -A && git commit -m "docs: kit de démarrage"
claude
```

Puis coller le prompt **1. Premier lancement** de `PROMPT.md`. Ensuite : `/implement-task` (prochaine tâche) ou le prompt **3** pour enchaîner un jalon.

Prérequis poste : Node.js 22, pnpm (`corepack enable`), `jq` (hooks), Docker pour M7, Playwright (installé par le projet en M7-T5).

## Prototype

Ouvrir `docs/prototype.html` dans un navigateur : tableau de bord, fiche véhicule, plan, journal, notifications, et « Tester le premier lancement » dans le bandeau. Données d'exemple stockées dans le navigateur uniquement.
