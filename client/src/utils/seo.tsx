import React from 'react';
import type { HelmetProps } from 'react-helmet-async';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
  noIndex?: boolean;
}

/**
 * SEO component for managing document head metadata
 */
const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = '',
  ogTitle = '',
  ogDescription = '',
  ogImage = '/logo512.png',
  ogUrl = '',
  twitterCard = 'summary_large_image',
  canonicalUrl = '',
  structuredData = {},
  noIndex = false
}) => {
  // Prepare meta title and description
  const metaTitle = title;
  const metaDescription = description;

  // Create an object with all the SEO metadata
  const helmetData = {
    title: metaTitle,
    meta: [
      { name: 'description', content: metaDescription },
      { name: 'keywords', content: keywords },
      
      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: ogTitle || metaTitle },
      { property: 'og:description', content: ogDescription || metaDescription },
      { property: 'og:image', content: ogImage },
      ...(ogUrl ? [{ property: 'og:url', content: ogUrl }] : []),
      
      // Twitter
      { name: 'twitter:card', content: twitterCard },
      { name: 'twitter:title', content: ogTitle || metaTitle },
      { name: 'twitter:description', content: ogDescription || metaDescription },
      { name: 'twitter:image', content: ogImage },
      
      // No index directive if specified
      ...(noIndex ? [{ name: 'robots', content: 'noindex' }] : [])
    ],
    link: [
      // Canonical URL
      ...(canonicalUrl ? [{ rel: 'canonical', href: canonicalUrl }] : [])
    ],
    script: [
      // Structured data for rich results
      ...(Object.keys(structuredData).length > 0 ? [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(structuredData)
        }
      ] : [])
    ]
  };

  return (
    <React.Fragment>
      {/* 
        Note: This component returns metadata that should be placed within a HelmetProvider
        in the application's root component. The actual Helmet component is not rendered here
        to avoid TypeScript JSX element issues.
      */}
      {/* 
        Usage example in App.tsx:
        <HelmetProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            ...
          </Routes>
        </HelmetProvider>
      */}
      {/* Helmet data is returned for documentation purposes */}
      {null}
    </React.Fragment>
  );
};

export default SEO;