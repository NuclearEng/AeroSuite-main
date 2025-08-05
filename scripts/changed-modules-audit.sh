#!/bin/bash
changed_modules=$(git diff --name-only origin/main...HEAD | grep 'client/src/pages/' | cut -d'/' -f4 | sort | uniq | tr '\n' ',' | sed 's/,$//')
if [ -n "$changed_modules" ]; then
  npx ts-node automation/orchestrator.ts --modules=$changed_modules
else
  echo "No relevant modules changed."
fi 