#!/bin/bash

# Run Orchestrator Script
# This script provides a convenient way to run the orchestrator with various options

# Set the base directory to the script location
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOMATION_DIR="${BASE_DIR}/automation"

# Check if automation directory exists
if [ ! -d "$AUTOMATION_DIR" ]; then
  echo "❌ Error: Automation directory not found at $AUTOMATION_DIR"
  exit 1
fi

# Default values
MODULE="all"
VERBOSE=false
AGENTS=""

# Display help message
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -m, --module MODULE   Specify module to test (default: all)"
  echo "  -a, --agent AGENT     Run specific agent only (e.g., preBuild, dockerBuild)"
  echo "  -v, --verbose         Enable verbose output"
  echo "  -h, --help            Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0                    # Run all agents for all modules"
  echo "  $0 -m client          # Run all agents for client module"
  echo "  $0 -a preBuild        # Run only preBuild agent"
  echo "  $0 -a dockerBuild -v  # Run only dockerBuild agent with verbose output"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--module)
      MODULE="$2"
      shift 2
      ;;
    -a|--agent)
      AGENTS="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "❌ Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Navigate to repo root (script's base dir)
cd "$BASE_DIR" || { echo "❌ Failed to navigate to repo base directory"; exit 1; }

# Build orchestrator flags
ORCH_FLAGS=""
if [ -n "$AGENTS" ]; then
  ORCH_FLAGS="$ORCH_FLAGS --agents=$AGENTS"
fi
if [ "$MODULE" != "all" ]; then
  ORCH_FLAGS="$ORCH_FLAGS --modules=$MODULE"
fi

echo "🚀 Running orchestrator ${MODULE:+for module: $MODULE} ${AGENTS:+with agents: $AGENTS}"
if [ "$VERBOSE" = true ]; then
  echo "📝 Verbose mode enabled"
fi

npx ts-node automation/orchestrator.ts $ORCH_FLAGS

# Check exit status
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Orchestrator completed successfully"
else
  echo "❌ Orchestrator failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE
