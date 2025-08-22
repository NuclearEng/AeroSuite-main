/**
 * Accessibility Audit Utilities
 * 
 * This module provides utilities for conducting accessibility audits and fixing common issues.
 */

import axe, { RunOptions, ElementContext, Result, NodeResult } from 'axe-core';

/**
 * Severity levels for accessibility issues
 */
export enum AccessibilitySeverity {
  CRITICAL = 'critical',
  SERIOUS = 'serious',
  MODERATE = 'moderate',
  MINOR = 'minor'
}

/**
 * Interface for accessibility audit results
 */
export interface AccessibilityAuditResult {
  violations: AccessibilityIssue[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityIncomplete[];
  timestamp: Date;
  url: string;
}

/**
 * Interface for accessibility issues
 */
export interface AccessibilityIssue {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
  tags: string[];
  severity: AccessibilitySeverity;
}

/**
 * Interface for accessibility passes
 */
export interface AccessibilityPass {
  id: string;
  description: string;
  help: string;
  nodes: AccessibilityNode[];
  tags: string[];
}

/**
 * Interface for incomplete accessibility checks
 */
export interface AccessibilityIncomplete {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
  tags: string[];
}

/**
 * Interface for accessibility node information
 */
export interface AccessibilityNode {
  html: string;
  target: any; // Using any to avoid type issues with UnlabelledFrameSelector
  failureSummary?: string;
  fix?: AccessibilityFix;
}

/**
 * Interface for accessibility fix suggestions
 */
export interface AccessibilityFix {
  type: 'attribute' | 'node' | 'property';
  target: any; // Using any to avoid type issues with UnlabelledFrameSelector
  action: 'add' | 'remove' | 'replace';
  value?: string;
}

/**
 * Options for accessibility audit
 */
export interface AccessibilityAuditOptions {
  rules?: {
    [key: string]: {
      enabled: boolean;
    };
  };
  context?: ElementContext;
  runOnly?: {
    type: 'tag' | 'rule';
    values: string[];
  };
  resultTypes?: ('violations' | 'passes' | 'incomplete')[];
  severityThreshold?: AccessibilitySeverity;
}

/**
 * Map axe-core impact levels to severity levels
 */
const impactToSeverityMap: Record<string, AccessibilitySeverity> = {
  critical: AccessibilitySeverity.CRITICAL,
  serious: AccessibilitySeverity.SERIOUS,
  moderate: AccessibilitySeverity.MODERATE,
  minor: AccessibilitySeverity.MINOR
};

/**
 * Run an accessibility audit on the current page or a specific element
 * 
 * @param options - Audit options
 * @returns Promise resolving to audit results
 */
export async function runAccessibilityAudit(
  options: AccessibilityAuditOptions = {}
): Promise<AccessibilityAuditResult> {
  // Configure axe options
  const axeOptions: RunOptions = {};
  
  if (options.rules) {
    axeOptions.rules = options.rules;
  }
  
  if (options.runOnly) {
    axeOptions.runOnly = options.runOnly;
  }
  
  if (options.resultTypes) {
    axeOptions.resultTypes = options.resultTypes;
  }
  
  // Run axe
  const results = await axe.run(options.context || document, axeOptions);
  
  // Process violations
  const violations = results.violations.map((violation: Result) => {
    const severity = impactToSeverityMap[violation.impact || 'moderate'];
    
    // Filter by severity threshold if provided
    if (options.severityThreshold) {
      const severityLevels = Object.values(AccessibilitySeverity);
      const thresholdIndex = severityLevels.indexOf(options.severityThreshold);
      const currentIndex = severityLevels.indexOf(severity);
      
      if (currentIndex > thresholdIndex) {
        return null;
      }
    }
    
    return {
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node: NodeResult) => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary,
        fix: generateFixSuggestion(node, violation.id)
      })),
      tags: violation.tags,
      severity
    };
  }).filter(Boolean) as AccessibilityIssue[];
  
  // Process passes
  const passes = results.passes.map((pass: Result) => ({
    id: pass.id,
    description: pass.description,
    help: pass.help,
    nodes: pass.nodes.map((node: NodeResult) => ({
      html: node.html,
      target: node.target
    })),
    tags: pass.tags
  }));
  
  // Process incomplete
  const incomplete = results.incomplete.map((item: Result) => ({
    id: item.id,
    description: item.description,
    help: item.help,
    helpUrl: item.helpUrl,
    nodes: item.nodes.map((node: NodeResult) => ({
      html: node.html,
      target: node.target,
      failureSummary: node.failureSummary
    })),
    tags: item.tags
  }));
  
  return {
    violations,
    passes,
    incomplete,
    timestamp: new Date(),
    url: window.location.href
  };
}

