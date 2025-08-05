declare module 'use-query-params/adapters/react-router-6' {
  export const ReactRouter6Adapter: {
    update: (params: Record<string, any>) => void;
    remove: (paramNames: string[]) => void;
    parse: () => Record<string, any>;
  };
}