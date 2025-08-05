# Testing React Router Components in AeroSuite
## A Comprehensive Solution

---

## The Problem

- Components using React Router hooks fail in tests
- Error: `useNavigate() may be used only in the context of a <Router> component`
- Similar errors with `useParams`, `useLocation`, etc.
- Tests need to provide Router context

---

## Our Solution

1. Custom testing utilities
2. Global mocks
3. Updated component tests
4. Automation scripts
5. Comprehensive documentation

---

## Testing Utilities

- `router-wrapper.tsx`: For components using React Router hooks
- `theme-wrapper.tsx`: For components using Material-UI Theme
- `combined-wrapper.tsx`: For components using both
- `test-setup.tsx`: Custom render function with necessary providers

---

## How It Works

**Before:**
```jsx
render(<CustomerDetail />);
```

**After:**
```jsx
renderWithRouterAndTheme(<CustomerDetail />, {
  path: '/customers/:id',
  route: '/customers/123',
  initialEntries: ['/customers/123']
});
```

---

## Choosing the Right Utility

1. **React Router only:** `renderWithRouter`
2. **Material-UI Theme only:** `renderWithTheme`
3. **Both:** `renderWithRouterAndTheme`

---

## Route Parameters

```jsx
renderWithRouter(<CustomerDetail />, {
  path: '/customers/:id',  // Route pattern with parameter placeholders
  route: '/customers/123', // Actual URL for the test
  initialEntries: ['/customers/123'] // History stack
});
```

- Makes `id` parameter available via `useParams()`

---

## Automation Scripts

- `fix-router-tests.sh`: Main script with menu interface
  - Interactive mode: Fix tests one by one
  - Batch mode: Fix all tests at once
  - Directory mode: Fix tests in a specific directory

---

## What the Scripts Do

1. Scan test files for React Router hooks
2. Add appropriate imports
3. Replace `render` calls with appropriate wrapper function
4. Add task reference comment
5. Create backups of original files

---

## Components Fixed

- **Customer components:** 
  - CustomerDetail, CustomerList, EditCustomer
- **Supplier components:** 
  - SupplierDetail, SupplierList, SupplierEdit, EditSupplier
- **Inspection components:** 
  - InspectionDetail, InspectionList, ScheduleInspection, InspectionAnalytics, ConductInspection

---

## Benefits

1. **Consistent Testing Approach**
2. **Improved Test Reliability**
3. **Reduced Boilerplate**
4. **Better Mocking**
5. **Easier Maintenance**
6. **Automation**

---

## Documentation

- Technical documentation: `docs/testing/react-router-testing.md`
- Quick start guide: `docs/testing/react-router-testing-quickstart.md`
- Cheat sheet: `docs/testing/react-router-testing-cheatsheet.md`
- Video tutorial script: `docs/testing/react-router-testing-video-script.md`
- PR template: `docs/testing/react-router-testing-pr-template.md`

---

## Best Practices

1. Use specific paths matching component needs
2. Include all necessary route parameters
3. Use the same route in both `route` and `initialEntries`
4. Mock API calls and services
5. Test navigation with `userEvent`
6. Verify correct routes by checking screen content

---

## How to Get Started

1. Read the quick start guide
2. Use the cheat sheet for reference
3. Try the automation scripts
4. Ask questions if needed

---

## Demo

[Live demonstration of fixing a test]

---

## Questions?

Thank you for your attention!

Contact the team for any questions or assistance. 
