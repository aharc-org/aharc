#!/bin/bash
set -e  # stop on errors

trap 'echo; read -r -p "✅ Script finished (or exited early). Press Enter to close..." _ < /dev/tty' EXIT

shopt -s nullglob

# Fail if not exactly one .org file exists
ORG_FILES=(*.org)
if [ ${#ORG_FILES[@]} -ne 1 ]; then
    echo "❌ Expected exactly one .org file, found ${#ORG_FILES[@]}"
    exit 1
fi

# Extract organisation file
ORG_FILE="${ORG_FILES[0]}"

# Get base name (e.g. acme.org → acme)
BASENAME=$(basename "$ORG_FILE" .org)

EXPECTED_URL="git@github.com:${BASENAME}-org/${BASENAME}.git"

# Check current remote (if it exists)
CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [[ -n "$CURRENT_URL" && "$CURRENT_URL" != "$EXPECTED_URL" ]]; then
    echo "⚠️ Remote mismatch detected"
    echo "Current:  $CURRENT_URL"
    echo "Expected: $EXPECTED_URL"
    read -p "Update remote to expected? (y/N): " CONFIRM
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        git remote set-url origin "$EXPECTED_URL"
    else
        echo "❌ Aborting to avoid pushing to wrong repo"
        exit 1
    fi
else
    git remote set-url origin "$EXPECTED_URL"
fi

# 🔐 Validate GitHub SSH access
echo "🔐 Checking GitHub SSH access..."
SSH_OUTPUT=$(ssh -T git@github.com 2>&1 || true)

if echo "$SSH_OUTPUT" | grep -q "successfully authenticated"; then
    echo "✅ SSH authentication OK"
else
    echo "❌ SSH authentication failed"
    echo "$SSH_OUTPUT"
    exit 1
fi

# Load commit message (first line only)
if [[ -f dep-message.txt ]]; then
    MESSAGE_LINE=$(head -n 1 dep-message.txt | tr -d '\r\n')
    MESSAGE="${BASENAME} ${MESSAGE_LINE}"
else
    MESSAGE="${BASENAME} update"
fi

# Git operations
git add .

if git diff --cached --quiet; then
    echo "Nothing to commit"
    exit 0
fi

git commit -m "$MESSAGE"
git push
