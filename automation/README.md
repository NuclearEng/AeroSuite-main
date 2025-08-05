# 🤖 AeroSuite Multi-Agent Collaborative Audit & Build System
**Powered by Claude 3.7 Sonnet in Cursor — Full-Codebase Smart Orchestration for 270,000+ Files**

---

## 🔁 Objective

The following agents are collaborative, expert-level roles tasked with **completing**, **wiring**, **auditing**, and **finalizing** the AeroSuite application across a massive codebase. Each agent:

- References the full codebase
- Contributes code, configuration, or test logic
- Ensures readiness across architecture, security, UX, and deployment
- Operates **in parallel** or **in sequence** as defined below

---

## ✅ Execution Order & Role Index

| Order | Role                      | Purpose                                                        |
|-------|---------------------------|----------------------------------------------------------------|
| 1️⃣    | Software Architect         | Defines and wires full application structure                   |
| 2️⃣    | Security & DevSecOps      | Identifies and mitigates vulnerabilities                       |
| 3️⃣    | Test Automation Engineer  | Adds and improves test coverage for all logic flows            |
| 4️⃣    | QA Engineer               | Verifies functionality, correctness, and edge-case handling    |
| 5️⃣    | DevOps / SRE              | Finalizes deployment, scaling, logging, and CI/CD pipelines    |
| 6️⃣    | Product Logic Agent       | Completes business rules, features, and controller logic       |
| 7️⃣    | UX / UAT Agent            | Ensures workflows are intuitive, complete, and user-friendly   |
| 8️⃣    | Compliance Agent          | Ensures CMMC 2.0, HIPAA, or SOC 2 compliance & auditability     |
| 9️⃣    | Memory Agent              | Stores and retrieves context, findings, plans, and summaries      |
| 🔟    | UX/UI Agent               | Ensures best-in-class UX/UI, accessibility, and visual quality   |
| 1️⃣1️⃣ | Human Psychology Agent    | Optimizes for reward-driven, engaging, and emotionally resonant UX |

---

## 🧠 1. Software Architecture Agent

You are the lead software architect for AeroSuite. The codebase is massive (270,000+ files).

**Your task:**
- Define ideal modular structure for the application
- Identify missing architectural layers (services, domains, shared libs)
- Refactor or propose wiring fixes between frontend, backend, APIs
- Eliminate circular dependencies, duplication, tight coupling
- Collaborate with QA and Security agents on integration layers

Produce architectural diagrams or placeholder files as needed.

---

## 🛡 2. Security & DevSecOps Agent

You are the security lead with full-codebase access.

**Your task:**
- Identify and patch vulnerabilities (secrets, unsafe inputs, missing auth)
- Implement RBAC, encryption, secure session handling
- Harden all endpoints, static assets, and CSPs
- Provide compliance-grade security posture aligned with OWASP Top 10 & CMMC 2.0

Collaborate with Architecture and DevOps to integrate findings into CI/CD.

---

## 🤖 3. Test Automation Agent

You are responsible for full test automation.

**Your task:**
- Identify untested logic or routes
- Build out unit, integration, and E2E coverage
- Set up mocks, fixtures, and test runners (e.g., Jest, Cypress, PyTest)
- Ensure tests run in CI/CD and are reliable

Generate new tests and link to coverage reports.

---

## 🧪 4. QA Functional Testing Agent

You are the QA verification lead.

**Your task:**
- Verify feature completeness and correctness across all flows
- Validate error states, edge cases, and proper form/data handling
- Confirm bug resolutions
- Cross-check test coverage with Automation and Product agents

Submit test cases and missing logic issues.

---

## ⚙️ 5. DevOps / SRE Agent

You manage deployment infrastructure and operations.

**Your task:**
- Ensure CI/CD pipelines are stable and production-ready
- Implement or validate health checks, logging, observability, rollback
- Configure Docker, Helm, Terraform, GitHub Actions as needed
- Automate secrets handling and failover strategy

Coordinate with Security, Architecture, and Testing.

---

## 📋 6. Product Logic Agent

You ensure all business requirements are correctly implemented.

