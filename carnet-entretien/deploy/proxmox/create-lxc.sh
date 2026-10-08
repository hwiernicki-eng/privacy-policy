#!/usr/bin/env bash
# =============================================================================
# create-lxc.sh — Crée un conteneur LXC Debian non privilégié prêt pour Docker
#                 et y prépare le déploiement de Carnet d'entretien.
#
# À exécuter sur un nœud Proxmox VE (root). Ne détruit ni ne modifie jamais
# un conteneur ou une VM existante.
#
# Exemples :
#   ./create-lxc.sh --ctid 230 --ip dhcp --dry-run
#   ./create-lxc.sh --ctid 230 --hostname carnet --ip 192.168.1.230/24 --gw 192.168.1.1 \
#       --storage local-lvm --repo https://github.com/<compte>/carnet-entretien.git
# =============================================================================
set -Eeuo pipefail

# ----------------------------- Valeurs par défaut ----------------------------
CTID=""
HOSTNAME_CT="carnet"
STORAGE="local-lvm"
TEMPLATE_STORAGE="local"
TEMPLATE_PATTERN="debian-12-standard"
BRIDGE="vmbr0"
IP="dhcp"
GW=""
VLAN=""
CORES=1
MEMORY=1024
SWAP=512
DISK=8
REPO=""
SSH_KEY_FILE=""
ASSUME_YES=0
DRY_RUN=0
APP_DIR="/opt/carnet-entretien"

CREATED=0

# --------------------------------- Utilitaires -------------------------------
log()  { printf '\033[1;34m[INFO]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[ERREUR]\033[0m %s\n' "$*" >&2; exit 1; }

on_error() {
  local code=$? line=$1
  printf '\033[1;31m[ERREUR]\033[0m échec ligne %s (code %s).\n' "$line" "$code" >&2
  if [[ $CREATED -eq 1 ]]; then
    warn "Le conteneur $CTID a été créé mais la préparation a échoué."
    warn "Il n'est PAS supprimé automatiquement. Inspectez-le : pct enter $CTID"
    warn "Suppression manuelle si nécessaire : pct stop $CTID && pct destroy $CTID"
  fi
  exit "$code"
}
trap 'on_error $LINENO' ERR

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    printf '\033[2m[dry-run]\033[0m'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

usage() {
  cat <<'EOF'
Usage : create-lxc.sh --ctid <id> [options]

Obligatoire :
  --ctid <id>                 Identifiant libre (100-999999999)

Options :
  --hostname <nom>            Nom d'hôte (défaut : carnet)
  --storage <stockage>        Stockage du rootfs, contenu "rootdir" (défaut : local-lvm)
  --template-storage <st>     Stockage des templates, contenu "vztmpl" (défaut : local)
  --template-pattern <motif>  Motif du template (défaut : debian-12-standard)
  --bridge <pont>             Pont réseau (défaut : vmbr0)
  --vlan <tag>                Tag VLAN (1-4094)
  --ip <dhcp|CIDR>            dhcp ou ex. 192.168.1.230/24 (défaut : dhcp)
  --gw <ip>                   Passerelle (obligatoire si IP statique)
  --cores <n>                 vCPU 1-8 (défaut : 1)
  --memory <Mo>               RAM 512-8192 (défaut : 1024)
  --disk <Go>                 Disque 4-200 (défaut : 8)
  --repo <url git>            Clone le dépôt dans /opt/carnet-entretien
  --ssh-key <fichier>         Clé publique SSH autorisée pour root
  --yes                       Ne pas demander de confirmation
  --dry-run                   Afficher les commandes sans rien exécuter
  -h, --help                  Aide
EOF
}

# ------------------------------- Arguments ----------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ctid) CTID="${2:-}"; shift 2 ;;
    --hostname) HOSTNAME_CT="${2:-}"; shift 2 ;;
    --storage) STORAGE="${2:-}"; shift 2 ;;
    --template-storage) TEMPLATE_STORAGE="${2:-}"; shift 2 ;;
    --template-pattern) TEMPLATE_PATTERN="${2:-}"; shift 2 ;;
    --bridge) BRIDGE="${2:-}"; shift 2 ;;
    --vlan) VLAN="${2:-}"; shift 2 ;;
    --ip) IP="${2:-}"; shift 2 ;;
    --gw) GW="${2:-}"; shift 2 ;;
    --cores) CORES="${2:-}"; shift 2 ;;
    --memory) MEMORY="${2:-}"; shift 2 ;;
    --disk) DISK="${2:-}"; shift 2 ;;
    --repo) REPO="${2:-}"; shift 2 ;;
    --ssh-key) SSH_KEY_FILE="${2:-}"; shift 2 ;;
    --yes) ASSUME_YES=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage; die "Option inconnue : $1" ;;
  esac
done

# ------------------------------ Pré-requis hôte ------------------------------
[[ $EUID -eq 0 ]] || die "Exécuter en root sur le nœud Proxmox."
for bin in pct pvesm pveam pvesh pveversion ip; do
  command -v "$bin" >/dev/null 2>&1 || die "Commande '$bin' introuvable : ce script doit tourner sur Proxmox VE."
