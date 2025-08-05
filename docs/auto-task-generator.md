# AeroSuite Auto Task Generator

The Auto Task Generator automatically creates high-quality tasks for AeroSuite based on DOD security requirements, state-of-the-art technology trends, and reward-driven UX principles. It provides a curated set of enterprise-grade features to enhance your project.

## What It Does

The auto task generator:

1. **Generates Enterprise-Grade Tasks** aligned with DOD security requirements
2. **Creates State-of-the-Art Technology Tasks** reflecting cutting-edge trends
3. **Adds Reward-Driven UX Tasks** leveraging behavioral psychology principles
4. **Integrates with Existing Task System** for seamless project management
5. **Provides Detailed Subtasks** for comprehensive implementation guidance

## Benefits

- **Security Compliance**: Automatically generates tasks that meet DOD security requirements
- **Technology Innovation**: Ensures your project leverages cutting-edge technologies
- **Enhanced User Experience**: Incorporates proven psychological reward mechanisms
- **Consistent Task Structure**: Maintains proper task hierarchy and relationships
- **Implementation Guidance**: Provides detailed subtasks with clear dependencies

## Usage

Run the auto task generator with:

```bash
npm run task:auto-generate
```

Or choose specific categories:

```bash
# Generate security-focused tasks
npm run task:generate-security

# Generate state-of-the-art technology tasks
npm run task:generate-tech

# Generate reward-driven UX tasks
npm run task:generate-ux

# Generate tasks from all categories
npm run task:generate-all
```

## Command Line Options

The auto task generator supports these options:

- `--security` or `-s`: Include DOD security requirement tasks
- `--tech` or `-t`: Include state-of-the-art technology tasks
- `--ux` or `-u`: Include reward-driven UX tasks
- `--all` or `-a`: Include tasks from all categories (default)
- `--count` or `-c`: Number of tasks to generate (default: 3)
- `--automap`: Run task automapper after generating tasks

Example:
```bash
node scripts/task-management/auto-task-generator.js --security --tech --count 5
```

## Feature Categories

### DOD Security Requirements

Tasks in this category ensure compliance with Department of Defense security standards, including:

- Zero Trust Architecture
- FIPS 140-3 Cryptographic Validation
- RMF ATO Documentation
- STIG Compliance Automation
- Continuous Monitoring

### State-of-the-Art Technology

Tasks in this category implement cutting-edge technology capabilities:

- Edge Computing Architecture
- Quantum-Resistant Cryptography
- AI-Driven Predictive Analytics
- Event-Driven Microservices
- Digital Twin Simulation

### Reward-Driven UX Principles

Tasks in this category enhance user engagement through behavioral psychology:

- Progressive Achievement Systems
- Cognitive Load Optimization
- Personalized User Journeys
- Micro-Feedback Animations
- Gamified Task Completion

## How It Works

1. The generator selects features based on your specified categories
2. For each feature, it creates a main task with appropriate complexity
3. It generates detailed subtasks based on feature requirements
4. All tasks are added to your task.md file in the correct categories
5. If requested, it runs the task automapper to connect tasks to code

## Integration with Other Tools

The auto task generator integrates with other AeroSuite task tools:

- **Task Recommender**: Uses the recommender engine for task creation
- **Task-Code Automapper**: Can automatically connect generated tasks to code
- **Task Traceability Analyzer**: Maintains traceability for generated tasks

## Best Practices

1. **Generate Security Tasks First**: Start with security requirements as a foundation
2. **Add Technology Tasks**: Add cutting-edge technology capabilities next
3. **Enhance with UX Tasks**: Layer in user experience enhancements
4. **Run Automapper**: Always run the automapper to maintain code traceability
5. **Review Generated Tasks**: Verify and adjust tasks to fit your specific project needs

## Adding Custom Feature Sets

You can extend the auto task generator with your own feature sets by adding to the feature arrays in the script:

```javascript
// Custom feature example
const CUSTOM_FEATURES = [
  {
    title: "Your Feature Name",
    description: "Detailed description of the feature",
    complexity: "Medium", // Low, Medium, or High
    category: "Core System", // Must match a category in task.md
    subtasks: [
      "Subtask 1",
      "Subtask 2",
      "Subtask 3"
    ]
  }
];
``` 
