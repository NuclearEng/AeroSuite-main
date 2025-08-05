/**
 * Frontend Performance Testing Module
 * 
 * This module uses Puppeteer to test frontend component rendering and interaction
 * performance in a headless browser environment.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createSpinner } = require('nanospinner');

// Default pages/components to test if none specified
const DEFAULT_PAGES = [
  { name: 'login', path: '/login', interactions: ['login'] },
  { name: 'dashboard', path: '/dashboard', interactions: ['tabChange'] },
  { name: 'suppliers', path: '/suppliers', interactions: ['search', 'filter'] },
  { name: 'customers', path: '/customers', interactions: ['search', 'filter'] },
  { name: 'inspections', path: '/inspections', interactions: ['search', 'filter'] },
  { name: 'supplierDetails', path: '/suppliers/sup123', interactions: ['tabChange'] },
  { name: 'customerDetails', path: '/customers/cust123', interactions: ['tabChange'] },
  { name: 'inspectionDetails', path: '/inspections/insp123', interactions: ['tabChange'] },
];

/**
 * Run frontend performance tests
 */
async function run(config) {
  // Determine which pages to test
  const pagesToTest = config.components.length > 0
    ? config.components.map(component => {
        return { name: component, path: `/${component}` };
      })
    : DEFAULT_PAGES;

  console.log(`Testing ${pagesToTest.length} frontend pages/components`);
  
  // Launch browser
  const spinner = createSpinner('Launching headless browser').start();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  spinner.success({ text: 'Headless browser launched' });
  
  // Login and get authentication
  let authCookies = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Go to login page
    await page.goto(`${getBaseURL()}/login`, { waitUntil: 'networkidle0' });
    
    // Fill login form
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="password"]', 'password123');
    
    // Submit form and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    
    // Get cookies for authenticated requests
    authCookies = await page.cookies();
    
    await page.close();
  } catch (error) {
    console.warn('Warning: Could not authenticate. Some tests may fail.');
    console.warn(error.message);
  }
  
  // Run tests for each page
  const results = [];
  
  for (const pageConfig of pagesToTest) {
    const pageSpinner = createSpinner(`Testing page: ${pageConfig.path}`).start();
    
    try {
      const result = await testPage(browser, pageConfig, authCookies, config);
      results.push(result);
      pageSpinner.success({ text: `Page ${pageConfig.path} tested successfully` });
    } catch (error) {
      pageSpinner.error({ text: `Error testing page ${pageConfig.path}: ${error.message}` });
      results.push({
        page: pageConfig.path,
        error: error.message,
        success: false
      });
    }
  }
  
  // Close browser
  await browser.close();
  
  // Generate summary stats
  const summary = generateSummary(results);
  
  // Save detailed results
  const resultPath = path.join(config.reportDir, `frontend-performance-${config.timestamp}.json`);
  fs.writeFileSync(resultPath, JSON.stringify({ results, summary }, null, 2));
  
  return {
    results,
    summary,
    recommendations: generateRecommendations(results, summary)
  };
}

/**
 * Test a single page using Puppeteer
 */
