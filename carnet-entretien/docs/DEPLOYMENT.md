# DEPLOYMENT — Mise en service

Deux façons d'exposer l'application. **Option A par défaut** (ADR-012) : accès public en HTTPS via le VPS, relié au homelab par Tailscale. **Option B** : accessible uniquement depuis le tailnet.

| | Option A — public via VPS | Option B — Tailscale uniquement |
|---|---|---|
| URL | `https://carnet.<domaine>` (domaine OVH) | `https://carnet.<tailnet>.ts.net` |
| Certificat | Let's Encrypt par Caddy sur le VPS | Certificat Tailscale (`tailscale serve`) |
| Qui peut ouvrir l'app | Tout le monde (comptes fermés par `REGISTRATION_OPEN=false`) | Uniquement les appareils du tailnet |
| Téléphone | Aucun prérequis | Application Tailscale active sur le téléphone |
| Liens des emails | Fonctionnent partout | Fonctionnent seulement sur le tailnet |
| Web Push / ntfy | OK | OK (l'envoi est sortant depuis le CT) |
| Surface d'attaque | Port 443 du VPS | Aucune exposition publique |

Choisir B pour un usage strictement personnel ; A dès que l'entourage utilise l'application.

## 1. Conteneur LXC

Sur le nœud Proxmox (root), simulation puis création :

```bash
./deploy/proxmox/create-lxc.sh --ctid 230 --hostname carnet --ip 192.168.1.230/24 --gw 192.168.1.1 \
  --repo <url du dépôt> --dry-run
# relire la sortie, puis relancer sans --dry-run
```

Dans le CT :

```bash
cd /opt/carnet-entretien
openssl rand -base64 32                 # → SECRETS_KEY (à copier aussi dans le gestionnaire de mots de passe)
npx --yes web-push generate-vapid-keys  # → VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
nano .env                               # APP_URL, SECRETS_KEY, VAPID_*, SMTP_*, TRUST_PROXY, APP_BIND
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
curl -fsS http://127.0.0.1:3000/health
```

## 2a. Option A — Caddy sur le VPS → Tailscale → CT

1. **Tailscale côté homelab** : si un routeur de sous-réseau Tailscale expose déjà le LAN, rien à installer dans le CT (le VPS joint `192.168.1.230`). Sinon, installer Tailscale dans le CT ; un CT non privilégié a besoin du périphérique TUN, à ajouter sur l'hôte dans `/etc/pve/lxc/230.conf` puis redémarrer le CT :
   ```
   lxc.cgroup2.devices.allow: c 10:200 rwm
   lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file
   ```
2. **Écoute** : dans `.env`, `APP_BIND` = l'adresse sur laquelle le VPS joint le CT (IP Tailscale du CT, ou IP LAN si routeur de sous-réseau). Ne jamais mettre `0.0.0.0` sur un CT joignable depuis Internet.
3. **Pare-feu** : n'autoriser le port 3000 du CT que depuis l'IP Tailscale du VPS (pare-feu Proxmox du CT ou ACL Tailscale : `"src": ["tag:vps"], "dst": ["tag:carnet:3000"]`).
4. **Caddy sur le VPS** : `deploy/caddy/Caddyfile.example` → `/etc/caddy/Caddyfile`, adapter le domaine et l'IP, `caddy validate --config /etc/caddy/Caddyfile` puis `systemctl reload caddy`.
5. **DNS OVH** : enregistrement `A` (et `AAAA` si IPv6) `carnet` → IP publique du VPS.
6. **`.env`** : `APP_URL=https://carnet.<domaine>` ; `TRUST_PROXY=<IP Tailscale du VPS>` (pas `true` : seul le proxy connu est cru pour `X-Forwarded-For`).

## 2b. Option B — Tailscale uniquement

Dans le CT (Tailscale installé, TUN configuré comme en 2a.1) :

```bash
tailscale up --hostname carnet
tailscale serve --bg --https=443 http://127.0.0.1:3000
tailscale serve status
```

`.env` : `APP_URL=https://carnet.<tailnet>.ts.net`, `TRUST_PROXY=127.0.0.1`, `APP_BIND=127.0.0.1`. Activer HTTPS et MagicDNS dans la console Tailscale si ce n'est pas fait.

## 3. Sauvegardes

| Niveau | Quoi | Fréquence | Rétention |
|---|---|---|---|
| Application | `pnpm db:backup` → `data/backups/carnet-*.db` | quotidienne (cron de l'hôte du CT) | 14 copies |
| Hors site | `deploy/backup-offsite.sh` (rclone ou rsync vers le VPS / un stockage distant) | quotidienne, après la précédente | 30 jours (rclone) |
| Conteneur | Job PBS du CT 230 | quotidienne | selon la politique PBS |
| Secrets | `SECRETS_KEY`, `.env` | à chaque changement | gestionnaire de mots de passe, **jamais** avec la base |

Crontab de l'hôte du CT (`crontab -e` dans le CT) :

```cron
15 3 * * * cd /opt/carnet-entretien && docker compose --env-file .env -f deploy/docker-compose.yml exec -T app node dist/server/db/backup.js >> /var/log/carnet-backup.log 2>&1
45 3 * * * OFFSITE_RCLONE=offsite:carnet-backups /opt/carnet-entretien/deploy/backup-offsite.sh >> /var/log/carnet-offsite.log 2>&1
```

## 4. Supervision

- Sonde HTTP `https://<APP_URL>/health` toutes les 60 s (Uptime Kuma du homelab), alerte ntfy après 2 échecs.
- Sonde « mot-clé » sur la réponse `"db":true`.
- `docker compose --env-file .env -f deploy/docker-compose.yml logs --since 24h app | grep '"level":50'` pour les erreurs (pino niveau 50).

## 5. Restauration (à tester une fois, M7-T6)

1. Créer un CT vierge avec `create-lxc.sh` (autre CTID), cloner le dépôt.
2. Restaurer `.env` depuis le gestionnaire de mots de passe (même `SECRETS_KEY`, sinon les canaux de notification sont à recréer).
3. Récupérer la dernière copie : `rclone copy offsite:carnet-backups/<fichier> data/` puis `sqlite3 data/<fichier> 'PRAGMA integrity_check'` ⇒ `ok`.
4. `mv data/<fichier> data/carnet.db && chown 1000:1000 data/carnet.db`.
5. `docker compose --env-file .env -f deploy/docker-compose.yml up -d --build`, vérifier `/health`, se connecter, envoyer un test de notification.
6. Basculer le reverse proxy (option A) ou le `tailscale serve` (option B) vers le nouveau CT ; arrêter l'ancien seulement après vérification.
