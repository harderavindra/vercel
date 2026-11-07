#!/usr/bin/env bash
# Campaigns v2: full workflow test over HTTP with curl (one cookie jar per role).
#
#   !! This CREATES real data (a campaign that ends "Completed" and cannot be deleted). !!
#   Run it against a local/test database only.
#
# Needs: curl, jq, a running backend, and one user per role. The masters must have a zone with
# at least 2 states, languages for them, a brand/model with features, and Settings
# (hpSegments, offerTypes, agencyStatuses). The ZMM user must have that zone.
#
# Usage:
#   CV2_FLOW_WRITES_DATA=yes BASE=http://localhost:4000 PASSWORD='secret' \
#   ZMM=zmm@x.io BM=bm@x.io MM=mm@x.io AGENCY=ag1@x.io AGENCY2=ag2@x.io \
#   bash backend/scripts/campaignsV2Flow.sh
# (PASSWORD is shared; or set ZMM_PASSWORD, BM_PASSWORD, ... per user.)
set -u

if [ "${CV2_FLOW_WRITES_DATA:-}" != "yes" ]; then
  echo "This script writes a test campaign to the database behind \$BASE."
  echo "Set CV2_FLOW_WRITES_DATA=yes to run it (local/test database only)."
  exit 2
fi
command -v jq >/dev/null || { echo "jq is required"; exit 2; }

BASE="${BASE:-http://localhost:4000}"
API="$BASE/api/campaigns-v2"
JARS="$(mktemp -d)"
trap 'rm -rf "$JARS"' EXIT
PASS=0; FAIL=0; LAST=""

# req <role> <METHOD> <path> <expected-status> <label> [json-body]
req() {
  local role="$1" method="$2" path="$3" expect="$4" label="$5" body="${6:-}"
  local args=(-s -o "$JARS/body" -w '%{http_code}' -X "$method" -b "$JARS/$role" -H 'Content-Type: application/json')
  [ -n "$body" ] && args+=(--data "$body")
  local code; code=$(curl "${args[@]}" "$path")
  LAST=$(cat "$JARS/body")
  if [ "$code" = "$expect" ]; then PASS=$((PASS+1)); printf 'PASS  %s  %-6s %s\n' "$code" "$role" "$label"
  else FAIL=$((FAIL+1)); printf 'FAIL  %s  %-6s %s  (expected %s) %s\n' "$code" "$role" "$label" "$expect" "$(echo "$LAST" | head -c 200)"; fi
}
# check <label> <jq-expression that must be true on $LAST>
check() {
  if echo "$LAST" | jq -e "$2" >/dev/null 2>&1; then PASS=$((PASS+1)); echo "PASS        $1"
  else FAIL=$((FAIL+1)); echo "FAIL        $1  ($(echo "$LAST" | head -c 200))"; fi
}
login() {
  local role="$1" email="$2" pw="$3"
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' -c "$JARS/$role" -H 'Content-Type: application/json' \
    --data "$(jq -n --arg e "$email" --arg p "$pw" '{email:$e,password:$p}')" "$BASE/api/users/login")
  [ "$code" = "200" ] || { echo "Login failed for $role ($email): HTTP $code"; exit 1; }
}
act() { req "$1" POST "$API/$CID/actions/$2" "$3" "$4" "${5:-}"; }

echo "== Log in"
for r in ZMM BM MM AGENCY AGENCY2; do
  pwvar="${r}_PASSWORD"; login "$(echo "$r" | tr 'A-Z' 'a-z')" "${!r}" "${!pwvar:-${PASSWORD:-}}"
done
echo "logged in: zmm bm mm agency agency2"
AG_ID=$(curl -s -b "$JARS/agency" "$BASE/api/users/profile" | jq -r '._id // .user._id')
AG2_ID=$(curl -s -b "$JARS/agency2" "$BASE/api/users/profile" | jq -r '._id // .user._id')
ZONE=$(curl -s -b "$JARS/zmm" "$BASE/api/users/profile" | jq -r '.zone // .user.zone // empty')
[ -n "$ZONE" ] || { echo "The ZMM user has no zone"; exit 1; }

