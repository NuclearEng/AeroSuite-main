# AeroSuite UI Component Library

This library follows the Atomic Design methodology:
- **Atoms:** Basic building blocks (Button, Input, etc.)
- **Molecules:** Combinations of atoms (FormField, LabeledInput, etc.)
- **Organisms:** Complex components (DataTable, CardList, etc.)

## Usage
Import components from the relevant subfolder:
```js
import Button from './atoms/Button';
```

## Contributing
- Add new components in the appropriate folder.
- Document props with JSDoc.
- Add Storybook stories for each component.

## Storybook
Run `npm run storybook` to view and develop components interactively.

## Structure

The library is organized according to Atomic Design methodology:

- **Atoms**: Basic building blocks (buttons, inputs, labels, etc.)
- **Molecules**: Simple combinations of atoms (form fields, search bars, etc.)
- **Organisms**: Complex UI components (navigation bars, forms, etc.)
- **Templates**: Page layouts and structures
- **Pages**: Complete page templates

## Available Components

### Atoms
- Button
- Input
- Typography
- Icon
- Badge
- Spinner
- Checkbox
- Radio
- Switch
- Tooltip

### Molecules
- FormField
- SearchBar
- Card
- Alert
- Pagination
- Dropdown
- Tabs
- Breadcrumbs
- Modal
- Notification

### Organisms
- DataTable
- Form
- Navigation
- Header
- Footer
- Sidebar
- Chart
- FileUploader
- FilterPanel
- Wizard

### Templates
- DashboardLayout
- AuthLayout
- SettingsLayout
- ReportLayout
- DetailLayout
- ListLayout
- FormLayout
- SplitLayout
- FullWidthLayout
- PrintLayout

### Pages
- LoginPage
- RegisterPage
- DashboardPage
- SettingsPage
- ProfilePage
- NotFoundPage
- ErrorPage
- ListingPage
- DetailPage
- FormPage

## Design Principles

1. **Consistency**: All components follow the same design language and patterns
2. **Composability**: Components can be easily combined to create more complex UIs
3. **Reusability**: Components are designed to be reused across the application
4. **Accessibility**: Components are built with accessibility in mind
5. **Customization**: Components can be customized through props

When adding new components:

1. Place them in the appropriate category folder
2. Export them from the category's index.ts file
3. Follow the existing naming and code style conventions
4. Include proper TypeScript typing
5. Ensure the component is properly documented 