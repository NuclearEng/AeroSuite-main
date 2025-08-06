import { runNginxUnitAgent } from './nginxUnitAgent';

describe('NGINX Unit Agent', () => {
  it('should provide NGINX Unit testing strategy for Login module', async () => {
    const result = await runNginxUnitAgent('Login');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('NGINX Unit Testing Strategy for Login');
    expect(result.details).toContain('session management');
    expect(result.details).toContain('authentication endpoints');
  });

  it('should provide NGINX Unit testing strategy for Reports module', async () => {
    const result = await runNginxUnitAgent('Reports');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('file upload handling');
    expect(result.details).toContain('streaming capabilities');
  });

  it('should provide NGINX Unit testing strategy for Settings module', async () => {
    const result = await runNginxUnitAgent('Settings');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('configuration management');
    expect(result.details).toContain('environment variable handling');
  });

  it('should provide NGINX Unit testing strategy for Suppliers module', async () => {
    const result = await runNginxUnitAgent('Suppliers');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('bulk data processing');
    expect(result.details).toContain('connection pooling');
  });

  it('should include Unit configuration example', async () => {
    const result = await runNginxUnitAgent('Login');
    expect(result.details).toContain('Unit Configuration Example');
    expect(result.details).toContain('"type": "external"');
    expect(result.details).toContain('unit-http/loader.mjs');
  });
}); 