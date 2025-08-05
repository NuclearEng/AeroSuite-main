# AeroSuite Task-Code Automapper

The Task-Code Automapper is a powerful tool that automatically creates and maintains the relationship between code files and tasks in your project.

## What It Does

The automapper:

1. **Scans your entire codebase** for code files (JS, TS, Python, etc.)
2. **Finds existing task references** in comments within those files
3. **Maps code files to existing tasks** in task.md
4. **Creates new tasks** for files that don't match any existing tasks
5. **Updates task.md** with an indented structure showing all files under each task
6. **Calculates lines of code** for each file and task

## Benefits

- **Comprehensive Traceability**: Every code file is linked to a task
- **Automatic Organization**: Files are grouped logically by directory/purpose
- **Task Creation**: Missing tasks are created automatically
- **Visual Structure**: Indented format shows which files implement each task
- **Code Metrics**: Lines of code are calculated for each file and task

## Usage

Run the automapper with:

```bash
npm run task:automap
```

Or directly:

```bash
node scripts/task-management/task-code-automapper.js
```

## How It Works

1. **Backup**: The script first backs up your current task.md file to task.md.bak
2. **Parsing**: It parses your existing task.md file to extract tasks
3. **Scanning**: It scans your codebase for all code files
4. **Task Extraction**: It looks for task references in comments within files
5. **Mapping**: It maps files to existing tasks where possible
6. **Task Creation**: It creates new tasks for unmapped files, grouping them by directory
7. **Update**: It updates task.md with all tasks and their associated files

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

```
| TS123 | User Authentication Component | ✅ Completed | 🔴 High | - | 450 |
|        | &nbsp;&nbsp;&nbsp;&nbsp;↳ `client/src/components/auth/LoginForm.jsx` | | | | 120 |
|        | &nbsp;&nbsp;&nbsp;&nbsp;↳ `client/src/components/auth/AuthProvider.jsx` | | | | 330 |
```

## Customization

You can customize the automapper by editing the configuration variables at the top of the script:

- `CODE_FILE_EXTENSIONS`: File types to include
- `IGNORE_DIRS`: Directories to exclude
- `DEFAULT_STATUS`: Default status for new tasks
- `DEFAULT_PRIORITY`: Default priority for new tasks
- `taskCounters`: Starting ID numbers for new tasks

## Best Practices

1. **Run periodically**: Run the automapper regularly to keep task.md in sync with your code
2. **Review new tasks**: Review auto-created tasks and adjust titles/priorities as needed
3. **Keep backups**: The script creates backups, but consider version controlling task.md
4. **Add task references**: When creating new files, add task references in comments

## Integration with Other Tools

The automapper works with other task traceability tools:

- **Task Traceability Analyzer**: Run this after automapper to get coverage statistics
- **Task Reference Adder**: Use this to manually add task references to specific files
- **Git Hooks**: Enforce task references in new and modified files 
