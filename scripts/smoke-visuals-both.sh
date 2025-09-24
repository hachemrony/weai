#!/usr/bin/env bash
set -euo pipefail
# debug on any error: show line and last command
trap 'echo "[ERR] line $LINENO: $BASH_COMMAND" >&2' ERR

declare -a JOB_IDS=()


MODE=${MODE:-animate}
INSTR=${INSTR:-"smoke: banana rocket"}
DURATIONSEC=${DURATIONSEC:-4}
PRESET=${PRESET:-}         # empty by default
PROV=${PROV:-both}
BASE=${BASE:-"http://127.0.0.1:3000/api/v1"}

need() { command -v "$1" >/dev/null || { echo "Need $1 installed"; exit 1; }; }
need jq; need curl


# curl that always fails on HTTP errors & times out quickly
ccurl() { curl --fail --silent --show-error --max-time 20 "$@"; }

need() { command -v "$1" >/dev/null || { echo "Need $1 installed: $1"; exit 1; }; }
need curl; need jq

echo "[1/5] Health"
curl -s "$BASE/visuals/health" | jq .

# pick a persona for the post
PERS="$(curl -s "$BASE/personas?limit=1" | jq -r '.items[0].id')"

echo "[2/5] Create post (persona: $PERS)"
POST_ID="$(curl -sS -X POST "$BASE/posts" \
  -H 'content-type: application/json' \
  -d "{\"content\":\"smoke post\",\"personaId\":\"$PERS\"}" \
  | jq -r '.id // empty')"

# some builds return 204/no body; fall back to the latest post
if [[ -z "${POST_ID:-}" ]]; then
  POST_ID="$(curl -s "$BASE/posts?limit=1" | jq -r '.items[0].id')"
fi
echo "post_id=$POST_ID"

echo "[3/5] enqueue (${PROV})"

PAYLOAD="$(jq -n \
  --arg  postId      "$POST_ID" \
  --arg  mode        "$MODE" \
  --arg  instruction "$INSTR" \
  --arg  preset      "$PRESET" \
  --argjson duration $DURATIONSEC '
  {postId:$postId, mode:$mode, instruction:$instruction}
  + (if ($preset|length)>0 then {preset:$preset} else {} end)
  + (if $duration>0 then {durationSec:$duration} else {} end)
')"

# POST and capture both body + status code (do NOT use the curl() wrapper)
RESP="$(command curl -sS -w $'\n%{http_code}' \
  -H 'content-type: application/json' \
  --data-raw "$PAYLOAD" \
  "$BASE/visuals?provider=$PROV")" || true

# Split into body + code
code="${RESP##*$'\n'}"
body="${RESP%$'\n'$code}"

# Pretty print if JSON; otherwise raw
echo "$body" | jq . 2>/dev/null || echo "$body"

# Treat any 4xx/5xx as failure (but with informative output)
if [ "$code" -ge 400 ]; then
  echo "[ERR] POST /visuals?provider=$PROV returned HTTP $code"
  exit 22
fi


echo "$RESP" | jq .

# --- parse job ids (supports object | array | string) ---
JOB_IDS=()
ids="$(echo "$RESP" | jq -r '
  if type=="object" and (.jobIds?!=null) then .jobIds[]            # { jobIds: [] }
  elif type=="object" and ((.jobId?!=null) or (.id?!=null)) then (.jobId // .id)  # { jobId } or { id }
  elif type=="string" then .                                        # "abc123"
  else empty
  end
')"

while IFS= read -r jid; do
  [[ -n "$jid" ]] && JOB_IDS+=("$jid")
done <<< "$ids"

# guard if we got nothing back
if [[ ${#JOB_IDS[@]} -eq 0 ]]; then
  echo "no jobs parsed from enqueue response"
  echo "$RESP" | jq .
  exit 1
fi

echo "jobs: ${JOB_IDS[*]}"

doneCount=0
failCount=0
total="${#JOB_IDS[@]}"

echo "[4/5] Poll jobs"
declare -i doneCount=0 failCount=0 pending=0
declare -i deadline=$(( SECONDS + 180 ))   # 3 minutes max

while (( SECONDS <= deadline )); do
  doneCount=0
  failCount=0
  pending=0

  # poll each job
  for id in "${JOB_IDS[@]}"; do
    s="$(curl -s "$BASE/visuals/$id" | jq -r '{id,status,provider,updatedAt}')"
    echo "$s"

    st="$(jq -r '.status // "unknown"' <<<"$s")"
    case "$st" in
      finished) ((doneCount++)) ;;
      failed)   ((failCount++)) ;;
      queued|processing|pending|unknown) ((pending++)) ;;
    esac
  done

  # single-line live progress
  printf "\r[poll] finished=%d  failed=%d  pending=%d" \
         "$doneCount" "$failCount" "$pending"

  # stop early if everything reached a terminal state
  if (( pending == 0 )); then break; fi

  sleep 1
done

# newline to end the single-line printf
echo

echo "[5/5] poll summary"
echo "  finished: $doneCount"
echo "  failed:   $failCount"
echo "  pending:  $pending"

# optional: final per-job status list
for id in "${JOB_IDS[@]}"; do
  s="$(curl -s "$BASE/visuals/$id" | jq -r '.status // "unknown"')"
  echo "[$id] $s"
done


# --- after the [4/5] poll block ---

# --- after the [4/5] poll block ---
rc=0

echo
echo "[5/5] Check media on post"
# use --fail so a 4xx/5xx sets a non-zero exit
post="$(curl --fail -sS "$BASE/posts/$POST_ID")" || rc=1

# pretty JSON (human)
echo "$post" | jq '{ id, media }'

# fail if no media came back (treat null the same as empty)
if [ "$(echo "$post" | jq -r '(.media // []) | length')" -eq 0 ]; then
  echo "no media attached to post $POST_ID"
  rc=1
fi

# compact, one-line summary per media (provider, kind, url)
echo "[5/5] Summary (provider<TAB>kind<TAB>url)"
echo "$post" | jq -r '.media // [] | .[] | [.provider, .kind, .url] | @tsv'

# also fail the script if any jobs failed or are still pending
if (( failCount > 0 )); then rc=1; fi
if (( pending  > 0 )); then rc=2; fi

exit "$rc"

