declare module 'use-query-params' {
  import { ReactNode } from 'react';

  export type QueryParamConfig<T> = {
    encode: (value: T | undefined) => string | undefined;
    decode: (value: string | undefined) => T | undefined;
  };

  export const StringParam: QueryParamConfig<string>;
  export const NumberParam: QueryParamConfig<number>;
  export const BooleanParam: QueryParamConfig<boolean>;
  export const ArrayParam: QueryParamConfig<string[]>;
  export const JsonParam: QueryParamConfig<any>;

  export function useQueryParams<T extends Record<string, any>>(
    paramConfigMap: { [K in keyof T]: QueryParamConfig<T[K]> }
  ): [T, (newQuery: Partial<T>) => void];

  export interface QueryParamProviderProps {
    children: ReactNode;
    ReactRouterRoute: any;
  }

  export function QueryParamProvider(props: QueryParamProviderProps): JSX.Element;
}

declare module 'use-query-params/adapters/react-router-6' {
  export const ReactRouter6Adapter: any;
}