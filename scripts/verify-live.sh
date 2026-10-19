#!/usr/bin/env bash
# Post-deploy check of the LIVE site. Fails the deploy (so GitHub emails you)
# if any page or the CSS/JS it needs doesn't load, or if the live files don't
# match the build that was just uploaded. Results also appear as a summary on
# the workflow run page (readable on iPad, no console needed).
#
# Usage: scripts/verify-live.sh https://windowdude.com
set -uo pipefail

SITE="${1:?site URL required}"
SITE="${SITE%/}"
BUST="verify=$(date +%s)"
UA="WindowDude-deploy-check"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"
FAILS=0

pass() { echo "✅ $1"; echo "- ✅ $1" >> "$SUMMARY"; }
fail() { echo "❌ $1"; echo "- ❌ $1" >> "$SUMMARY"; FAILS=$((FAILS + 1)); }

# A missing file must not be "found" as an HTML page (e.g. a 404 page or fallback)
is_html() { head -c 200 "$1" | tr 'A-Z' 'a-z' | grep -q '<!doctype\|<html'; }

fetch() { curl -sS -L --max-time 20 -A "$UA" -o "$2" -w '%{http_code}' "$1" 2>/dev/null || true; }

echo "## Live site check: $SITE" >> "$SUMMARY"

# Pages = every built index.html (plus the home page)
PAGES=$(cd dist && find . -name index.html | sed 's#^\.##; s#index\.html$##' | sort)   # /, /about/, ...
TMP=$(mktemp -d)

for page in $PAGES; do
  url="$SITE$page"
  # 1) Fresh copy (bypasses caches): must load and use the stable asset names
  code=$(fetch "$url?$BUST" "$TMP/fresh.html")
  if [ "$code" != "200" ]; then fail "$page returned HTTP $code"; continue; fi
  if grep -q '/assets/site.css' "$TMP/fresh.html" && grep -q '/assets/site.js' "$TMP/fresh.html"; then
    pass "$page loads (fresh copy)"
  else
    fail "$page fresh copy doesn't reference /assets/site.css and /assets/site.js"
  fi

  # 2) What visitors actually get (may come from a cache): every CSS/JS it asks for must load
  code=$(fetch "$url" "$TMP/plain.html")
  if [ "$code" != "200" ]; then fail "$page (as visitors see it) returned HTTP $code"; continue; fi
  for asset in $(grep -oE '/assets/[^"?]+\.(css|js)' "$TMP/plain.html" | sort -u); do
    acode=$(fetch "$SITE$asset" "$TMP/asset")
    if [ "$acode" = "200" ] && ! is_html "$TMP/asset"; then pass "$page → $asset loads"
    else fail "$page → $asset is missing (HTTP $acode); the page would look broken"; fi
  done
  if ! cmp -s "$TMP/fresh.html" "$TMP/plain.html"; then
    echo "⚠️ $page: visitors are being served an older cached copy (check cPanel → NGINX Caching)" | tee -a "$SUMMARY"
  fi
done

# 3) Live CSS/JS must match what was just built (proves the upload completed)
for f in site.css site.js; do
  fetch "$SITE/assets/$f?$BUST" "$TMP/$f" >/dev/null
  if cmp -s "$TMP/$f" "dist/assets/$f"; then pass "/assets/$f matches this build"; else fail "/assets/$f on the server doesn't match this build"; fi
  # What visitors get (no cache-buster): warn if a cache is still serving the old version
  fetch "$SITE/assets/$f" "$TMP/plain-$f" >/dev/null
  if ! cmp -s "$TMP/plain-$f" "dist/assets/$f"; then
    echo "⚠️ /assets/$f: visitors still get the previous version from a cache (check cPanel → NGINX Caching)" | tee -a "$SUMMARY"
  fi
done

# 4) Old hashed file names still resolve (rescues pages cached before stable names)
# Unique name every run so no cache (e.g. NGINX) can answer from a previous deploy
fetch "$SITE/assets/site-old$(date +%s)$RANDOM.css" "$TMP/old.css" >/dev/null
if cmp -s "$TMP/old.css" "dist/assets/site.css"; then pass "old hashed asset names are served the current CSS"
else fail "old hashed asset URL does not serve the current CSS (.htaccess rewrite not working)"; fi

rm -rf "$TMP"
if [ "$FAILS" -gt 0 ]; then
  echo "**$FAILS problem(s) found. See the ❌ lines above.**" >> "$SUMMARY"
  exit 1
fi
echo "**All checks passed.**" >> "$SUMMARY"
