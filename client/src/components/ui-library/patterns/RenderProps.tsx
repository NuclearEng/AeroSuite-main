/**
 * Render Props Pattern
 * 
 * @task RF015 - Implement component composition patterns
 * 
 * The Render Props pattern involves passing a function as a prop to a component,
 * which the component then calls to render part of its UI. This pattern provides
 * flexibility in how components render and share state or behavior.
 * 
 * Examples: Toggle and DataFetcher components
 */

import React, { useState, useEffect, ReactNode } from 'react';

// Types for the Toggle component
interface ToggleState {
  isOn: boolean;
  toggle: () => void;
  setOn: () => void;
  setOff: () => void;
}

interface ToggleProps {
  initialState?: boolean;
  children: (state: ToggleState) => ReactNode;
  onToggle?: (isOn: boolean) => void;
}

/**
 * Toggle Component
 * 
 * A render props component that manages toggle state
 */
export const Toggle: React.FC<ToggleProps> = ({ 
  initialState = false, 
  children, 
  onToggle 
}) => {
  const [isOn, setIsOn] = useState(initialState);
  
  const toggle = () => {
    setIsOn(prev => !prev);
  };
  
  const setOn = () => setIsOn(true);
  const setOff = () => setIsOn(false);
  
  // Call onToggle callback when state changes
  useEffect(() => {
    if (onToggle) {
      onToggle(isOn);
    }
  }, [isOn, onToggle]);
  
  // Provide state and handlers to children render prop
  return <>{children({ isOn, toggle, setOn, setOff })}</>;
};

// Types for the DataFetcher component
interface DataFetcherState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface DataFetcherProps<T> {
  url: string;
  children: (state: DataFetcherState<T>) => ReactNode;
  initialData?: T | null;
  fetchOptions?: RequestInit;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * DataFetcher Component
 * 
 * A render props component that handles data fetching
 */
export function DataFetcher<T>({ 
  url, 
  children, 
  initialData = null, 
  fetchOptions,
  onSuccess,
  onError
}: DataFetcherProps<T>): JSX.Element {
  const [data, setData] = useState<any>(initialData);
  const [isLoading, setIsLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (_err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [url]); // Re-fetch when URL changes
  
  // Provide state and refetch function to children render prop
  return <>{children({ data, isLoading, error, refetch: fetchData })}</>;
}

/**
 * MouseTracker Component
 * 
 * A render props component that tracks mouse position
 */
interface MousePosition {
  x: number;
  y: number;
}

interface MouseTrackerProps {
  children: (position: MousePosition) => ReactNode;
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({ children }) => {
  const [position, setPosition] = useState<any>({ x: 0, y: 0 });
  
  const handleMouseMove = (event: MouseEvent) => {
    setPosition({
      x: event.clientX,
      y: event.clientY
    });
  };
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return <>{children(position)}</>;
};

export type { ToggleState, ToggleProps, DataFetcherState, DataFetcherProps, MousePosition, MouseTrackerProps }; 