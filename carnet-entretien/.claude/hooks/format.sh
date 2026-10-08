#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit) — formate le fichier modifié. Non bloquant.
set -uo pipefail

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"
file="$(jq -r '.tool_input.file_path // empty' <<<"$input")"
[[ -z "$file" || ! -f "$file" ]] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
[[ -x "$root/node_modules/.bin/prettier" ]] || exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.mjs|*.cjs|*.json|*.css|*.md|*.html|*.yml|*.yaml)
    "$root/node_modules/.bin/prettier" --write --log-level warn "$file" >/dev/null 2>&1 || true ;;
esac

case "$file" in
  *.ts|*.tsx)
    if [[ -x "$root/node_modules/.bin/eslint" ]]; then
      # Corrige ce qui est automatique. En PostToolUse, exit 2 ne bloque rien
      # (l'écriture a déjà eu lieu) mais transmet stderr à Claude pour correction.
      out="$("$root/node_modules/.bin/eslint" --fix --no-warn-ignored "$file" 2>&1)" || {
        echo "ESLint signale des problèmes dans $file :" >&2
        echo "$out" | head -n 30 >&2
        exit 2
      }
    fi ;;
esac

exit 0
