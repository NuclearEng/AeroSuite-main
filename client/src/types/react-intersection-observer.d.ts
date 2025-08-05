declare module 'react-intersection-observer' {
  export interface IntersectionOptions extends IntersectionObserverInit {
    triggerOnce?: boolean;
    skip?: boolean;
    initialInView?: boolean;
    fallbackInView?: boolean;
    trackVisibility?: boolean;
    delay?: number;
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
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

  export type InViewHookResponse = [
    (node?: Element | null) => void,
    boolean,
    IntersectionObserverEntry | undefined
  ];

  export function useInView(options?: IntersectionOptions): InViewHookResponse;
}