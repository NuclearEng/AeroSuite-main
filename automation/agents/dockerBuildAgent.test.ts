import { runDockerBuildAgent } from './dockerBuildAgent';

describe('dockerBuildAgent', () => {
  it('runs without error', async () => {
    const result = await runDockerBuildAgent('all');
    expect(result).toBeDefined();
    expect(result.details).toBeDefined();
    expect(typeof result.passed).toBe('boolean');
  });

  it('checks Docker daemon status', async () => {
    const result = await runDockerBuildAgent('all');
    expect(result.details).toContain('Docker Daemon Check');
  });

  it('validates docker-compose.yml', async () => {
    const result = await runDockerBuildAgent('all');
    expect(result.details).toContain('Docker Compose Configuration Check');
  });

  it('checks Dockerfiles', async () => {
    const result = await runDockerBuildAgent('all');
    expect(result.details).toContain('Dockerfile Check');
  });

  it('checks client TypeScript when specified', async () => {
    const result = await runDockerBuildAgent('client');
    expect(result.details).toContain('Client TypeScript Check');
  });
});
