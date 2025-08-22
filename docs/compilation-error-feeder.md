# Compilation Error Feeder

A comprehensive tool for capturing compilation errors and feeding them back to Cursor IDE or displaying them in a formatted terminal output. This tool provides real-time error monitoring for TypeScript, ESLint, and build errors.

## Features

- **Real-time Error Detection**: Monitors TypeScript, ESLint, and build errors
- **Cursor IDE Integration**: Feeds errors directly to Cursor's diagnostic system
- **Terminal Display**: Beautiful, color-coded error display in the terminal
- **Watch Mode**: Continuous file monitoring with debounced error checking
- **Multiple Output Formats**: JSON files, LSP diagnostics, VS Code problems format
- **Error Suggestions**: Contextual suggestions for common error types
- **Extensible**: Easy to add new error sources and formatters

## Installation

The scripts are already included in your AeroSuite project. Make sure you have the required dependencies:

```bash
# Install chokidar for file watching (if not already installed)
npm install chokidar --save-dev
```

## Quick Start

### Basic Usage

```bash
# Run a single error check
./scripts/error-feeder.sh

# Start watch mode for continuous monitoring
./scripts/error-feeder.sh watch

# Include build errors in checks
./scripts/error-feeder.sh build-check
```

### Advanced Usage

```bash
# Use the Node.js script directly
node scripts/compilation-error-feeder.js

# Watch mode with all features
node scripts/compilation-error-feeder.js --watch --build --file

# TypeScript only check
node scripts/compilation-error-feeder.js --no-eslint

# Save errors to custom file
node scripts/compilation-error-feeder.js --file --output-file ./my-errors.json
```

## Command Line Options

### Shell Script (`error-feeder.sh`)

```bash
./scripts/error-feeder.sh [COMMAND] [OPTIONS]

Commands:
  check          Run a single error check (default)
  watch          Start watch mode for continuous monitoring
  build-check    Include build errors in checks
  help           Show help message

Options:
  --typescript   Check TypeScript errors (default: enabled)
  --eslint       Check ESLint errors (default: enabled)
  --build        Include build errors
  --no-typescript Disable TypeScript checking
  --no-eslint    Disable ESLint checking
  --no-cursor    Disable Cursor integration
  --file         Save errors to file
  --output-file  Specify output file path
  --verbose      Verbose output
  --no-colors    Disable colored output
```

### Node.js Script

```bash
node scripts/compilation-error-feeder.js [OPTIONS]

Options:
  --watch, -w           Enable watch mode
  --build, -b           Include build errors
  --no-typescript       Disable TypeScript checking
  --no-eslint           Disable ESLint checking
  --no-cursor           Disable Cursor integration
  --file, -f            Save errors to file
  --output-file FILE    Specify output file path
  --verbose, -v         Verbose output
  --no-colors           Disable colored output
```

## Integration with Cursor IDE

The tool automatically integrates with Cursor IDE through multiple mechanisms:

### 1. LSP Diagnostics
Creates `.cursor/diagnostics.json` with LSP-compatible error format that Cursor can automatically detect.

### 2. Extension Format
Generates `.cursor-diagnostics.json` for custom Cursor extensions.

### 3. VS Code Problems
Creates `.vscode/problems.json` for VS Code compatibility.

### Manual Integration

To manually set up Cursor integration:

```bash
# Create Cursor extension config
node scripts/cursor-integration.js --config

# Start diagnostics server (optional)
node scripts/cursor-integration.js --server
```

## Watch Mode

Watch mode provides real-time error detection with intelligent debouncing:

```bash
# Start watch mode
./scripts/error-feeder.sh watch

# Or with Node.js
node scripts/compilation-error-feeder.js --watch
```

Features:
- Monitors `client/src`, `server/src`, and `src` directories
- Debounced error checking (1-second delay after file changes)
- Graceful shutdown with Ctrl+C
- Continuous error reporting

## Error Types Supported

### TypeScript Errors
- Compilation errors (`tsc --noEmit`)
- Type mismatches
- Missing imports
- Interface implementation errors

### ESLint Errors
- Code style violations
- Unused variables
- Import/export issues
- Custom rule violations

### Build Errors
- React build failures
- Webpack compilation errors
- General build process errors

