// Test for orchestrator prioritization, aggregation, and human review logic
const { main } = require('./orchestrator');

// Mock the dependencies
jest.mock('./agents/softwareArchitectAgent');
jest.mock('./agents/devSecOpsAgent');
jest.mock('./agents/testAutomationAgent');
jest.mock('./agents/qaAgent');
jest.mock('./agents/devOpsAgent');
jest.mock('./agents/productLogicAgent');
jest.mock('./agents/uxAgent');
jest.mock('./agents/uxUiAgent');
jest.mock('./agents/humanPsychologyAgent');
jest.mock('./agents/complianceAgent');
jest.mock('./agents/componentAgent');
jest.mock('./agents/customerAgent');
jest.mock('./agents/inspectionAgent');
jest.mock('./agents/supplierAgent');
jest.mock('./agents/systemsAgent');
jest.mock('./agents/dockerAgent');
jest.mock('./agents/nodejsAgent');
jest.mock('./agents/nginxUnitAgent');
jest.mock('./agents/redisAgent');
jest.mock('./agents/cypressAgent');
jest.mock('./agents/humanReviewAgent');
jest.mock('./agents/a11yAgent');
jest.mock('./agents/aiModelAgent');
jest.mock('./agents/bugAgent');
jest.mock('./agents/codeQualityAgent');
jest.mock('./agents/lintAgent');
jest.mock('./agents/parallelismAgent');
jest.mock('./agents/performanceAgent');
jest.mock('./agents/securityAgent');
jest.mock('./agents/testCoverageAgent');
jest.mock('./agents/uxUatAgent');
jest.mock('./agents/preBuildAgent');
jest.mock('./agents/dockerBuildAgent');
jest.mock('./utils/logger');
jest.mock('./agents/memoryAgent');

describe('orchestrator', () => {
  it('runs main function without error', async () => {
    // Setup mock implementations
    const mockResult = { passed: true, details: 'Test passed' };
    
    // Import all agent functions
    const { runSoftwareArchitectAgent } = require('./agents/softwareArchitectAgent');
    const { runDevSecOpsAgent } = require('./agents/devSecOpsAgent');
    const { runTestAutomationAgent } = require('./agents/testAutomationAgent');
    const { runQaAgent } = require('./agents/qaAgent');
    const { runDevOpsAgent } = require('./agents/devOpsAgent');
    const { runProductLogicAgent } = require('./agents/productLogicAgent');
    const { runUXAgent } = require('./agents/uxAgent');
    const { runUxUiAgent } = require('./agents/uxUiAgent');
    const { runHumanPsychologyAgent } = require('./agents/humanPsychologyAgent');
    const { runComplianceAgent } = require('./agents/complianceAgent');
    const { runComponentAgent } = require('./agents/componentAgent');
    const { runCustomerAgent } = require('./agents/customerAgent');
    const { runInspectionAgent } = require('./agents/inspectionAgent');
    const { runSupplierAgent } = require('./agents/supplierAgent');
    const { runSystemsAgent } = require('./agents/systemsAgent');
    const { runDockerAgent } = require('./agents/dockerAgent');
    const { runNodejsAgent } = require('./agents/nodejsAgent');
    const { runNginxUnitAgent } = require('./agents/nginxUnitAgent');
    const { runRedisAgent } = require('./agents/redisAgent');
    const { runCypressAgent } = require('./agents/cypressAgent');
    const { runHumanReviewAgent } = require('./agents/humanReviewAgent');
    const { runA11yAgent } = require('./agents/a11yAgent');
    const { runAIModelAgent } = require('./agents/aiModelAgent');
    const { runBugAgent } = require('./agents/bugAgent');
    const { runCodeQualityAgent } = require('./agents/codeQualityAgent');
    const { runLintAgent } = require('./agents/lintAgent');
    const { runParallelismAgent } = require('./agents/parallelismAgent');
    const { runPerformanceAgent } = require('./agents/performanceAgent');
    const { runSecurityAgent } = require('./agents/securityAgent');
    const { runTestCoverageAgent } = require('./agents/testCoverageAgent');
    const { runUxUatAgent } = require('./agents/uxUatAgent');
    const { runPreBuildAgent } = require('./agents/preBuildAgent');
    const { runDockerBuildAgent } = require('./agents/dockerBuildAgent');
    const { logResult, summarizeResults } = require('./utils/logger');
    const { saveMemory, loadMemory } = require('./agents/memoryAgent');
    
    // Mock implementations
    runSoftwareArchitectAgent.mockResolvedValue(mockResult);
    runDevSecOpsAgent.mockResolvedValue(mockResult);
    runTestAutomationAgent.mockResolvedValue(mockResult);
    runQaAgent.mockResolvedValue(mockResult);
    runDevOpsAgent.mockResolvedValue(mockResult);
    runProductLogicAgent.mockResolvedValue(mockResult);
    runUXAgent.mockResolvedValue(mockResult);
    runUxUiAgent.mockResolvedValue(mockResult);
    runHumanPsychologyAgent.mockResolvedValue(mockResult);
    runComplianceAgent.mockResolvedValue(mockResult);
    runComponentAgent.mockResolvedValue(mockResult);
    runCustomerAgent.mockResolvedValue(mockResult);
    runInspectionAgent.mockResolvedValue(mockResult);
    runSupplierAgent.mockResolvedValue(mockResult);
    runSystemsAgent.mockResolvedValue(mockResult);
    runDockerAgent.mockResolvedValue(mockResult);
    runNodejsAgent.mockResolvedValue(mockResult);
    runNginxUnitAgent.mockResolvedValue(mockResult);
    runRedisAgent.mockResolvedValue(mockResult);
    runCypressAgent.mockResolvedValue(mockResult);
    runA11yAgent.mockResolvedValue(mockResult);
    runAIModelAgent.mockResolvedValue(mockResult);
    runBugAgent.mockResolvedValue(mockResult);
    runCodeQualityAgent.mockResolvedValue(mockResult);
    runLintAgent.mockResolvedValue(mockResult);
    runParallelismAgent.mockResolvedValue(mockResult);
    runPerformanceAgent.mockResolvedValue(mockResult);
    runSecurityAgent.mockResolvedValue(mockResult);
    runTestCoverageAgent.mockResolvedValue(mockResult);
    runUxUatAgent.mockResolvedValue(mockResult);
    runPreBuildAgent.mockResolvedValue(mockResult);
    runDockerBuildAgent.mockResolvedValue(mockResult);
    runHumanReviewAgent.mockResolvedValue(undefined);
    logResult.mockImplementation(() => {});
    summarizeResults.mockImplementation(() => {});
    saveMemory.mockResolvedValue(undefined);
    loadMemory.mockResolvedValue(null);
    
    // Mock process.exit to prevent test from exiting
    const originalExit = process.exit;
    process.exit = jest.fn() as unknown as typeof process.exit;
    
    // Run the test
    await main();
    
    // Assertions
    expect(runSystemsAgent).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
    
    // Restore process.exit
    process.exit = originalExit;
  });
});
