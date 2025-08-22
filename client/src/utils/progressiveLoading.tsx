/**
 * Progressive Loading Strategies
 * 
 * This file provides utilities for implementing progressive loading strategies
 * that improve perceived performance and user experience by loading content
 * in stages of increasing fidelity.
 * 
 * Implementation of RF036 - Implement progressive loading strategies
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LoadPriority } from './codeSplittingConfig';
import { optimizedImport } from './bundleOptimization';

// Add RefObject to the imports
import type { RefObject } from 'react';

// Type definitions
type RenderFunction<T> = (props: T) => React.ReactNode;
type ProgressiveStage = 'initial' | 'skeleton' | 'low-fidelity' | 'full';

/**
 * Interface for tracking progressive loading stages
 */
export interface ProgressiveLoadingState {
  stage: ProgressiveStage;
  progress: number;
  isComplete: boolean;
}

/**
 * Configuration for progressive loading
 */
export interface ProgressiveLoadingConfig {
  initialDelay?: number;
  stageDelays?: {
    skeleton?: number;
    'low-fidelity'?: number;
    full?: number;
  };
  minStageDuration?: {
    skeleton?: number;
    'low-fidelity'?: number;
  };
  priority?: LoadPriority;
  enableDataStreaming?: boolean;
  useIncrementalLoading?: boolean;
  loadFullVersionInBackground?: boolean;
}

// Default configuration
const defaultConfig: ProgressiveLoadingConfig = {
  initialDelay: 0,
  stageDelays: {
    skeleton: 0,
    'low-fidelity': 100,
    full: 200
  },
  minStageDuration: {
    skeleton: 300,
    'low-fidelity': 500
  },
  priority: LoadPriority.MEDIUM,
  enableDataStreaming: true,
  useIncrementalLoading: true,
  loadFullVersionInBackground: true
};

/**
 * Hook for implementing progressive loading with multiple fidelity stages
 * 
 * @param renderers Object containing render functions for different stages
 * @param config Configuration options
 * @returns Current stage and render function
 */
