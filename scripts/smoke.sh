#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://127.0.0.1:13080}

# 1) Get cookie from /health
CK=$(curl -s -D - -o /dev/null "$BASE/api/v1/health" \
     | awk -F '[; ]+' '/weai_vid/ {print $2}' | tr -d '\r')
echo "[cookie] weai_vid=$CK"

# 2) Create a post
PID=$(curl -s -X POST "$BASE/api/v1/posts" \
  -H 'content-type: application/json' \
  -d '{"content":"hello feed","personalId":"TEMP-ALFA"}' \
  | jq -r .id)
echo "[post] $PID"

# 3) Like / Save / Share
for a in like save share; do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
         -H "Cookie: weai_vid=$CK" \
         -X POST "$BASE/api/v1/posts/$PID/$a")
  echo "[$a] $code"
done

# 4) Check feed summary
curl -s "$BASE/api/v1/posts/feed?page=1&limit=5" \
  | jq '{first:.items[0]|{id,content,stats}}'
