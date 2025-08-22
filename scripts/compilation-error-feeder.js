#!/usr/bin/env node

/**
 * Compilation Error Feeder
 * 
 * Captures compilation errors from various sources and feeds them back to Cursor
 * or displays them in a formatted terminal output. Supports real-time monitoring.
 * 
 * Features:
 * - TypeScript compilation errors
 * - ESLint errors
 * - Build errors (React scripts)
 * - Real-time file watching
 * - Cursor IDE integration
 * - Terminal formatting
 * - JSON output for tooling integration
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chokidar = require('chokidar');

class CompilationErrorFeeder {
  constructor(options = {}) {
    this.options = {
      // Output options
      outputToTerminal: options.outputToTerminal !== false, // Default true
      outputToCursor: options.outputToCursor !== false,    // Default true
      outputToFile: options.outputToFile || false,
      outputFile: options.outputFile || 'compilation-errors.json',
      
      // Source options
      watchMode: options.watchMode || false,
      checkTypeScript: options.checkTypeScript !== false,  // Default true
      checkESLint: options.checkESLint !== false,          // Default true
      checkBuild: options.checkBuild || false,
      
      // Project paths
      projectRoot: options.projectRoot || process.cwd(),
      clientPath: options.clientPath || path.join(process.cwd(), 'client'),
      serverPath: options.serverPath || path.join(process.cwd(), 'server'),
      
      // Display options
      verbose: options.verbose || false,
      colors: options.colors !== false, // Default true
      showSuggestions: options.showSuggestions !== false, // Default true
      
      // Integration options
      cursorApiPort: options.cursorApiPort || 3001,
      ...options
    };

    this.errors = [];
    this.lastCheck = new Date();
    this.isRunning = false;
    
    // Color codes for terminal output
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
      bold: '\x1b[1m'
    };
  }

  log(message, level = 'info') {
    if (!this.options.outputToTerminal && level !== 'error') return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = this.options.colors ? {
      info: `${this.colors.cyan}[INFO]${this.colors.reset}`,
      warn: `${this.colors.yellow}[WARN]${this.colors.reset}`,
      error: `${this.colors.red}[ERROR]${this.colors.reset}`,
      success: `${this.colors.green}[SUCCESS]${this.colors.reset}`,
      debug: `${this.colors.gray}[DEBUG]${this.colors.reset}`
    }[level] : `[${level.toUpperCase()}]`;
    
    console.log(`${this.colors.gray}${timestamp}${this.colors.reset} ${prefix} ${message}`);
  }

  async run() {
    this.log('🚀 Starting Compilation Error Feeder', 'info');
    this.log(`Project: ${this.options.projectRoot}`, 'debug');
    
    if (this.options.watchMode) {
      await this.startWatchMode();
    } else {
      await this.runSingleCheck();
    }
  }

  async runSingleCheck() {
    this.log('🔍 Running single compilation check...', 'info');
    
    const results = await this.performChecks();
    await this.processResults(results);
    
    if (results.totalErrors === 0) {
      this.log('✅ No compilation errors found!', 'success');
    } else {
      this.log(`❌ Found ${results.totalErrors} compilation errors`, 'error');
      process.exit(1);
    }
  }

  async startWatchMode() {
    this.log('👁️ Starting watch mode...', 'info');
    this.isRunning = true;
    
    // Initial check
    await this.performChecksAndProcess();
    
    // Set up file watchers
    const watchPaths = [
      path.join(this.options.clientPath, 'src'),
      path.join(this.options.serverPath, 'src'),
      path.join(this.options.projectRoot, 'src')
    ].filter(p => fs.existsSync(p));

    if (watchPaths.length === 0) {
      this.log('⚠️ No source directories found to watch', 'warn');
      return;
    }

    this.log(`Watching: ${watchPaths.join(', ')}`, 'debug');

    const watcher = chokidar.watch(watchPaths, {
      ignored: [
        /node_modules/,
        /\.git/,
        /build/,
        /dist/,
        /\.backup/,
        /\.bak$/
      ],
      persistent: true,
      ignoreInitial: true
    });

    let debounceTimeout;
    const debounceDelay = 1000; // 1 second

    watcher.on('change', (filePath) => {
      if (this.options.verbose) {
        this.log(`File changed: ${path.relative(this.options.projectRoot, filePath)}`, 'debug');
      }
      
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        this.performChecksAndProcess();
      }, debounceDelay);
    });

    watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'error');
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('🛑 Shutting down watch mode...', 'info');
      watcher.close();
      process.exit(0);
    });

    this.log('Watch mode active. Press Ctrl+C to stop.', 'info');
  }

  async performChecksAndProcess() {
    if (this.isRunning) {
      this.log('🔄 Changes detected, checking for errors...', 'info');
    }
    
    const results = await this.performChecks();
    await this.processResults(results);
  }

  async performChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      totalErrors: 0,
      checks: {}
    };

    // TypeScript check
    if (this.options.checkTypeScript) {
      try {
        results.checks.typescript = await this.checkTypeScript();
        results.totalErrors += results.checks.typescript.errors.length;
      } catch (error) {
        this.log(`TypeScript check failed: ${error.message}`, 'error');
        results.checks.typescript = { errors: [], failed: true, error: error.message };
      }
    }

    // ESLint check
    if (this.options.checkESLint) {
      try {
        results.checks.eslint = await this.checkESLint();
        results.totalErrors += results.checks.eslint.errors.length;
      } catch (error) {
        this.log(`ESLint check failed: ${error.message}`, 'error');
        results.checks.eslint = { errors: [], failed: true, error: error.message };
      }
    }

    // Build check
    if (this.options.checkBuild) {
      try {
        results.checks.build = await this.checkBuild();
        results.totalErrors += results.checks.build.errors.length;
      } catch (error) {
        this.log(`Build check failed: ${error.message}`, 'error');
        results.checks.build = { errors: [], failed: true, error: error.message };
      }
    }

    this.errors = this.flattenErrors(results.checks);
    return results;
  }

  async checkTypeScript() {
    this.log('Checking TypeScript...', 'debug');
    
    const errors = [];
    const clientTsConfig = path.join(this.options.clientPath, 'tsconfig.json');
    const serverTsConfig = path.join(this.options.serverPath, 'tsconfig.json');
    const rootTsConfig = path.join(this.options.projectRoot, 'tsconfig.json');

    // Check client TypeScript
    if (fs.existsSync(clientTsConfig)) {
      try {
        execSync('npx tsc --noEmit --skipLibCheck', {
          cwd: this.options.clientPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
      } catch (error) {
        const parsed = this.parseTypeScriptErrors(error.stdout || error.stderr || '', 'client');
        errors.push(...parsed);
      }
    }

    // Check server TypeScript (if exists)
    if (fs.existsSync(serverTsConfig)) {
      try {
        execSync('npx tsc --noEmit --skipLibCheck', {
          cwd: this.options.serverPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
      } catch (error) {
        const parsed = this.parseTypeScriptErrors(error.stdout || error.stderr || '', 'server');
        errors.push(...parsed);
      }
    }

    return { errors, type: 'typescript' };
  }

  async checkESLint() {
    this.log('Checking ESLint...', 'debug');
    
    const errors = [];
    
    // Check client ESLint
    if (fs.existsSync(this.options.clientPath)) {
      try {
        execSync('npx eslint src --format json --quiet', {
          cwd: this.options.clientPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
      } catch (error) {
        try {
          const eslintOutput = JSON.parse(error.stdout || '[]');
          const parsed = this.parseESLintErrors(eslintOutput, 'client');
          errors.push(...parsed);
        } catch (parseError) {
          this.log(`Failed to parse ESLint output: ${parseError.message}`, 'warn');
        }
      }
    }

    return { errors, type: 'eslint' };
  }

  async checkBuild() {
    this.log('Checking build...', 'debug');
    
    const errors = [];
    
    // Try building the client
    if (fs.existsSync(this.options.clientPath)) {
      try {
        execSync('npm run build', {
          cwd: this.options.clientPath,
          stdio: 'pipe',
          encoding: 'utf-8',
          env: { ...process.env, CI: 'true' }
        });
      } catch (error) {
        const parsed = this.parseBuildErrors(error.stdout || error.stderr || '', 'client');
        errors.push(...parsed);
      }
    }

    return { errors, type: 'build' };
  }

  parseTypeScriptErrors(output, source) {
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Match TypeScript error format: file(line,col): error TS####: message
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
      if (match) {
        const [, file, line, col, severity, code, message] = match;
        errors.push({
          type: 'typescript',
          source,
          file: path.resolve(file),
          line: parseInt(line),
          column: parseInt(col),
          severity,
          code: `TS${code}`,
          message: message.trim(),
          raw: line
        });
      }
    }
    
    return errors;
  }

  parseESLintErrors(eslintResults, source) {
    const errors = [];
    
    for (const result of eslintResults) {
      for (const message of result.messages) {
        errors.push({
          type: 'eslint',
          source,
          file: result.filePath,
          line: message.line,
          column: message.column,
          severity: message.severity === 2 ? 'error' : 'warning',
          code: message.ruleId || 'eslint',
          message: message.message,
          raw: `${result.filePath}:${message.line}:${message.column}: ${message.message}`
        });
      }
    }
    
    return errors;
  }

  parseBuildErrors(output, source) {
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Match various build error formats
      if (line.includes('ERROR') || line.includes('Error:') || line.includes('Failed to compile')) {
        errors.push({
          type: 'build',
          source,
          file: 'unknown',
          line: 0,
          column: 0,
          severity: 'error',
          code: 'build',
          message: line.trim(),
          raw: line
        });
      }
    }
    
    return errors;
  }

  flattenErrors(checks) {
    const allErrors = [];
    for (const [checkType, result] of Object.entries(checks)) {
      if (result.errors) {
        allErrors.push(...result.errors);
      }
    }
    return allErrors;
  }

  async processResults(results) {
    // Terminal output
    if (this.options.outputToTerminal) {
      this.displayErrorsInTerminal(results);
    }

    // File output
    if (this.options.outputToFile) {
      this.saveErrorsToFile(results);
    }

    // Cursor integration
    if (this.options.outputToCursor) {
      await this.sendErrorsToCursor(results);
    }
  }

  displayErrorsInTerminal(results) {
    const { colors } = this;
    
    if (results.totalErrors === 0) {
      console.log(`\n${colors.green}✅ No compilation errors found!${colors.reset}\n`);
      return;
    }

    console.log(`\n${colors.red}❌ Found ${results.totalErrors} compilation errors:${colors.reset}\n`);

    // Group errors by file
    const errorsByFile = {};
    this.errors.forEach(error => {
      const relativeFile = path.relative(this.options.projectRoot, error.file);
      if (!errorsByFile[relativeFile]) {
        errorsByFile[relativeFile] = [];
      }
      errorsByFile[relativeFile].push(error);
    });

    // Display errors by file
    for (const [file, errors] of Object.entries(errorsByFile)) {
      console.log(`${colors.bold}${colors.cyan}📁 ${file}${colors.reset}`);
      
      errors.forEach((error, index) => {
        const severityColor = error.severity === 'error' ? colors.red : colors.yellow;
        const typeColor = colors.magenta;
        
        console.log(`  ${severityColor}${error.severity === 'error' ? '❌' : '⚠️'}${colors.reset} ${typeColor}[${error.type.toUpperCase()}]${colors.reset} Line ${error.line}:${error.column}`);
        console.log(`     ${colors.gray}${error.code}:${colors.reset} ${error.message}`);
        
        if (this.options.showSuggestions) {
          const suggestion = this.getSuggestion(error);
          if (suggestion) {
            console.log(`     ${colors.blue}💡 ${suggestion}${colors.reset}`);
          }
        }
        
        if (index < errors.length - 1) {
          console.log('');
        }
      });
      
      console.log('');
    }
  }

  saveErrorsToFile(results) {
    const outputData = {
      timestamp: results.timestamp,
      totalErrors: results.totalErrors,
      errors: this.errors,
      summary: {
        byType: {},
        byFile: {},
        bySeverity: { error: 0, warning: 0 }
      }
    };

    // Generate summary
    this.errors.forEach(error => {
      const relativeFile = path.relative(this.options.projectRoot, error.file);
      
      outputData.summary.byType[error.type] = (outputData.summary.byType[error.type] || 0) + 1;
      outputData.summary.byFile[relativeFile] = (outputData.summary.byFile[relativeFile] || 0) + 1;
      outputData.summary.bySeverity[error.severity] = (outputData.summary.bySeverity[error.severity] || 0) + 1;
    });

    fs.writeFileSync(this.options.outputFile, JSON.stringify(outputData, null, 2));
    this.log(`📝 Error report saved to: ${this.options.outputFile}`, 'debug');
  }

  async sendErrorsToCursor(results) {
    // Try to send errors to Cursor via LSP or API
    try {
      // This would integrate with Cursor's diagnostic system
      // For now, we'll create a format that Cursor can understand
      const cursorFormat = this.formatForCursor(this.errors);
      
      // Save in a format that Cursor's extensions can pick up
      const cursorFile = path.join(this.options.projectRoot, '.cursor-diagnostics.json');
      fs.writeFileSync(cursorFile, JSON.stringify(cursorFormat, null, 2));
      
      this.log(`📡 Diagnostics sent to Cursor: ${cursorFile}`, 'debug');
    } catch (error) {
      this.log(`Failed to send errors to Cursor: ${error.message}`, 'warn');
    }
  }

  formatForCursor(errors) {
    const diagnostics = {};
    
    errors.forEach(error => {
      const file = error.file;
      if (!diagnostics[file]) {
        diagnostics[file] = [];
      }
      
      diagnostics[file].push({
        range: {
          start: { line: error.line - 1, character: error.column - 1 },
          end: { line: error.line - 1, character: error.column + 10 }
        },
        severity: error.severity === 'error' ? 1 : 2, // 1 = Error, 2 = Warning
        code: error.code,
        source: error.type,
        message: error.message
      });
    });
    
    return {
      timestamp: new Date().toISOString(),
      diagnostics
    };
  }

  getSuggestion(error) {
    const suggestions = {
      // TypeScript suggestions
      'TS2304': 'Import the missing module or check the spelling of the identifier',
      'TS2339': 'Check if the property exists or add it to the type definition',
      'TS2345': 'Check the argument types match the function signature',
      'TS2322': 'Ensure the assigned value matches the expected type',
      'TS2531': 'Add null checking or use optional chaining (?.)',
      'TS2571': 'Check if the object is of the expected union type',
      
      // ESLint suggestions
      'no-unused-vars': 'Remove the unused variable or add underscore prefix',
      'import/no-unresolved': 'Install the missing package or check the import path',
      'react-hooks/exhaustive-deps': 'Add the missing dependency to the useEffect array',
      'prefer-const': 'Use const instead of let if the variable is not reassigned'
    };
    
    return suggestions[error.code] || null;
  }
}

// CLI interface
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
    colors: !args.includes('--no-colors')
  };

  // Parse custom options
  const fileIndex = args.findIndex(arg => arg === '--output-file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    options.outputFile = args[fileIndex + 1];
  }

  const feeder = new CompilationErrorFeeder(options);
  
  feeder.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = CompilationErrorFeeder;
