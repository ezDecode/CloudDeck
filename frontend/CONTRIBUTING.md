# Contributing to CloudDeck

Thank you for your interest in contributing to CloudDeck! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please read and follow our code of conduct:

- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git
- AWS account (for testing)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/clouddeck.git
   cd clouddeck/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## 📝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (browser, OS, AWS region)

### Suggesting Features

Feature suggestions are welcome! Please include:

- **Clear description** of the feature
- **Use case** and motivation
- **Mockups or examples** if applicable
- **Implementation considerations**

### Pull Requests

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add file preview feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.title - Component title
 */
export default function Component({ title }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <motion.div
      className="component-class"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Component content */}
    </motion.div>
  );
}
```

### CSS/Styling Guidelines

- Use TailwindCSS utility classes
- Follow mobile-first responsive design
- Use semantic class names for custom CSS
- Maintain dark mode compatibility

```jsx
// Good
<div className="flex items-center p-4 bg-white dark:bg-slate-800">

// Avoid inline styles
<div style={{ padding: '16px' }}>
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## 📚 Documentation

### Component Documentation

Use JSDoc comments for all components:

```jsx
/**
 * File explorer component for browsing S3 objects
 * @param {Object} props - Component props
 * @param {Array} props.files - List of files to display
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {string} props.viewMode - Display mode ('grid' | 'list')
 */
export default function FileExplorer({ files, onFileSelect, viewMode }) {
  // Component implementation
}
```

### README Updates

When adding features, update relevant documentation:

- Main README.md
- Setup guides
- API documentation

## 🔒 Security Guidelines

### AWS Credentials

- Never commit AWS credentials
- Use environment variables for sensitive data
- Follow principle of least privilege for IAM policies

### Code Security

- Validate all user inputs
- Sanitize data before displaying
- Use HTTPS for all external requests
- Follow OWASP security guidelines

## 🚀 Performance Guidelines

### Optimization Techniques

- Use React.memo for expensive components
- Implement lazy loading for large lists
- Optimize images and assets
- Use efficient state management

```jsx
// Good: Memoized component
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// Good: Lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

### Bundle Size

- Monitor bundle size with each change
- Use dynamic imports for large dependencies
- Remove unused code and dependencies

## 🐛 Debugging

### Development Tools

- React Developer Tools
- Redux DevTools (if applicable)
- Browser DevTools
- AWS CloudTrail for S3 API debugging

### Common Issues

- CORS configuration problems
- AWS credential issues
- File upload/download failures
- Browser compatibility issues

## 📋 Review Process

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design works
- [ ] Dark mode compatibility
- [ ] Accessibility considerations

### Code Review

All submissions require code review. Reviewers will check:

- Code quality and style
- Performance implications
- Security considerations
- Test coverage
- Documentation completeness

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Test thoroughly
5. Create GitHub release
6. Deploy to production

## 🆘 Getting Help

### Resources

- [React Documentation](https://reactjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [AWS S3 API Reference](https://docs.aws.amazon.com/s3/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

### Support Channels

- GitHub Issues for bug reports
- GitHub Discussions for questions
- Discord community (if available)
- Email support for security issues

## 🎉 Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes
- Project documentation
- Social media shoutouts

## 📄 License

By contributing to CloudDeck, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to CloudDeck! 🚀**
