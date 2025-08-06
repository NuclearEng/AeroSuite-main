# Screen Reader Compatibility Guide

This document provides guidelines and best practices for ensuring that all components in the
AeroSuite application are compatible with screen readers, making the application accessible to
users with visual impairments.

## Table of Contents

1. [Introduction](#introduction)
2. [Testing with Screen Readers](#testing-with-screen-readers)
3. [Common Screen Reader Patterns](#common-screen-reader-patterns)
4. [ARIA Attributes](#aria-attributes)
5. [Semantic HTML](#semantic-html)
6. [Live Regions](#live-regions)
7. [Best Practices](#best-practices)
8. [Resources](#resources)

## Introduction

Screen readers are assistive technologies that convert digital text into synthesized speech,
allowing users with visual impairments to access and interact with applications. Ensuring screen
reader compatibility is essential for making our application accessible to all users.

Screen reader users navigate applications differently than sighted users. They rely on keyboard
navigation, semantic HTML structure, and ARIA attributes to understand and interact with content.
This guide will help you create components that work well with screen readers.

## Testing with Screen Readers

To ensure screen reader compatibility, test your components with actual screen readers. Here are
the most common screen readers to test with:

- __NVDA__ (NonVisual Desktop Access) - Free, open-source screen reader for Windows
- __VoiceOver__ - Built into macOS and iOS
- __JAWS__ (Job Access With Speech) - Commercial screen reader for Windows
- __TalkBack__ - Built into Android devices

### Basic Testing Steps

1. __Install a screen reader__ - Start with NVDA (Windows) or VoiceOver (Mac)
2. __Learn basic commands__ - Each screen reader has different keyboard commands
3. __Navigate with keyboard only__ - Tab, Shift+Tab, arrow keys, Enter, Space
4. __Check reading order__ - Is content read in a logical order?
5. __Test form controls__ - Are labels properly associated with inputs?
6. __Verify dynamic content__ - Are updates properly announced?

## Common Screen Reader Patterns

### Hidden Text for Context

Sometimes visual users can infer context that screen readers cannot. Add hidden text for screen
readers in these cases:

```tsx
import { SROnly } from '../../utils/accessibility';

// Button with hidden context for screen readers
<Button variant="contained">
  Edit
  <SROnly>user profile</SROnly>
</Button>
```bash

### Descriptive Link Text

Screen reader users often navigate by links. Avoid generic "click here" links:

```tsx
// Bad - lacks context when navigating by links
<Typography>
  To learn more about accessibility, <Link href="/docs/accessibility">click here</Link>.
</Typography>

// Good - provides context when navigating by links
<Typography>
  Learn more about our <Link href="/docs/accessibility">accessibility guidelines</Link>.
</Typography>
```bash

### Form Input Labels

All form controls must have proper labels:

```tsx
// Good - explicit label association
<label htmlFor="name-input">Full Name</label>
<input id="name-input" type="text" />

// Good - MUI TextField with label
<TextField
  id="email-input"
  label="Email Address"
  variant="outlined"
  aria-describedby="email-helper-text"
/>
<Typography id="email-helper-text" variant="caption">
  We'll never share your email with anyone else.
</Typography>
```bash

### Image Alt Text

All meaningful images must have alt text:

```tsx
// Meaningful image with descriptive alt text
<img src="/logo.png" alt="AeroSuite company logo" />

// Decorative image with empty alt text
<img src="/decorative-pattern.png" alt="" />
```bash

## ARIA Attributes

ARIA (Accessible Rich Internet Applications) attributes provide additional semantics for screen
readers when HTML alone is not sufficient.

### ARIA Landmarks

Landmarks help screen reader users navigate between major sections of the page:

```tsx
// Common ARIA landmarks
<header role="banner">Main Header</header>
<nav role="navigation">Main Navigation</nav>
<main role="main">Main Content</main>
<aside role="complementary">Sidebar Content</aside>
<footer role="contentinfo">Footer</footer>
<form role="search">Search Form</form>
```bash

Note: Modern HTML5 elements like `<header>`, `<nav>`, `<main>`, etc. have implicit landmark roles,
so explicit roles are often unnecessary.

### ARIA Labeling

ARIA labeling provides accessible names for elements:

```tsx
// aria-label for elements without visible text
<button aria-label="Close dialog">✕</button>

// aria-labelledby for elements labeled by other elements
<div id="slider-label">Volume</div>
<div
  role="slider"
  aria-labelledby="slider-label"
  aria-valuenow={50}
  aria-valuemin={0}
  aria-valuemax={100}
></div>
```bash

### ARIA States

ARIA states communicate the current condition of elements:

```tsx
// Common ARIA states
<button aria-expanded="true">Show Details</button>
<div role="tab" aria-selected="true">Active Tab</div>
<input type="checkbox" aria-checked="true" />
<button aria-disabled="true">Submit</button>
<button aria-pressed="true">Toggle</button>
```bash

Always keep ARIA states updated with JavaScript when the UI changes.

## Semantic HTML

Using semantic HTML elements provides built-in accessibility benefits. Always prefer semantic HTML
over generic divs with ARIA when possible.

### Headings Structure

Proper heading structure creates a document outline for screen reader navigation:

```tsx
<h1>Page Title</h1>
  <h2>Section Heading</h2>
    <h3>Subsection Heading</h3>
  <h2>Another Section</h2>
    <h3>Another Subsection</h3>
```bash

Screen reader users can navigate between headings to quickly understand page structure. Never skip
heading levels (e.g., h1 to h3).

### Lists

Use proper list elements for groups of related items:

```tsx
// Unordered list
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
  <li>List item 3</li>
</ul>

// Ordered list
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>

// Description list
<dl>
  <dt>Term 1</dt>
  <dd>Definition 1</dd>
  <dt>Term 2</dt>
  <dd>Definition 2</dd>
</dl>
```bash

### Tables

Use proper table markup for tabular data:

```tsx
<table>
  <caption>Monthly Sales Data</caption>
  <thead>
    <tr>
      <th scope="col">Month</th>
      <th scope="col">Sales</th>
      <th scope="col">Growth</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">January</th>
      <td>$10,000</td>
      <td>5%</td>
    </tr>
    <tr>
      <th scope="row">February</th>
      <td>$12,000</td>
      <td>20%</td>
    </tr>
  </tbody>
</table>
```bash

### Buttons vs. Links

Use the right element for the right job:

```tsx
// Use buttons for actions within the page
<button onClick={handleSave}>Save Changes</button>

// Use links for navigation to other pages
<a href="/documentation">View Documentation</a>
```bash

## Live Regions

Live regions announce dynamic content changes to screen readers. They are essential for
notifications, alerts, and other dynamic updates.

```tsx
// Simple live region
<div
  aria-live="polite"
  aria-atomic="true"
>
  {message}
</div>

// React component with live region
const NotificationSystem = () => {
  const [message, setMessage] = useState('');

  // Function to show a notification
  const showNotification = (text) => {
    setMessage(text);

    // Clear after 5 seconds
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  return (
    <>
      {/_ Your UI components _/}

      {/_ Live region for announcements _/}
      {message && (
        <div
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </div>
      )}
    </>
  );
};
```bash

Use "polite" for most updates to avoid interrupting the user. Only use "assertive" for critical
information that requires immediate attention.

## Best Practices

1. __Use semantic HTML__ - Prefer native HTML elements over custom widgets when possible
2. __Maintain keyboard focus__ - Ensure focus is visible and logical, especially after dynamic
updates
3. __Provide text alternatives__ - For all non-text content (images, icons, etc.)
4. __Use proper headings__ - Create a logical document structure with headings
5. __Label form controls__ - Every form control needs a label
6. __Test with actual screen readers__ - Don't rely solely on automated tools
7. __Announce dynamic changes__ - Use live regions for updates
8. __Maintain reading order__ - Visual order should match DOM order
9. __Use ARIA sparingly__ - Only use ARIA when HTML alone is insufficient
10. __Keep it simple__ - Complex widgets are harder to make accessible

## Resources

- [WebAIM Screen Reader Survey](https://webaim.org/projects/screenreadersurvey9/) - Research on
screen reader usage patterns
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) - Patterns for accessible
components
- [Screen Reader Keyboard Shortcuts](https://dequeuniversity.com/screenreaders/) - Keyboard
commands for popular screen readers
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/) - Accessibility checklist for
web projects
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Mozilla's
accessibility documentation
