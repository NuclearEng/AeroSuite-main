# AeroSuite Task Recommender

The Task Recommender is an interactive tool that helps generate new tasks based on
feature/improvement ideas. It analyzes your input and creates appropriately structured tasks with
subtasks in the task.md file.

## What It Does

The task recommender:

1. __Takes user input__ about desired features or improvements
2. __Analyzes the complexity__ of the proposed feature
3. __Generates appropriate tasks__ with proper IDs, titles, and priorities
4. __Creates logical subtasks__ based on the feature requirements
5. __Updates task.md__ with the new tasks in the correct categories

## Benefits

- __Structured Task Creation__: Ensures new features are broken down into manageable tasks
- __Consistent Task Structure__: Maintains consistent task IDs and formatting
- __Smart Prioritization__: Automatically assigns priorities based on feature complexity
- __Feature Decomposition__: Identifies subtasks appropriate for the feature type
- __Time-Saving__: Automates the tedious process of manually creating multiple related tasks

## Usage

Run the task recommender with:

```bash
npm run task:recommend
```bash

The tool will:

1. Prompt you to select a task category (Core System, Security, AI/ML, etc.)
2. Ask you a question related to that category to help generate ideas
3. Take your feature/improvement description as input
4. Analyze the complexity of your request
5. Generate appropriate tasks and subtasks
6. Add them to task.md in the correct section

## Example

```bash
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
Enter your feature/improvement idea: Add a data export feature that allows users to download their
data in CSV and JSON formats

🧠 Analyzing codebase and generating task recommendations...
Feature complexity: Medium (3 tasks recommended)

✅ Task recommendations added to task.md:
- TS572: Add a data export feature that allows users to download their data in CSV and JSON formats
(🟠 Medium)
- TS573: Add a data export feature that allows users to download their data in CSV and JSON formats
- API implementation (🟠 Medium)
- TS574: Add a data export feature that allows users to download their data in CSV and JSON formats
- UI component implementation (🔵 Low)

Backup saved to: /path/to/task.md.bak
```bash

## How It Works

### Complexity Analysis

The tool analyzes the complexity of your feature request by:

- Counting words in the description
- Looking for complexity keywords like "advanced", "integrated", etc.
- Checking for security-related terms
- Evaluating the technical scope

### Task Generation

Based on the complexity, the tool:

- For __Low__ complexity: Creates a single task
- For __Medium__ complexity: Creates a main task with 2 subtasks
- For __High__ complexity: Creates a main task with 4 subtasks

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

1. __Be Specific__: The more detailed your feature description, the better the tasks
2. __Use Technical Terms__: Include relevant technical terms to help generate appropriate subtasks
3. __Mention Impact__: Include terms like "critical" or "performance" to indicate priority
4. __Review Generated Tasks__: Always review and adjust the generated tasks as needed
5. __Run the Automapper__: After adding new tasks, run `npm run task:automap` to connect them to
code

## Integration with Other Tools

The task recommender works well with other AeroSuite task tools:

- __Task-Code Automapper__: Connects the new tasks to relevant code
- __Task Traceability Analyzer__: Verifies coverage of the new tasks
- __Task Reference Adder__: Helps add references to the new tasks in code
