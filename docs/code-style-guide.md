# AeroSuite Code Style Guide

This guide outlines the coding standards and style guidelines for the AeroSuite project. Following these standards ensures consistency, readability, and maintainability across the codebase.

## Table of Contents

- [General Guidelines](#general-guidelines)
- [JavaScript/TypeScript](#javascripttypescript)
- [React Components](#react-components)
- [CSS/SCSS](#cssscss)
- [Node.js/Express](#nodejsexpress)
- [MongoDB/Mongoose](#mongodbmongoose)
- [Testing](#testing)
- [Documentation](#documentation)
- [File Organization](#file-organization)

## General Guidelines

### Principles

- **Readability**: Write code that is easy to read and understand
- **Maintainability**: Write code that is easy to maintain and extend
- **Consistency**: Follow consistent patterns throughout the codebase
- **Simplicity**: Keep code simple and avoid unnecessary complexity
- **Testability**: Write code that is easy to test

### Naming Conventions

- Use meaningful and descriptive names
- Use camelCase for variables, functions, and methods
- Use PascalCase for classes, interfaces, and React components
- Use UPPERCASE_SNAKE_CASE for constants
- Use kebab-case for file names (except for React components which use PascalCase)

### Whitespace and Formatting

- Use 2 spaces for indentation
- Limit line length to 100 characters
- Add a blank line between logical sections
- Use consistent spacing around operators and after commas
- Use semicolons at the end of statements

## JavaScript/TypeScript

### Language Features

- Use ES6+ features when available
- Prefer `const` over `let`, and avoid `var`
- Use arrow functions for anonymous functions
- Use template literals instead of string concatenation
- Use destructuring assignment where appropriate
- Use spread syntax for array and object operations
- Use optional chaining and nullish coalescing operators

### TypeScript

- Use TypeScript for all new code
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Use type aliases for complex types
- Use enums for related constants
- Avoid the `any` type unless absolutely necessary
- Use generics for reusable components and functions

### Examples

```typescript
// Good
const getUserData = async (userId: string): Promise<UserData> => {
  const { firstName, lastName, email } = await fetchUser(userId);
  return { 
    fullName: `${firstName} ${lastName}`,
    email,
    isActive: true
  };
};

// Bad
var getData = async function(id) {
  var data = await fetchUser(id);
  var firstName = data.firstName;
  var lastName = data.lastName;
  var email = data.email;
  return { 
    fullName: firstName + ' ' + lastName,
    email: email,
    isActive: true
  };
};
```

## React Components

### Component Structure

- Use functional components with hooks instead of class components
- Each component should have a single responsibility
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use prop destructuring in function parameters

### Props

- Use TypeScript interfaces to define prop types
- Provide default props where appropriate
- Validate props with TypeScript or PropTypes
- Use descriptive prop names

### Hooks

- Follow the Rules of Hooks
- Use custom hooks to share logic between components
- Keep hook dependencies accurate and minimal
- Name hooks with the `use` prefix

### Examples

```tsx
// Good
interface UserProfileProps {
  userId: string;
  showDetails?: boolean;
}

const UserProfile = ({ userId, showDetails = false }: UserProfileProps) => {
  const { user, isLoading, error } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      {showDetails && (
        <div className="user-details">
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
        </div>
      )}
    </div>
  );
};

// Bad
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      isLoading: true,
      error: null
    };
  }

  componentDidMount() {
    fetchUser(this.props.userId)
      .then(user => this.setState({ user, isLoading: false }))
      .catch(error => this.setState({ error, isLoading: false }));
  }

  render() {
    if (this.state.isLoading) return <div>Loading...</div>;
    if (this.state.error) return <div>Error: {this.state.error.message}</div>;

    return (
      <div className="user-profile">
        <h2>{this.state.user.name}</h2>
        {this.props.showDetails && (
          <div className="user-details">
            <p>Email: {this.state.user.email}</p>
            <p>Role: {this.state.user.role}</p>
          </div>
        )}
      </div>
    );
  }
}
```

## CSS/SCSS

### Styling Approach

- Use CSS Modules or styled-components for component styling
- Use SCSS for global styles
- Follow BEM (Block Element Modifier) naming convention when applicable
- Use variables for colors, font sizes, spacing, etc.
- Keep CSS selectors simple and avoid deep nesting

### Organization

- Group related properties together
- Order properties consistently (e.g., positioning, box model, typography, visual)
- Use media queries for responsive design
- Extract common styles into mixins and utility classes

### Examples

```scss
// Good (SCSS with BEM)
.user-card {
  display: flex;
  padding: 16px;
  border-radius: 4px;
  background-color: $card-background;

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin-right: 16px;
  }

  &__name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  &__email {
    font-size: 14px;
    color: $text-secondary;
  }

  &--active {
    border-left: 4px solid $primary-color;
  }
}

// Bad
.user-card {
  display: flex;
  padding: 16px;
  border-radius: 4px;
  background-color: white;
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin-right: 16px;
  }
  .details {
    .name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .email {
      font-size: 14px;
      color: grey;
    }
  }
}
```

## Node.js/Express

### API Design

- Follow RESTful API design principles
- Use plural nouns for resource endpoints
- Use HTTP methods appropriately (GET, POST, PUT, DELETE)
- Use consistent response formats
- Handle errors gracefully and provide meaningful error messages
- Use middleware for cross-cutting concerns

### Controllers and Services

- Separate business logic from controllers
- Use the model-service-controller pattern
- Keep controllers thin and focused on request/response handling
- Implement service classes for business logic
- Use dependency injection for better testability

### Examples

```javascript
// Good (Controller)
const userController = {
  async getUser(req, res, next) {
    try {
      const userId = req.params.id;
      const user = await userService.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }
      
      return res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
};

// Good (Service)
const userService = {
  async findById(userId) {
    return await User.findById(userId).select('-password');
  }
};

// Bad
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.send(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
```

## MongoDB/Mongoose

### Schema Design

- Design schemas based on access patterns
- Use appropriate data types
- Define indexes for frequently queried fields
- Use schema validation
- Keep documents reasonably sized
- Use references or embedding based on relationship types

### Queries

- Use Mongoose methods instead of raw MongoDB operations
- Chain query methods for better readability
- Use projection to limit returned fields
- Use pagination for large result sets
- Handle potential errors in database operations

### Examples

```javascript
// Good (Schema)
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a virtual property
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Good (Query)
const getActiveUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  return await User
    .find({ status: 'active' })
    .select('email firstName lastName role')
    .sort({ lastName: 1, firstName: 1 })
    .skip(skip)
    .limit(limit)
    .exec();
};
```

## Testing

### General Testing Guidelines

- Write tests before or alongside code (TDD/BDD approach)
- Focus on behavior, not implementation details
- Keep tests independent and isolated
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern

### Component Testing

- Test rendering and user interactions
- Test component props and state changes
- Use React Testing Library to test behavior instead of implementation
- Mock external dependencies and API calls

### API Testing

- Test API endpoints for correct responses
- Test error handling and edge cases
- Use supertest for HTTP assertions
- Use test databases instead of production databases

### Examples

```javascript
// Good (Component Test)
describe('UserProfile', () => {
  test('displays user information when loaded', async () => {
    // Arrange
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin'
    };
    jest.spyOn(userService, 'getUser').mockResolvedValue(mockUser);
    
    // Act
    render(<UserProfile userId="123" />);
    
    // Assert
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Role: Admin')).toBeInTheDocument();
  });
  
  test('displays error message when user fetch fails', async () => {
    // Arrange
    jest.spyOn(userService, 'getUser').mockRejectedValue(new Error('Failed to fetch user'));
    
    // Act
    render(<UserProfile userId="123" />);
    
    // Assert
    expect(await screen.findByText('Error: Failed to fetch user')).toBeInTheDocument();
  });
});

// Good (API Test)
describe('User API', () => {
  test('GET /api/users/:id returns 200 and user data for valid ID', async () => {
    // Arrange
    const userId = 'valid-user-id';
    const mockUser = {
      _id: userId,
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };
    jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
    
    // Act
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${validToken}`);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    });
  });
});
```

## Documentation

### Code Documentation

- Use JSDoc for documenting functions, classes, and interfaces
- Document parameters, return values, and thrown exceptions
- Include examples for complex functions
- Document non-obvious behavior and edge cases

### API Documentation

- Use OpenAPI/Swagger for documenting API endpoints
- Document request and response formats
- Include authentication requirements
- Document error responses and status codes

### Examples

```javascript
/**
 * Authenticates a user and returns a JWT token
 * 
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Promise<{token: string, user: User}>} The JWT token and user object
 * @throws {AuthError} If authentication fails
 * 
 * @example
 * try {
 *   const { token, user } = await authService.login('user@example.com', 'password123');
 *   // Use token for authenticated requests
 * } catch (error) {
 *   console.error('Authentication failed:', error.message);
 * }
 */
const login = async (email, password) => {
  // Implementation
};
```

## File Organization

### Directory Structure

- Group files by feature or module instead of file type
- Keep related files close to each other
- Use index files to export public API of modules
- Keep directory nesting to a reasonable level

### File Naming

- Use descriptive file names that reflect the content
- Use consistent file naming conventions
- Use appropriate file extensions (.js, .ts, .tsx, .scss, etc.)
- Name test files with .test.js or .spec.js suffix

### Examples

```
// Good
features/
  users/
    components/
      UserList.tsx
      UserDetail.tsx
      UserForm.tsx
    hooks/
      useUsers.ts
    services/
      userService.ts
    tests/
      UserList.test.tsx
      UserDetail.test.tsx
      userService.test.ts
    types/
      User.ts
    index.ts

// Bad
components/
  UserList.tsx
  UserDetail.tsx
  UserForm.tsx
hooks/
  useUsers.ts
services/
  userService.ts
tests/
  UserList.test.tsx
  UserDetail.test.tsx
  userService.test.ts
types/
  User.ts
```

## Conclusion

This style guide is not exhaustive but covers the main aspects of coding standards for the AeroSuite project. When in doubt, consider these principles:

1. Consistency is more important than personal preference
2. Code is read more often than it is written
3. Follow the conventions of the existing codebase
4. When adding a new pattern, document it and update this guide

The automatic linting and formatting tools (ESLint, Prettier) should help enforce many of these standards automatically. 