export function useProgressiveLoading<T>(
  renderers: {
    initial?: RenderFunction<T>;
    skeleton: RenderFunction<T>;
    'low-fidelity'?: RenderFunction<T>;
    full: RenderFunction<T>;
  },
  config: ProgressiveLoadingConfig = {}
): [ProgressiveStage, RenderFunction<T>, ProgressiveLoadingState] {
  const mergedConfig = { ...defaultConfig, ...config };
  const [stage, setStage] = useState<any>('initial');
  const [progress, setProgress] = useState(0);
  const stageTimestamps = useRef<Record<ProgressiveStage, number>>({
    initial: Date.now(),
    skeleton: 0,
    'low-fidelity': 0,
    full: 0
  });
  
  // Handle stage transitions
  useEffect(() => {
    // Initial -> Skeleton transition
    const initialTimer = setTimeout(() => {
      setStage('skeleton');
      stageTimestamps.current.skeleton = Date.now();
      setProgress(25);
    }, mergedConfig.initialDelay || 0);
    
    return () => clearTimeout(initialTimer);
  }, [mergedConfig.initialDelay]);
  
  // Handle subsequent stage transitions
  useEffect(() => {
    if (stage === 'initial') return;
    
    let nextStage: ProgressiveStage | null = null;
    let nextProgress = progress;
    let delay = 0;
    
    // Determine next stage
    if (stage === 'skeleton') {
      nextStage = renderers['low-fidelity'] ? 'low-fidelity' : 'full';
      nextProgress = renderers['low-fidelity'] ? 50 : 100;
      
      // Ensure minimum duration for skeleton stage
      const timeInStage = Date.now() - stageTimestamps.current.skeleton;
      const minDuration = mergedConfig.minStageDuration?.skeleton || 0;
      delay = Math.max(0, minDuration - timeInStage);
      
      // Add configured delay
      delay += (nextStage === 'low-fidelity' ? 
        mergedConfig.stageDelays?.['low-fidelity'] || 0 : 
        mergedConfig.stageDelays?.full || 0);
    } else if (stage === 'low-fidelity') {
      nextStage = 'full';
      nextProgress = 100;
      
      // Ensure minimum duration for low-fidelity stage
      const timeInStage = Date.now() - stageTimestamps.current['low-fidelity'];
      const minDuration = mergedConfig.minStageDuration?.['low-fidelity'] || 0;
      delay = Math.max(0, minDuration - timeInStage);
      
      // Add configured delay
      delay += mergedConfig.stageDelays?.full || 0;
    }
    
    if (nextStage) {
      const timer = setTimeout(() => {
        setStage(nextStage as ProgressiveStage);
        stageTimestamps.current[nextStage as ProgressiveStage] = Date.now();
        setProgress(nextProgress);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [stage, renderers, mergedConfig, progress]);
  
  // Get the current renderer
  const getCurrentRenderer = useCallback((props: T) => {
    const renderer = (renderers as any)[stage] || renderers.full;
    return renderer(props);
  }, [renderers, stage]);
  
  // Create loading state object
  const loadingState: ProgressiveLoadingState = {
    stage,
    progress,
    isComplete: stage === 'full'
  };
  
  return [stage, getCurrentRenderer, loadingState];
}

/**
 * Progressive image loading with blur-up technique
 * 
 * @param props Component props
 * @returns JSX element
 */
export function ProgressiveImage({
  src,
  lowResSrc,
  placeholderColor = '#e0e0e0',
  alt,
  width,
  height,
  style = {},
  className = '',
  onLoad,
  ...rest
}: {
  src: string;
  lowResSrc?: string;
  placeholderColor?: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onLoad?: () => void;
  [key: string]: any;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLowResLoaded, setIsLowResLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<any>(null);
  const fullImageRef = useRef<HTMLImageElement>(null);
  
  // Load low resolution image first if available
  useEffect(() => {
    if (lowResSrc) {
      const lowResImg = new Image();
      lowResImg.onload = () => {
      setCurrentSrc(lowResSrc);
      setIsLowResLoaded(true);
    };
      lowResImg.src = lowResSrc;
    }
  }, [lowResSrc]);
  
  // Load full resolution image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      if (onLoad) {
        onLoad();
      }
    };
    img.src = src;
  }, [src, onLoad]);
  
  // Combine styles for smooth transition
  const combinedStyle: React.CSSProperties = {
    ...style,
    transition: 'filter 0.3s ease-out',
    filter: !isLoaded && isLowResLoaded ? 'blur(8px)' : 'none',
  };
  
  return (
    <img
      ref={fullImageRef}
      src={currentSrc || placeholderColor}
      alt={alt}
      style={combinedStyle}
      className={className}
      width={width}
      height={height}
      {...rest}
    />
  );
}

/**
 * Data streaming utility for progressively loading data
 * 
 * @param fetchFn Function that returns a promise resolving to data
 * @param options Configuration options
 * @returns Object with data and loading state
 */
export function useProgressiveDataLoading<T>(
  fetchFn: () => Promise<T>,
  options: {
    initialData?: Partial<T>;
    streamingFn?: (partialData: Partial<T>, fullData: T) => Partial<T>[];
    streamInterval?: number;
    priority?: LoadPriority;
  } = {}
) {
  const {
    initialData = {} as Partial<T>,
    streamingFn,
    streamInterval = 100,
    priority = LoadPriority.MEDIUM
  } = options;
  
  const [data, setData] = useState<any>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const fullDataRef = useRef<T | null>(null);
  const streamingStepsRef = useRef<Partial<T>[]>([]);
  const currentStepRef = useRef(0);
  
  // Fetch data and set up streaming
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // Start loading
        setLoading(true);
        setProgress(0);
        
        // Fetch full data
        const result = await fetchFn();
        
        if (!isMounted) return;
        
        fullDataRef.current = result;
        
        // If streaming function is provided, use it to create intermediate steps
        if (streamingFn) {
          streamingStepsRef.current = streamingFn(initialData, result);
          
          // Set up interval to progressively update data
          const intervalId = setInterval(() => {
            if (!isMounted) return;
            
            const currentStep = currentStepRef.current;
            if (currentStep < streamingStepsRef.current.length) {
              setData(streamingStepsRef.current[currentStep]);
              setProgress(Math.round((currentStep + 1) / (streamingStepsRef.current.length + 1) * 100));
              currentStepRef.current++;
            } else {
              // Final step - set full data
              setData(result);
              setProgress(100);
              setLoading(false);
              clearInterval(intervalId);
            }
          }, streamInterval);
          
          return () => clearInterval(intervalId);
        } else {
          // No streaming - just set the full data
          setData(result);
          setProgress(100);
          setLoading(false);
        }
      } catch (_err) {
        if (!isMounted) return;
        
        const error = _err instanceof Error ? _err : new Error(String(_err));
        setError(error);
        setLoading(false);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchFn, initialData, streamingFn, streamInterval]);
  
  return { data, loading, error, progress };
}

