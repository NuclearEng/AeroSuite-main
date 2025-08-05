// Usage: npx ts-node automation/orchestrator.ts [--modules=Login,Reports] [--agents=softwareArchitect,devSecOps,testAutomation,qa,devOps,productLogic,ux,compliance]
import { runSoftwareArchitectAgent } from './agents/softwareArchitectAgent';
import { runDevSecOpsAgent } from './agents/devSecOpsAgent';
import { runTestAutomationAgent } from './agents/testAutomationAgent';
import { runQaAgent } from './agents/qaAgent';
import { runDevOpsAgent } from './agents/devOpsAgent';
import { runProductLogicAgent } from './agents/productLogicAgent';
import { runUXAgent } from './agents/uxAgent';
import { runComplianceAgent } from './agents/complianceAgent';
import { runHumanReviewAgent } from './agents/humanReviewAgent';
import { logResult, summarizeResults } from './utils/logger';
import { saveMemory, loadMemory } from './agents/memoryAgent';
import { runComponentAgent } from './agents/componentAgent';
import { runCustomerAgent } from './agents/customerAgent';
import { runInspectionAgent } from './agents/inspectionAgent';
import { runSupplierAgent } from './agents/supplierAgent';
import { runSystemsAgent } from './agents/systemsAgent';
import { runUxUiAgent } from './agents/uxUiAgent';
import { runHumanPsychologyAgent } from './agents/humanPsychologyAgent';

type AgentResult = { passed: boolean; details: string };
type ModuleResult = {
  module: string;
  agentResults: Record<string, AgentResult>;
  bestAgent: string;
  bestAnswer: string;
};

const allModules = [
  'Login',
  'Reports',
  'Settings',
  'Suppliers',
  // ...add more modules as needed
];
const allAgents = [
  'softwareArchitect',
  'devSecOps',
  'testAutomation',
  'qa',
  'devOps',
  'productLogic',
  'ux',
  'uxUi',
  'humanPsychology',
  'compliance',
  'component',
  'customer',
  'inspection',
  'supplier',
  // systems agent is global, not per module
];

const agentFns: Record<string, (m: string) => Promise<AgentResult>> = {
  softwareArchitect: runSoftwareArchitectAgent,
  devSecOps: runDevSecOpsAgent,
  testAutomation: runTestAutomationAgent,
  qa: runQaAgent,
  devOps: runDevOpsAgent,
  productLogic: runProductLogicAgent,
  ux: runUXAgent,
  uxUi: runUxUiAgent,
  humanPsychology: runHumanPsychologyAgent,
  compliance: runComplianceAgent,
  component: runComponentAgent,
  customer: runCustomerAgent,
  inspection: runInspectionAgent,
  supplier: runSupplierAgent,
  // systems agent is not per module
};

function parseArgs() {
  const modulesArg = process.argv.find(arg => arg.startsWith('--modules='));
  const agentsArg = process.argv.find(arg => arg.startsWith('--agents='));
  const modules = modulesArg ? modulesArg.replace('--modules=', '').split(',') : allModules;
  const agents = agentsArg ? agentsArg.replace('--agents=', '').split(',') : allAgents;
  return { modules, agents };
}

async function main() {
  const { modules, agents } = parseArgs();
  const results: ModuleResult[] = [];
  // Run systems agent globally (once per orchestrator run)
  const systemsResult = await runSystemsAgent();
  logResult('SYSTEMS', { systems: systemsResult });
  for (const module of modules) {
    // 1. Check orchestrator memory for previous failures/priorities
    const orchestratorMemory = await loadMemory('orchestrator', module);
    let prioritizedAgents = agents;
    let memoryLog = '';
    if (orchestratorMemory) {
      // If previous run had failures, prioritize those agents
      const failedAgents = orchestratorMemory.match(/Agent failed: (\w+)/g)?.map(s => s.split(': ')[1]) || [];
      if (failedAgents.length > 0) {
        prioritizedAgents = [...failedAgents, ...agents.filter(a => !failedAgents.includes(a))];
        memoryLog = `Prioritizing agents due to previous failures: ${failedAgents.join(', ')}`;
      }
    }
    // 2. Run prioritized agents in parallel
    const agentResults: Record<string, AgentResult> = {};
    await Promise.all(prioritizedAgents.map(async (agent) => {
      agentResults[agent] = await agentFns[agent](module);
    }));
    logResult(module, agentResults);
    // 3. Aggregate and select best answer/plan
    let bestAgent = prioritizedAgents.find(a => agentResults[a]?.passed);
    let bestAnswer = bestAgent ? agentResults[bestAgent].details : 'No agent passed. See details above.';
    if (!bestAgent) {
      bestAgent = prioritizedAgents.reduce((maxA, a) => (agentResults[a]?.details.length > (agentResults[maxA]?.details.length || 0) ? a : maxA), prioritizedAgents[0]);
      bestAnswer = agentResults[bestAgent]?.details || bestAnswer;
    }
    // 4. Save orchestrator memory for this module
    let orchestratorSummary = `Best agent: ${bestAgent}\nBest answer:\n${bestAnswer}\n`;
    prioritizedAgents.forEach(a => {
      if (!agentResults[a]?.passed) orchestratorSummary += `Agent failed: ${a}\n`;
    });
    if (memoryLog) orchestratorSummary = memoryLog + '\n' + orchestratorSummary;
    await saveMemory('orchestrator', module, orchestratorSummary);
    // 5. Human review if any agent failed
    const failed = prioritizedAgents.filter(a => !agentResults[a]?.passed);
    if (failed.length > 0) {
      const issues = failed.map(a => `${a}: ${agentResults[a]?.details}`);
      await runHumanReviewAgent(module, issues);
    }
    // 6. Add to results
    results.push({
      module,
      agentResults,
      bestAgent: bestAgent || '',
      bestAnswer: bestAnswer || ''
    });
  }
  // 7. Summarize and print results
  summarizeResults(results);
  // 8. Print best answers per module
  for (const r of results) {
    console.log(`\n=== Best Answer for ${r.module} ===\nAgent: ${r.bestAgent}\n${r.bestAnswer}`);
  }
  // 9. Exit code
  const allGreen = results.every(r => allAgents.every(a => r.agentResults[a]?.passed));
  if (allGreen) {
    console.log('✅ All modules are fully green!');
    process.exit(0);
  } else {
    console.error('❌ Some modules need attention. See summary above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in orchestrator:', err);
  process.exit(1);
}); 