/**
 * Generate fix suggestions based on the violation type
 * 
 * @param node - The node with the violation
 * @param ruleId - The ID of the violated rule
 * @returns Fix suggestion or undefined
 */
function generateFixSuggestion(node: NodeResult, ruleId: string): AccessibilityFix | undefined {
  // Common fixes for specific rule violations
  switch (ruleId) {
    case 'image-alt':
      return {
        type: 'attribute',
        target: node.target,
        action: 'add',
        value: 'alt="Image description"'
      };
    
    case 'button-name':
      return {
        type: 'node',
        target: node.target,
        action: 'add',
        value: 'Add text content to button'
      };
    
    case 'color-contrast':
      return {
        type: 'attribute',
        target: node.target,
        action: 'replace',
        value: 'Increase color contrast to at least 4.5:1'
      };
    
    case 'label':
      return {
        type: 'attribute',
        target: node.target,
        action: 'add',
        value: 'Add label or aria-label attribute'
      };
    
    case 'aria-roles':
      return {
        type: 'attribute',
        target: node.target,
        action: 'replace',
        value: 'Use valid ARIA role'
      };
    
    default:
      return undefined;
  }
}

/**
 * Generate an accessibility report in HTML format
 * 
 * @param results - Accessibility audit results
 * @returns HTML string with formatted report
 */