async function testPage(browser, pageConfig, authCookies, config) {
  const page = await browser.newPage();
  
  // Set cookies for authentication
  if (authCookies.length > 0 && pageConfig.path !== '/login') {
    await page.setCookie(...authCookies);
  }
  
  // Enable performance metrics collection
  await page.setViewport({ width: 1280, height: 800 });
  
  // Create performance observer
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = {
      firstPaint: 0,
      firstContentfulPaint: 0,
      domContentLoaded: 0,
      load: 0,
      timeToInteractive: 0,
      renderMetrics: [],
      resourceMetrics: [],
      errors: []
    };
    
    // Listen for errors
    window.addEventListener('error', function(e) {
      window.performanceMetrics.errors.push({
        message: e.message,
        source: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        timestamp: Date.now()
      });
    });
    
    // Performance observer for paint timing
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          window.performanceMetrics.firstPaint = entry.startTime;
        }
        if (entry.name === 'first-contentful-paint') {
          window.performanceMetrics.firstContentfulPaint = entry.startTime;
        }
      });
    });
    observer.observe({ entryTypes: ['paint'] });
    
    // Listen for DOM content loaded
    document.addEventListener('DOMContentLoaded', () => {
      window.performanceMetrics.domContentLoaded = performance.now();
    });
    
    // Listen for load event
    window.addEventListener('load', () => {
      window.performanceMetrics.load = performance.now();
      
      // Collect resource timing data
      const resources = performance.getEntriesByType('resource');
      resources.forEach(resource => {
        window.performanceMetrics.resourceMetrics.push({
          name: resource.name,
          duration: resource.duration,
          size: resource.transferSize,
          type: resource.initiatorType
        });
      });
      
      // Estimate time to interactive
      // A simple heuristic: time to load + 500ms
      setTimeout(() => {
        window.performanceMetrics.timeToInteractive = window.performanceMetrics.load + 500;
      }, 500);
    });
    
    // Track component render times if the performance monitor is available
    if (typeof window.__PERFORMANCE_MONITOR__ !== 'undefined') {
      const originalAddMetric = window.__PERFORMANCE_MONITOR__.addPerformanceMetric;
      window.__PERFORMANCE_MONITOR__.addPerformanceMetric = (metric) => {
        window.performanceMetrics.renderMetrics.push(metric);
        return originalAddMetric(metric);
      };
    }
  });
  
  // Start navigation and measure performance
  const navigationStart = Date.now();
  const url = `${getBaseURL()}${pageConfig.path}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Take screenshot for reference
  const screenshotPath = path.join(config.reportDir, `screenshot-${pageConfig.name}-${config.timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  
  // Perform interactions if specified
  const interactionResults = [];
  if (pageConfig.interactions && pageConfig.interactions.length > 0) {
    for (const interaction of pageConfig.interactions) {
      try {
        const interactionResult = await performInteraction(page, interaction);
        interactionResults.push(interactionResult);
      } catch (error) {
        interactionResults.push({
          name: interaction,
          success: false,
          error: error.message
        });
      }
    }
  }
  
  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    return window.performanceMetrics;
  });
  
  // Collect Lighthouse-like metrics
  const performanceMetrics = await page.metrics();
  
  // Memory usage
  const jsHeapUsed = performanceMetrics.JSHeapUsedSize / (1024 * 1024); // Convert to MB
  
  // Close page
  await page.close();
  
  return {
    page: pageConfig.path,
    name: pageConfig.name,
    navigationTime: Date.now() - navigationStart,
    firstPaint: metrics.firstPaint,
    firstContentfulPaint: metrics.firstContentfulPaint,
    domContentLoaded: metrics.domContentLoaded,
    load: metrics.load,
    timeToInteractive: metrics.timeToInteractive,
    jsHeapUsed,
    errors: metrics.errors,
    interactions: interactionResults,
    renderMetrics: metrics.renderMetrics,
    resourceMetrics: summarizeResources(metrics.resourceMetrics),
    success: metrics.errors.length === 0,
    screenshotPath
  };
}

/**
 * Perform a specific interaction on the page
 */
async function performInteraction(page, interaction) {
  const startTime = Date.now();
  
  switch (interaction) {
    case 'login':
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password123');
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      break;
      
    case 'search':
      await page.type('[data-testid="search-input"]', 'test');
      await Promise.all([
        page.click('[data-testid="search-button"]'),
        page.waitForResponse(response => response.url().includes('/api/') && response.status() === 200),
      ]);
      break;
      
    case 'filter':
      await Promise.all([
        page.click('[data-testid="filter-button"]'),
        page.waitForSelector('[data-testid="status-filter"]', { visible: true }),
      ]);
      await page.select('[data-testid="status-filter"]', 'Active');
      await Promise.all([
        page.click('[data-testid="apply-filter-button"]'),
        page.waitForResponse(response => response.url().includes('/api/') && response.status() === 200),
      ]);
      break;
      
    case 'tabChange':
      const tabs = await page.$$('[role="tab"]');
      if (tabs.length > 1) {
        await Promise.all([
          tabs[1].click(),
          page.waitForResponse(response => response.url().includes('/api/') && response.status() === 200).catch(() => {}),
        ]);
      }
      break;
      
    default:
      throw new Error(`Unknown interaction: ${interaction}`);
  }
  
  return {
    name: interaction,
    duration: Date.now() - startTime,
    success: true
  };
}