/**
 * Component that renders content in progressive stages
 * 
 * @param props Component props
 * @returns JSX element
 */
export function ProgressiveRender<T extends object>({
  initialComponent,
  skeletonComponent,
  lowFidelityComponent,
  fullComponent,
  componentProps,
  config = {}
}: {
  initialComponent?: React.ComponentType<T>;
  skeletonComponent: React.ComponentType<T>;
  lowFidelityComponent?: React.ComponentType<T>;
  fullComponent: React.ComponentType<T>;
  componentProps: T;
  config?: ProgressiveLoadingConfig;
}) {
  // Create render functions
  const renderers = {
    initial: initialComponent ? (props: T) => <>{React.createElement(initialComponent, props)}</> : undefined,
    skeleton: (props: T) => <>{React.createElement(skeletonComponent, props)}</>,
    'low-fidelity': lowFidelityComponent ? (props: T) => <>{React.createElement(lowFidelityComponent, props)}</> : undefined,
    full: (props: T) => <>{React.createElement(fullComponent, props)}</>
  };
  
  // Use progressive loading hook
  const [_, renderContent] = useProgressiveLoading(renderers, config);
  
  return <>{renderContent(componentProps)}</>;
}

/**
 * Hook for critical path rendering
 * 
 * @param dependencies Array of module import functions
 * @returns Boolean indicating if critical path is loaded
 */
export function useCriticalPathRendering(
  dependencies: Array<{
    importFn: () => Promise<any>;
    key: string;
    priority?: LoadPriority;
  }>
) {
  const [criticalPathLoaded, setCriticalPathLoaded] = useState(false);
  const loadedModules = useRef<Set<string>>(new Set());
  
  // Load critical path dependencies
  useEffect(() => {
    let isMounted = true;
    
    const loadCriticalDependencies = async () => {
      try {
        // Sort dependencies by priority
        const sortedDeps = [...dependencies].sort((a, b) => {
          const priorityA = a.priority || LoadPriority.MEDIUM;
          const priorityB = b.priority || LoadPriority.MEDIUM;
          
          if (priorityA === LoadPriority.CRITICAL) return -1;
          if (priorityB === LoadPriority.CRITICAL) return 1;
          if (priorityA === LoadPriority.HIGH) return -1;
          if (priorityB === LoadPriority.HIGH) return 1;
          return 0;
        });
        
        // Load critical and high priority dependencies first
        const criticalDeps = sortedDeps.filter(dep => 
          dep.priority === LoadPriority.CRITICAL || dep.priority === LoadPriority.HIGH
        );
        
        await Promise.all(criticalDeps.map(async (dep) => {
          await optimizedImport(dep.importFn, dep.key);
          if (isMounted) {
            loadedModules.current.add(dep.key);
          }
        }));
        
        if (isMounted) {
          setCriticalPathLoaded(true);
        }
        
        // Then load medium and low priority dependencies
        const remainingDeps = sortedDeps.filter(dep => 
          dep.priority !== LoadPriority.CRITICAL && dep.priority !== LoadPriority.HIGH
        );
        
        for (const dep of remainingDeps) {
          // Use setTimeout to avoid blocking the main thread
          setTimeout(() => {
            optimizedImport(dep.importFn, dep.key).then(() => {
              if (isMounted) {
                loadedModules.current.add(dep.key);
              }
            });
          }, 0);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    
    loadCriticalDependencies();
    
    return () => {
      isMounted = false;
    };
  }, [dependencies]);
  
  return criticalPathLoaded;
}

/**
 * Hook for incremental component hydration
 * 
 * @param components Array of components to hydrate
 * @param options Configuration options
 * @returns Object with hydration state
 */
export function useIncrementalHydration(
  components: Array<{
    id: string;
    priority: LoadPriority;
  }>,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    hydrateAboveTheFoldFirst?: boolean;
  } = {}
) {
  const {
    batchSize = 3,
    delayBetweenBatches = 100,
    hydrateAboveTheFoldFirst = true
  } = options;
  
  const [hydratedComponents, setHydratedComponents] = useState<any>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const pendingComponentsRef = useRef<typeof components>([...components]);
  
  // Function to check if a component is above the fold
  const isAboveTheFold = useCallback((id: string) => {
    if (!hydrateAboveTheFoldFirst) return false;
    
    const element = document.getElementById(id);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight;
  }, [hydrateAboveTheFoldFirst]);
  
  // Start hydration process
  useEffect(() => {
    if (components.length === 0) {
      setIsComplete(true);
      setProgress(100);
      return;
    }
    
    let isMounted = true;
    const currentBatch = 0;
    
    // Sort components by priority and visibility
    const sortedComponents = [...components].sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        if (a.priority === LoadPriority.CRITICAL) return -1;
        if (b.priority === LoadPriority.CRITICAL) return 1;
        if (a.priority === LoadPriority.HIGH) return -1;
        if (b.priority === LoadPriority.HIGH) return 1;
        if (a.priority === LoadPriority.MEDIUM) return -1;
        if (b.priority === LoadPriority.MEDIUM) return 1;
      }
      
      // Then by visibility (above the fold)
      const aAboveTheFold = isAboveTheFold(a.id);
      const bAboveTheFold = isAboveTheFold(b.id);
      
      if (aAboveTheFold && !bAboveTheFold) return -1;
      if (!aAboveTheFold && bAboveTheFold) return 1;
      
      return 0;
    });
    
    pendingComponentsRef.current = sortedComponents;
    
    // Process components in batches
    const processNextBatch = () => {
      if (!isMounted) return;
      
      const pendingComponents = pendingComponentsRef.current;
      if (pendingComponents.length === 0) {
        setIsComplete(true);
        setProgress(100);
        return;
      }
      
      // Get next batch
      const batch = pendingComponents.splice(0, batchSize);
      
      // Update hydrated components
      setHydratedComponents((prev: any) => {
        const updated = new Set(prev);
        batch.forEach((component: any) => updated.add(component.id));
        return updated;
      });
      
      // Update progress
      const newProgress = Math.round(
        ((components.length - pendingComponents.length) / components.length) * 100
      );
      setProgress(newProgress);
      
      // Schedule next batch
      if (pendingComponents.length > 0) {
        setTimeout(processNextBatch, delayBetweenBatches);
      } else {
        setIsComplete(true);
        setProgress(100);
      }
    };
    
    // Start processing
    processNextBatch();
    
    return () => {
      isMounted = false;
    };
  }, [components, batchSize, delayBetweenBatches, isAboveTheFold]);
  
  return {
    hydratedComponents,
    isComplete,
    progress,
    isHydrated: (id: string) => hydratedComponents.has(id)
  };
}

