/**
 * Lazy Loading Utilities
 * Code splitting for better performance
 */

import { lazy, ComponentType } from 'react';

/**
 * Retry lazy loading on failure (network issues)
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Retry loading component (attempt ${i + 1}/${maxRetries})`);
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }

    throw lastError || new Error('Failed to load component');
  });
}

/**
 * Preload component for faster navigation
 */
export function preloadComponent(
  componentImport: () => Promise<{ default: ComponentType<any> }>
): void {
  componentImport()
    .then(() => console.log('Component preloaded'))
    .catch((err) => console.warn('Failed to preload component:', err));
}

/**
 * Create lazy loaded route component
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazyWithRetry(importFn);
  
  return {
    Component: LazyComponent,
    preload: () => preloadComponent(importFn),
  };
}
