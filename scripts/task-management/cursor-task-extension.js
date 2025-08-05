/**
 * AeroSuite Task Traceability Cursor Extension
 * 
 * This extension adds task traceability features to Cursor:
 * - Task reference decoration in the editor
 * - Command to insert task references
 * - Quick task lookup
 * - Task status indicators
 * 
 * To use this extension, add it to your Cursor extensions folder.
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// Configuration
let config = {
  taskFilePath: 'task.md',
  taskIdPattern: '(TS|SEC|AI|PERF|DEV)[0-9]{3}',
  commentFormats: {
    javascript: '// Task: {taskId} - {taskTitle}',
    typescript: '// Task: {taskId} - {taskTitle}',
    python: '# Task: {taskId} - {taskTitle}',
    html: '<!-- Task: {taskId} - {taskTitle} -->'
    // Additional languages will be loaded from .cursor.json
  },
  decorationStyle: {
    backgroundColor: 'rgba(65, 105, 225, 0.1)',
    border: '1px solid rgba(65, 105, 225, 0.3)',
    borderRadius: '3px'
  }
};

// Task decoration type
let taskDecorationType;

// Cache for tasks
let tasksCache = null;
let lastTaskFileModified = 0;

// Activate the extension
function activate(context) {
  console.log('AeroSuite Task Traceability Extension is now active');
  
  // Load configuration from .cursor.json if available
  loadConfiguration();
  
  // Create task decoration type
  taskDecorationType = vscode.window.createTextEditorDecorationType(config.decorationStyle);
  
  // Register commands
  const insertTaskReferenceCommand = vscode.commands.registerCommand(
    'aerosuite.insertTaskReference',
    insertTaskReference
  );
  
  const refreshTaskReferencesCommand = vscode.commands.registerCommand(
    'aerosuite.refreshTaskReferences',
    () => updateDecorations(vscode.window.activeTextEditor)
  );
  
  const generateTaskMappingCommand = vscode.commands.registerCommand(
    'aerosuite.generateTaskMapping',
    generateTaskMapping
  );
  
  // Register task completion provider
  const taskCompletionProvider = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript', 'python', 'html', 'css', 'java', 'php'],
    {
      provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        
        // Check if we're typing a task reference
        if (linePrefix.match(/Task:\s*$/i)) {
          return provideTaskCompletionItems();
        }
        
        return undefined;
      }
    },
    ':' // Trigger after typing "Task:"
  );
  
  // Event handlers
  const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      updateDecorations(editor);
    }
  });
  
  const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      updateDecorations(editor);
    }
  });
  
  // Check if task file has been modified
  const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(document => {
    if (document.fileName.endsWith(config.taskFilePath)) {
      // Clear cache to reload tasks
      tasksCache = null;
      
      // Update decorations in all visible editors
      vscode.window.visibleTextEditors.forEach(editor => {
        updateDecorations(editor);
      });
    }
  });
  
  // Update decorations for the active editor
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
  }
  
  // Register status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'aerosuite.generateTaskMapping';
  statusBarItem.text = '$(list-tree) Tasks';
  statusBarItem.tooltip = 'View and manage task references';
  statusBarItem.show();
  
  // Add to context
  context.subscriptions.push(
    insertTaskReferenceCommand,
    refreshTaskReferencesCommand,
    generateTaskMappingCommand,
    taskCompletionProvider,
    onDidChangeActiveEditor,
    onDidChangeTextDocument,
    onDidSaveTextDocument,
    statusBarItem,
    taskDecorationType
  );
}

// Deactivate the extension
function deactivate() {
  console.log('AeroSuite Task Traceability Extension has been deactivated');
}

// Load configuration from .cursor.json
function loadConfiguration() {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;
    
    const cursorConfigPath = path.join(workspaceFolders[0].uri.fsPath, '.cursor.json');
    
    if (fs.existsSync(cursorConfigPath)) {
      const cursorConfig = JSON.parse(fs.readFileSync(cursorConfigPath, 'utf8'));
      
      if (cursorConfig['task-traceability']) {
        const traceabilityConfig = cursorConfig['task-traceability'];
        
        if (traceabilityConfig.taskIdPattern) {
          config.taskIdPattern = traceabilityConfig.taskIdPattern;
        }
        
        if (traceabilityConfig.commentFormats) {
          // Merge with default comment formats
          config.commentFormats = {
            ...config.commentFormats,
            ...traceabilityConfig.commentFormats
          };
        }
        
        if (traceabilityConfig.taskMappingFile) {
          config.taskMappingFile = traceabilityConfig.taskMappingFile;
        }
      }
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
}

// Get all tasks from task.md
function getTasks() {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];
    
    const taskFilePath = path.join(workspaceFolders[0].uri.fsPath, config.taskFilePath);
    
    if (!fs.existsSync(taskFilePath)) {
      return [];
    }
    
    // Check if we need to reload the tasks
    const stats = fs.statSync(taskFilePath);
    if (tasksCache && stats.mtimeMs <= lastTaskFileModified) {
      return tasksCache;
    }
    
    const content = fs.readFileSync(taskFilePath, 'utf8');
    const lines = content.split('\n');
    
    const tasks = [];
    const taskIdPattern = new RegExp(`^(${config.taskIdPattern})$`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Parse task rows from the markdown table
      if (line.startsWith('|') && !line.includes('---') && !line.includes('ID')) {
        const columns = line.split('|').map(col => col.trim()).filter(Boolean);
        
        if (columns.length >= 5) { // At least ID, Title, Status, Priority, Dependencies
          const id = columns[0];
          const title = columns[1];
          const status = columns[2];
          const priority = columns[3];
          const dependencies = columns[4];
          
          // Only add if it's a valid task ID
          if (taskIdPattern.test(id)) {
            tasks.push({
              id,
              title,
              status,
              priority,
              dependencies
            });
          }
        }
      }
    }
    
    // Update cache
    tasksCache = tasks;
    lastTaskFileModified = stats.mtimeMs;
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
}

// Update task decorations in the editor
function updateDecorations(editor) {
  if (!editor) return;
  
  try {
    const document = editor.document;
    const text = document.getText();
    
    // Find all task references in the document
    const taskIdRegex = new RegExp(`Task:\\s*(${config.taskIdPattern})`, 'gi');
    const decorations = [];
    
    let match;
    while ((match = taskIdRegex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const decoration = { range: new vscode.Range(startPos, endPos) };
      decorations.push(decoration);
    }
    
    // Apply decorations
    editor.setDecorations(taskDecorationType, decorations);
  } catch (error) {
    console.error('Error updating decorations:', error);
  }
}

// Insert task reference
async function insertTaskReference() {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    // Get tasks
    const tasks = getTasks();
    if (tasks.length === 0) {
      vscode.window.showWarningMessage('No tasks found in task.md');
      return;
    }
    
    // Create quick pick items
    const quickPickItems = tasks.map(task => ({
      label: `${task.id} - ${task.title}`,
      description: task.status,
      task
    }));
    
    // Show quick pick
    const selected = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: 'Select a task to reference',
      matchOnDescription: true,
      matchOnDetail: true
    });
    
    if (!selected) return;
    
    // Get comment format for current language
    const languageId = editor.document.languageId;
    let commentFormat = config.commentFormats[languageId] || '// Task: {taskId} - {taskTitle}';
    
    // Replace placeholders
    const taskReference = commentFormat
      .replace('{taskId}', selected.task.id)
      .replace('{taskTitle}', selected.task.title);
    
    // Insert at the beginning of the file or at cursor position
    editor.edit(editBuilder => {
      if (editor.selection.isEmpty) {
        // If selection is empty, insert at the beginning of the file
        const firstLine = editor.document.lineAt(0);
        if (firstLine.text.startsWith('#!')) {
          // If first line is a shebang, insert after it
          const position = new vscode.Position(1, 0);
          editBuilder.insert(position, taskReference + '\n\n');
        } else {
          // Otherwise insert at the beginning
          const position = new vscode.Position(0, 0);
          editBuilder.insert(position, taskReference + '\n\n');
        }
      } else {
        // If there's a selection, insert at the cursor position
        editBuilder.insert(editor.selection.start, taskReference + '\n');
      }
    });
  } catch (error) {
    console.error('Error inserting task reference:', error);
    vscode.window.showErrorMessage('Error inserting task reference: ' + error.message);
  }
}

// Provide task completion items
function provideTaskCompletionItems() {
  try {
    const tasks = getTasks();
    if (tasks.length === 0) return [];
    
    return tasks.map(task => {
      const completionItem = new vscode.CompletionItem(
        `${task.id} - ${task.title}`, 
        vscode.CompletionItemKind.Reference
      );
      completionItem.detail = task.status;
      completionItem.documentation = `Priority: ${task.priority}\nDependencies: ${task.dependencies}`;
      completionItem.insertText = task.id;
      return completionItem;
    });
  } catch (error) {
    console.error('Error providing task completion items:', error);
    return [];
  }
}

// Generate task mapping
async function generateTaskMapping() {
  try {
    const terminal = vscode.window.createTerminal('Task Traceability');
    terminal.show();
    terminal.sendText('node scripts/task-management/task-traceability.js');
    
    vscode.window.showInformationMessage('Generating task-code mapping...');
  } catch (error) {
    console.error('Error generating task mapping:', error);
    vscode.window.showErrorMessage('Error generating task mapping: ' + error.message);
  }
}

module.exports = {
  activate,
  deactivate
}; 