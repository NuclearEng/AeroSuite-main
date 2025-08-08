import axe from 'axe-core';

/**
 * Run accessibility tests on a DOM element
 * @param {HTMLElement} element - The DOM element to test
 * @param {Object} options - Options for axe-core
 * @returns {Promise<Object>} - The axe-core results
 */
export const runA11yTests = async (element, options = {}) => {
  try {
    const results = await axe.run(element || document, {
      rules: {
        'color-contrast': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-hidden-focus': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'button-name': { enabled: true },
        'document-title': { enabled: true },
        'duplicate-id-active': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'meta-viewport': { enabled: true },
        ...options.rules
      },
      ...options
    });
    
    return results;
  } catch (_error) {
    console.error('Error running accessibility tests:', _error);
    return { violations: [], passes: [], incomplete: [], inapplicable: [] };
  }
};

/**
 * Log accessibility violations to the console
 * @param {Object} results - The axe-core results
 */
export const logA11yViolations = (results) => {
  if (results.violations.length === 0) {
    console.log('%c No accessibility violations found!', 'color: green; font-weight: bold;');
    return;
  }
  
  console.group('%c Accessibility violations:', 'color: red; font-weight: bold;');
  
  results.violations.forEach((violation) => {
    console.groupCollapsed(
      `%c ${violation.impact} impact: ${violation.help} (${violation.id})`,
      `color: ${getImpactColor(violation.impact)}; font-weight: bold;`
    );
    
    console.log('Description:', violation.description);
    console.log('Help URL:', violation.helpUrl);
    console.log('Affected nodes:', violation.nodes.length);
    
    violation.nodes.forEach((node, i) => {
      console.groupCollapsed(`Node ${i + 1}: ${truncateHTML(node.html)}`);
      console.log('Element:', node.element);
      console.log('Impact:', node.impact);
      console.log('Target:', node.target);
      console.log('HTML:', node.html);
      console.log('Failure Summary:', node.failureSummary);
      console.groupEnd();
    });
    
    console.groupEnd();
  });
  
  console.groupEnd();
};

/**
 * Get a color based on the impact level
 * @param {string} impact - The impact level
 * @returns {string} - The color
 */
const getImpactColor = (impact) => {
  switch (impact) {
    case 'critical':
      return 'darkred';
    case 'serious':
      return 'red';
    case 'moderate':
      return 'orange';
    case 'minor':
      return 'yellow';
    default:
      return 'gray';
  }
};

/**
 * Truncate HTML string for display
 * @param {string} html - The HTML string
 * @param {number} length - The maximum length
 * @returns {string} - The truncated HTML
 */
const truncateHTML = (html, length = 50) => {
  return html.length > length ? `${html.substring(0, length)}...` : html;
};

/**
 * Run a quick accessibility check on the current page
 * This can be called from the browser console for quick testing
 */
export const quickA11yCheck = async () => {
  const results = await runA11yTests();
  logA11yViolations(results);
  return results;
};

// Expose the quick check function to the window object for console access
if (typeof window !== 'undefined') {
  window.quickA11yCheck = quickA11yCheck;
}

/**
 * Generate an accessibility report
 * @param {HTMLElement} element - The DOM element to test
 * @returns {Promise<Object>} - The accessibility report
 */
export const generateA11yReport = async (element) => {
  const results = await runA11yTests(element);
  
  return {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    totalIssues: results.violations.length,
    criticalIssues: results.violations.filter(v => v.impact === 'critical').length,
    seriousIssues: results.violations.filter(v => v.impact === 'serious').length,
    moderateIssues: results.violations.filter(v => v.impact === 'moderate').length,
    minorIssues: results.violations.filter(v => v.impact === 'minor').length,
    violations: results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary
      }))
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length
  };
}; 