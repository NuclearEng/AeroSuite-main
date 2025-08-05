#!/bin/bash
# auto-orchestrate-and-launch.sh
# Fully automate orchestrator review, remediation, and launch for AeroSuite

set -e

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

ORCH_LOG="orchestrator-output.log"
MAX_ITER=10
ITER=1

function run_orchestrator() {
  echo "[INFO] Running orchestrator (iteration $ITER)..."
  npx ts-node automation/orchestrator.ts | tee "$ORCH_LOG"
}

function parse_failures() {
  grep -E '❌|Agent failed:|\[TODO\]' "$ORCH_LOG" > failures.tmp || true
}

function automate_fixes() {
  if grep -q '\[TODO\]' failures.tmp; then
    echo "[INFO] Detected TODOs. Running upgrade-best-in-class.sh to address testability and test issues..."
    ./scripts/upgrade-best-in-class.sh
  fi
  # Add more automation hooks here as needed
}

function all_green() {
  grep -q '✅ All modules are fully green!' "$ORCH_LOG"
}

function launch_app() {
  echo "[INFO] All checks passed. Launching application..."
  # Try docker-compose first, fallback to npm start
  if [[ -f docker-compose.yml ]]; then
    docker-compose up -d
    echo "[INFO] Application launched with docker-compose."
  elif [[ -f package.json ]]; then
    npm start &
    echo "[INFO] Application launched with npm start."
  else
    echo "[WARN] No recognized launch method found. Please launch manually."
  fi
}

while (( ITER <= MAX_ITER )); do
  run_orchestrator
  if all_green; then
    launch_app
    break
  else
    parse_failures
    if [[ -s failures.tmp ]]; then
      automate_fixes
      echo "[INFO] Remediation attempted. Re-running orchestrator..."
    else
      echo "[WARN] No actionable failures found, but not all green. Manual review required."
      break
    fi
  fi
  ((ITER++))
done

if (( ITER > MAX_ITER )); then
  echo "[ERROR] Max iterations reached. Please review $ORCH_LOG and failures.tmp manually."
fi

# Print summary
if [[ -f failures.tmp ]]; then
  echo "--- Remaining Issues / TODOs ---"
  cat failures.tmp
  echo "--- End of Issues ---"
  rm failures.tmp
fi 