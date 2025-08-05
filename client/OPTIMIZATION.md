# Performance Optimization Guide

## Memory Issues

If you're experiencing memory issues during development or build, try these approaches:

### Development Mode

1. Start the app with increased memory:
   ```
   npm run start:optimized
   ```

2. If you still experience issues, try building and serving:
   ```
   npm run build:optimized
   npx serve -s build
   ```

### Production Build

Use the optimized build script:
```
npm run build:optimized
```

### Analyze Bundle Size

Run the analyzer to see what's taking up space:
```
npm run analyze
```

## Performance Recommendations

1. **Code Splitting**: Use dynamic imports and React.lazy for route-based code splitting
2. **Virtualization**: Use virtualized lists for large data sets (react-window, react-virtualized)
3. **Memoization**: Use React.memo, useMemo, and useCallback to prevent unnecessary renders
4. **Image Optimization**: Compress images and use WebP format where possible
5. **Tree Shaking**: Import only what you need from libraries
6. **Dependencies**: Regularly audit dependencies and remove unused ones

## Memory Leak Debugging

To find memory leaks:

1. Open Chrome DevTools
2. Go to the Memory tab
3. Take a heap snapshot
4. Perform the action that might cause a leak
5. Take another snapshot
6. Compare snapshots to identify retained memory

Common memory leak sources:
- Forgotten event listeners
- Timers/intervals not cleared
- Closures holding references to large objects
- Detached DOM elements

