# React Router Testing Workshop

## Overview

This workshop will teach developers how to test React components that use React Router hooks in the AeroSuite application. By the end of this workshop, participants will be able to write reliable tests for components that use React Router hooks and understand the testing utilities provided by the AeroSuite framework.

## Prerequisites

- Basic knowledge of React and React Router
- Familiarity with Jest and React Testing Library
- AeroSuite development environment set up

## Workshop Duration

Approximately 2 hours

## Materials

- Laptop with AeroSuite development environment
- Workshop repository (to be provided)
- React Router Testing Cheat Sheet

## Agenda

### 1. Introduction (15 minutes)

- Welcome and introductions
- Overview of the workshop
- The problem with testing React Router components
- Our solution approach

### 2. Understanding the Problem (20 minutes)

- Explanation of React Router hooks and context requirements
- Common errors when testing React Router components
- Live demonstration of a failing test
- Discussion of potential solutions

### 3. AeroSuite Testing Utilities (30 minutes)

- Overview of the testing utilities:
  - `router-wrapper.tsx`
  - `theme-wrapper.tsx`
  - `combined-wrapper.tsx`
  - `test-setup.tsx`
- How to choose the right utility for your component
- Hands-on exercise: Fixing a simple test

### 4. Advanced Testing Scenarios (30 minutes)

- Testing components with route parameters
- Testing navigation between routes
- Testing protected routes
- Testing redirects
- Hands-on exercise: Testing a component with route parameters

### 5. Automation Scripts (15 minutes)

- Overview of the automation scripts
- Demonstration of the interactive mode
- Demonstration of the batch mode
- Demonstration of the directory mode
- Hands-on exercise: Using the scripts to fix tests

### 6. Best Practices (15 minutes)

- Use specific paths matching component needs
- Include all necessary route parameters
- Use the same route in both `route` and `initialEntries`
- Mock API calls and services
- Test navigation with `userEvent`
- Verify correct routes by checking screen content

### 7. Workshop Challenge (30 minutes)

- Participants work in pairs to fix a set of failing tests
- Apply the knowledge gained from the workshop
- Use the automation scripts where appropriate
- Share solutions and discuss different approaches

### 8. Q&A and Wrap-up (15 minutes)

- Address any questions or concerns
- Review key takeaways
- Additional resources for further learning
- Workshop feedback

## Exercises

### Exercise 1: Fixing a Simple Test

Fix the following test for a component that uses `useNavigate`:

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import NavigationComponent from './NavigationComponent';

describe('NavigationComponent', () => {
  it('renders without crashing', () => {
    render(<NavigationComponent />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

### Exercise 2: Testing a Component with Route Parameters

Write a test for a component that uses `useParams` to display details based on an ID:

```jsx
import React from 'react';
import { useParams } from 'react-router-dom';

function UserDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>User Detail</h1>
      <p>User ID: {id}</p>
    </div>
  );
}

export default UserDetail;
```

### Exercise 3: Workshop Challenge

Fix the following tests in the workshop repository:
1. `CustomerList.test.tsx` - Uses `useNavigate`
2. `ProductDetail.test.tsx` - Uses `useParams`
3. `ProtectedRoute.test.tsx` - Tests a protected route with authentication
4. `SearchResults.test.tsx` - Uses query parameters

## Resources

- [React Router Testing Documentation](docs/testing/react-router-testing.md)
- [Testing Utilities README](client/src/test-utils/README.md)
- [Quick Start Guide](docs/testing/react-router-testing-quickstart.md)
- [Cheat Sheet](docs/testing/react-router-testing-cheatsheet.md)
- [Video Tutorial](docs/testing/react-router-testing-video-script.md) 
