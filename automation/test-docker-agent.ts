import { runDockerBuildAgent } from './agents/dockerBuildAgent';

async function main() {
  console.log('Running Docker Build Agent test...');
  const result = await runDockerBuildAgent('all');
  console.log('=== TEST RESULTS ===');
  console.log(`Passed: ${result.passed}`);
  console.log(result.details);
}

main().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
