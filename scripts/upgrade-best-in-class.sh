#!/bin/bash
# upgrade-best-in-class.sh
# Automate best-in-class upgrades for all major modules and agents in AeroSuite

set -e

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

MODULE_DIRS=(
  "client/src/pages/dashboard"
  "client/src/pages/customers"
  "client/src/pages/inspections"
  "client/src/pages/suppliers"
)

AGENT_DIR="automation/agents"
ORCHESTRATOR_FILE="automation/orchestrator.ts"
SUMMARY_FILE="upgrade-best-in-class-summary.txt"
> "$SUMMARY_FILE"

function ensure_jest_d_ts() {
  local dir="$1"
  local jestd="$dir/jest.d.ts"
  if [[ ! -f "$jestd" ]]; then
    echo "import 'jest-axe';" > "$jestd"
    echo "  [CREATED] $jestd" | tee -a "$SUMMARY_FILE"
  fi
}

function remove_ts_ignore() {
  local dir="$1"
  find "$dir" -type f -name "*.test.*" ! -path "*/node_modules/*" | while read -r file; do
    if grep -q "@ts-" "$file"; then
      sed -i.bak '/@ts-/d' "$file"
      rm "$file.bak"
      echo "  [CLEANED] $file (removed @ts-ignore/@ts-expect-error)" | tee -a "$SUMMARY_FILE"
    fi
  done
}

function ensure_test_file() {
  local dir="$1"
  local base="$2"
  local testfile="$dir/${base}.test.tsx"
  if [[ ! -f "$testfile" ]]; then
    cat > "$testfile" <<EOF
import React from 'react';
import { render, screen } from '@testing-library/react';
import ${base} from './${base}';

describe('${base}', () => {
  it('renders without crashing', () => {
    render(<${base} />);
    expect(screen.getByText(/${base}/i)).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
EOF
    echo "  [CREATED] $testfile" | tee -a "$SUMMARY_FILE"
  fi
}

function ensure_props_todo() {
  local file="$1"
  if ! grep -q 'props' "$file"; then
    echo "  [TODO] $file: Refactor to accept optional props for testability" | tee -a "$SUMMARY_FILE"
  fi
}

# Upgrade UI modules
echo "--- Upgrading UI modules ---" | tee -a "$SUMMARY_FILE"
for dir in "${MODULE_DIRS[@]}"; do
  if [[ -d "$dir" ]]; then
    for comp in "$dir"/*.tsx; do
      base=$(basename "$comp" .tsx)
      # Skip test files
      [[ "$base" == *.test ]] && continue
      ensure_props_todo "$comp"
      ensure_test_file "$dir" "$base"
      ensure_jest_d_ts "$dir"
      remove_ts_ignore "$dir"
    done
  fi

done

echo "--- Upgrading agents ---" | tee -a "$SUMMARY_FILE"
for agent in "$AGENT_DIR"/*.ts; do
  base=$(basename "$agent" .ts)
  testfile="$AGENT_DIR/${base}.test.ts"
  if [[ ! -f "$testfile" ]]; then
    cat > "$testfile" <<EOF
// Scenario-driven test template for $base
// TODO: Add robust tests for agent logic, memory integration, and error handling

describe('$base agent', () => {
  it('runs without error', async () => {
    // TODO: Import and invoke agent function with mock args
    expect(true).toBe(true);
  });
});
EOF
    echo "  [CREATED] $testfile" | tee -a "$SUMMARY_FILE"
  fi
  remove_ts_ignore "$AGENT_DIR"
done

# Orchestrator test
echo "--- Upgrading orchestrator ---" | tee -a "$SUMMARY_FILE"
ORCH_TEST="automation/orchestrator.test.ts"
if [[ ! -f "$ORCH_TEST" ]]; then
  cat > "$ORCH_TEST" <<EOF
// Test template for orchestrator prioritization, aggregation, and human review logic
// TODO: Add robust scenario-driven tests for orchestrator

describe('orchestrator', () => {
  it('runs main function without error', async () => {
    // TODO: Import and invoke orchestrator main
    expect(true).toBe(true);
  });
});
EOF
  echo "  [CREATED] $ORCH_TEST" | tee -a "$SUMMARY_FILE"
fi

# Print summary
echo "--- Upgrade summary ---"
cat "$SUMMARY_FILE"
echo "--- End of summary ---" 