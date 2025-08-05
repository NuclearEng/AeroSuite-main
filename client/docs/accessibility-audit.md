# Accessibility Audit Tools

This document provides an overview of the accessibility audit tools implemented in the AeroSuite application.

## Overview

The accessibility audit tools are designed to help identify and fix accessibility issues in the application. These tools are based on the Web Content Accessibility Guidelines (WCAG) 2.1 and use the axe-core library for automated testing.

## Components

### 1. Accessibility Audit Utility

The `accessibilityAudit.ts` utility provides functions for conducting accessibility audits and generating reports. It uses the axe-core library to analyze the DOM and identify accessibility issues.

Key features:
- Run accessibility audits on the entire page or specific elements
- Generate HTML or JSON reports
- Filter issues by severity or type
- Get suggested fixes for common issues

Usage example:
```typescript
import { runAccessibilityAudit } from '../../utils/accessibilityAudit';

// Run an audit on the entire page
const results = await runAccessibilityAudit();

// Run an audit on a specific element
const element = document.querySelector('#main-content');
const results = await runAccessibilityAudit({ context: element });
```

### 2. Color Contrast Checker

The `ColorContrastChecker` component allows users to check if text and background colors meet WCAG contrast requirements.

Key features:
- Check contrast ratio against WCAG AA and AAA standards
- Adjust colors using sliders or hex input
- Get suggested colors that meet accessibility requirements
- Preview text with the selected colors

Usage example:
```tsx
import ColorContrastChecker from '../../components/common/ColorContrastChecker';

// Basic usage
<ColorContrastChecker />

// With initial colors
<ColorContrastChecker 
  initialForeground="#000000" 
  initialBackground="#FFFFFF" 
/>
```

### 3. Accessibility Audit Component

The `AccessibilityAudit` component provides a user interface for running accessibility audits and displaying results.

Key features:
- Run audits on the entire page or specific elements
- Display issues grouped by severity
- Show detailed information about each issue
- Download audit reports

Usage example:
```tsx
import AccessibilityAudit from '../../components/common/AccessibilityAudit';

// Basic usage
<AccessibilityAudit />

// Target a specific element
<AccessibilityAudit targetSelector="#main-content" />

// Auto-run on mount
<AccessibilityAudit autoRun={true} />

// Hide controls
<AccessibilityAudit showControls={false} />

// Get results callback
<AccessibilityAudit onAuditComplete={(results) => console.log(results)} />
```

### 4. Accessibility Audit Page

The `AccessibilityAuditPage` provides a comprehensive interface for conducting different types of accessibility audits.

Key features:
- General accessibility audit
- Focus management audit
- Screen reader compatibility audit
- Color contrast audit
- Configurable audit settings

### 5. Keyboard Navigation Utilities

The `keyboardNavigation.ts` utility provides functions for implementing keyboard navigation in components. This helps ensure that all interactive elements are accessible to keyboard users.

Key features:
- Create keyboard navigation controllers for any component
- Support for vertical and horizontal navigation
- Focus management for lists, grids, menus, and tabs
- Support for keyboard shortcuts (arrow keys, Home, End, Enter, Space)

Usage example:
```typescript
import { createKeyboardNavigation } from '../../utils/keyboardNavigation';

// Create a keyboard navigation controller
const controller = createKeyboardNavigation({
  container: document.querySelector('#my-list'),
  itemSelector: 'li',
  vertical: true,
  wrap: true,
  onItemSelect: (item, index) => {
    console.log(`Selected item ${index}`);
  }
});

// Initialize the controller
controller.init();
```

### 6. Keyboard Navigation React Hooks

The `useKeyboardNavigation.ts` hooks provide React-friendly wrappers for the keyboard navigation utilities.

Key features:
- React hooks for keyboard navigation in functional components
- Specialized hooks for lists, grids, menus, and tabs
- Automatic cleanup on component unmount
- TypeScript support for better developer experience

Usage example:
```tsx
import { useKeyboardNavigableList } from '../../hooks/useKeyboardNavigation';

function MyList() {
  const { containerRef, controller } = useKeyboardNavigableList({
    onItemSelect: (item, index) => {
      console.log(`Selected item ${index}`);
    }
  });
  
  return (
    <ul ref={containerRef}>
      <li tabIndex={0}>Item 1</li>
      <li tabIndex={-1}>Item 2</li>
      <li tabIndex={-1}>Item 3</li>
    </ul>
  );
}
```

## Best Practices

When using these tools, follow these best practices:

1. **Run audits regularly**: Incorporate accessibility audits into your development workflow.
2. **Fix critical issues first**: Prioritize issues that prevent users from accessing core functionality.
3. **Test with real users**: Automated tools can't catch everything. Test with real users, including those with disabilities.
4. **Use semantic HTML**: Proper HTML structure is essential for accessibility.
5. **Ensure keyboard accessibility**: Make sure all interactive elements can be accessed and operated using only a keyboard.
6. **Implement proper focus management**: Ensure focus is visible and follows a logical order.
7. **Provide text alternatives**: Add descriptive alt text for images and other non-text content.
8. **Maintain sufficient contrast**: Ensure text has sufficient contrast against its background.

## WCAG Compliance Levels

The tools check for compliance with the following WCAG levels:

- **WCAG 2.1 A**: Minimum level of compliance
- **WCAG 2.1 AA**: Standard level of compliance (recommended)
- **WCAG 2.1 AAA**: Enhanced level of compliance

## Additional Resources

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [axe-core documentation](https://github.com/dequelabs/axe-core)
- [WebAIM: Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/)

## Keyboard Accessibility

Keyboard accessibility is essential for users who cannot use a mouse. The following keyboard interactions should be supported:

### General Keyboard Navigation

- **Tab**: Move focus to the next focusable element
- **Shift+Tab**: Move focus to the previous focusable element
- **Enter/Space**: Activate the focused element

### List Navigation

- **Up/Down arrows**: Move focus between list items
- **Home**: Move focus to the first item
- **End**: Move focus to the last item
- **Enter/Space**: Select the focused item

### Grid Navigation

- **Up/Down/Left/Right arrows**: Move focus between cells
- **Home**: Move focus to the first cell in the row
- **End**: Move focus to the last cell in the row
- **Enter/Space**: Select the focused cell

### Tab Navigation

- **Left/Right arrows**: Move focus between tabs
- **Home**: Move focus to the first tab
- **End**: Move focus to the last tab
- **Enter/Space**: Activate the focused tab

### Menu Navigation

- **Up/Down arrows**: Move focus between menu items
- **Home**: Move focus to the first item
- **End**: Move focus to the last item
- **Enter/Space**: Select the focused item
- **Escape**: Close the menu

## Implementation Details

The accessibility audit tools are implemented using the following technologies:

- **axe-core**: For automated accessibility testing
- **React**: For building the user interface
- **TypeScript**: For type safety and better developer experience
- **Material-UI**: For accessible UI components

The tools are designed to be extensible and can be customized to meet specific requirements. 
