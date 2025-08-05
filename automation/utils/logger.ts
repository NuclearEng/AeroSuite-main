import * as fs from 'fs';
type AgentResult = { passed: boolean; details: string };
type ModuleResult = {
  module: string;
  agentResults: Record<string, AgentResult>;
  bestAgent: string;
  bestAnswer: string;
};

const reportPath = 'automation/report.md';

export function logResult(module: string, agentResults: Record<string, AgentResult>) {
  let log = `\n=== ${module} ===\n`;
  Object.entries(agentResults).forEach(([agent, res]) => {
    log += `${agent}: ${res.passed ? '✅' : '❌'} - ${res.details}\n`;
  });
  console.log(log);
  fs.appendFileSync(reportPath, log);
}

export function summarizeResults(results: ModuleResult[]) {
  let summary = '\n=== Summary ===\n';
  results.forEach(r => {
    const agents = Object.keys(r.agentResults);
    const allPassed = agents.every(a => r.agentResults[a]?.passed);
    summary += `${r.module}: ${allPassed ? '✅' : '❌'}\n`;
  });
  console.log(summary);
  fs.appendFileSync(reportPath, summary);
} 