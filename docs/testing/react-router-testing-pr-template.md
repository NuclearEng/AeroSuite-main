# [DEV004] Fix React Router Testing Issues

## Description

This PR addresses issues with testing React components that use React Router hooks. Components
using hooks like `useNavigate`, `useParams`, etc. were failing in tests with errors like:

```bash
Error: useNavigate() may be used only in the context of a <Router> component.
```bash

This PR implements a comprehensive solution with testing utilities, global mocks, and updated
component tests.

## Changes

### Testing Utilities

- Created `router-wrapper.tsx` with `renderWithRouter` function and `RouterWrapper` component
- Created `theme-wrapper.tsx` with `renderWithTheme` function and `ThemeWrapper` component
- Created `combined-wrapper.tsx` with `renderWithRouterAndTheme` function and `CombinedWrapper`
component
- Updated `test-setup.tsx` with a custom render function that wraps components with necessary
providers

### Global Mocks

- Updated `setupTests.ts` to include mocks for React Router hooks, fetch, localStorage, and
IntersectionObserver

### Component Tests Updated

- Customer components: `CustomerDetail.test.tsx`, `CustomerList.test.tsx`, `EditCustomer.test.tsx`
- Supplier components: `SupplierDetail.test.tsx`, `SupplierList.test.tsx`, `SupplierEdit.test.tsx`,
`EditSupplier.test.tsx`
- Inspection components: `InspectionDetail.test.tsx`, `InspectionList.test.tsx`,
`ScheduleInspection.test.tsx`, `InspectionAnalytics.test.tsx`, `ConductInspection.test.tsx`

### Documentation and Scripts

- Created documentation in `docs/testing/react-router-testing.md`
- Created README file in `client/src/test-utils/README.md`
- Created scripts to help automate the process of updating component tests:
  - `apply-router-test-fixes.js`: Interactive script to fix tests one by one
  - `batch-fix-router-tests.js`: Script to fix multiple tests at once
  - `fix-router-tests.sh`: Shell script with a menu interface for the above scripts
  - `README-router-test-fixer.md`: Documentation for using the scripts

## Benefits

1. __Consistent Testing Approach__: All components now follow a consistent approach to testing
React Router components.
2. __Improved Test Reliability__: Tests now properly simulate the environment in which components
will be used.
3. __Reduced Boilerplate__: The utility functions reduce the amount of boilerplate code needed in
each test.
4. __Better Mocking__: Proper mocks for React Router hooks and other dependencies make tests more
reliable.
5. __Easier Maintenance__: The centralized approach makes it easier to maintain and update tests in
the future.
6. __Automation__: Scripts help automate the process of fixing other tests.

## How to Test

1. Run the tests for the updated components:
   ```bash
   cd client
   npm test -- --testPathPattern="src/pages/(customers|suppliers|inspections)"
   ```

2. Try the automation scripts to fix other tests:
   ```bash
   cd client
   ./scripts/fix-router-tests.sh
   ```

## Notes

- The automation scripts create backups of the original files before making changes
- You may need to manually adjust the path, route, and initialEntries values after using the scripts
- The scripts add the task reference comment to help track which files have been updated