done
log "Hôte : $(pveversion | head -n1)"

# ------------------------------ Validation entrées ---------------------------
is_int() { [[ "$1" =~ ^[0-9]+$ ]]; }
in_range() { is_int "$1" && (( $1 >= $2 && $1 <= $3 )); }
valid_ipv4() {
  local ip=$1 o
  [[ "$ip" =~ ^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$ ]] || return 1
  for o in "${BASH_REMATCH[@]:1}"; do (( o <= 255 )) || return 1; done
}

[[ -n "$CTID" ]] || { usage; die "--ctid est obligatoire."; }
in_range "$CTID" 100 999999999 || die "CTID invalide : $CTID (entier 100-999999999)."
[[ "$HOSTNAME_CT" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || die "Nom d'hôte invalide : $HOSTNAME_CT (minuscules, chiffres, tirets)."
[[ "$STORAGE" =~ ^[A-Za-z0-9._-]+$ ]] || die "Nom de stockage invalide : $STORAGE"
[[ "$TEMPLATE_STORAGE" =~ ^[A-Za-z0-9._-]+$ ]] || die "Nom de stockage de templates invalide : $TEMPLATE_STORAGE"
[[ "$TEMPLATE_PATTERN" =~ ^[A-Za-z0-9._-]+$ ]] || die "Motif de template invalide : $TEMPLATE_PATTERN"
[[ "$BRIDGE" =~ ^[A-Za-z0-9._-]{1,15}$ ]] || die "Nom de pont invalide : $BRIDGE"
[[ -z "$VLAN" ]] || in_range "$VLAN" 1 4094 || die "VLAN invalide : $VLAN"
in_range "$CORES" 1 8 || die "--cores doit être entre 1 et 8."
in_range "$MEMORY" 512 8192 || die "--memory doit être entre 512 et 8192 Mo."
in_range "$DISK" 4 200 || die "--disk doit être entre 4 et 200 Go."

if [[ "$IP" != "dhcp" ]]; then
  [[ "$IP" =~ ^([0-9.]+)/([0-9]{1,2})$ ]] || die "--ip doit valoir dhcp ou une adresse CIDR (ex. 192.168.1.230/24)."
  valid_ipv4 "${BASH_REMATCH[1]}" && in_range "${BASH_REMATCH[2]}" 8 32 || die "Adresse IP invalide : $IP"
  [[ -n "$GW" ]] || die "--gw est obligatoire avec une IP statique."
  valid_ipv4 "$GW" || die "Passerelle invalide : $GW"
  if command -v ping >/dev/null 2>&1 && ping -c1 -W1 "${IP%/*}" >/dev/null 2>&1; then
    die "L'adresse ${IP%/*} répond déjà au ping : conflit d'IP probable."
  fi
elif [[ -n "$GW" ]]; then
  warn "--gw ignoré en DHCP."; GW=""
fi

if [[ -n "$REPO" ]]; then
  [[ "$REPO" =~ ^(https://|git@)[A-Za-z0-9._~@:/+-]+(\.git)?$ ]] || die "URL de dépôt refusée : $REPO"
fi
if [[ -n "$SSH_KEY_FILE" ]]; then
  [[ -f "$SSH_KEY_FILE" ]] || die "Clé SSH introuvable : $SSH_KEY_FILE"
  grep -Eq '^(ssh-(ed25519|rsa)|ecdsa-sha2-nistp(256|384|521)) ' "$SSH_KEY_FILE" || die "Le fichier $SSH_KEY_FILE ne ressemble pas à une clé publique SSH."
fi

# ------------------------------ Vérifications PVE ----------------------------
# Identifiant libre sur tout le cluster (pvesh échoue si l'ID existe déjà)
if ! pvesh get /cluster/nextid --vmid "$CTID" >/dev/null 2>&1; then
  die "L'identifiant $CTID est déjà utilisé (CT ou VM) dans le cluster."
fi

pvesm status --content rootdir 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx "$STORAGE" \
  || die "Le stockage '$STORAGE' n'existe pas ou n'accepte pas les conteneurs (contenu rootdir)."
pvesm status --content vztmpl 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx "$TEMPLATE_STORAGE" \
  || die "Le stockage '$TEMPLATE_STORAGE' n'existe pas ou n'accepte pas les templates (contenu vztmpl)."
ip link show "$BRIDGE" >/dev/null 2>&1 || die "Le pont réseau '$BRIDGE' n'existe pas sur ce nœud."

# Template : le plus récent correspondant au motif, téléchargé si absent
TEMPLATE="$(pveam list "$TEMPLATE_STORAGE" 2>/dev/null | awk 'NR>1 {print $1}' | grep -E "vztmpl/${TEMPLATE_PATTERN}_" | sort -V | tail -n1 || true)"
if [[ -z "$TEMPLATE" ]]; then
  log "Template $TEMPLATE_PATTERN absent de $TEMPLATE_STORAGE, recherche en ligne…"
  run pveam update
  AVAILABLE="$(pveam available --section system | awk '{print $2}' | grep -E "^${TEMPLATE_PATTERN}_" | sort -V | tail -n1 || true)"
  [[ -n "$AVAILABLE" ]] || die "Aucun template '$TEMPLATE_PATTERN' disponible (pveam available --section system)."
  run pveam download "$TEMPLATE_STORAGE" "$AVAILABLE"
  TEMPLATE="${TEMPLATE_STORAGE}:vztmpl/${AVAILABLE}"
fi
log "Template : $TEMPLATE"

# ---------------------------------- Résumé -----------------------------------
NET0="name=eth0,bridge=${BRIDGE},ip=${IP},firewall=1"
[[ -n "$GW" ]] && NET0+=",gw=${GW}"
[[ -n "$VLAN" ]] && NET0+=",tag=${VLAN}"

cat <<EOF

  Conteneur à créer
  ─────────────────────────────────────────────
  CTID ............ $CTID
  Hostname ........ $HOSTNAME_CT
  Template ........ $TEMPLATE
  Rootfs .......... ${STORAGE}:${DISK} Go
  CPU / RAM / swap  ${CORES} vCPU / ${MEMORY} Mo / ${SWAP} Mo
  Réseau .......... $NET0
  Type ............ non privilégié, nesting=1, keyctl=1 (Docker)
  Dépôt ........... ${REPO:-aucun}
  Mode ............ $([[ $DRY_RUN -eq 1 ]] && echo "DRY-RUN (rien n'est exécuté)" || echo "EXÉCUTION")

EOF

if [[ $ASSUME_YES -eq 0 && $DRY_RUN -eq 0 ]]; then
  read -r -p "Confirmer la création ? Tapez le CTID ($CTID) pour continuer : " answer
  [[ "$answer" == "$CTID" ]] || die "Annulé."
fi

# --------------------------------- Création ----------------------------------
CREATE_ARGS=(
  "$CTID" "$TEMPLATE"
  --hostname "$HOSTNAME_CT"
  --ostype debian
  --unprivileged 1
  --features "nesting=1,keyctl=1"
  --cores "$CORES"
  --memory "$MEMORY"
  --swap "$SWAP"
  --rootfs "${STORAGE}:${DISK}"
  --net0 "$NET0"
  --onboot 1
  --tags "carnet;docker"
  --description "Carnet d'entretien — créé par create-lxc.sh le $(date -Iseconds)"
)
[[ -n "$SSH_KEY_FILE" ]] && CREATE_ARGS+=(--ssh-public-keys "$SSH_KEY_FILE")

log "Création du conteneur $CTID…"
run pct create "${CREATE_ARGS[@]}"
[[ $DRY_RUN -eq 0 ]] && CREATED=1
run pct start "$CTID"

if [[ $DRY_RUN -eq 0 ]]; then
  log "Attente du réseau dans le conteneur…"
  for _ in $(seq 1 30); do
    pct exec "$CTID" -- getent hosts deb.debian.org >/dev/null 2>&1 && break
    sleep 2
  done
  pct exec "$CTID" -- getent hosts deb.debian.org >/dev/null 2>&1 || die "Pas de résolution DNS dans le conteneur après 60 s (vérifier IP/passerelle/DNS)."
fi

# --------------------------- Installation de Docker --------------------------
read -r -d '' INSTALL_DOCKER <<'EOS' || true
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q ca-certificates curl git jq unattended-upgrades
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
apt-get update -q
apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker info --format '{{.ServerVersion}} storage={{.Driver}}'
EOS

log "Installation de Docker (dépôt officiel)…"
run pct exec "$CTID" -- bash -c "$INSTALL_DOCKER"

# ------------------------------- Dépôt applicatif ----------------------------
if [[ -n "$REPO" ]]; then
  log "Clonage du dépôt dans $APP_DIR…"
  PREP_APP="set -euo pipefail
if [ -e $(printf '%q' "$APP_DIR") ]; then echo 'Le dossier existe déjà, clonage ignoré.'; else git clone --depth 1 $(printf '%q' "$REPO") $(printf '%q' "$APP_DIR"); fi
cd $(printf '%q' "$APP_DIR")
mkdir -p data && chown 1000:1000 data && chmod 750 data
if [ ! -f .env ]; then cp deploy/.env.example .env && chmod 600 .env; fi"
  run pct exec "$CTID" -- bash -c "$PREP_APP"
fi

# --------------------------------- Fin ---------------------------------------
CT_IP="(DHCP)"
if [[ $DRY_RUN -eq 0 ]]; then
  CT_IP="$(pct exec "$CTID" -- hostname -I 2>/dev/null | awk '{print $1}' || true)"
fi

cat <<EOF

  Conteneur $CTID prêt ${CT_IP:+— IP : $CT_IP}

  Étapes suivantes :
    1. pct enter $CTID
    2. cd $APP_DIR && nano .env          # APP_URL, SMTP_*, REGISTRATION_OPEN
    3. docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
    4. curl -fsS http://127.0.0.1:3000/health
    5. Reverse proxy TLS → ${CT_IP:-<IP du CT>}:3000
       (adapter le mapping de port du compose si le proxy est sur une autre machine)
    6. Ajouter le CT $CTID à un job de sauvegarde PBS (Datacenter → Backup)

EOF
