#!/bin/bash

trap 'echo; read -r -p "✅ Script finished (or exited early). Press Enter to close..." _ < /dev/tty' EXIT

if [[ $(git branch --show-current) != "main" ]]; then
    echo "❌ Not on main; aborting."
    exit 1
fi

read -p "⚠️ Type 'yes' to FORCE push: " confirm

if [[ "$confirm" =~ ^[Yy][Ee][Ss]$ ]]; then
    git push origin main --force
else
    echo "❌ Aborted."
fi
