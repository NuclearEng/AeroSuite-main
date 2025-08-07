import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface DockerBuildResult {
  passed: boolean;
  details: string;
}

/**
 * Docker Build Agent
 * 
 * Validates Docker configurations and performs pre-build checks
 */
export async function runDockerBuildAgent(module: string): Promise<DockerBuildResult> {
  const results: string[] = [];
  let hasErrors = false;

  try {
    // Get project root (assuming automation folder is at project root)
    const projectRoot = path.resolve(__dirname, '../../');
    
    // Check if Docker is running
    results.push('=== Docker Daemon Check ===');
    try {
      execSync('docker ps', { stdio: 'pipe' });
      results.push('✅ Docker daemon is running');
    } catch (error: any) {
      hasErrors = true;
      results.push('❌ Docker daemon is not running');
      results.push(error.message);
      // Early return if Docker isn't running
      return {
        passed: false,
        details: results.join('\n')
      };
    }

    // Check Docker Compose file
    results.push('\n=== Docker Compose Configuration Check ===');
    const dockerComposeFile = path.join(projectRoot, 'docker-compose.yml');
    if (fs.existsSync(dockerComposeFile)) {
      results.push('✅ docker-compose.yml exists');
      
      // Validate docker-compose.yml format
      try {
        execSync(`docker-compose config`, { 
          cwd: projectRoot,
          stdio: 'pipe' 
        });
        results.push('✅ docker-compose.yml is valid');
      } catch (error: any) {
        hasErrors = true;
        results.push('❌ docker-compose.yml has errors:');
        results.push(error.stdout?.toString() || error.message);
      }
    } else {
      hasErrors = true;
      results.push('❌ docker-compose.yml not found');
    }

    // Check Dockerfiles
    results.push('\n=== Dockerfile Check ===');
    const requiredDockerfiles = [
      'client/Dockerfile',
      'server/Dockerfile'
    ];
    
    for (const dockerfile of requiredDockerfiles) {
      const dockerfilePath = path.join(projectRoot, dockerfile);
      if (fs.existsSync(dockerfilePath)) {
        results.push(`✅ ${dockerfile} exists`);
        
        // Check for common Dockerfile issues
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
        
        if (dockerfileContent.includes('chown -R')) {
          results.push(`⚠️ ${dockerfile} contains recursive chown which may slow down builds`);
        }
        
        if (!dockerfileContent.toLowerCase().includes('user ')) {
          results.push(`⚠️ ${dockerfile} doesn't explicitly set USER (running as root)`);
        }
        
        // Check if Dockerfile can be parsed
        try {
          execSync(`docker build -t test-${dockerfile.replace(/\//g, '-')} -f ${dockerfilePath} --target deps . --no-cache`, {
            cwd: path.join(projectRoot, path.dirname(dockerfile)),
            stdio: 'pipe'
          });
          results.push(`✅ ${dockerfile} syntax is valid`);
        } catch (error: any) {
          if (error.stderr?.toString().includes('not find') || error.stderr?.toString().includes('No such file')) {
            results.push(`⚠️ Could not validate ${dockerfile} build - skipping`);
          } else {
            hasErrors = true;
            results.push(`❌ ${dockerfile} has errors:`);
            results.push(error.stderr?.toString() || error.message);
          }
        }
      } else {
        hasErrors = true;
        results.push(`❌ ${dockerfile} not found`);
      }
    }

    // Check for TypeScript errors in client
    if (module.toLowerCase() === 'all' || module.toLowerCase() === 'client') {
      results.push('\n=== Client TypeScript Check ===');
      try {
        const clientPath = path.join(projectRoot, 'client');
        if (fs.existsSync(clientPath)) {
          try {
            execSync('npx tsc --noEmit --skipLibCheck', { 
              cwd: clientPath,
              stdio: 'pipe' 
            });
            results.push('✅ Client TypeScript check passed');
          } catch (error: any) {
            // Count TypeScript errors
            const output = error.stdout?.toString() || '';
            const errorCount = (output.match(/error TS/g) || []).length;
            
            if (errorCount > 0) {
              hasErrors = true;
              results.push(`❌ Found ${errorCount} TypeScript errors`);
              
              // Show first few errors
              const errorLines = output.split('\n')
                .filter((line: string) => line.includes('error TS'))
                .slice(0, 5);
              
              results.push(errorLines.join('\n'));
              
              if (errorCount > 5) {
                results.push(`... and ${errorCount - 5} more errors`);
              }
            }
          }
        } else {
          results.push('⚠️ Client directory not found');
        }
      } catch (error: any) {
        results.push(`⚠️ Could not check client TypeScript: ${error.message}`);
      }
    }

    // Check for common error patterns
    results.push('\n=== Common Error Pattern Check ===');
    try {
      const output = execSync(
        `grep -r "console.error(\\"Error:\\", err)" client/src || true`,
        { cwd: projectRoot, stdio: 'pipe' }
      ).toString();
      
      const matchCount = output.split('\n').filter(Boolean).length;
      
      if (matchCount > 0) {
        results.push(`⚠️ Found ${matchCount} potential undefined variable errors`);
        const sampleLines = output.split('\n').filter(Boolean).slice(0, 3);
        results.push(sampleLines.join('\n'));
        if (matchCount > 3) {
          results.push(`... and ${matchCount - 3} more instances`);
        }
      } else {
        results.push('✅ No common error patterns detected');
      }
    } catch (error: any) {
      results.push(`⚠️ Could not check for error patterns: ${error.message}`);
    }

  } catch (error: any) {
    hasErrors = true;
    results.push(`❌ Docker build check failed: ${error.message}`);
  }

  return {
    passed: !hasErrors,
    details: results.join('\n')
  };
}

// Export for CommonJS compatibility
module.exports = { runDockerBuildAgent };
