#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
cd "$ROOT_DIR"

echo "==> Running code scan in $ROOT_DIR"

has_cmd() { command -v "$1" >/dev/null 2>&1; }

echo "-- Versions --"
node -v || true
npm -v || true

echo "\n==> Lint (ESLint)"
# Client
npm exec --no -- eslint "client/src" --ext .js,.jsx,.ts,.tsx || { echo "ESLint failed for client"; exit 1; }
# Server
npm exec --no -- eslint "server/src" --ext .js,.cjs,.mjs || { echo "ESLint failed for server"; exit 1; }

echo "\n==> TypeScript typecheck (client)"
if [ -f client/tsconfig.json ]; then
  npm exec --no -- tsc -p client/tsconfig.json --noEmit || { echo "TypeScript typecheck failed for client"; exit 1; }
else
  echo "(skip) client/tsconfig.json not found"
fi

echo "\n==> Prettier formatting check"
PRETTIER_PATTERNS=(
  "**/*.{js,jsx,ts,tsx,json,css,scss,md,yml,yaml}"
)
npm exec --no -- prettier -c "${PRETTIER_PATTERNS[@]}" --ignore-path .gitignore || { echo "Prettier check failed"; exit 1; }

echo "\n==> Targeted pattern scans"
ISSUE_COUNT=0

warn() {
  ISSUE_COUNT=$((ISSUE_COUNT + 1))
  printf "[!] %s\n" "$1"
}

# 1) Potential duplicate useTheme imports from both modules in same file
echo " - scanning for duplicate useTheme imports in the same file"
TMP_A=$(mktemp)
TMP_B=$(mktemp)
grep -RslE "import\\s*\\{[^}]*useTheme[^}]*\\}\\s*from\\s*'@mui/material';" client/src || true > "$TMP_A"
grep -RslE "import\\s*\\{[^}]*useTheme[^}]*\\}\\s*from\\s*'@mui/material/styles'" client/src || true > "$TMP_B"
if [ -s "$TMP_A" ] && [ -s "$TMP_B" ]; then
  DUP_FILES=$(comm -12 <(sort "$TMP_A") <(sort "$TMP_B") || true)
  if [ -n "${DUP_FILES}" ]; then
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      warn "Duplicate useTheme import sources in: $f"
    done <<< "$DUP_FILES"
  fi
fi
rm -f "$TMP_A" "$TMP_B"

# 2) Likely invalid MUI Typography variants starting with 'card'
echo " - scanning for suspicious Typography variant values"
grep -RInE "variant=\"card[^"]*\"|variant='card[^']*'" client/src || true | while IFS= read -r line; do
  warn "Suspicious Typography variant: $line"
done

# 3) catch (_error) blocks that reference bare 'error'
echo " - scanning for catch(_error) blocks referencing 'error'"
grep -RIl "catch (\(_error\))" client/src server/src || true | while IFS= read -r f; do
  if grep -In "catch (\(_error\))" "$f" >/dev/null 2>&1 && grep -In "[^_]error" "$f" >/dev/null 2>&1; then
    warn "File may use 'error' inside catch(_error): $f"
  fi
done

# 4) Spreading 'theme' object (..theme) which may be undefined without useTheme
echo " - scanning for spreading of 'theme' object"
grep -RInE "\.\.\.?\s*theme\b" client/src || true | while IFS= read -r line; do
  warn "Theme spread detected (verify theme is defined): $line"
done

echo "\n==> Summary"
if [ "$ISSUE_COUNT" -gt 0 ]; then
  echo "Found $ISSUE_COUNT potential issue(s)."
  exit 2
else
  echo "No targeted pattern issues detected."
fi