/**
 * Options for progressive loading hooks
 */
export interface ProgressiveLoadingOptions {
  /** Number of items to load initially (default: 20) */
  initialBatchSize?: number;
  /** Number of items to load in each subsequent batch (default: 10) */
  batchSize?: number;
  /** Time in ms between loading batches when scrolling isn't detected (default: 100) */
  interval?: number;
  /** Maximum number of items to display (default: Infinity) */
  maxItems?: number;
  /** Callback function called when all data is loaded */
  onLoadComplete?: () => void;
}

/**
 * Return type for progressive loading hooks
 */
export interface ProgressiveLoadingResult<T> {
  /** The progressively loaded data */
  data: T[];
  /** Whether more data is currently being loaded */
  isLoading: boolean;
  /** Whether all data has been loaded */
  loadedAll: boolean;
  /** Function to manually load more data */
  loadMore: () => void;
  /** Function to automatically load more data with a delay */
  autoLoad: () => void;
  /** Function to reset and start over */
  reset: () => void;
  /** Progress as a number between 0 and 1 */
  progress: number;
  /** Number of items loaded so far */
  loadedCount: number;
  /** Total number of items to load */
  totalCount: number;
}

/**
 * Options for scroll-based progressive loading
 */
export interface ScrollProgressiveLoadingOptions extends ProgressiveLoadingOptions {
  /** Distance in pixels from bottom to trigger loading (default: 200) */
  threshold?: number;
}

/**
 * Return type for scroll-based progressive loading
 */
export interface ScrollProgressiveLoadingResult<T> extends Omit<ProgressiveLoadingResult<T>, 'autoLoad'> {
  /** Reference to attach to the scrollable container */
  scrollRef: RefObject<HTMLElement>;
}

/**
 * Return type for intersection observer-based progressive loading
 */
