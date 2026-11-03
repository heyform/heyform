#!/usr/bin/env bash
# Model-check the form flow/logic spec with TLC.
#
#   ./run.sh              # full suite, expectations enforced
#   WORKERS=1 ./run.sh    # fewer workers (MCTerm must stay single-worker)
#
# Configs whose invariants are expected to fail document the two storage-type
# holes that were found; the script fails if they start passing.
set -uo pipefail
cd "$(dirname "$0")"

TLA_VERSION=v1.8.0   # ships tla2tools 2.19
TOOLS=.tools
JAR=$TOOLS/tla2tools.jar
WORKERS=${WORKERS:-4}

if [ ! -f "$JAR" ]; then
  mkdir -p "$TOOLS"
  echo "downloading tla2tools $TLA_VERSION ..."
  curl -fsSL -o "$JAR" \
    "https://github.com/tlaplus/tlaplus/releases/download/$TLA_VERSION/tla2tools.jar"
fi

rm -rf states
status=0

check() { # check <config> <expect: pass|fail> <spec module> [extra tlc args]
  local cfg=$1 expect=$2 spec=$3
  shift 3
  echo "=== $cfg (expect $expect)"
  local out
  mkdir -p "states/$cfg"
  out=$(java -XX:+UseParallelGC -cp "$JAR" tlc2.TLC -config "$cfg.cfg" \
          -metadir "states/$cfg" -workers "$WORKERS" "$@" "$spec" 2>&1)
  local rc=$?
  local ok=no
  if [ $rc -eq 0 ] && grep -q "No error has been found" <<<"$out"; then ok=pass; fi
  if [ $rc -ne 0 ] && grep -qE "is violated|equal to FALSE" <<<"$out"; then ok=fail; fi
  grep -E "No error has been found|is violated|equal to FALSE|states generated" <<<"$out" |
    sed 's/^/    /'
  if [ "$ok" = "$expect" ]; then
    echo "    -> OK ($ok)"
  else
    echo "    -> UNEXPECTED ($ok)"
    status=1
  fi
}

# answer shapes, flow, logic and schema drift (FormFlow.tla)
check MCFlow            pass MCModel.tla
check MCAttack          pass MCModel.tla
check MCTerm            pass MCModel.tla -workers 1
check MCDrift           pass MCModel.tla
check MCStrict          fail MCModel.tla
check MCTypeHole        fail MCModel.tla
check MCDriftLogic      fail MCModel.tla
check MCDriftCalc       fail MCModel.tla
check MCDriftUnguarded  fail MCModel.tla
check MCBroken          fail MCModel.tla
check MCBrokenRule      fail MCModel.tla

# endings that keep their responses out of the form (Discard.tla, PR #387)
check MCDiscard           pass MCDiscard.tla
check MCDiscardVar        pass MCDiscard.tla
check MCDiscardGroup      pass MCDiscard.tla
check MCDiscardGroupBroken fail MCDiscard.tla
check MCDiscardShown      fail MCDiscard.tla
check MCDiscardCountdown  fail MCDiscard.tla

rm -rf states
echo
[ $status -eq 0 ] && echo "all expectations met" || echo "some expectations were not met"
exit $status
