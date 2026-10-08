#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit) — bloque l'écriture de fichiers sensibles.
# exit 2 = refus, le message stderr est renvoyé à Claude.
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "jq absent : installez jq pour activer la protection des fichiers" >&2; exit 0; }

input="$(cat)"
file="$(jq -r '.tool_input.file_path // empty' <<<"$input")"
[[ -z "$file" ]] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel="${file#"$root"/}"

case "$rel" in
  .env|.env.local|.env.production|.env.*.local)
    echo "Refusé : $rel contient des secrets. Modifiez .env.example à la place." >&2
    exit 2 ;;
  data/*|*.db|*.db-wal|*.db-shm)
    echo "Refusé : $rel est une base de données. Passez par une migration Drizzle." >&2
    exit 2 ;;
  drizzle/*.sql|drizzle/meta/*)
    # Une migration déjà présente (donc potentiellement appliquée) est immuable.
    if [[ -e "$file" ]]; then
      echo "Refusé : la migration $rel existe déjà. Modifiez src/server/db/schema.ts puis lancez 'pnpm db:generate'." >&2
      exit 2
    fi ;;
  pnpm-lock.yaml)
    echo "Refusé : le lockfile se met à jour via 'pnpm add' / 'pnpm install'." >&2
    exit 2 ;;
esac

exit 0
