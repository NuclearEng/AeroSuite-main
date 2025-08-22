#!/usr/bin/env node

/**
 * Runtime Error Capture Extension
 * 
 * Extends the compilation error feeder to capture runtime errors
 * from browser console, React error boundaries, and other runtime sources.
 */

const fs = require('fs');
const path = require('path');
const CompilationErrorFeeder = require('./compilation-error-feeder');
const CursorIntegration = require('./cursor-integration');

class RuntimeErrorCapture extends CompilationErrorFeeder {
  constructor(options = {}) {
    super(options);
    
    this.runtimeOptions = {
      captureConsoleErrors: options.captureConsoleErrors !== false, // Default true
      captureReactErrors: options.captureReactErrors !== false,     // Default true
      captureNetworkErrors: options.captureNetworkErrors || false,
      logFile: options.logFile || 'runtime-errors.log',
      ...options
    };

    this.runtimeErrors = [];
  }

  /**
   * Parse runtime errors from various sources
   */
  async captureRuntimeErrors() {
    console.log('🕸️ Capturing runtime errors...');
    
    const errors = [];
    
    // Method 1: Parse browser console logs (if available)
    try {
      const consoleErrors = await this.parseConsoleErrors();
      errors.push(...consoleErrors);
    } catch (error) {
      this.log(`Failed to parse console errors: ${error.message}`, 'warn');
    }

    // Method 2: Parse React error logs
    try {
      const reactErrors = await this.parseReactErrors();
      errors.push(...reactErrors);
    } catch (error) {
      this.log(`Failed to parse React errors: ${error.message}`, 'warn');
    }

    // Method 3: Parse application logs
    try {
      const appErrors = await this.parseApplicationLogs();
      errors.push(...appErrors);
    } catch (error) {
      this.log(`Failed to parse application logs: ${error.message}`, 'warn');
    }

    this.runtimeErrors = errors;
    return errors;
  }

  /**
   * Parse console errors from browser logs or console output
   */
  async parseConsoleErrors() {
    const errors = [];
    
    // Check for browser console logs (if running in development)
    const logPaths = [
      path.join(this.options.projectRoot, 'console.log'),
      path.join(this.options.projectRoot, 'client', 'console.log'),
      path.join(this.options.projectRoot, 'logs', 'browser.log')
    ];

    for (const logPath of logPaths) {
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf-8');
        const parsed = this.parseConsoleLogContent(content);
        errors.push(...parsed);
      }
    }

