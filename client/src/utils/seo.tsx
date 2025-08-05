import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
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
 * SEO component for managing page metadata
 * 
 * This component uses react-helmet-async to manage SEO metadata for pages.
 * It supports standard meta tags, Open Graph tags, Twitter Card tags,
 * canonical URLs, and structured data.
 * 
 * @param props SEO properties
 */
const SEO: React.FC<SEOProps> = ({
  title = 'AeroSuite',
  description = 'AeroSuite - Aerospace Supply Chain Management Platform',
  keywords = 'aerospace, supply chain, quality management',
  ogTitle,
  ogDescription,
  ogImage = '/logo512.png',
  ogUrl,
  twitterCard = 'summary_large_image',
  canonicalUrl,
  structuredData,
  noIndex = false,
}) => {
  // Use provided values or fall back to defaults
  const metaTitle = title;
  const metaDescription = description;
  const metaOgTitle = ogTitle || title;
  const metaOgDescription = ogDescription || description;
  
  // Base URL for canonical URLs and OG URLs
  const baseUrl = 'https://aerosuite.example.com';
  
  // Determine canonical URL
  const canonical = canonicalUrl 
    ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${baseUrl}${canonicalUrl}`)
    : undefined;
  
  // Determine OG URL
  const ogUrlFull = ogUrl 
    ? (ogUrl.startsWith('http') ? ogUrl : `${baseUrl}${ogUrl}`)
    : canonical;
  
  // Determine OG Image URL
  const ogImageFull = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
  
  return (
    <Helmet>
      {/* Standard meta tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={metaOgTitle} />
      <meta property="og:description" content={metaOgDescription} />
      <meta property="og:image" content={ogImageFull} />
      {ogUrlFull && <meta property="og:url" content={ogUrlFull} />}
      <meta property="og:type" content="website" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={metaOgTitle} />
      <meta name="twitter:description" content={metaOgDescription} />
      <meta name="twitter:image" content={ogImageFull} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots meta tag */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Structured data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO; 