export interface IntersectionProgressiveLoadingResult<T> extends Omit<ProgressiveLoadingResult<T>, 'autoLoad'> {
  /** Reference to attach to the sentinel element that triggers loading when visible */
  sentinelRef: RefObject<HTMLElement>;
}

/**
 * Options for progressive pagination
 */
export interface ProgressivePaginationOptions {
  /** Number of items per page (default: 20) */
  pageSize?: number;
  /** Maximum number of pages to keep in memory (default: 5) */
  maxLoadedPages?: number;
}

/**
 * Return type for progressive pagination
 */
export interface ProgressivePaginationResult<T> {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  pageSize: number;
  /** Whether data is currently being loaded */
  isLoading: boolean;
  /** Current page data */
  data: T[];
  /** Array of page numbers that have been loaded */
  loadedPages: number[];
  /** Function to go to a specific page */
  goToPage: (page: number) => void;
  /** Function to go to the next page */
  nextPage: () => void;
  /** Function to go to the previous page */
  prevPage: () => void;
  /** Function to go to the first page */
  firstPage: () => void;
  /** Function to go to the last page */
  lastPage: () => void;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
}

/**
 * Custom hook for progressive loading of large datasets
 * 
 * @param data - The complete dataset to progressively load
 * @param options - Configuration options
 * @returns The progressively loaded data and control functions
 */
export function useProgressiveDataListLoading<T>(
  data: T[] = [], 
  options: ProgressiveLoadingOptions = {}
): ProgressiveLoadingResult<T> {
  const {
    initialBatchSize = 20,
    batchSize = 10,
    interval = 100,
    maxItems = Infinity,
    onLoadComplete = () => {},
  } = options;

  const [displayedData, setDisplayedData] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<any>(false);
  const [loadedAll, setLoadedAll] = useState<any>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedCountRef = useRef<number>(0);

  // Function to load the next batch of data
  const loadNextBatch = useCallback(() => {
    if (loadedCountRef.current >= data.length || loadedCountRef.current >= maxItems) {
      setLoadedAll(true);
      setIsLoading(false);
      onLoadComplete();
      return;
    }

    setIsLoading(true);
    const nextBatchSize = loadedCountRef.current === 0 ? initialBatchSize : batchSize;
    const endIndex = Math.min(
      loadedCountRef.current + nextBatchSize,
      data.length,
      maxItems
    );

    const newBatch = data.slice(loadedCountRef.current, endIndex);
    loadedCountRef.current = endIndex;

    setDisplayedData((current: any) => [...current, ...newBatch]);

    if (loadedCountRef.current >= data.length || loadedCountRef.current >= maxItems) {
      setLoadedAll(true);
      setIsLoading(false);
      onLoadComplete();
    } else {
      setIsLoading(false);
    }
  }, [data, initialBatchSize, batchSize, maxItems, onLoadComplete]);

  // Load initial batch
  useEffect(() => {
    loadedCountRef.current = 0;
    setDisplayedData([]);
    setLoadedAll(false);
    setIsLoading(true);
    loadNextBatch();
    
    // Cleanup function to clear any pending timeouts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, loadNextBatch]);

  // Function to manually trigger loading more data
  const loadMore = useCallback(() => {
    if (!isLoading && !loadedAll) {
      loadNextBatch();
    }
  }, [isLoading, loadedAll, loadNextBatch]);

  // Auto-load function with delay
  const autoLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!loadedAll && !isLoading) {
      timeoutRef.current = setTimeout(() => {
        loadNextBatch();
      }, interval);
    }
  }, [loadedAll, isLoading, interval, loadNextBatch]);

  // Reset function to start over
  const reset = useCallback(() => {
    loadedCountRef.current = 0;
    setDisplayedData([]);
    setLoadedAll(false);
    loadNextBatch();
  }, [loadNextBatch]);

  return {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    autoLoad,
    reset,
    progress: data.length > 0 ? loadedCountRef.current / Math.min(data.length, maxItems) : 0,
    loadedCount: loadedCountRef.current,
    totalCount: Math.min(data.length, maxItems),
  };
}

/**
 * Custom hook for progressive loading with scroll detection
 * 
 * @param data - The complete dataset to progressively load
 * @param options - Configuration options
 * @returns The progressively loaded data and control functions
 */