echo "== Look up masters for $ZONE"
ZJSON=$(curl -s -b "$JARS/zmm" "$BASE/api/masters/zones" | jq --arg z "$ZONE" '.[] | select(.name==$z)')
S1=$(echo "$ZJSON" | jq -r '.states[0].name'); L1=$(echo "$ZJSON" | jq -c '.states[0].languages')
S2=$(echo "$ZJSON" | jq -r '.states[1].name'); L2=$(echo "$ZJSON" | jq -c '.states[1].languages')
SETTINGS=$(curl -s -b "$JARS/zmm" "$BASE/api/masters/settings")
HP=$(echo "$SETTINGS" | jq -r '.hpSegments[0]'); TYPE=$(echo "$SETTINGS" | jq -r '.offerTypes[0]')
AGSTATUS=$(echo "$SETTINGS" | jq -r '.agencyStatuses[0]')
CATALOG=$(curl -s -b "$JARS/zmm" "$BASE/api/masters/catalog")
MODEL_ID=""
for row in $(echo "$CATALOG" | jq -r '.[].brands[] | . as $b | .models[] | "\($b._id):\(._id)"'); do
  F=$(curl -s -b "$JARS/zmm" "$BASE/api/masters/features?model=${row#*:}" | jq -c '[.[0]._id] | map(select(. != null))')
  if [ "$F" != "[]" ]; then BRAND_ID=${row%%:*}; MODEL_ID=${row#*:}; FEATS=$F; break; fi
done
[ -n "$MODEL_ID" ] || { echo "No model with offer features found"; exit 1; }
echo "states: $S1, $S2 | hp: $HP | type: $TYPE | brand/model: $BRAND_ID/$MODEL_ID"
offer() { # offer <state> <languages-json> <details>
  jq -n --arg s "$1" --argjson l "$2" --arg b "$BRAND_ID" --arg m "$MODEL_ID" --arg hp "$HP" --arg t "$TYPE" --argjson f "$FEATS" --arg d "$3" \
    '{state:$s, languages:$l, items:[{brand:$b, model:$m, hp:$hp, type:$t, offerPrice:"650000", crossingPrice:"700000", features:$f, details:$d}]}'
}
artwork() { jq -n --arg n "$1" '{url:("https://storage.googleapis.com/test/"+$n+".png"), fileName:($n+".png"), type:"image/png", size:250000}'; }

echo "== Create campaign + offers (ZMM)"
MONTH=$(date +%Y-%m)
req zmm POST "$API" 201 "create draft" "$(jq -n --arg m "$MONTH" '{title:("API flow test " + (now | floor | tostring)), description:"campaignsV2Flow.sh", month:$m}')"
CID=$(echo "$LAST" | jq -r '._id')
req zmm POST "$API/$CID/offers" 201 "offer in $S1" "$(offer "$S1" "$L1" "Offer one")"; O1=$(echo "$LAST" | jq -r '._id')
req zmm POST "$API/$CID/offers" 201 "offer in $S2" "$(offer "$S2" "$L2" "Offer two")"; O2=$(echo "$LAST" | jq -r '._id')

echo "== Submit + offer approval, with a rejection loop"
act bm submit 403 "brand manager cannot submit"
act zmm submit 200 "ZMM submits"; check "both states pending" ".campaign.approvals[\"$S1\"].status==\"pending\" and .campaign.approvals[\"$S2\"].status==\"pending\""
act zmm decideOffers 403 "ZMM cannot decide offers" "{\"state\":\"$S1\",\"decision\":\"approved\"}"
act bm decideOffers 400 "bad decision value" "{\"state\":\"$S1\",\"decision\":\"maybe\"}"
act bm decideOffers 200 "BM approves $S1" "{\"state\":\"$S1\",\"decision\":\"approved\"}"; check "still awaiting $S2" '.status=="pending_offer_approval"'
act bm decideOffers 409 "BM approves $S1 twice" "{\"state\":\"$S1\",\"decision\":\"approved\"}"
act bm decideOffers 400 "reject without remark" "{\"state\":\"$S2\",\"decision\":\"rejected\"}"
act bm decideOffers 200 "BM rejects $S2" "{\"state\":\"$S2\",\"decision\":\"rejected\",\"remark\":\"Price too high\"}"; check "offers_rejected" '.status=="offers_rejected"'
act mm assign 409 "assign while offers rejected" "{\"agencyUserId\":\"$AG_ID\"}"
req zmm PUT "$API/$CID/offers/$O2" 200 "ZMM fixes the $S2 offer" "$(offer "$S2" "$L2" "Offer two, new price")"
act zmm submit 200 "ZMM resubmits"; check "$S1 stays approved, $S2 pending" ".campaign.approvals[\"$S1\"].status==\"approved\" and .campaign.approvals[\"$S2\"].status==\"pending\""
act bm decideOffers 200 "BM approves $S2" "{\"state\":\"$S2\",\"decision\":\"approved\"}"; check "offers_approved" '.status=="offers_approved"'

echo "== Assign + agency status"
act bm assign 403 "brand manager cannot assign" "{\"agencyUserId\":\"$AG_ID\"}"
act mm assign 200 "MM assigns agency" "{\"agencyUserId\":\"$AG_ID\"}"; check "assigned" '.status=="assigned"'
act agency2 changeStatus 404 "other agency cannot even see it" "{\"agencyStatus\":\"$AGSTATUS\"}"
act agency changeStatus 400 "status not in Settings" '{"agencyStatus":"Nope"}'
act agency changeStatus 200 "agency changes status" "{\"agencyStatus\":\"$AGSTATUS\"}"; check "in_progress" '.status=="in_progress"'

echo "== Artwork + approval, with a rejection loop"
act agency submitArtwork 400 "submit with no artwork"
req agency PUT "$API/$CID/offers/$O1/artwork" 200 "artwork $S1" "$(artwork a1)"
req agency PUT "$API/$CID/offers/$O2/artwork" 200 "artwork $S2" "$(artwork a2)"
act agency submitArtwork 200 "agency submits artwork"; check "content_uploaded" '.status=="content_uploaded"'
req zmm POST "$API/$CID/offers/$O2/comments" 201 "ZMM comments on $S2 artwork" '{"text":"Logo too small"}'
act zmm decideContent 200 "ZMM approves $S1 artwork" "{\"state\":\"$S1\",\"decision\":\"approved\"}"
act zmm decideContent 400 "reject artwork without remark" "{\"state\":\"$S2\",\"decision\":\"rejected\"}"
act zmm decideContent 200 "ZMM rejects $S2 artwork" "{\"state\":\"$S2\",\"decision\":\"rejected\",\"remark\":\"See comment\"}"; check "content_rejected" '.status=="content_rejected"'
req agency PUT "$API/$CID/offers/$O1/artwork" 409 "approved $S1 artwork is locked" "$(artwork a1b)"
req agency PUT "$API/$CID/offers/$O2/artwork" 200 "agency replaces $S2 artwork" "$(artwork a2b)"
act agency submitArtwork 200 "agency resubmits"; check "$S1 approved, $S2 pending" ".campaign.contentApprovals[\"$S1\"].status==\"approved\" and .campaign.contentApprovals[\"$S2\"].status==\"pending\""
act zmm decideContent 200 "ZMM approves $S2 artwork" "{\"state\":\"$S2\",\"decision\":\"approved\"}"; check "artwork_approved" '.status=="artwork_approved"'

echo "== Creative links"
act agency submitLinks 400 "share links before setting them"
act agency setCreativeLinks 400 "invalid URL" "{\"links\":{\"$O1\":\"not a url\"}}"
act mm setCreativeLinks 403 "MM cannot set creative links" "{\"links\":{\"$O1\":\"https://x.io/1\"}}"
act agency setCreativeLinks 200 "agency saves creative links" "{\"links\":{\"$O1\":\"https://creative.example/1\",\"$O2\":\"https://creative.example/2\"}}"; check "status unchanged" '.status=="artwork_approved"'
# race: two identical submitLinks at once → exactly one succeeds
( curl -s -o /dev/null -w '%{http_code}\n' -X POST -b "$JARS/agency" "$API/$CID/actions/submitLinks" > "$JARS/r1" ) &
( curl -s -o /dev/null -w '%{http_code}\n' -X POST -b "$JARS/agency" "$API/$CID/actions/submitLinks" > "$JARS/r2" ) &
wait
RACE="$(cat "$JARS/r1") $(cat "$JARS/r2")"
if [ "$(echo "$RACE" | tr ' ' '\n' | sort | tr '\n' ' ')" = "200 409 " ]; then PASS=$((PASS+1)); echo "PASS        race: two submitLinks at once → $RACE (one wins, one 409)"
else FAIL=$((FAIL+1)); echo "FAIL        race: two submitLinks at once → $RACE (expected one 200, one 409)"; fi

echo "== Landing pages + hand-over"
act agency setLandingPages 403 "agency cannot set landing pages" "{\"pages\":{\"$O1\":\"https://lp.example/1\"}}"
act mm setLandingPages 200 "MM saves landing page 1" "{\"pages\":{\"$O1\":\"https://lp.example/1\"}}"
act mm handOver 400 "hand over with a landing page missing" "{\"agencyUserIds\":[\"$AG2_ID\"]}"
act mm setLandingPages 200 "MM saves landing page 2" "{\"pages\":{\"$O2\":\"https://lp.example/2\"}}"
act mm handOver 400 "hand over to nobody" '{"agencyUserIds":[]}'
act mm handOver 200 "MM hands over to agency 2" "{\"agencyUserIds\":[\"$AG2_ID\"]}"; check "completed" '.status=="completed"'
req agency2 GET "$API/$CID" 200 "agency 2 now sees the campaign"
check "history: one entry per action (18), ending with the hand-over" '(.history | length) == 18 and .history[-1].event == "Landing pages added and handed over"'
echo "$LAST" | jq -r '.history[] | "      " + .event + (if .note != "" then " (" + .note + ")" else "" end) + (if .remark != "" then " — \"" + .remark + "\"" else "" end)'
act mm handOver 409 "nothing left to do when completed" "{\"agencyUserIds\":[\"$AG2_ID\"]}"

echo
echo "Campaign $CID: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
