const JSXBestPracticesChecker = require('../jsx-best-practices');
const JSXAutoFixer = require('../jsx-auto-fix');
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

describe('JSX Best Practices Tests', () => {
  let checker;
  let fixer;
  
  beforeEach(() => {
    checker = new JSXBestPracticesChecker();
    fixer = new JSXAutoFixer();
  });

  describe('JSX Expression Checks', () => {
    test('should detect empty JSX expressions', () => {
      const code = `
        const Component = () => (
          <div>{}</div>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkEmptyExpressions(ast);
      
      expect(results).toHaveLength(1);
      expect(results[0].line).toBe(3);
    });

    test('should detect complex nested ternary expressions', () => {
      const code = `
        const Component = ({ a, b, c }) => (
          <div>{a ? b : c ? d : e}</div>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkComplexExpressions(ast);
      
      expect(results).toHaveLength(1);
    });

    test('should recognize good conditional rendering', () => {
      const code = `
        const Component = ({ show, items }) => (
          <div>
            {show && <span>Visible</span>}
            {items.length > 0 ? <List items={items} /> : <Empty />}
          </div>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkConditionalRendering(ast);
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('JSX Attribute Checks', () => {
    test('should detect reserved prop names', () => {
      const code = `
        const Component = () => (
          <div class="container" for="input-id">
            <label for="input-id">Label</label>
          </div>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkReservedProps(ast);
      
      expect(results).toHaveLength(2);
      expect(results[0].prop).toBe('class');
      expect(results[1].prop).toBe('for');
    });

    test('should detect non-camelCase HTML attributes', () => {
      const code = `
        const Component = () => (
          <input tabindex="0" readonly maxlength="10" />
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkCamelCaseAttributes(ast);
      
      expect(results).toHaveLength(3);
      expect(results[0].attr).toBe('tabindex');
      expect(results[0].correct).toBe('tabIndex');
    });
  });

  describe('JSX Security Checks', () => {
    test('should detect dangerouslySetInnerHTML usage', () => {
      const code = `
        const Component = ({ html }) => (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkDangerouslySetInnerHTML(ast);
      
      expect(results).toHaveLength(1);
    });

    test('should recognize safe user input rendering', () => {
      const code = `
        const Component = ({ userInput }) => (
          <div>{userInput}</div>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkUserInputSafety(ast);
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('JSX Structure Checks', () => {
    test('should detect non-self-closing void elements', () => {
      const code = `
        const Component = () => (
          <div>
            <img src="test.jpg"></img>
            <input type="text"></input>
            <br></br>
          </div>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkSelfClosingTags(ast);
      
      expect(results).toHaveLength(3);
      expect(results.map(r => r.tag)).toEqual(['img', 'input', 'br']);
    });

    test('should detect missing key props in lists', () => {
      const code = `
        const Component = ({ items }) => (
          <ul>
            {items.map(item => (
              <li>{item.name}</li>
            ))}
          </ul>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkKeyProps(ast);
      
      expect(results).toHaveLength(1);
    });

    test('should recognize Fragment usage', () => {
      const code = `
        const Component = () => (
          <>
            <Header />
            <Main />
            <Footer />
          </>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkFragmentUsage(ast);
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Component Best Practices', () => {
    test('should detect non-PascalCase component names', () => {
      const code = `
        function myComponent() {
          return <div>Hello</div>;
        }
        
        const anotherComponent = () => <span>World</span>;
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkComponentNaming(ast);
      
      expect(results).toHaveLength(1); // Only function declarations are checked
      expect(results[0].component).toBe('myComponent');
    });

    test('should detect props spreading', () => {
      const code = `
        const Component = (props) => (
          <ChildComponent {...props} />
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkPropsSpreading(ast);
      
      expect(results).toHaveLength(1);
    });

    test('should detect inline function handlers', () => {
      const code = `
        const Component = () => (
          <button onClick={() => console.log('clicked')}>
            Click me
          </button>
        );
      `;
      
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
      const results = checker.checkInlineFunctions(ast);
      
      expect(results).toHaveLength(1);
      expect(results[0].attr).toBe('onClick');
    });
  });

  describe('JSX Auto-Fix', () => {
    test('should fix reserved props', () => {
      const ast = parse(`<div class="test" />`, { 
        sourceType: 'module', 
        plugins: ['jsx'],
        tokens: true 
      });
      
      const result = fixer.fixReservedProps(ast);
      
      expect(result.modified).toBe(true);
      expect(result.changes[0].from).toBe('class');
      expect(result.changes[0].to).toBe('className');
    });

    test('should fix HTML attributes to camelCase', () => {
      const ast = parse(`<input tabindex="1" readonly />`, { 
        sourceType: 'module', 
        plugins: ['jsx'],
        tokens: true 
      });
      
      const result = fixer.fixCamelCaseAttributes(ast);
      
      expect(result.modified).toBe(true);
      expect(result.changes).toHaveLength(2);
      expect(result.changes[0].to).toBe('tabIndex');
      expect(result.changes[1].to).toBe('readOnly');
    });

    test('should fix self-closing tags', () => {
      const ast = parse(`<img src="test.jpg"></img>`, { 
        sourceType: 'module', 
        plugins: ['jsx'],
        tokens: true 
      });
      
      const result = fixer.fixSelfClosingTags(ast);
      
      expect(result.modified).toBe(true);
      expect(result.changes[0].tag).toBe('img');
    });

    test('should fix component naming', () => {
      const ast = parse(`
        function myComponent() {
          return <div>Hello</div>;
        }
      `, { 
        sourceType: 'module', 
        plugins: ['jsx'],
        tokens: true 
      });
      
      const result = fixer.fixComponentNaming(ast);
      
      expect(result.modified).toBe(true);
      expect(result.changes[0].from).toBe('myComponent');
      expect(result.changes[0].to).toBe('MyComponent');
    });

    test('should remove empty expressions', () => {
      const ast = parse(`<div>{}</div>`, { 
        sourceType: 'module', 
        plugins: ['jsx'],
        tokens: true 
      });
      
      const result = fixer.fixEmptyExpressions(ast);
      
      expect(result.modified).toBe(true);
      expect(result.changes[0].action).toBe('removed');
    });

    test('should add missing keys to list items', () => {
      const ast = parse(`
        <ul>
          {items.map((item, index) => (
            <li>{item}</li>
          ))}
        </ul>
      `, { 
        sourceType: 'module', 
        plugins: ['jsx'],
        tokens: true 
      });
      
      const result = fixer.fixMissingKeys(ast);
      
      expect(result.modified).toBe(true);
      expect(result.changes[0].action).toBe('added key prop');
    });
  });
});

// Export test utilities
module.exports = {
  createMockJSXFile: (content) => {
    const tempPath = path.join(__dirname, 'temp-test.jsx');
    fs.writeFileSync(tempPath, content);
    return tempPath;
  },
  
  cleanupMockFile: (filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },
  
  parseJSX: (code) => {
    return parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  }
};