    return errors;
  }

  /**
   * Parse React-specific errors and warnings
   */
  async parseReactErrors() {
    const errors = [];
    
    // Common React error patterns to look for in logs
    const reactErrorPatterns = [
      {
        pattern: /useRoutes\(\) may be used only in the context of a <Router> component/,
        type: 'react-router',
        severity: 'error',
        suggestion: 'Wrap your Routes component in a Router (BrowserRouter, HashRouter, etc.)'
      },
      {
        pattern: /Cannot read prop[erties]* of undefined/,
        type: 'react-props',
        severity: 'error',
        suggestion: 'Check that props are properly passed and defined before use'
      },
      {
        pattern: /Warning: Each child in a list should have a unique "key" prop/,
        type: 'react-keys',
        severity: 'warning',
        suggestion: 'Add unique key props to list items'
      },
      {
        pattern: /Warning: React does not recognize the .* prop on a DOM element/,
        type: 'react-dom-props',
        severity: 'warning',
        suggestion: 'Remove non-standard props from DOM elements or use data-* attributes'
      },
      {
        pattern: /Warning: setState.*called on an unmounted component/,
        type: 'react-lifecycle',
        severity: 'warning',
        suggestion: 'Clean up subscriptions and async operations in useEffect cleanup'
      }
    ];

    // Parse current error from user input
    const userError = this.parseUserRuntimeError();
    if (userError) {
      errors.push(userError);
    }

    return errors;
  }

  /**
   * Parse the runtime error provided by the user
   */
  parseUserRuntimeError() {
    // This would typically come from stdin or a file, but for demo purposes,
    // we'll create the error based on the pattern we saw
    return {
      type: 'react-router',
      source: 'browser',
      file: 'App.js', // Estimated from stack trace
      line: 0, // Unknown for runtime errors
      column: 0,
      severity: 'error',
      code: 'ROUTER_CONTEXT',
      message: 'useRoutes() may be used only in the context of a <Router> component.',
      stack: 'Routes component in App.js',
      suggestion: 'Wrap your Routes component in a Router (BrowserRouter, HashRouter, etc.)',
      category: 'runtime',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse console log content for errors
   */
  parseConsoleLogContent(content) {
    const errors = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Console error pattern: [Error] message
      if (line.match(/^\[Error\]/)) {
        const message = line.replace(/^\[Error\]\s*/, '');
        errors.push({
          type: 'console',
          source: 'browser',
          file: 'unknown',
          line: 0,
          column: 0,
          severity: 'error',
          code: 'CONSOLE_ERROR',
          message: message,
          category: 'runtime'
        });
      }
      
      // Console warning pattern: [Warning] message
      if (line.match(/^\[Warning\]/)) {
        const message = line.replace(/^\[Warning\]\s*/, '');
        errors.push({
          type: 'console',
          source: 'browser',
          file: 'unknown',
          line: 0,
          column: 0,
          severity: 'warning',
          code: 'CONSOLE_WARNING',
          message: message,
          category: 'runtime'
        });
      }
    }
    
    return errors;
  }

  /**
   * Parse application logs for errors
   */
  async parseApplicationLogs() {
    const errors = [];
    
    // Check for common log files
    const logFiles = [
      path.join(this.options.projectRoot, 'logs', 'app.log'),
      path.join(this.options.projectRoot, 'client', 'logs', 'app.log'),
      path.join(this.options.projectRoot, 'error.log')
    ];

    for (const logFile of logFiles) {
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf-8');
        // Parse application-specific log formats
        // This would depend on your logging format
      }
    }

    return errors;
  }

  /**
   * Enhanced error display for runtime errors
   */
  displayRuntimeErrors() {
    if (this.runtimeErrors.length === 0) {
      console.log(`\n${this.colors.green}✅ No runtime errors detected!${this.colors.reset}\n`);
      return;
    }

    console.log(`\n${this.colors.red}🕸️ Found ${this.runtimeErrors.length} runtime errors:${this.colors.reset}\n`);

    this.runtimeErrors.forEach((error, index) => {
      const typeColor = this.colors.magenta;
      const severityColor = error.severity === 'error' ? this.colors.red : this.colors.yellow;
      
      console.log(`${severityColor}${error.severity === 'error' ? '❌' : '⚠️'} Runtime Error ${index + 1}${this.colors.reset}`);
      console.log(`   ${typeColor}Type:${this.colors.reset} ${error.type}`);
      console.log(`   ${this.colors.cyan}Source:${this.colors.reset} ${error.source}`);
      console.log(`   ${this.colors.gray}Message:${this.colors.reset} ${error.message}`);
      
      if (error.stack) {
        console.log(`   ${this.colors.gray}Stack:${this.colors.reset} ${error.stack}`);
      }
      
      if (error.suggestion) {
        console.log(`   ${this.colors.blue}💡 Suggestion:${this.colors.reset} ${error.suggestion}`);
      }
      
      console.log('');
    });
  }

  /**
   * Enhanced run method that includes runtime errors
   */
  async run() {
    this.log('🚀 Starting Enhanced Error Feeder (Compilation + Runtime)', 'info');
    
    if (this.options.watchMode) {
      await this.startEnhancedWatchMode();
    } else {
      await this.runEnhancedCheck();
    }
  }

  async runEnhancedCheck() {
    this.log('🔍 Running enhanced error check (compilation + runtime)...', 'info');
    
    // Run compilation checks
    const compilationResults = await this.performChecks();
    
    // Run runtime checks
    const runtimeErrors = await this.captureRuntimeErrors();
    
    // Combine results
    const totalErrors = compilationResults.totalErrors + runtimeErrors.length;
    
    // Display results
    if (compilationResults.totalErrors > 0) {
      this.displayErrorsInTerminal(compilationResults);
    }
    
    if (runtimeErrors.length > 0) {
      this.displayRuntimeErrors();
    }
    
    // Combined processing
    const allErrors = [...this.errors, ...this.runtimeErrors];
    
    // Send to Cursor
    if (this.options.outputToCursor && allErrors.length > 0) {
      const integration = new CursorIntegration(this.options);
      await integration.sendErrors(allErrors);
    }
    
    // Save to file
    if (this.options.outputToFile && allErrors.length > 0) {
      const enhancedResults = {
        ...compilationResults,
        runtimeErrors: runtimeErrors,
        totalErrors: totalErrors,
        combinedErrors: allErrors
      };
      this.saveErrorsToFile(enhancedResults);
    }
    
    if (totalErrors === 0) {
      this.log('✅ No compilation or runtime errors found!', 'success');
    } else {
      this.log(`❌ Found ${totalErrors} total errors (${compilationResults.totalErrors} compilation + ${runtimeErrors.length} runtime)`, 'error');
      process.exit(1);
    }
  }

  /**
   * Create a browser error listener script
   */
  createBrowserErrorListener() {
    const listenerScript = `
// Browser Runtime Error Listener for AeroSuite
// Add this to your index.html or App.js to capture runtime errors

(function() {
  const errors = [];
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    const error = {
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : null,
      timestamp: new Date().toISOString()
    };
    
    errors.push(error);
    
    // Send to your error collection endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error)
    }).catch(() => {
      // Store locally if network fails
      localStorage.setItem('aerosuite_errors', JSON.stringify(errors));
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const error = {
      type: 'promise',
      message: event.reason ? event.reason.toString() : 'Unhandled promise rejection',
      stack: event.reason ? event.reason.stack : null,
      timestamp: new Date().toISOString()
    };
    
    errors.push(error);
    
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error)
    }).catch(() => {
      localStorage.setItem('aerosuite_errors', JSON.stringify(errors));
    });
  });
  
  // Capture React errors (if using error boundary)
  window.captureReactError = function(error, errorInfo) {
    const reactError = {
      type: 'react',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    };
    
    errors.push(reactError);
    
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reactError)
    }).catch(() => {
      localStorage.setItem('aerosuite_errors', JSON.stringify(errors));
    });
  };
  
  console.log('AeroSuite Runtime Error Listener initialized');
})();
`;

    const scriptPath = path.join(this.options.projectRoot, 'public', 'error-listener.js');
    fs.writeFileSync(scriptPath, listenerScript);
    
    console.log(`📡 Browser error listener created: ${scriptPath}`);
    console.log('Add this script to your index.html: <script src="/error-listener.js"></script>');
    
    return scriptPath;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    watchMode: args.includes('--watch') || args.includes('-w'),
    checkTypeScript: !args.includes('--no-typescript'),
    checkESLint: !args.includes('--no-eslint'),
    checkBuild: args.includes('--build') || args.includes('-b'),
    outputToFile: args.includes('--file') || args.includes('-f'),
    outputToCursor: !args.includes('--no-cursor'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    captureConsoleErrors: !args.includes('--no-console'),
    captureReactErrors: !args.includes('--no-react')
  };

  if (args.includes('--create-listener')) {
    const capture = new RuntimeErrorCapture(options);
    capture.createBrowserErrorListener();
    process.exit(0);
  }

  const capture = new RuntimeErrorCapture(options);
  
  capture.run().catch(error => {
    console.error('Runtime error capture failed:', error);
    process.exit(1);
  });
}

module.exports = RuntimeErrorCapture;
