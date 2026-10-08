#!/usr/bin/env bash
# PreToolUse (Bash) — bloque les commandes destructrices ou contraires aux règles du projet.
set -euo pipefail

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"
cmd="$(jq -r '.tool_input.command // empty' <<<"$input")"
[[ -z "$cmd" ]] && exit 0

deny() { echo "Refusé : $1" >&2; exit 2; }

# Suppressions récursives hors dossiers de build
if grep -Eq '(^|[;&|[:space:]])rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[[:space:]]' <<<"$cmd"; then
  if ! grep -Eq 'rm[[:space:]]+-[a-zA-Z]+[[:space:]]+(\./)?(dist|coverage|node_modules|playwright-report|test-results)/?([[:space:]]|$)' <<<"$cmd"; then
    deny "rm -rf autorisé uniquement sur dist/, coverage/, node_modules/, playwright-report/, test-results/."
  fi
fi

grep -Eq 'drizzle-kit[[:space:]]+push' <<<"$cmd" && deny "drizzle-kit push est interdit : utilisez 'pnpm db:generate' puis 'pnpm db:migrate'."
grep -Eq 'git[[:space:]]+push[[:space:]].*(--force|-f([[:space:]]|$))' <<<"$cmd" && deny "push forcé interdit."
grep -Eq 'git[[:space:]]+reset[[:space:]]+--hard' <<<"$cmd" && deny "git reset --hard interdit sans validation humaine."
grep -Eq '(^|[;&|[:space:]])(pct|qm)[[:space:]]+(destroy|stop|shutdown|rollback)' <<<"$cmd" && deny "commandes Proxmox destructrices interdites depuis Claude Code."
grep -Eq '(^|[;&|[:space:]])(cat|less|more|head|tail)[[:space:]]+[^|;&]*\.env([[:space:]]|$)' <<<"$cmd" && deny "lecture de .env interdite."

exit 0