/**
 * Summarize resource metrics
 */
function summarizeResources(resources) {
  if (!resources || resources.length === 0) {
    return {
      totalResources: 0,
      totalSize: 0,
      slowestResource: null
    };
  }
  
  const totalResources = resources.length;
  const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0) / (1024 * 1024); // MB
  const slowestResource = [...resources].sort((a, b) => b.duration - a.duration)[0];
  
  return {
    totalResources,
    totalSize,
    slowestResource: {
      name: slowestResource.name,
      duration: slowestResource.duration,
      type: slowestResource.type
    }
  };
}

/**
 * Generate a summary of frontend performance test results
 */
function generateSummary(results) {
  // Filter out failed tests
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    return {
      avgFirstPaint: 0,
      avgFirstContentfulPaint: 0,
      avgLoadTime: 0,
      avgRenderTime: 0,
      avgJsHeapUsed: 0,
      slowestPages: []
    };
  }
  
  // Calculate aggregate metrics
  const avgFirstPaint = successfulResults.reduce((sum, r) => sum + r.firstPaint, 0) / successfulResults.length;
  const avgFirstContentfulPaint = successfulResults.reduce((sum, r) => sum + r.firstContentfulPaint, 0) / successfulResults.length;
  const avgLoadTime = successfulResults.reduce((sum, r) => sum + r.load, 0) / successfulResults.length;
  const avgTimeToInteractive = successfulResults.reduce((sum, r) => sum + r.timeToInteractive, 0) / successfulResults.length;
  const avgJsHeapUsed = successfulResults.reduce((sum, r) => sum + r.jsHeapUsed, 0) / successfulResults.length;
  
  // Calculate render time if available
  let avgRenderTime = 0;
  let renderTimeCount = 0;
  
  successfulResults.forEach(result => {
    if (result.renderMetrics && result.renderMetrics.length > 0) {
      const renderMetrics = result.renderMetrics.filter(m => m.type === 'render');
      if (renderMetrics.length > 0) {
        avgRenderTime += renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length;
        renderTimeCount++;
      }
    }
  });
  
  if (renderTimeCount > 0) {
    avgRenderTime /= renderTimeCount;
  }
  
  return {
    avgFirstPaint,
    avgFirstContentfulPaint,
    avgLoadTime,
    avgTimeToInteractive,
    avgRenderTime,
    avgJsHeapUsed,
    // Identify slowest pages
    slowestPages: successfulResults
      .sort((a, b) => b.load - a.load)
      .slice(0, 3)
      .map(r => ({
        page: r.page,
        loadTime: r.load
      }))
  };
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results, summary) {
  const recommendations = [];
  
  // Check for slow load times
  if (summary.avgLoadTime > 3000) {
    recommendations.push('Page load times are above 3 seconds on average. Consider code splitting, lazy loading, or optimizing resource delivery.');
  }
  
  // Check for long time to interactive
  if (summary.avgTimeToInteractive > 5000) {
    recommendations.push('Time to interactive is above 5 seconds on average. Review JavaScript execution and consider deferring non-critical scripts.');
  }
  
  // Check for high memory usage
  if (summary.avgJsHeapUsed > 100) {
    recommendations.push(`JavaScript heap usage is high (${summary.avgJsHeapUsed.toFixed(2)}MB). Look for memory leaks or optimize data structures.`);
  }
  
  // Specific page recommendations
  summary.slowestPages.forEach(page => {
    if (page.loadTime > 5000) {
      recommendations.push(`Page ${page.page} is very slow to load (${page.loadTime.toFixed(2)}ms). Consider optimizing or implementing progressive loading.`);
    }
  });
  
  // Resource recommendations
  const largeResourcePages = results.filter(r => 
    r.resourceMetrics && 
    r.resourceMetrics.totalSize > 5 // More than 5MB
  );
  
  if (largeResourcePages.length > 0) {
    recommendations.push(`${largeResourcePages.length} pages have excessive resource sizes. Optimize images, use code splitting, and minify resources.`);
  }
  
  return recommendations;
}

/**
 * Get base URL for frontend
 */
function getBaseURL() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

module.exports = {
  run
}; 