declare module 'react-intersection-observer' {
  export interface IntersectionOptions {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    triggerOnce?: boolean;
    skip?: boolean;
  }

  export interface IntersectionObserverEntry {
    boundingClientRect: DOMRectReadOnly;
    intersectionRatio: number;
    intersectionRect: DOMRectReadOnly;
    isIntersecting: boolean;
    rootBounds: DOMRectReadOnly | null;
    target: Element;
    time: number;
  }

  export interface UseInViewHookResponse {
    ref: (element: Element | null) => void;
    inView: boolean;
    entry?: IntersectionObserverEntry;
  }

  export function useInView(options?: IntersectionOptions): UseInViewHookResponse;
}