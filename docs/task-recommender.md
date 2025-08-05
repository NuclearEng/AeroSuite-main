# AeroSuite Task Recommender

The Task Recommender is an interactive tool that helps generate new tasks based on feature/improvement ideas. It analyzes your input and creates appropriately structured tasks with subtasks in the task.md file.

## What It Does

The task recommender:

1. **Takes user input** about desired features or improvements
2. **Analyzes the complexity** of the proposed feature
3. **Generates appropriate tasks** with proper IDs, titles, and priorities
4. **Creates logical subtasks** based on the feature requirements
5. **Updates task.md** with the new tasks in the correct categories

## Benefits

- **Structured Task Creation**: Ensures new features are broken down into manageable tasks
- **Consistent Task Structure**: Maintains consistent task IDs and formatting
- **Smart Prioritization**: Automatically assigns priorities based on feature complexity
- **Feature Decomposition**: Identifies subtasks appropriate for the feature type
- **Time-Saving**: Automates the tedious process of manually creating multiple related tasks

## Usage

Run the task recommender with:

```bash
npm run task:recommend
```

The tool will:

1. Prompt you to select a task category (Core System, Security, AI/ML, etc.)
2. Ask you a question related to that category to help generate ideas
3. Take your feature/improvement description as input
4. Analyze the complexity of your request
5. Generate appropriate tasks and subtasks
6. Add them to task.md in the correct section

## Example

```
$ npm run task:recommend

🔍 Starting Task Recommender...
Backed up task.md to /path/to/task.md.bak
Updated task counters based on existing tasks: { TS: 572, SEC: 54, AI: 54, PERF: 54, DEV: 54 }

Select a task category:
1. Core System
2. Security & Compliance
3. AI/ML Integration
4. Performance & Scalability
5. Developer Experience
Enter category number: 1

What data management features would benefit the system?
Enter your feature/improvement idea: Add a data export feature that allows users to download their data in CSV and JSON formats

🧠 Analyzing codebase and generating task recommendations...
Feature complexity: Medium (3 tasks recommended)

✅ Task recommendations added to task.md:
- TS572: Add a data export feature that allows users to download their data in CSV and JSON formats (🟠 Medium)
- TS573: Add a data export feature that allows users to download their data in CSV and JSON formats - API implementation (🟠 Medium)
- TS574: Add a data export feature that allows users to download their data in CSV and JSON formats - UI component implementation (🔵 Low)

Backup saved to: /path/to/task.md.bak
```

## How It Works

### Complexity Analysis

The tool analyzes the complexity of your feature request by:

- Counting words in the description
- Looking for complexity keywords like "advanced", "integrated", etc.
- Checking for security-related terms
- Evaluating the technical scope

### Task Generation

Based on the complexity, the tool:

- For **Low** complexity: Creates a single task
- For **Medium** complexity: Creates a main task with 2 subtasks
- For **High** complexity: Creates a main task with 4 subtasks

### Subtask Selection

The tool intelligently selects subtasks based on keywords in your description:

- UI-related terms trigger UI design and implementation tasks
- API-related terms trigger API design and implementation tasks
- Database-related terms trigger data model and migration tasks
- Authentication-related terms trigger auth mechanism tasks
- Performance-related terms trigger optimization tasks

### Task Priority

Priorities are assigned based on:

- Complexity assessment
- Presence of priority keywords like "critical", "urgent", etc.
- Task relationships (subtasks typically get lower priority than their parent)

## Best Practices

1. **Be Specific**: The more detailed your feature description, the better the tasks
2. **Use Technical Terms**: Include relevant technical terms to help generate appropriate subtasks
3. **Mention Impact**: Include terms like "critical" or "performance" to indicate priority
4. **Review Generated Tasks**: Always review and adjust the generated tasks as needed
5. **Run the Automapper**: After adding new tasks, run `npm run task:automap` to connect them to code

## Integration with Other Tools

The task recommender works well with other AeroSuite task tools:

- **Task-Code Automapper**: Connects the new tasks to relevant code
- **Task Traceability Analyzer**: Verifies coverage of the new tasks
- **Task Reference Adder**: Helps add references to the new tasks in code 
