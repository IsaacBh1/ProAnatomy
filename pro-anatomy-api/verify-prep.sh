#!/usr/bin/env bash
set -euo pipefail

echo "── 1. schema.prisma has directUrl ──"
grep -q 'directUrl' prisma/schema.prisma && echo "  ✔ directUrl present" || { echo "  ✖ MISSING"; exit 1; }

echo
echo "── 2. env.ts accepts the new vars ──"
grep -q 'DIRECT_URL' src/env.ts            && echo "  ✔ DIRECT_URL"        || echo "  ✖ MISSING"
grep -q 'COOKIE_SAME_SITE' src/env.ts      && echo "  ✔ COOKIE_SAME_SITE"  || echo "  ✖ MISSING"

echo
echo "── 3. cookies.ts uses it ──"
grep -q 'env.COOKIE_SAME_SITE' src/shared/security/cookies.ts \
  && echo "  ✔ wired up" || echo "  ✖ not wired"

echo
echo "── 4. .env state ──"
if [ ! -f .env ]; then echo "  ✖ no .env"; exit 1; fi
grep -q '^DIRECT_URL=' .env      && echo "  ✔ DIRECT_URL present"       || echo "  ✖ MISSING"
grep -q '^COOKIE_SAME_SITE=' .env && echo "  ✔ COOKIE_SAME_SITE present" || echo "  ✖ MISSING"

echo
echo "── 5. .env current DATABASE_URL / DIRECT_URL (passwords hidden) ──"
# Hide everything between : and @ to avoid printing secrets to the terminal.
awk -F= '/^DATABASE_URL=|^DIRECT_URL=/ { k=$1; v=$2; gsub(/:[^:@]+@/, ":***@", v); print "  " k "=" v }' .env

echo
echo "── 6. package.json scripts ──"
node -e '
  const pkg = require("./package.json");
  const s = pkg.scripts ?? {};
  for (const k of ["build", "start"]) {
    console.log(`  ${s[k] ? "✔" : "✖"} ${k}: ${s[k] ?? "(missing)"}`);
  }
  console.log(`  ${s.postinstall?.includes("prisma generate") ? "✔" : "⚠"} postinstall runs prisma generate`);
'
