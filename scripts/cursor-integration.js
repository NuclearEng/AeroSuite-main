#!/usr/bin/env node

/**
 * Cursor IDE Integration Module
 * 
 * Provides integration with Cursor IDE for displaying compilation errors
 * directly in the editor. Supports LSP-style diagnostics and custom
 * error formatting for Cursor extensions.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class CursorIntegration {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      diagnosticsFile: options.diagnosticsFile || '.cursor-diagnostics.json',
      problemsFile: options.problemsFile || '.vscode/problems.json',
      enableLSP: options.enableLSP !== false, // Default true
      enableExtension: options.enableExtension !== false, // Default true
      port: options.port || 3001,
      ...options
    };

    this.diagnostics = new Map();
    this.lastUpdate = new Date();
  }

  /**
   * Send errors to Cursor IDE using multiple methods
   */
  async sendErrors(errors, options = {}) {
    const formattedErrors = this.formatErrors(errors);
    
    const results = {
      lsp: false,
      extension: false,
      file: false,
      problems: false
    };

    // Method 1: LSP-style diagnostics file (Cursor picks this up automatically)
    if (this.options.enableLSP) {
      try {
        await this.createLSPDiagnostics(formattedErrors);
        results.lsp = true;
      } catch (error) {
        console.warn('Failed to create LSP diagnostics:', error.message);
      }
    }

    // Method 2: Extension-friendly format
    if (this.options.enableExtension) {
      try {
        await this.createExtensionFormat(formattedErrors);
        results.extension = true;
      } catch (error) {
        console.warn('Failed to create extension format:', error.message);
      }
    }

    // Method 3: Standard diagnostics file
    try {
      await this.createDiagnosticsFile(formattedErrors);
      results.file = true;
    } catch (error) {
      console.warn('Failed to create diagnostics file:', error.message);
    }

    // Method 4: VS Code compatible problems file
    try {
      await this.createProblemsFile(formattedErrors);
      results.problems = true;
    } catch (error) {
      console.warn('Failed to create problems file:', error.message);
    }

    return results;
  }

  /**
   * Format errors for IDE consumption
   */
  formatErrors(errors) {
    const diagnosticsByFile = new Map();

    errors.forEach(error => {
      const file = this.normalizeFilePath(error.file);
      
      if (!diagnosticsByFile.has(file)) {
        diagnosticsByFile.set(file, []);
      }

      const diagnostic = {
        range: {
          start: {
            line: Math.max(0, (error.line || 1) - 1),
            character: Math.max(0, (error.column || 1) - 1)
          },
          end: {
            line: Math.max(0, (error.line || 1) - 1),
            character: Math.max(0, (error.column || 1) + 10) // Rough estimate
          }
        },
        severity: this.mapSeverity(error.severity),
        code: error.code || 'unknown',
        source: error.type || 'compilation',
        message: error.message || 'Unknown error',
        tags: this.getTags(error)
      };

      // Add related information if available
      if (error.suggestion) {
        diagnostic.relatedInformation = [{
          location: {
            uri: file,
            range: diagnostic.range
          },
          message: `Suggestion: ${error.suggestion}`
        }];
      }

      diagnosticsByFile.get(file).push(diagnostic);
    });

    return diagnosticsByFile;
  }

  /**
   * Create LSP-style diagnostics that Cursor can understand
   */
  async createLSPDiagnostics(diagnosticsByFile) {
    const lspFormat = {};

    for (const [file, diagnostics] of diagnosticsByFile) {
      lspFormat[this.getFileUri(file)] = diagnostics;
    }

    const lspData = {
      method: 'textDocument/publishDiagnostics',
      params: lspFormat,
      timestamp: new Date().toISOString(),
      version: 1
    };

    const lspPath = path.join(this.options.projectRoot, '.cursor', 'diagnostics.json');
    await this.ensureDirectory(path.dirname(lspPath));
    await fs.promises.writeFile(lspPath, JSON.stringify(lspData, null, 2));
  }

  /**
   * Create extension-friendly format
   */
  async createExtensionFormat(diagnosticsByFile) {
    const extensionFormat = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'compilation-error-feeder',
      diagnostics: {},
      summary: {
        totalFiles: diagnosticsByFile.size,
        totalErrors: 0,
        totalWarnings: 0
      }
    };

    for (const [file, diagnostics] of diagnosticsByFile) {
      const relativeFile = path.relative(this.options.projectRoot, file);
      extensionFormat.diagnostics[relativeFile] = diagnostics;
      
      // Update summary
      diagnostics.forEach(d => {
        if (d.severity === 1) {
          extensionFormat.summary.totalErrors++;
        } else if (d.severity === 2) {
          extensionFormat.summary.totalWarnings++;
        }
      });
    }

    const extPath = path.join(this.options.projectRoot, this.options.diagnosticsFile);
    await fs.promises.writeFile(extPath, JSON.stringify(extensionFormat, null, 2));
  }

  /**
   * Create standard diagnostics file
   */
  async createDiagnosticsFile(diagnosticsByFile) {
    const diagnosticsData = {
      timestamp: new Date().toISOString(),
      files: {}
    };

    for (const [file, diagnostics] of diagnosticsByFile) {
      const relativeFile = path.relative(this.options.projectRoot, file);
      diagnosticsData.files[relativeFile] = diagnostics;
    }

    const filePath = path.join(this.options.projectRoot, this.options.diagnosticsFile);
    await fs.promises.writeFile(filePath, JSON.stringify(diagnosticsData, null, 2));
  }

  /**
   * Create VS Code compatible problems file
   */
  async createProblemsFile(diagnosticsByFile) {
    const problems = [];

    for (const [file, diagnostics] of diagnosticsByFile) {
      const relativeFile = path.relative(this.options.projectRoot, file);
      
      diagnostics.forEach(diagnostic => {
        problems.push({
          resource: relativeFile,
          owner: diagnostic.source,
          code: diagnostic.code,
          severity: diagnostic.severity,
          message: diagnostic.message,
          startLineNumber: diagnostic.range.start.line + 1,
          startColumn: diagnostic.range.start.character + 1,
          endLineNumber: diagnostic.range.end.line + 1,
          endColumn: diagnostic.range.end.character + 1
        });
      });
    }

    const problemsData = {
      version: '0.1.0',
      problems: problems
    };

    const problemsPath = path.join(this.options.projectRoot, this.options.problemsFile);
    await this.ensureDirectory(path.dirname(problemsPath));
    await fs.promises.writeFile(problemsPath, JSON.stringify(problemsData, null, 2));
  }

  /**
   * Clear all diagnostics
   */
  async clearDiagnostics() {
    const files = [
      path.join(this.options.projectRoot, '.cursor', 'diagnostics.json'),
      path.join(this.options.projectRoot, this.options.diagnosticsFile),
      path.join(this.options.projectRoot, this.options.problemsFile)
    ];

    const results = {};
    
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          await fs.promises.unlink(file);
          results[path.basename(file)] = 'cleared';
        } else {
          results[path.basename(file)] = 'not_found';
        }
      } catch (error) {
        results[path.basename(file)] = `error: ${error.message}`;
      }
    }

    return results;
  }

  /**
   * Start a simple HTTP server for real-time diagnostics
   */
  startDiagnosticsServer() {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/diagnostics' && req.method === 'GET') {
        const diagnosticsPath = path.join(this.options.projectRoot, this.options.diagnosticsFile);
        
        if (fs.existsSync(diagnosticsPath)) {
          const data = fs.readFileSync(diagnosticsPath, 'utf-8');
          res.writeHead(200);
          res.end(data);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'No diagnostics found' }));
        }
      } else if (req.url === '/clear' && req.method === 'POST') {
        this.clearDiagnostics().then(results => {
          res.writeHead(200);
          res.end(JSON.stringify(results));
        }).catch(error => {
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        });
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    server.listen(this.options.port, () => {
      console.log(`Diagnostics server running on http://localhost:${this.options.port}`);
    });

    return server;
  }

  /**
   * Utility methods
   */
  mapSeverity(severity) {
    switch (severity?.toLowerCase()) {
      case 'error': return 1;
      case 'warning': return 2;
      case 'info': return 3;
      case 'hint': return 4;
      default: return 1; // Default to error
    }
  }

  getTags(error) {
    const tags = [];
    
    if (error.deprecated) tags.push(1); // Deprecated
    if (error.unnecessary) tags.push(2); // Unnecessary
    
    return tags;
  }

  normalizeFilePath(filePath) {
    if (!filePath || filePath === 'unknown') {
      return path.join(this.options.projectRoot, 'unknown-file.txt');
    }
    
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    
    return path.resolve(this.options.projectRoot, filePath);
  }

  getFileUri(filePath) {
    return `file://${filePath}`;
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Create a Cursor extension configuration
   */
  async createCursorExtensionConfig() {
    const config = {
      "name": "AeroSuite Error Feeder",
      "version": "1.0.0",
      "description": "Real-time compilation error display for AeroSuite",
      "activationEvents": [
        "onLanguage:typescript",
        "onLanguage:javascript",
        "workspaceContains:**/.cursor-diagnostics.json"
      ],
      "contributes": {
        "commands": [
          {
            "command": "aerosuite.showErrors",
            "title": "Show Compilation Errors",
            "category": "AeroSuite"
          },
          {
            "command": "aerosuite.clearErrors",
            "title": "Clear Compilation Errors",
            "category": "AeroSuite"
          }
        ],
        "keybindings": [
          {
            "command": "aerosuite.showErrors",
            "key": "ctrl+shift+e",
            "mac": "cmd+shift+e"
          }
        ]
      },
      "scripts": {
        "watch": "node ../scripts/compilation-error-feeder.js --watch",
        "check": "node ../scripts/compilation-error-feeder.js"
      }
    };

    const configPath = path.join(this.options.projectRoot, '.cursor', 'extension.json');
    await this.ensureDirectory(path.dirname(configPath));
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    
    return configPath;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    projectRoot: process.cwd(),
    enableLSP: !args.includes('--no-lsp'),
    enableExtension: !args.includes('--no-extension')
  };

  const integration = new CursorIntegration(options);

  if (args.includes('--server')) {
    integration.startDiagnosticsServer();
  } else if (args.includes('--clear')) {
    integration.clearDiagnostics().then(results => {
      console.log('Clear results:', results);
    }).catch(console.error);
  } else if (args.includes('--config')) {
    integration.createCursorExtensionConfig().then(configPath => {
      console.log('Extension config created:', configPath);
    }).catch(console.error);
  } else {
    console.log('Cursor Integration module loaded');
    console.log('Use --server to start diagnostics server');
    console.log('Use --clear to clear diagnostics');
    console.log('Use --config to create extension config');
  }
}

module.exports = CursorIntegration;
