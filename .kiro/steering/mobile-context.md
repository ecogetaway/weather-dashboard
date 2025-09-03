---
inclusion: always
---

# Mobile-First Development Guidelines

## Responsive Design Principles

- Use mobile-first approach with min-width media queries
- Default breakpoint for mobile: `< 768px` (defined in `src/styles/breakpoints.css`)
- Ensure touch-friendly interface elements (minimum 44px touch targets)
- Test layouts at common mobile viewports: 320px, 375px, 414px

## Component Architecture

- Components should be responsive by default
- Use CSS Grid and Flexbox for layout management
- Implement conditional rendering for mobile vs desktop features when necessary
- Leverage the `@` alias for clean imports (`@/components`, `@/utils`, etc.)

## Code Style & Standards

- Follow TypeScript strict mode conventions
- Use functional components with hooks
- Implement proper type definitions in `src/types/`
- Maintain component exports through index files
- Use CSS Modules with camelCase naming convention

## Testing Requirements

- Write unit tests for all utility functions
- Test responsive behavior at different viewport sizes
- Use React Testing Library for component testing
- Run tests with `npm run test` before committing

## Performance Considerations

- Optimize images for mobile bandwidth
- Implement lazy loading for non-critical components
- Use React.memo() for expensive re-renders
- Consider mobile data usage in API calls

## Weather Dashboard Specific

- Forecast layout should adapt to column layout on mobile (`< 768px`)
- Ensure weather data is easily readable on small screens
- Implement swipe gestures for forecast navigation on mobile devices
