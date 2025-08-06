import { runRedisAgent } from './redisAgent';

describe('Redis Agent', () => {
  it('should provide Redis testing strategy for Login module', async () => {
    const result = await runRedisAgent('Login');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('Redis Testing Strategy for Login');
    expect(result.details).toContain('session management');
    expect(result.details).toContain('JWT token storage');
  });

  it('should provide Redis testing strategy for Reports module', async () => {
    const result = await runRedisAgent('Reports');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('report caching');
    expect(result.details).toContain('report generation queuing');
  });

  it('should provide Redis testing strategy for Settings module', async () => {
    const result = await runRedisAgent('Settings');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('user preferences');
    expect(result.details).toContain('feature flags');
  });

  it('should provide Redis testing strategy for Suppliers module', async () => {
    const result = await runRedisAgent('Suppliers');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('supplier data caching');
    expect(result.details).toContain('bulk data processing');
  });

  it('should include Redis configuration example', async () => {
    const result = await runRedisAgent('Login');
    expect(result.details).toContain('Redis Configuration Example');
    expect(result.details).toContain('redis.createClient');
    expect(result.details).toContain('client.set');
  });
}); 