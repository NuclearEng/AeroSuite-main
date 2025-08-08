import { runDockerBuildAgent } from './dockerBuildAgent';
import { execSync } from 'child_process';

describe('dockerBuildAgent', () => {
  let dockerRunning = true;
  beforeAll(() => {
    try {
      execSync('docker ps', { stdio: 'pipe' });
      dockerRunning = true;
    } catch {
      dockerRunning = false;
    }
  });
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
    if (dockerRunning) {
      expect(result.details).toContain('Docker Compose Configuration Check');
    } else {
      expect(result.details).toContain('Docker daemon is not running');
    }
  });

  it('checks Dockerfiles', async () => {
    const result = await runDockerBuildAgent('all');
    if (dockerRunning) {
      expect(result.details).toContain('Dockerfile Check');
    } else {
      expect(result.details).toContain('Docker daemon is not running');
    }
  });

  it('checks client TypeScript when specified', async () => {
    const result = await runDockerBuildAgent('client');
    // TypeScript check may be skipped if early return occurred due to Docker not running
    if (dockerRunning) {
      expect(result.details).toContain('Client TypeScript Check');
    } else {
      expect(result.details).toContain('Docker daemon is not running');
    }
  });
});
