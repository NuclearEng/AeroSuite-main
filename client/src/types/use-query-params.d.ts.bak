declare module 'use-query-params' {
  export type QueryParamConfig<T> = {
    encode: (value: T | undefined | null) => string | undefined | null;
    decode: (value: string | undefined | null) => T | undefined | null;
  };

  export const StringParam: QueryParamConfig<string>;
  export const NumberParam: QueryParamConfig<number>;
  export const BooleanParam: QueryParamConfig<boolean>;
  export const ArrayParam: QueryParamConfig<string[]>;
  export const JsonParam: QueryParamConfig<any>;
  export const DateParam: QueryParamConfig<Date>;

  export type QueryParams = { [key: string]: any };

  export function useQueryParams<T extends QueryParams>(
    paramConfigMap: { [K in keyof T]: QueryParamConfig<T[K]> }
  ): [T, (params: Partial<T>) => void];

  export function QueryParamProvider(props: {
    children: React.ReactNode;
    ReactRouterRoute?: any;
  }): JSX.Element;
}