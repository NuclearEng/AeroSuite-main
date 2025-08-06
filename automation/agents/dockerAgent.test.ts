import { runDockerAgent } from './dockerAgent';

describe('Docker Agent', () => {
  it('should provide Docker testing strategy for Login module', async () => {
    const result = await runDockerAgent('Login');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('Docker Testing Strategy for Login');
    expect(result.details).toContain('session management');
  });

  it('should provide Docker testing strategy for Reports module', async () => {
    const result = await runDockerAgent('Reports');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('report generation');
  });
}); 