export function generateAccessibilityReport(results: AccessibilityAuditResult): string {
  const { violations, passes, incomplete, timestamp, url } = results;
  
  // Count issues by severity
  const severityCounts = violations.reduce((counts, violation) => {
    counts[violation.severity] = (counts[violation.severity] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Generate HTML report
  return `
    <div class="accessibility-report">
      <h1>Accessibility Audit Report</h1>
      <p>URL: ${url}</p>
      <p>Date: ${timestamp.toLocaleString()}</p>
      
      <h2>Summary</h2>
      <ul>
        <li>Total violations: ${violations.length}</li>
        <li>Critical issues: ${severityCounts[AccessibilitySeverity.CRITICAL] || 0}</li>
        <li>Serious issues: ${severityCounts[AccessibilitySeverity.SERIOUS] || 0}</li>
        <li>Moderate issues: ${severityCounts[AccessibilitySeverity.MODERATE] || 0}</li>
        <li>Minor issues: ${severityCounts[AccessibilitySeverity.MINOR] || 0}</li>
        <li>Passes: ${passes.length}</li>
        <li>Incomplete: ${incomplete.length}</li>
      </ul>
      
      <h2>Violations</h2>
      ${violations.length === 0 ? '<p>No violations found.</p>' : ''}
      ${violations.map(violation => `
        <div class="violation ${violation.severity}">
          <h3>${violation.id} - ${violation.impact} impact</h3>
          <p>${violation.description}</p>
          <p><a href="${violation.helpUrl}" target="_blank">Learn more</a></p>
          <h4>Affected elements (${violation.nodes.length}):</h4>
          <ul>
            ${violation.nodes.map(node => `
              <li>
                <code>${escapeHtml(node.html)}</code>
                <p>Selector: ${node.target.join(' > ')}</p>
                ${node.failureSummary ? `<p>Failure: ${node.failureSummary}</p>` : ''}
                ${node.fix ? `<p>Suggested fix: ${fixToString(node.fix)}</p>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
      
      <h2>Incomplete checks</h2>
      ${incomplete.length === 0 ? '<p>No incomplete checks.</p>' : ''}
      ${incomplete.map(item => `
        <div class="incomplete">
          <h3>${item.id}</h3>
          <p>${item.description}</p>
          <p><a href="${item.helpUrl}" target="_blank">Learn more</a></p>
          <h4>Affected elements (${item.nodes.length}):</h4>
          <ul>
            ${item.nodes.map(node => `
              <li>
                <code>${escapeHtml(node.html)}</code>
                <p>Selector: ${node.target.join(' > ')}</p>
                ${node.failureSummary ? `<p>Failure: ${node.failureSummary}</p>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Escape HTML special characters to prevent XSS
 * 
 * @param html - HTML string to escape
 * @returns Escaped HTML string
 */
function escapeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert fix suggestion to human-readable string
 * 
 * @param fix - Fix suggestion
 * @returns Human-readable string
 */
function fixToString(fix: AccessibilityFix): string {
  switch (fix.type) {
    case 'attribute':
      return `${fix.action} attribute: ${fix.value}`;
    case 'node':
      return `${fix.action} node: ${fix.value}`;
    case 'property':
      return `${fix.action} property: ${fix.value}`;
    default:
      return JSON.stringify(fix);
  }
}

/**
 * Save accessibility audit results to a file
 * 
 * @param results - Accessibility audit results
 * @param format - Output format ('json' or 'html')
 * @returns Blob URL for downloading the report
 */
export function saveAccessibilityReport(
  results: AccessibilityAuditResult,
  format: 'json' | 'html' = 'html'
): string {
  let content: string;
  let mimeType: string;
  
  if (format === 'json') {
    content = JSON.stringify(results, null, 2);
    mimeType = 'application/json';
  } else {
    content = generateAccessibilityReport(results);
    mimeType = 'text/html';
  }
  
  const blob = new Blob([content], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Run an accessibility audit and return issues grouped by type
 * 
 * @param options - Audit options
 * @returns Promise resolving to grouped issues
 */
export async function getAccessibilityIssuesByType(
  options: AccessibilityAuditOptions = {}
): Promise<Record<string, AccessibilityIssue[]>> {
  const results = await runAccessibilityAudit(options);
  
  return results.violations.reduce((groups, violation) => {
    violation.tags.forEach(tag => {
      if (!groups[tag]) {
        groups[tag] = [];
      }
      groups[tag].push(violation);
    });
    
    return groups;
  }, {} as Record<string, AccessibilityIssue[]>);
}

/**
 * Check if an element is accessible
 * 
 * @param element - Element to check
 * @returns Promise resolving to boolean
 */
export async function isElementAccessible(element: Element): Promise<boolean> {
  const results = await runAccessibilityAudit({
    context: element
  });
  
  return results.violations.length === 0;
}

/**
 * Get focus management issues
 * 
 * @returns Promise resolving to focus management issues
 */
export async function getFocusManagementIssues(): Promise<AccessibilityIssue[]> {
  const issuesByType = await getAccessibilityIssuesByType({
    runOnly: {
      type: 'tag',
      values: ['keyboard', 'focus']
    }
  });
  
  return [
    ...(issuesByType.keyboard || []),
    ...(issuesByType.focus || [])
  ];
}

/**
 * Get screen reader compatibility issues
 * 
 * @returns Promise resolving to screen reader compatibility issues
 */
export async function getScreenReaderIssues(): Promise<AccessibilityIssue[]> {
  const issuesByType = await getAccessibilityIssuesByType({
    runOnly: {
      type: 'tag',
      values: ['aria', 'screen-reader']
    }
  });
  
  return [
    ...(issuesByType.aria || []),
    ...(issuesByType['screen-reader'] || [])
  ];
}

export default {
  runAccessibilityAudit,
  generateAccessibilityReport,
  saveAccessibilityReport,
  getAccessibilityIssuesByType,
  isElementAccessible,
  getFocusManagementIssues,
  getScreenReaderIssues
}; 