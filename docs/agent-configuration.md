# Cursor Agent Configuration for AeroSuite

This document outlines the Agent configuration and usage for the AeroSuite application, based on
the [Cursor Agent Overview](https://docs.cursor.com/en/agent/overview).

## 🎯 __Agent Features Configured__

### __1. Auto-Run Commands__
The Agent is configured to automatically run trusted commands without confirmation:
- `npm run lint` - Code linting
- `npm run type-check` - TypeScript checking
- `npm test` - Running tests
- `npx cypress run --spec` - E2E testing
- `docker-compose logs` - Container logs
- Git commands (`status`, `add`, `commit`)

### __2. Terminal Integration__
- __Auto-confirm__: Disabled for safety
- __Show output__: Enabled for visibility
- __Working directory__: Set to project root
- __Multi-step processes__: Supported

### __3. Modes Available__
- __Agent Mode__: Full autonomous coding with all tools
- __Ask Mode__: Question-answer focused
- __Manual Mode__: Manual control with confirmation
- __Custom Mode__: AeroSuite-specific development workflow

### __4. Tools Enabled__
- __Codebase Search__: Semantic search across files
- __File Search__: Fuzzy file finding
- __Grep Search__: Pattern-based search
- __Read/Edit Files__: Direct file manipulation
- __Terminal Commands__: Shell execution
- __Directory Operations__: File system management

### __5. Checkpoints__
- __Auto-create__: Enabled for automatic snapshots
- __Max checkpoints__: 10 saved states
- __Restore capability__: Rollback to previous states

### __6. Chat Features__
- __Multiple tabs__: Up to 5 concurrent conversations
- __Export format__: Markdown for documentation
- __History retention__: 30 days of chat history

## 🚀 __Custom Workflow Script__

### __Usage__
```bash
# Start development environment
./scripts/agent-workflow.sh start-dev

# Run all tests
./scripts/agent-workflow.sh test

# Check code quality
./scripts/agent-workflow.sh quality

# Debug backend issues
./scripts/agent-workflow.sh debug

# Check backend health
./scripts/agent-workflow.sh health

# Deploy to production
./scripts/agent-workflow.sh deploy
```bash

### __Keyboard Shortcuts__
- `Ctrl+Shift+A`: Start development environment
- `Ctrl+Shift+T`: Run all tests
- `Ctrl+Shift+Q`: Check code quality
- `Ctrl+Shift+D`: Debug backend issues
- `Ctrl+Shift+H`: Check backend health
- `Ctrl+Shift+P`: Deploy to production
- `Ctrl+Shift+C`: Open Agent chat
- `Ctrl+Shift+R`: Show active rules

## 📋 __Agent Rules Integration__

### __Auto-Applied Rules__
- __Frontend Standards__: React/Material-UI patterns
- __Backend Standards__: Express.js/MongoDB patterns
- __Testing Standards__: Cypress/Jest patterns
- __Docker Standards__: Containerization best practices
- __API Validation__: Input validation and security
- __Development Workflow__: Common tasks and debugging

### __Context-Aware Application__
- Rules automatically apply based on file types
- Manual invocation with `@ruleName`
- Visible active rules in sidebar

## 🔧 __Configuration Files__

### __Settings__ (`.cursor/settings.json`)
```json
{
  "agent": {
    "autoRun": {
      "enabled": true,
      "trustedCommands": [...]
    },
    "terminal": {
      "autoConfirm": false,
      "showOutput": true
    },
    "checkpoints": {
      "enabled": true,
      "autoCreate": true
    }
  }
}
```bash

### __Custom Mode__ (`.cursor/modes/aerosuite-dev.mdc`)
- Full-stack development focus
- Docker and deployment workflows
- Testing and quality assurance
- Security and performance optimization

## 🎯 __Best Practices__

### __For Development__
1. __Use Agent Mode__ for complex coding tasks
2. __Leverage Auto-Run__ for trusted commands
3. __Create Checkpoints__ before major changes
4. __Use Multiple Chat Tabs__ for different tasks
5. __Apply Rules__ for consistent code quality

### __For Debugging__
1. __Use Debug Workflow__ for backend issues
2. __Check Health Endpoints__ regularly
3. __Review Docker Logs__ for container issues
4. __Run Tests__ before committing changes
5. __Use Checkpoints__ for safe experimentation

### __For Deployment__
1. __Run Quality Checks__ before deployment
2. __Test All Components__ thoroughly
3. __Use Production Scripts__ for deployment
4. __Monitor Health__ after deployment
5. __Document Changes__ in chat history

## 📊 __Monitoring and Logs__

### __Agent Activity__
- Chat history preserved for 30 days
- Checkpoints saved for rollback
- Terminal output logged
- File changes tracked

### __Application Health__
- Backend health monitoring
- Docker container status
- Test results tracking
- Performance metrics

## 🔒 __Security Considerations__

### __Trusted Commands__
Only safe, read-only, and development commands are auto-approved:
- Code quality checks
- Testing commands
- Git operations
- Docker logs

### __Manual Confirmation__
- File deletions require confirmation
- Production deployments need approval
- Large code changes are reviewed
- Security-sensitive operations are protected

## 📚 __Resources__

- [Cursor Agent Overview](https://docs.cursor.com/en/agent/overview)
- [Agent Rules Documentation](https://docs.cursor.com/en/context/rules)
- [Terminal Integration Guide](https://docs.cursor.com/en/agent/terminal)
- [Checkpoints and Rollback](https://docs.cursor.com/en/agent/checkpoints)

---

This configuration optimizes the Agent for AeroSuite's full-stack development workflow while
maintaining security and code quality standards.
