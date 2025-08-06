# AeroSuite Task-Code Automapper

The Task-Code Automapper is a powerful tool that automatically creates and maintains the
relationship between code files and tasks in your project.

## What It Does

The automapper:

1. __Scans your entire codebase__ for code files (JS, TS, Python, etc.)
2. __Finds existing task references__ in comments within those files
3. __Maps code files to existing tasks__ in task.md
4. __Creates new tasks__ for files that don't match any existing tasks
5. __Updates task.md__ with an indented structure showing all files under each task
6. __Calculates lines of code__ for each file and task

## Benefits

- __Comprehensive Traceability__: Every code file is linked to a task
- __Automatic Organization__: Files are grouped logically by directory/purpose
- __Task Creation__: Missing tasks are created automatically
- __Visual Structure__: Indented format shows which files implement each task
- __Code Metrics__: Lines of code are calculated for each file and task

## Usage

Run the automapper with:

```bash
npm run task:automap
```bash

Or directly:

```bash
node scripts/task-management/task-code-automapper.js
```bash

## How It Works

1. __Backup__: The script first backs up your current task.md file to task.md.bak
2. __Parsing__: It parses your existing task.md file to extract tasks
3. __Scanning__: It scans your codebase for all code files
4. __Task Extraction__: It looks for task references in comments within files
5. __Mapping__: It maps files to existing tasks where possible
6. __Task Creation__: It creates new tasks for unmapped files, grouping them by directory
7. __Update__: It updates task.md with all tasks and their associated files

## Task Creation Logic

When creating new tasks, the automapper:

1. Groups unmapped files by directory
2. Chooses an appropriate task prefix based on the directory:
   - `TS` for general system components
   - `SEC` for security/auth-related files
   - `AI` for AI/ML-related files
   - `PERF` for performance-related files
   - `DEV` for developer tooling
3. Generates a descriptive task title based on the directory name
4. Creates a new task ID using the next available number for that prefix
5. Sets default status and priority
6. Calculates total lines of code

## Task File Format

The updated task.md will include indented file references under each task:

```bash
| TS123 | User Authentication Component | ✅ Completed | 🔴 High | - | 450 |
|        | &nbsp;&nbsp;&nbsp;&nbsp;↳ `client/src/components/auth/LoginForm.jsx` | | | | 120 |
|        | &nbsp;&nbsp;&nbsp;&nbsp;↳ `client/src/components/auth/AuthProvider.jsx` | | | | 330 |
```bash

## Customization

You can customize the automapper by editing the configuration variables at the top of the script:

- `CODE_FILE_EXTENSIONS`: File types to include
- `IGNORE_DIRS`: Directories to exclude
- `DEFAULT_STATUS`: Default status for new tasks
- `DEFAULT_PRIORITY`: Default priority for new tasks
- `taskCounters`: Starting ID numbers for new tasks

## Best Practices

1. __Run periodically__: Run the automapper regularly to keep task.md in sync with your code
2. __Review new tasks__: Review auto-created tasks and adjust titles/priorities as needed
3. __Keep backups__: The script creates backups, but consider version controlling task.md
4. __Add task references__: When creating new files, add task references in comments

## Integration with Other Tools

The automapper works with other task traceability tools:

- __Task Traceability Analyzer__: Run this after automapper to get coverage statistics
- __Task Reference Adder__: Use this to manually add task references to specific files
- __Git Hooks__: Enforce task references in new and modified files
