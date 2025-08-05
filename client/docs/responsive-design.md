# Responsive Design System

This document provides an overview of AeroSuite's responsive design system, which ensures a consistent user experience across different devices and screen sizes.

## Components

### TouchTargetWrapper

The `TouchTargetWrapper` component enhances interactive elements to meet accessibility standards for touch targets.

```tsx
import TouchTargetWrapper from '../components/common/TouchTargetWrapper';

// Basic usage
<TouchTargetWrapper>
  <Button variant="contained" size="small">Small Button</Button>
</TouchTargetWrapper>

// Advanced usage with configuration
<TouchTargetWrapper 
  minSize={64}
  applyWidth={true}
  applyHeight={true}
  centerContent={true}
>
  <IconButton size="small">
    <PhoneIcon fontSize="small" />
  </IconButton>
</TouchTargetWrapper>
```

### ResponsiveLayoutAudit

The `ResponsiveLayoutAudit` component helps developers audit responsive layouts by showing viewport size and breakpoints.

```tsx
import ResponsiveLayoutAudit from '../components/common/ResponsiveLayoutAudit';

// Basic usage
<ResponsiveLayoutAudit />

// Advanced usage with configuration
<ResponsiveLayoutAudit
  initiallyVisible={true}
  position="bottom-right"
  showGridOverlay={false}
  highlightTouchTargets={false}
/>
```

### ResponsiveGrid

The `ResponsiveGrid` component provides a flexible grid system that adapts to different screen sizes.

```tsx
import { ResponsiveGrid, ResponsiveGridItem } from '../components/layout/ResponsiveGrid';

// Basic usage
<ResponsiveGrid spacing={2}>
  <ResponsiveGridItem xs={12} sm={6} md={4} lg={3}>
    <Card>
      <CardContent>Item 1</CardContent>
    </Card>
  </ResponsiveGridItem>
  <ResponsiveGridItem xs={12} sm={6} md={4} lg={3}>
    <Card>
      <CardContent>Item 2</CardContent>
    </Card>
  </ResponsiveGridItem>
</ResponsiveGrid>

// Advanced usage with configuration
<ResponsiveGrid 
  spacing={{ xs: 1, sm: 2, md: 3 }}
  mobileDirection="column"
  tabletDirection="row"
  desktopDirection="row"
  mobileSingleColumn={true}
>
  {/* Grid items */}
</ResponsiveGrid>
```

## Utilities

### touchTargetUtils

The `touchTargetUtils` module provides utilities for enhancing touch targets on mobile devices.

```tsx
import { 
  useTouchTargetStyles, 
  createTouchTargetStyles, 
  getResponsiveSpacing,
  createResponsivePadding
} from '../utils/touchTargetUtils';

// Using the hook
const touchTargetStyles = useTouchTargetStyles({
  minSize: 48,
  applyWidth: true,
  applyHeight: true,
  centerContent: true
});

// Using the utility function
const styles = createTouchTargetStyles(isMobile, {
  minSize: 48,
  applyWidth: true,
  applyHeight: true
});

// Get responsive spacing
const spacing = getResponsiveSpacing(2, 1, isMobile);

// Create responsive padding
const paddingStyles = createResponsivePadding(2, 1, isMobile);
```

### useResponsive

The `useResponsive` hook provides information about the current viewport and device.

```tsx
import useResponsive from '../hooks/useResponsive';

const {
  width,
  height,
  orientation,
  isMobile,
  isTablet,
  isDesktop,
  matchesQuery,
  getCurrentBreakpoint,
  getGridColumns,
  viewportUnits,
  getResponsiveStyles,
  getSpacing
} = useResponsive();

// Conditional rendering based on device type
{isMobile ? (
  <MobileComponent />
) : isTablet ? (
  <TabletComponent />
) : (
  <DesktopComponent />
)}

// Using responsive styles
const styles = getResponsiveStyles(
  { padding: 2 },
  {
    xs: { padding: 1 },
    md: { padding: 3 }
  }
);
```

## Best Practices

### Touch Targets

- Ensure touch targets are at least 48×48 pixels on mobile devices
- Use the `TouchTargetWrapper` component for small interactive elements
- Increase padding for buttons and interactive elements on mobile

### Responsive Layout

- Design mobile-first, then enhance for larger screens
- Use relative units (%, em, rem) instead of fixed pixels
- Use the `ResponsiveGrid` component for adaptive layouts
- Test on real devices, not just browser resizing

### Content Adaptation

- Prioritize content for different screen sizes
- Hide non-essential content on mobile devices
- Adjust typography sizes for better readability on small screens
- Use responsive images with appropriate sizes for different devices

### Testing

- Use the `ResponsiveLayoutAudit` component to debug layouts
- Test on various devices and orientations
- Check for touch target size issues
- Verify that all content is accessible on mobile

## Breakpoints

AeroSuite uses the following breakpoints:

| Name | Width (px) | Device Type |
|------|------------|-------------|
| xs   | 0-599      | Mobile phones |
| sm   | 600-899    | Small tablets |
| md   | 900-1199   | Large tablets |
| lg   | 1200-1535  | Laptops |
| xl   | 1536+      | Desktops |

## Demo Page

Visit the [Responsive Design Demo](/demos/responsive-design) page to see all responsive design components and utilities in action. 
