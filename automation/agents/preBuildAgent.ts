import { execSync } from 'child_process';
import * as path from 'path';

interface PreBuildResult {
  passed: boolean;
  details: string;
}

/**
 * Pre-build Agent
 * 
 * Runs syntax and type checks before Docker builds to catch errors early
 */
export async function runPreBuildAgent(module: string): Promise<PreBuildResult> {
  const results: string[] = [];
  let hasErrors = false;

  try {
    // Get project root (assuming automation folder is at project root)
    const projectRoot = path.resolve(__dirname, '../../..');
    
    switch (module.toLowerCase()) {
      case 'client':
      case 'frontend':
      case 'login':
      case 'reports':
      case 'settings':
      case 'suppliers':
        // TypeScript check for client
        results.push('=== Client TypeScript Check ===');
        try {
          const clientPath = path.join(projectRoot, 'client');
          execSync('npx tsc --noEmit --skipLibCheck', { 
            cwd: clientPath,
            stdio: 'pipe' 
          });
          results.push('✅ Client TypeScript check passed');
        } catch (error: any) {
          hasErrors = true;
          results.push('❌ Client TypeScript errors found:');
          results.push(error.stdout?.toString() || error.message);
        }
        break;

      case 'server':
      case 'backend':
      case 'api':
        // Syntax check for server
        results.push('=== Server Syntax Check ===');
        try {
          const serverPath = path.join(projectRoot, 'server');
          execSync('node -c src/index.js', { 
            cwd: serverPath,
            stdio: 'pipe' 
          });
          results.push('✅ Server syntax check passed');
        } catch (error: any) {
          hasErrors = true;
          results.push('❌ Server syntax errors found:');
          results.push(error.stdout?.toString() || error.message);
        }
        break;

      case 'all':
      case 'full':
        // Check both client and server
        results.push('=== Full Pre-build Check ===');
        
        // Client check
        try {
          const clientPath = path.join(projectRoot, 'client');
          execSync('npx tsc --noEmit --skipLibCheck', { 
            cwd: clientPath,
            stdio: 'pipe' 
          });
          results.push('✅ Client TypeScript check passed');
        } catch (error: any) {
          hasErrors = true;
          results.push('❌ Client TypeScript errors found');
        }

        // Server check
        try {
          const serverPath = path.join(projectRoot, 'server');
          execSync('node -c src/index.js', { 
            cwd: serverPath,
            stdio: 'pipe' 
          });
          results.push('✅ Server syntax check passed');
        } catch (error: any) {
          hasErrors = true;
          results.push('❌ Server syntax errors found');
        }
        break;

      default:
        // Quick check for common errors
        results.push(`=== Pre-build Check for ${module} ===`);
        
        // Check for common TypeScript errors in client
        try {
          const searchResult = execSync(
            `grep -r "console.error(\\"Error:\\", err)" client/src || true`,
            { cwd: projectRoot, stdio: 'pipe' }
          ).toString();
          
          if (searchResult.trim()) {
            hasErrors = true;
            results.push('❌ Found potential undefined variable errors:');
            results.push(searchResult);
          } else {
            results.push('✅ No common TypeScript errors detected');
          }
        } catch (error: any) {
          results.push('⚠️ Could not perform error pattern check');
        }
    }

    // Additional checks for Docker readiness
    results.push('\n=== Docker Readiness Check ===');
    
    // Check if Docker is running
    try {
      execSync('docker ps', { stdio: 'pipe' });
      results.push('✅ Docker daemon is running');
    } catch {
      hasErrors = true;
      results.push('❌ Docker daemon is not running');
    }

    // Check for required files
    const requiredFiles = [
      'docker-compose.yml',
      'client/Dockerfile',
      'server/Dockerfile'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(projectRoot, file);
      try {
        execSync(`test -f ${filePath}`);
        results.push(`✅ Found ${file}`);
      } catch {
        hasErrors = true;
        results.push(`❌ Missing ${file}`);
      }
    }

  } catch (error: any) {
    hasErrors = true;
    results.push(`❌ Pre-build check failed: ${error.message}`);
  }

  return {
    passed: !hasErrors,
    details: results.join('\n')
  };
}

// Export for CommonJS compatibility
module.exports = { runPreBuildAgent };
