/**
 * Feature Flag Wrapper Component
 * 
 * This component wraps content that should only be shown when a feature flag is enabled.
 */

import React, { ReactNode } from 'react';
import useFeatureFlag from '../../hooks/useFeatureFlag';

interface FeatureFlagWrapperProps {
  flagKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  defaultValue?: boolean;
  renderWithoutFlag?: boolean; // For development or testing, can bypass flag check
}

/**
 * Component that conditionally renders its children based on a feature flag
 */
const FeatureFlagWrapper: React.FC<FeatureFlagWrapperProps> = ({
  flagKey,
  children,
  fallback = null,
  loadingComponent = null,
  defaultValue = false,
  renderWithoutFlag = false
}) => {
  // Skip flag check if renderWithoutFlag is true (useful for testing)
  if (renderWithoutFlag) {
    return <>{children}</>;
  }
  
  // Use the feature flag hook
  const [isEnabled, { loading }] = useFeatureFlag(flagKey, { defaultValue });
  
  // Show loading component if still loading
  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }
  
  // Render children if flag is enabled, otherwise render fallback
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

export default FeatureFlagWrapper; 