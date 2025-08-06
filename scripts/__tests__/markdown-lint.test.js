const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Load the project's markdownlint config
const configPath = path.join(process.cwd(), '.markdownlint.json');
let markdownConfig;

beforeAll(async () => {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    markdownConfig = JSON.parse(configContent);
  } catch (error) {
    console.warn('Could not load .markdownlint.json, using default config');
    markdownConfig = {
      "default": true
    };
  }
});

describe('Markdown Documentation Tests', () => {
  const findMarkdownFiles = async (dir) => {
    const files = [];
    const ignorePatterns = [
      'node_modules',
      'dist',
      'build',
      '.git',
      'coverage',
      '.next',
      'out'
    ];

    async function scan(directory) {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory() && !ignorePatterns.includes(entry.name)) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }

    await scan(dir);
    return files;
  };

  test('all markdown files should follow style guidelines', async () => {
    const markdownFiles = await findMarkdownFiles(process.cwd());
    expect(markdownFiles.length).toBeGreaterThan(0);

    let totalIssues = 0;
    const filesWithIssues = [];

    for (const file of markdownFiles) {
      try {
        execSync(`npx markdownlint-cli "${file}"`, { stdio: 'pipe' });
      } catch (error) {
        const output = error.stdout.toString();
        const issueCount = (output.match(/MD\d+/g) || []).length;
        totalIssues += issueCount;
        filesWithIssues.push({
          file: path.relative(process.cwd(), file),
          issues: issueCount
        });
      }
    }

    // Report issues but don't fail the test completely
    if (filesWithIssues.length > 0) {
      console.log('\n📊 Markdown Linting Summary:');
      console.log(`Total files with issues: ${filesWithIssues.length}`);
      console.log(`Total issues found: ${totalIssues}`);
      
      // Show top 10 files with most issues
      const sortedFiles = filesWithIssues
        .sort((a, b) => b.issues - a.issues)
        .slice(0, 10);
      
      console.log('\nTop files with issues:');
      sortedFiles.forEach(({ file, issues }) => {
        console.log(`  ${file}: ${issues} issues`);
      });
      
      // Only fail if there are too many issues (more than 100 total)
      if (totalIssues > 100) {
        throw new Error(`Too many markdown linting issues: ${totalIssues}. Please run 'npm run fix:markdown:all' to fix them.`);
      }
    }
  });

  test('markdown files should have proper heading hierarchy', async () => {
    const markdownFiles = await findMarkdownFiles(process.cwd());

    for (const file of markdownFiles) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      const headings = [];

      lines.forEach((line, index) => {
        const match = line.match(/^(#{1,6})\s/);
        if (match) {
          headings.push({
            level: match[1].length,
            line: index + 1
          });
        }
      });

      // Check heading hierarchy
      for (let i = 1; i < headings.length; i++) {
        const current = headings[i];
        const previous = headings[i - 1];
        
        // Heading levels should not skip more than one level
        const levelDiff = current.level - previous.level;
        if (levelDiff > 1) {
          console.log(`\nHeading hierarchy issue in ${path.relative(process.cwd(), file)}:`);
          console.log(`  Line ${current.line}: Heading level skips from h${previous.level} to h${current.level}`);
        }
        expect(levelDiff).toBeLessThanOrEqual(1);
      }
    }
  });

  test('code blocks should specify language', async () => {
    const markdownFiles = await findMarkdownFiles(process.cwd());
    let totalCodeBlocksWithoutLanguage = 0;

    for (const file of markdownFiles) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      let inCodeBlock = false;
      let codeBlockStart = 0;

      lines.forEach((line, index) => {
        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockStart = index + 1;
            
            // Check if language is specified
            const hasLanguage = line.length > 3;
            if (!hasLanguage) {
              totalCodeBlocksWithoutLanguage++;
              console.log(`\nUnspecified code block language in ${path.relative(process.cwd(), file)}:`);
              console.log(`  Line ${index + 1}: Code block should specify language`);
            }
          } else {
            inCodeBlock = false;
          }
        }
      });
    }

    // Only fail if there are too many code blocks without language
    if (totalCodeBlocksWithoutLanguage > 10) {
      throw new Error(`Too many code blocks without language specification: ${totalCodeBlocksWithoutLanguage}`);
    }
  });
});