# Server-Side Rendering (SSR) for AeroSuite

__Task: TS112 - Server-side rendering for SEO__

## Overview

AeroSuite supports server-side rendering (SSR) for improved SEO and faster initial page loads. SSR
renders the React app on the server and sends the generated HTML to the client, enhancing
discoverability and performance.

## How It Works

- The SSR server uses Express and ReactDOMServer to render the main App component to HTML.
- Static assets are served from the build directory.
- All routes are handled by SSR, which injects the rendered HTML into the template.
- SEO metadata is dynamically generated based on the current route.
- Redux state is pre-populated on the server and hydrated on the client.
- Material-UI styles are server-rendered to eliminate flicker.
- A sitemap.xml and robots.txt are automatically generated for search engines.

## Features

- __Dynamic Meta Tags__: Route-specific title, description, and Open Graph tags
- __Structured Data__: JSON-LD support for rich search results
- __State Hydration__: Server-rendered Redux state is hydrated on the client
- __Style Management__: Server-side Material-UI styles to prevent style flicker
- __SEO Component__: Reusable SEO component for page-specific metadata
- __Sitemap Generation__: Automatic sitemap.xml generation for search engines
- __Performance Optimizations__: Compression, caching headers, and resource hints

## Usage

1. __Build the client app and generate sitemap:__
   ```bash
   npm run ssr:build
   ```

2. __Start the SSR server:__
   ```bash
   npm run ssr:start
   ```
   The SSR server will run on http://localhost:4000 by default.

## Adding SEO to Pages

Use the SEO component to add metadata to your pages:

```tsx
import SEO from '../utils/seo';

const HomePage: React.FC = () => {
  return (
    <>
      <SEO
        title="AeroSuite - Home"
        description="Aerospace supply chain management platform"
        keywords="aerospace, supply chain, management"
      />
      <div>Page content here</div>
    </>
  );
};
```bash

## Customization

- The SSR server can be configured via environment variables (e.g., `SSR_PORT`, `SITE_URL`).
- You can extend the SEO component to support additional metadata.
- The sitemap generator can be customized to include dynamic routes.

## Benefits

- __Improved SEO__: Search engines can index the fully rendered content
- __Faster Time-to-Content__: Users see the rendered page immediately
- __Better Social Sharing__: Rich previews when sharing on social media
- __Accessibility__: Content is available even before JavaScript loads
- __Reduced Layout Shifts__: Server-rendered styles prevent layout shifts

## Notes

- SSR is intended for production and SEO-critical pages. For full interactivity, the client app
will hydrate on the client side.
- For advanced SSR (data fetching, routing), consider frameworks like Next.js in the future.
- The current implementation focuses on SEO and initial render performance.
- Ensure that components are isomorphic (work both on server and client) to avoid hydration
mismatches.
