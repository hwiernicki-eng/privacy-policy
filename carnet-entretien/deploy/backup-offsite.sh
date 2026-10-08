#!/usr/bin/env bash
# =============================================================================
# backup-offsite.sh — Copie hors site de la dernière sauvegarde SQLite.
#
# À exécuter dans le CT, hors Docker, après `db:backup` (voir docs/DEPLOYMENT.md §3).
# Ne supprime JAMAIS de fichier local. Côté distant, seule la rétention rclone
# (--retention-days) supprime des copies, et uniquement des fichiers carnet-*.db.
#
# Cible (une seule) :
#   OFFSITE_RCLONE=remote:chemin           (rclone configuré : rclone config)
#   OFFSITE_RSYNC=user@hote:/chemin/        (clé SSH sans mot de passe, dossier existant)
#
# Options :
#   --data-dir <dir>        défaut : /opt/carnet-entretien/data
#   --retention-days <n>    rclone uniquement, 7-365, défaut 30 ; 0 = pas de purge
#   --dry-run               affiche sans transférer
# =============================================================================
set -Eeuo pipefail

DATA_DIR="/opt/carnet-entretien/data"
RETENTION_DAYS=30
DRY_RUN=0
MAX_AGE_HOURS=36

log() { printf '%s [%s] %s\n' "$(date -Iseconds)" "$1" "$2"; }
die() { log ERREUR "$*" >&2; exit 1; }
trap 'die "échec ligne $LINENO"' ERR

while [[ $# -gt 0 ]]; do
  case "$1" in
    --data-dir) DATA_DIR="${2:-}"; shift 2 ;;
    --retention-days) RETENTION_DAYS="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) die "option inconnue : $1" ;;
  esac
done

# --- Verrou : pas deux exécutions simultanées
exec 9>/tmp/carnet-backup-offsite.lock
flock -n 9 || die "une autre exécution est en cours"

# --- Validation des entrées
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || die "--retention-days doit être un entier"
(( RETENTION_DAYS == 0 || (RETENTION_DAYS >= 7 && RETENTION_DAYS <= 365) )) || die "--retention-days : 0 ou 7 à 365"
[[ -d "$DATA_DIR/backups" ]] || die "dossier introuvable : $DATA_DIR/backups"

if [[ -n "${OFFSITE_RCLONE:-}" && -n "${OFFSITE_RSYNC:-}" ]]; then die "définir OFFSITE_RCLONE ou OFFSITE_RSYNC, pas les deux"; fi
if [[ -n "${OFFSITE_RCLONE:-}" ]]; then
  [[ "$OFFSITE_RCLONE" =~ ^[A-Za-z0-9_-]+:[A-Za-z0-9._/-]*$ ]] || die "OFFSITE_RCLONE invalide (attendu remote:chemin)"
  command -v rclone >/dev/null || die "rclone absent (apt install rclone)"
  rclone listremotes | grep -qx "${OFFSITE_RCLONE%%:*}:" || die "remote rclone inconnu : ${OFFSITE_RCLONE%%:*}"
elif [[ -n "${OFFSITE_RSYNC:-}" ]]; then
  [[ "$OFFSITE_RSYNC" =~ ^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+:/[A-Za-z0-9._/-]+/$ ]] || die "OFFSITE_RSYNC invalide (attendu user@hote:/chemin/ avec / final)"
  command -v rsync >/dev/null || die "rsync absent"
  (( RETENTION_DAYS == 0 )) || log INFO "rétention ignorée en rsync : la gérer côté destination"
else
  die "aucune cible : définir OFFSITE_RCLONE ou OFFSITE_RSYNC"
fi
command -v sqlite3 >/dev/null || die "sqlite3 absent (apt install sqlite3)"

# --- Dernière sauvegarde
latest="$(find "$DATA_DIR/backups" -maxdepth 1 -type f -name 'carnet-*.db' -printf '%T@ %p\n' | sort -nr | head -n1 | cut -d' ' -f2-)"
[[ -n "$latest" ]] || die "aucune sauvegarde carnet-*.db dans $DATA_DIR/backups"
age_h=$(( ( $(date +%s) - $(stat -c %Y "$latest") ) / 3600 ))
(( age_h <= MAX_AGE_HOURS )) || die "dernière sauvegarde trop ancienne (${age_h} h) : vérifier db:backup"
size=$(stat -c %s "$latest")
(( size > 0 )) || die "sauvegarde vide : $latest"

# --- Intégrité avant envoi
check="$(sqlite3 -readonly "$latest" 'PRAGMA integrity_check;' 2>&1 || true)"
[[ "$check" == "ok" ]] || die "intégrité KO pour $latest : $check"
log INFO "OK : $(basename "$latest") (${size} octets, ${age_h} h)"

# --- Transfert
if [[ -n "${OFFSITE_RCLONE:-}" ]]; then
  args=(copy "$latest" "$OFFSITE_RCLONE" --immutable --checksum)
  (( DRY_RUN )) && args+=(--dry-run)
  rclone "${args[@]}"
  if (( RETENTION_DAYS > 0 )); then
    purge=(delete "$OFFSITE_RCLONE" --min-age "${RETENTION_DAYS}d" --include 'carnet-*.db')
    (( DRY_RUN )) && purge+=(--dry-run)
    rclone "${purge[@]}"
  fi
else
  args=(-a --checksum --ignore-existing "$latest" "$OFFSITE_RSYNC")
  (( DRY_RUN )) && args=(--dry-run "${args[@]}")
  rsync "${args[@]}"
fi

log INFO "copie hors site terminée$( (( DRY_RUN )) && echo ' (dry-run)')"
