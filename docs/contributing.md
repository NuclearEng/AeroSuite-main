# Contributing to AeroSuite

Thank you for your interest in contributing to AeroSuite! This document provides guidelines and
instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Community](#community)

## Code of Conduct

AeroSuite is committed to fostering an inclusive and welcoming community. We expect all
contributors to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed Node.js (v18+)
- You have installed MongoDB (v5+)
- You have a basic understanding of Git
- You have read the [Developer Guide](developer-guide.md)

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/aerosuite.git
   cd aerosuite
   ```
3. Add the original repository as an upstream remote:
   ```bash
   git remote add upstream https://github.com/original-owner/aerosuite.git
   ```
4. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```
5. Set up your environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## Development Process

### Finding Issues to Work On

1. Check the [Issues](https://github.com/original-owner/aerosuite/issues) tab for open issues
2. Look for issues labeled `good first issue` if you're new to the project
3. Comment on an issue to express your interest in working on it

### Working on Features or Fixes

1. Make sure there's an issue for the work you're about to do
2. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```
   - Use `feature/` prefix for new features
   - Use `bugfix/` prefix for bug fixes
   - Use `docs/` prefix for documentation changes
   - Use `test/` prefix for test additions or changes

3. Implement your changes, following the [coding standards](#coding-standards)
4. Add tests for your changes when applicable
5. Update documentation as needed
6. Commit your changes following [commit message guidelines](#commit-message-guidelines)
7. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Process

1. Go to the original repository and create a new pull request from your feature branch
2. Fill in the PR template with all required information
3. Link the PR to the relevant issue(s)
4. Ensure all CI checks pass
5. Request a review from maintainers
6. Address any feedback from reviewers
7. Once approved, your PR will be merged by a maintainer

### PR Requirements Checklist

- [ ] Code follows project standards
- [ ] Tests are added or updated to cover changes
- [ ] Documentation is updated
- [ ] All CI checks pass
- [ ] PR is linked to an issue
- [ ] Commit messages follow guidelines

## Coding Standards

### General Guidelines

- Write clean, readable, and maintainable code
- Follow DRY (Don't Repeat Yourself) principles
- Keep functions small and focused on a single responsibility
- Use meaningful variable and function names
- Comment complex logic, but prefer self-documenting code

### JavaScript/TypeScript Style

The project uses ESLint and Prettier for code formatting:

- Use ES6+ features where appropriate
- Prefer const over let, and avoid var
- Use async/await for asynchronous code
- Use destructuring where it improves readability
- Follow functional programming patterns when possible

### React Guidelines

- Use functional components with hooks
- Break down large components into smaller, reusable ones
- Use PropTypes or TypeScript for type checking
- Follow React's best practices for performance optimization
- Use CSS-in-JS or CSS modules for component styling

### Backend Guidelines

- Follow RESTful API design principles
- Implement proper error handling and validation
- Use dependency injection where appropriate
- Separate business logic from controllers
- Follow the model-service-controller pattern

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```bash

### Types

- __feat__: A new feature
- __fix__: A bug fix
- __docs__: Documentation only changes
- __style__: Changes that do not affect the meaning of the code
- __refactor__: Code change that neither fixes a bug nor adds a feature
- __perf__: Code change that improves performance
- __test__: Adding missing tests or correcting existing tests
- __chore__: Changes to the build process or auxiliary tools

### Examples

```bash
feat(auth): add email verification functionality

Implements email verification using JWT tokens.

Closes #123
```bash

```bash
fix(ui): prevent form submission on invalid input

The form was being submitted even when validation failed.

Fixes #456
```bash

## Testing Guidelines

### Writing Tests

- Write tests for all new features and bug fixes
- Aim for high test coverage (minimum 80%)
- Structure tests using the "Arrange-Act-Assert" pattern
- Mock external dependencies when necessary
- Write tests that are fast, isolated, and repeatable

### Types of Tests

- __Unit Tests__: Test individual functions and components
- __Integration Tests__: Test interactions between components
- __End-to-End Tests__: Test complete user flows
- __Performance Tests__: Test system performance
- __Security Tests__: Test for vulnerabilities

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific tests
npm test -- -t "component name"
```bash

## Documentation

Good documentation is crucial for the project's success:

### Code Documentation

- Document public APIs, classes, and functions
- Explain complex algorithms and business logic
- Include examples where helpful
- Keep documentation up to date with code changes

### README and Wiki

- Update the README.md when adding significant features
- Contribute to wiki pages for more detailed explanations
- Add screenshots or diagrams where they help understanding

### Documentation Standards

- Use clear, concise language
- Structure documentation with headings and lists
- Link to other relevant documentation
- Include code examples when applicable

## Issue Reporting

When reporting issues, please use the provided issue templates and include:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Environment information (browser, OS, device)
7. Any additional context

## Feature Requests

Feature requests are welcome! When submitting a feature request:

1. Use the feature request template
2. Clearly describe the problem the feature would solve
3. Suggest a solution if possible
4. Consider the impact on existing functionality
5. Explain benefits and potential drawbacks

## Community

### Communication Channels

- __GitHub Issues__: For bug reports and feature requests
- __Developer Forum__: For technical discussions
- __Slack Channel__: For real-time communication
- __Monthly Meetings__: For project planning and updates

### Recognition

All contributors are recognized in:

- The project's README
- Release notes
- The contributors page on the website

### Becoming a Maintainer

Regular contributors who demonstrate expertise and commitment may be invited to become maintainers
with additional repository access and responsibilities.

## Thank You!

Your contributions make AeroSuite better. We appreciate your time and effort!
