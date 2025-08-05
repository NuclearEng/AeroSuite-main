# Micro-Interactions System

This document provides an overview of AeroSuite's micro-interactions system, which adds subtle animations and feedback to enhance the user experience.

## Components

### AnimatedButton

The `AnimatedButton` component adds interactive animations and feedback states to buttons.

```tsx
import AnimatedButton from '../components/common/AnimatedButton';

// Basic usage
<AnimatedButton variant="contained">
  Click Me
</AnimatedButton>

// With hover and click effects
<AnimatedButton 
  variant="contained"
  hoverEffect="scale"
  clickEffect="ripple"
>
  Interactive Button
</AnimatedButton>

// With loading state
<AnimatedButton 
  variant="contained"
  loading={isLoading}
  onClick={handleClick}
>
  Submit
</AnimatedButton>

// With success animation
<AnimatedButton 
  variant="contained"
  success={isSuccess}
  showSuccessAnimation
>
  Success Button
</AnimatedButton>
```

### AnimatedFeedback

The `AnimatedFeedback` component provides animated feedback messages for different states.

```tsx
import AnimatedFeedback from '../components/common/AnimatedFeedback';

// Basic usage
<AnimatedFeedback 
  type="success"
  message="Operation completed successfully."
/>

// With custom duration and callback
<AnimatedFeedback 
  type="error"
  message="An error occurred."
  duration={5000}
  onComplete={() => setShowFeedback(false)}
/>

// Minimal version
<AnimatedFeedback 
  type="info"
  message="Processing your request..."
  minimal
/>

// With custom animation
<AnimatedFeedback 
  type="warning"
  message="This action cannot be undone."
  animationType="slideInLeft"
/>
```

## Utilities

### animationUtils

The `animationUtils` module provides utilities for creating and managing animations.

```tsx
import { 
  createTransition, 
  createKeyframeAnimation, 
  animationPresets,
  createHoverAnimation,
  createStaggeredAnimation,
  prefersReducedMotion
} from '../utils/animationUtils';

// Create a CSS transition
const transition = createTransition(['transform', 'opacity'], {
  duration: 300,
  delay: 0,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
});

// Create keyframe animation styles
const fadeInStyles = createKeyframeAnimation(
  'fadeIn',
  {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 }
  },
  { duration: 500 }
);

// Use animation preset
const slideInStyles = animationPresets.slideInBottom({
  duration: 400,
  delay: 100
});

// Create hover animation
const hoverStyles = createHoverAnimation({
  transform: 'scale(1.05)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
});

// Create staggered animation
const getListItemStyles = createStaggeredAnimation(
  animationPresets.fadeIn(),
  { delay: 100 }
);

// Check reduced motion preference
if (prefersReducedMotion()) {
  // Provide alternative non-animated experience
}
```

### Animation Hooks

The animation hooks provide a React-friendly way to use animations in functional components.

```tsx
import { 
  useAnimation, 
  useStaggeredAnimation, 
  useHoverAnimation 
} from '../hooks/useAnimation';

// Basic animation hook
const fadeIn = useAnimation('fadeIn', { 
  duration: 500,
  autoPlay: true
});

// Control animation
const slideIn = useAnimation('slideInBottom', { 
  autoPlay: false,
  onComplete: () => console.log('Animation completed')
});

// Start animation programmatically
const handleClick = () => {
  slideIn.play();
};

// Apply animation styles
<Box sx={fadeIn.style}>
  This content will fade in
</Box>

// Staggered animations for lists
const listAnimations = useStaggeredAnimation('fadeIn', 5, { 
  duration: 400
});

// Apply to list items
{items.map((item, index) => (
  <ListItem key={index} sx={listAnimations[index]}>
    {item}
  </ListItem>
))}

// Hover animations
const hoverStyles = useHoverAnimation({
  transform: 'scale(1.05)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
});

// Apply hover styles
<Card sx={hoverStyles}>
  This card will animate on hover
</Card>
```

## Animation Presets

The following animation presets are available:

| Preset | Description |
|--------|-------------|
| `fadeIn` | Fades in an element from transparent to opaque |
| `fadeOut` | Fades out an element from opaque to transparent |
| `slideInTop` | Slides an element in from the top |
| `slideInBottom` | Slides an element in from the bottom |
| `slideInLeft` | Slides an element in from the left |
| `slideInRight` | Slides an element in from the right |
| `scaleIn` | Scales an element from smaller to full size |
| `scaleOut` | Scales an element from full size to smaller |
| `bounce` | Creates a bouncing effect |
| `pulse` | Creates a pulsing effect |
| `shake` | Creates a shaking effect |
| `rotate` | Rotates an element 360 degrees |

## Accessibility

The micro-interactions system respects user preferences for reduced motion:

- All animations check the `prefers-reduced-motion` media query
- When reduced motion is preferred, animations are either disabled or simplified
- Animation durations are kept short (under 500ms) to avoid disruption
- Animations never block user interaction

## Best Practices

### Do's

- Keep animations subtle and purposeful
- Use consistent animations for similar actions
- Provide visual feedback for user actions
- Respect reduced motion preferences
- Keep animations short (under 500ms)

### Don'ts

- Don't overuse animations
- Avoid long animations that delay user interaction
- Don't use animations that block user input
- Avoid jarring or unexpected animations
- Don't ignore performance considerations

## Demo Page

Visit the [Micro-Interactions Demo](/demos/micro-interactions) page to see all animation components and utilities in action. 
