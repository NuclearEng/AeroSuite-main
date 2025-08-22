import React, { useEffect } from 'react';
import {
  ResourceType,
  ResourcePriority,
  ResourceStrategy,
  preconnectToDomains,
  preloadCriticalAssets,
  setupResourceHints,
  prioritizeImage } from
'../../utils/resourcePrioritization';

interface ResourcePrioritizationProps {
  criticalAssets?: Array<{url: string;type: ResourceType;priority?: ResourcePriority;}>;
  preconnectDomains?: string[];
  prefetchAssets?: Array<{url: string;type: ResourceType;}>;
  children?: React.ReactNode;
}

/**
 * Component that handles resource prioritization for optimal loading performance
 * 
 * This component should be placed near the top of your application to ensure
 * resource hints are added as early as possible.
 */
export const ResourcePrioritization: React.FC<ResourcePrioritizationProps> = ({
  criticalAssets = [],
  preconnectDomains = [],
  prefetchAssets = [],
  children
}) => {
  useEffect(() => {
    // Set up common third-party domain preconnects
    if (preconnectDomains.length > 0) {
      preconnectToDomains(preconnectDomains);
    }

    // Preload critical assets
    if (criticalAssets.length > 0) {
      preloadCriticalAssets(criticalAssets);
    }

    // Set up resource hints for prefetching
    if (prefetchAssets.length > 0) {
      setupResourceHints({
        prefetch: prefetchAssets.map((asset: any) => ({
          href: asset.url,
          as: asset.type as any // Type conversion needed due to enum vs string literal type
        }))
      });
    }

    // Automatically prioritize visible images
    setTimeout(() => {
      const prioritizeVisibleImages = () => {
        const images = document.querySelectorAll('img:not([fetchpriority])');

        images.forEach((img) => {
          const imgElement = img as HTMLImageElement;
          const rect = imgElement.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

          // Prioritize images that are in the viewport
          if (isVisible) {
            prioritizeImage(imgElement, ResourcePriority.HIGH);
          } else {
            prioritizeImage(imgElement, ResourcePriority.LOW);
          }
        });
      };

      // Run once and then on scroll with throttling
      prioritizeVisibleImages();

      let scrollTimeout: NodeJS.Timeout | null = null;
      const handleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(prioritizeVisibleImages, 200);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }, 0);
  }, [criticalAssets, preconnectDomains, prefetchAssets]);

  return <>{children}</>;
};

/**
 * Example usage of the ResourcePrioritization component in your app
 */
export const ExampleUsage: React.FC = () => {
  const criticalAssets = [
  { url: '/css/critical.css', type: ResourceType.STYLE, priority: ResourcePriority.CRITICAL },
  { url: '/fonts/main-font.woff2', type: ResourceType.FONT, priority: ResourcePriority.HIGH },
  { url: '/images/hero.webp', type: ResourceType.IMAGE, priority: ResourcePriority.HIGH }];


  const preconnectDomains = [
  'https://api.example.com',
  'https://fonts.googleapis.com',
  'https://cdn.example.com'];


  const prefetchAssets = [
  { url: '/js/non-critical.js', type: ResourceType.SCRIPT },
  { url: '/css/non-critical.css', type: ResourceType.STYLE }];


  return (
    <ResourcePrioritization
      criticalAssets={criticalAssets}
      preconnectDomains={preconnectDomains}
      prefetchAssets={prefetchAssets}>

      <div className="app">
        
        <h1>Application with Optimized Resource Loading</h1>
        <p>This application uses advanced resource prioritization techniques.</p>
        
        
        <img src="/images/hero.webp" alt="Hero" width={1200} height={600} />
      </div>
    </ResourcePrioritization>);

};

export default ResourcePrioritization;