import { runPreBuildAgent } from './preBuildAgent';

describe('preBuildAgent', () => {
  it('runs without error', async () => {
    const result = await runPreBuildAgent('all');
    expect(result).toBeDefined();
    expect(result.details).toBeDefined();
    expect(typeof result.passed).toBe('boolean');
  });

  it('checks client TypeScript', async () => {
    const result = await runPreBuildAgent('client');
    expect(result.details).toContain('Client TypeScript Check');
  });

  it('checks server syntax', async () => {
    const result = await runPreBuildAgent('server');
    expect(result.details).toContain('Server Syntax Check');
  });

  it('performs full check for "all" module', async () => {
    const result = await runPreBuildAgent('all');
    expect(result.details).toContain('Full Pre-build Check');
    expect(result.details).toContain('Docker Readiness Check');
  });
});
