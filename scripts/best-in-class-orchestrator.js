#!/usr/bin/env node

/**
 * Best-in-Class Test Orchestrator
 * - Runs all major test suites in a logical order
 * - Attempts auto-fixes immediately on failure, commits changes, and retries
 * - Repeats until all tests pass or the max cycle limit is reached
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, options = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...options });
}

function tryRun(cmd, options = {}) {
  try {
    run(cmd, options);
    return true;
  } catch (e) {
    return false;
  }
}

function hasChanges() {
  try {
    const out = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function commitChanges(message) {
  try {
    run('git add -A');
    // Allow empty commit to provide traceability if desired
    tryRun(`git commit -m "${message}"`);
  } catch (e) {
    console.log('Skipping commit; no staged changes or git not initialized.');
  }
}

function fixTypescript() {
  // Comprehensive fixer if present
  if (fs.existsSync(path.join(process.cwd(), 'scripts', 'typescript-comprehensive-fixer.js')))
    tryRun('node scripts/typescript-comprehensive-fixer.js');
  // Secondary auto-fix helpers if present
  if (fs.existsSync(path.join(process.cwd(), 'scripts', 'typescript-auto-fix.js')))
    tryRun('node scripts/typescript-auto-fix.js');
}

function fixJSXAndTests() {
  if (fs.existsSync(path.join(process.cwd(), 'scripts', 'jsx-auto-fix.js')))
    tryRun('node scripts/jsx-auto-fix.js');
  if (fs.existsSync(path.join(process.cwd(), 'scripts', 'upgrade-best-in-class.sh')))
    tryRun('bash ./scripts/upgrade-best-in-class.sh');
}

function fixLint() {
  // Client and server lint fixes (best-effort)
  if (fs.existsSync(path.join(process.cwd(), 'client')))
    tryRun('cd client && npx eslint . --fix');
  if (fs.existsSync(path.join(process.cwd(), 'server')))
    tryRun('cd server && npx eslint . --fix');
}

function fixSecurity() {
  // Attempt dependency fixes in root, client, and server
  tryRun('npm audit fix');
  if (fs.existsSync(path.join(process.cwd(), 'client')))
    tryRun('cd client && npm audit fix');
  if (fs.existsSync(path.join(process.cwd(), 'server')))
    tryRun('cd server && npm audit fix');
}

function logicalTestSequence() {
  return [
    {
      name: 'Lint (client/server) with auto-fix',
      run: () => {
        // Non-blocking lint pass; we will fix on failure
        let ok = true;
        if (fs.existsSync('client')) ok = tryRun('cd client && npx eslint .');
        if (fs.existsSync('server')) ok = tryRun('cd server && npx eslint .') && ok;
        return ok;
      },
      fix: () => {
        fixLint();
      },
      commitMessage: 'chore(lint): auto-fix lint issues from best-in-class runner'
    },
    {
      name: 'TypeScript type-check (client)',
      run: () => tryRun('cd client && npm run type-check'),
      fix: () => fixTypescript(),
      commitMessage: 'chore(ts): auto-fix TypeScript issues from best-in-class runner'
    },
    {
      name: 'Automation tests (agents)',
      run: () => tryRun('npm run automation:test'),
      fix: () => {
        fixJSXAndTests();
        fixLint();
      },
      commitMessage: 'test(automation): apply best-in-class test upgrades'
    },
    {
      name: 'Server unit/integration tests',
      run: () => tryRun('npm test -w server --silent'),
      fix: () => {
        fixLint();
      },
      commitMessage: 'test(server): auto-fix issues uncovered by server tests'
    },
    {
      name: 'Client unit tests',
      run: () => tryRun('npm test -w client -- --watchAll=false'),
      fix: () => {
        fixJSXAndTests();
        fixLint();
      },
      commitMessage: 'test(client): auto-fix issues uncovered by client tests'
    },
    {
      name: 'Comprehensive meta tests (security, performance, e2e preflight)',
      run: () => tryRun('node scripts/comprehensive-test-runner.js'),
      fix: () => {
        fixSecurity();
        fixJSXAndTests();
        fixLint();
      },
      commitMessage: 'chore(meta): auto-fix from comprehensive runner (security/perf/e2e preflight)'
    },
    {
      name: 'End-to-End tests (full run)',
      run: () => tryRun('npm run test:e2e'),
      fix: () => {
        // Best-effort: ensure templates and quick fixes are applied
        fixJSXAndTests();
        fixLint();
      },
      commitMessage: 'test(e2e): auto-fix issues uncovered by E2E tests'
    }
  ];
}

async function main() {
  const args = process.argv.slice(2);
  const maxCyclesArgIndex = args.indexOf('--max-cycles');
  const maxCycles = maxCyclesArgIndex >= 0 ? parseInt(args[maxCyclesArgIndex + 1]) : 5;

  console.log('🚀 Best-in-Class Test Orchestrator');
  console.log('==================================');
  console.log(`Max cycles: ${maxCycles}`);

  const steps = logicalTestSequence();

  let cycle = 1;
  while (cycle <= maxCycles) {
    console.log(`\n\n===== Cycle ${cycle}/${maxCycles} =====`);
    let allPassed = true;

    for (const step of steps) {
      console.log(`\n▶️  Step: ${step.name}`);
      const passed = step.run();
      if (passed) {
        console.log('✅ Passed');
        continue;
      }

      allPassed = false;
      console.log('❌ Failed. Attempting auto-fix...');
      try {
        step.fix?.();
      } catch (e) {
        console.log('Auto-fix routine threw an error (continuing):', e?.message || e);
      }

      if (hasChanges()) {
        commitChanges(step.commitMessage);
      }

      console.log('🔁 Re-running step after fixes...');
      const passedAfterFix = step.run();
      if (!passedAfterFix) {
        console.log('❗ Step still failing after auto-fix. Proceeding to next step to gather more context.');
      } else {
        console.log('✅ Passed after auto-fix');
      }
    }

    if (allPassed) {
      console.log('\n🎉 All steps passed. Test suite is green.');
      process.exit(0);
    }

    // Commit any remaining changes between cycles
    if (hasChanges()) {
      commitChanges('chore(test-run): auto-commit changes after cycle');
    }

    cycle += 1;
  }

  console.error('\n❌ Reached max cycles with remaining failures. Please review logs and fix manually.');
  process.exit(1);
}

main().catch((err) => {
  console.error('💥 Fatal error in best-in-class orchestrator:', err);
  process.exit(1);
});


