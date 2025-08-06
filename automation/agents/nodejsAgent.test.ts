import { runNodejsAgent } from './nodejsAgent';

describe('Node.js Agent', () => {
  it('should provide Node.js testing strategy for Login module', async () => {
    const result = await runNodejsAgent('Login');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('Node.js Testing Strategy for Login');
    expect(result.details).toContain('Worker Threads');
    expect(result.details).toContain('password hashing');
  });

  it('should provide Node.js testing strategy for Reports module', async () => {
    const result = await runNodejsAgent('Reports');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('PDF generation');
    expect(result.details).toContain('Streams');
  });

  it('should provide Node.js testing strategy for Settings module', async () => {
    const result = await runNodejsAgent('Settings');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('AsyncLocalStorage');
    expect(result.details).toContain('configuration management');
  });

  it('should provide Node.js testing strategy for Suppliers module', async () => {
    const result = await runNodejsAgent('Suppliers');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('data processing');
    expect(result.details).toContain('connection pooling');
  });
}); 