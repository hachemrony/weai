#!/usr/bin/env bash
# scripts/smoke.sh
# One-shot sanity check for the WEAI API.
# - Creates a post
# - Likes / Saves / Shares it
# - Verifies feed stats
# - Cleans up toggles

set -euo pipefail

# ---- Config ---------------------------------------------------------------
BASE="${BASE:-http://127.0.0.1:13080}"   # override with: BASE=http://localhost:13080 npm run smoke
CURL="curl -sS --connect-timeout 2 --max-time 5"
JAR="$(mktemp -t weai_cookie_XXXXXX)"

# Kill cookie jar on exit
cleanup() { rm -f "$JAR" 2>/dev/null || true; }
trap cleanup EXIT

# If any proxies are set locally, they can confuse localhost calls.
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY all_proxy ALL_PROXY

# ---- Helpers --------------------------------------------------------------
fail() { echo "❌ $*" >&2; exit 1; }
ok()   { echo "✅ $*"; }

http_head() {
  local url="$1"
  $CURL -I -b "$JAR" -c "$JAR" -o /dev/null -w "%{http_code}" "$url"
}

http_json() {
  # Usage: http_json METHOD URL [JSON_BODY]
  local method="$1" url="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    $CURL -b "$JAR" -c "$JAR" -H "content-type: application/json" -X "$method" \
      --data "$body" "$url"
  else
    $CURL -b "$JAR" -c "$JAR" -H "content-type: application/json" -X "$method" \
      "$url"
  fi
}

expect_200() {
  local method="$1" url="$2" body="${3:-}"
  local code
  if [[ -n "$body" ]]; then
    code=$($CURL -b "$JAR" -c "$JAR" -H "content-type: application/json" -X "$method" \
      --data "$body" -o /dev/null -w "%{http_code}" "$url")
  else
    code=$($CURL -b "$JAR" -c "$JAR" -H "content-type: application/json" -X "$method" \
      -o /dev/null -w "%{http_code}" "$url")
  fi
  [[ "$code" == "200" ]] || fail "$method $url -> HTTP $code (wanted 200)"
}

# ---- 0) Health -> also seeds cookie jar -----------------------------------
echo "• Health check: $BASE/api/v1/health"
code=$(http_head "$BASE/api/v1/health")
[[ "$code" == "200" ]] || fail "health returned $code"
ok "health 200, cookie captured"

# ---- 1) Create a post -----------------------------------------------------
echo "• Create post"
CREATE_PAYLOAD='{"content":"hello feed","personaId":"TEMP-ALFA"}'
resp=$(http_json POST "$BASE/api/v1/posts" "$CREATE_PAYLOAD")
PID=$(jq -r '.id // empty' <<<"$resp")
[[ -n "${PID:-}" ]] || fail "post create returned no id: $resp"
ok "post id: $PID"

# ---- 2) Like / Save / Share ----------------------------------------------
echo "• Like / Save / Share"
expect_200 POST "$BASE/api/v1/posts/$PID/like"
expect_200 POST "$BASE/api/v1/posts/$PID/save"
expect_200 POST "$BASE/api/v1/posts/$PID/share"
ok "reactions toggled on"

# ---- 3) Verify in feed ----------------------------------------------------
echo "• Verify feed"
feed=$(http_json GET "$BASE/api/v1/posts/feed?page=1&limit=5")
summary=$(jq '{first: .items[0] | {id, content, stats: {likes, saves, shares, messages}}}' <<<"$feed")
echo "$summary" | jq

# Assert reactions registered
liked=$(jq -r '.items[0].stats.likes.likedByMe // false' <<<"$feed")
likesCount=$(jq -r '.items[0].stats.likes.count // 0' <<<"$feed")

saved=$(jq -r '.items[0].stats.saves.savedByMe // false' <<<"$feed")
savesCount=$(jq -r '.items[0].stats.saves.count // 0' <<<"$feed")

shared=$(jq -r '.items[0].stats.shares.sharedByMe // false' <<<"$feed")
sharesCount=$(jq -r '.items[0].stats.shares.count // 0' <<<"$feed")

[[ "$liked" == "true"  && "$likesCount"  -ge 1 ]] || fail "Like didn’t register"
[[ "$saved" == "true"  && "$savesCount"  -ge 1 ]] || fail "Save didn’t register"
[[ "$shared" == "true" && "$sharesCount" -ge 1 ]] || fail "Share didn’t register"

ok "feed shows expected reaction stats"

# ---- 4) Cleanup (best effort) --------------------------------------------
echo "• Cleanup toggles"
$CURL -b "$JAR" -c "$JAR" -X DELETE -o /dev/null "$BASE/api/v1/posts/$PID/like"  || true
$CURL -b "$JAR" -c "$JAR" -X DELETE -o /dev/null "$BASE/api/v1/posts/$PID/save"  || true
$CURL -b "$JAR" -c "$JAR" -X DELETE -o /dev/null "$BASE/api/v1/posts/$PID/share" || true
ok "done"