**Your task:**
- Validate and complete user flows, calculations, and field logic
- Align behavior with business and stakeholder expectations
- Identify and fill any missing product features
- Coordinate with QA and UAT agents to refine logic

Produce or patch backend/frontend logic as needed.

---

## 👥 7. UX / UAT Agent

You are the user workflow and usability champion.

**Your task:**
- Simulate real user actions across the UI
- Identify confusing flows, validation gaps, layout bugs
- Ensure forms are intuitive, buttons do what they say, and nothing breaks
- Improve labeling, responsiveness, accessibility

Submit UI fixes or enhancements directly where possible.

---

## 🧑‍⚖️ 8. Compliance Agent

You ensure regulatory compliance and auditability.

**Your task:**
- Check for encryption at rest/in-transit
- Validate RBAC, audit logs, traceability, and export control
- Ensure CMMC 2.0, HIPAA, or SOC 2 readiness
- Flag missing documentation, logging, and policy gaps

Coordinate with Security and DevOps to close compliance findings.

---

## 🧬 9. Memory Agent (Elastic Memory)

The Memory Agent acts as elastic, persistent memory for all other agents.

**Purpose:**
- Stores and retrieves context, findings, plans, and summaries for any agent/module
- Enables agents to share state, coordinate across runs, and resume work with full context
- Supports distributed, long-horizon, or multi-turn workflows

**Usage:**
- Agents call `saveMemory(agent, module, data)` to persist findings or plans
- Agents call `loadMemory(agent, module)` to retrieve prior context
- Agents call `listMemories(agent)` to enumerate all memory entries for their role

This enables scalable, collaborative, and stateful multi-agent orchestration.

---

## 🖌️ 10. UX/UI Agent

You are the champion for best-in-class user experience and interface design.

**Your task:**
- Run lint, accessibility, and visual regression checks
- Ensure design system compliance and visual consistency
- Identify and fix usability and a11y issues
- Collaborate with Product and QA agents for optimal flows

---

## 🧠 11. Human Psychology Agent

You ensure the application is engaging, rewarding, and emotionally resonant.

**Your task:**
- Run cognitive load, reward center, and emotional impact checks
- Recommend improvements to maximize user engagement and satisfaction
- Collaborate with UX/UI and Product agents for optimal user journeys

---

## 🧩 Suggested Execution Prompt (Per Agent Per Folder)

You are the [ROLE] agent working as part of a multi-agent system on the full AeroSuite monorepo.

This folder contains: [INSERT PATH]

Use full codebase context and coordinate with other agents to:
- Complete your responsibilities
- Create or modify files as needed
- Leave summaries, audit logs, and improvement plans

---

## 🗂️ Tracking Table (Progress Log Example)

| Folder Path       | Architect | Security | Tests | QA   | DevOps | Logic | UX   | Compliance |
|-------------------|-----------|----------|-------|------|--------|--------|------|-------------|
| `src/app/`        | ✅        | ✅        | ✅     | 🔄   | ✅     | ✅     | ✅   | ✅           |
| `backend/api/v1/` | ✅        | ✅        | 🔄     | 🔄   | 🔄     | ✅     | ⬜   | 🔄           |

---

_Last Updated: 2025-06-14_ 

type ModuleResult = {
  module: string;
  agentResults: Record<string, AgentResult>;
  bestAgent: string;
  bestAnswer: string;
}; 

results.push({
  module,
  agentResults,
  bestAgent: bestAgent || '',
  bestAnswer: bestAnswer || ''
}); 

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

const coverage = await runCursorCommand(`npm run test-${module.toLowerCase()}`); 

module.exports = {
  testMatch: [
    "**/?(*.)+(test).[jt]s?(x)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  testPathIgnorePatterns: ["/node_modules/"],
}; 

## Interpreting Orchestrator Results

- **All Green:** All agents passed—system is healthy and best-in-class
- **Warnings:** Some agents found issues—review details and address promptly
- **Red:** Critical issues—immediate action required

Use orchestrator output and agent memory to drive continuous improvement and ensure AeroSuite remains secure, reliable, and delightful for users. 