## Output Formats

### Terminal Display
- Color-coded severity levels
- Grouped by file
- Error suggestions and quick fixes
- Summary statistics

### JSON Output
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "totalErrors": 5,
  "errors": [
    {
      "type": "typescript",
      "source": "client",
      "file": "/path/to/file.ts",
      "line": 10,
      "column": 5,
      "severity": "error",
      "code": "TS2304",
      "message": "Cannot find name 'NonExistentType'."
    }
  ],
  "summary": {
    "byType": { "typescript": 3, "eslint": 2 },
    "byFile": { "file1.ts": 2, "file2.js": 3 },
    "bySeverity": { "error": 4, "warning": 1 }
  }
}
```

### Cursor Diagnostics Format
```json
{
  "method": "textDocument/publishDiagnostics",
  "params": {
    "file:///path/to/file.ts": [
      {
        "range": {
          "start": { "line": 9, "character": 4 },
          "end": { "line": 9, "character": 14 }
        },
        "severity": 1,
        "code": "TS2304",
        "source": "typescript",
        "message": "Cannot find name 'NonExistentType'."
      }
    ]
  }
}
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
node scripts/test-error-feeder.js

# Run tests with verbose output
node scripts/test-error-feeder.js --verbose

# Run tests without file cleanup
node scripts/test-error-feeder.js --no-cleanup
```

Test coverage includes:
- TypeScript error detection
- ESLint error detection
- Cursor integration
- Watch mode functionality
- Error formatting

## Configuration

### Project Structure
The tool automatically detects your project structure:
- `client/` - React/TypeScript frontend
- `server/` - Node.js backend
- `src/` - Source files in project root

### Custom Configuration
Create a `.error-feeder.json` file in your project root:

```json
{
  "checkTypeScript": true,
  "checkESLint": true,
  "checkBuild": false,
  "outputToCursor": true,
  "showSuggestions": true,
  "watchMode": {
    "debounceDelay": 1000,
    "ignored": ["node_modules", ".git", "build", "dist"]
  }
}
```

## Integration with Package Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "error-check": "node scripts/compilation-error-feeder.js",
    "error-watch": "node scripts/compilation-error-feeder.js --watch",
    "error-build": "node scripts/compilation-error-feeder.js --build",
    "error-test": "node scripts/test-error-feeder.js"
  }
}
```

## Troubleshooting

### Common Issues

1. **"chokidar not found" error**
   ```bash
   npm install chokidar --save-dev
   ```

2. **No TypeScript errors detected**
   - Ensure `tsconfig.json` exists in client/ or project root
   - Check TypeScript is installed: `npx tsc --version`

3. **No ESLint errors detected**
   - Ensure ESLint is configured in the project
   - Check ESLint config exists: `.eslintrc.js` or `eslint.config.js`

4. **Cursor integration not working**
   - Restart Cursor after first run
   - Check `.cursor-diagnostics.json` is created
   - Try manual config: `node scripts/cursor-integration.js --config`

### Debug Mode

Enable verbose logging:

```bash
./scripts/error-feeder.sh watch --verbose
```

### File Permissions

Make scripts executable:

```bash
chmod +x scripts/*.sh scripts/*.js
```

## API Reference

### CompilationErrorFeeder Class

```javascript
const CompilationErrorFeeder = require('./scripts/compilation-error-feeder');

const feeder = new CompilationErrorFeeder({
  projectRoot: '/path/to/project',
  checkTypeScript: true,
  checkESLint: true,
  outputToCursor: true,
  watchMode: false
});

// Run single check
const results = await feeder.run();

// Start watch mode
await feeder.startWatchMode();
```

### CursorIntegration Class

```javascript
const CursorIntegration = require('./scripts/cursor-integration');

const integration = new CursorIntegration({
  projectRoot: '/path/to/project'
});

// Send errors to Cursor
await integration.sendErrors(errors);

// Clear diagnostics
await integration.clearDiagnostics();
```

## Contributing

1. Add new error sources in `CompilationErrorFeeder.performChecks()`
2. Extend error formatting in `CursorIntegration.formatErrors()`
3. Add tests in `test-error-feeder.js`
4. Update documentation

## License

Part of the AeroSuite project. See main project license.