export function useScrollProgressiveLoading<T>(
  data: T[] = [], 
  options: ScrollProgressiveLoadingOptions = {}
): ScrollProgressiveLoadingResult<T> {
  const { threshold = 200, ...progressiveLoadingOptions } = options;
  const scrollRef = useRef<HTMLElement>(null);
  
  const {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    progress,
    loadedCount,
    totalCount,
  } = useProgressiveDataListLoading(data, progressiveLoadingOptions);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || isLoading || loadedAll) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const scrolledToBottom = scrollHeight - scrollTop - clientHeight < threshold;
      
      if (scrolledToBottom) {
        loadMore();
      }
    };

    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isLoading, loadedAll, loadMore, threshold]);

  return {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    scrollRef,
    progress,
    loadedCount,
    totalCount,
  };
}

/**
 * Custom hook for progressive loading with intersection observer
 * 
 * @param data - The complete dataset to progressively load
 * @param options - Configuration options
 * @returns The progressively loaded data, control functions, and sentinel ref
 */
export function useIntersectionProgressiveLoading<T>(
  data: T[] = [], 
  options: ProgressiveLoadingOptions = {}
): IntersectionProgressiveLoadingResult<T> {
  const sentinelRef = useRef<HTMLElement>(null);
  
  const {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    progress,
    loadedCount,
    totalCount,
  } = useProgressiveDataListLoading(data, options);

  // Set up intersection observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !loadedAll) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [isLoading, loadedAll, loadMore]);

  return {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    sentinelRef,
    progress,
    loadedCount,
    totalCount,
  };
}

/**
 * Creates a paginated version of a large dataset with progressive loading capabilities
 * 
 * @param data - The complete dataset to paginate
 * @param options - Configuration options
 * @returns Pagination state and control functions
 */
export function useProgressivePagination<T>(
  data: T[] = [], 
  options: ProgressivePaginationOptions = {}
): ProgressivePaginationResult<T> {
  const { pageSize = 20, maxLoadedPages = 5 } = options;
  
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [loadedPages, setLoadedPages] = useState<any>([1]);
  const [isLoading, setIsLoading] = useState<any>(false);
  
  const totalPages = Math.ceil(data.length / pageSize);
  
  // Get current page data
  const getCurrentPageData = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [currentPage, data, pageSize]);
  
  const [currentPageData, setCurrentPageData] = useState<any>(getCurrentPageData());
  
  // Update page data when current page or data changes
  useEffect(() => {
    setCurrentPageData(getCurrentPageData());
  }, [currentPage, data, getCurrentPageData]);
  
  // Load a specific page
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setIsLoading(true);
    
    // Simulate network delay for remote data fetching
    if (!loadedPages.includes(page)) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Add to loaded pages and maintain max loaded pages limit
      setLoadedPages((prevPages: any) => {
        const newPages = [...prevPages, page];
        if (newPages.length > maxLoadedPages) {
          // Remove pages that are furthest from the current page
          // but keep the first and last pages
          return newPages
            .sort((a, b) => Math.abs(page - a) - Math.abs(page - b))
            .slice(0, maxLoadedPages);
        }
        return newPages;
      });
    }
    
    setCurrentPage(page);
    setIsLoading(false);
  }, [totalPages, loadedPages, maxLoadedPages]);
  
  // Navigation functions
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);
  
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);
  
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);
  
  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);
  
  return {
    currentPage,
    totalPages,
    pageSize,
    isLoading,
    data: currentPageData,
    loadedPages,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Utility to create chunked versions of large arrays for progressive rendering
 * 
 * @param array - The array to chunk
 * @param size - The size of each chunk
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (!array || !Array.isArray(array)) return [];
  
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Utility to create a delayed rendering component
 * This is useful for progressively rendering large lists
 * 
 * @param callback - Function to call after delay
 * @param delay - Delay in milliseconds
 */
export function useDelayedRender(callback: () => void, delay = 0): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      callback();
    }, delay);
    
    return () => clearTimeout(timer);
  }, [callback, delay]);
}

/**
 * Utility to throttle a function call
 * Useful for handling scroll events in progressive loading
 * 
 * @param func - Function to throttle
 * @param limit - Throttle limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export default {
  useProgressiveLoading,
  useProgressiveDataListLoading,
  ProgressiveImage,
  useProgressiveDataLoading,
  ProgressiveRender,
  useCriticalPathRendering,
  useIncrementalHydration,
  useScrollProgressiveLoading,
  useIntersectionProgressiveLoading,
  useProgressivePagination,
  chunkArray,
  useDelayedRender,
  throttle
}; 