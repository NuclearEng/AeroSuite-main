import React from 'react';
import { QueryParamProvider as OriginalQueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

interface QueryParamProviderProps {
  children: React.ReactNode;
  adapter?: any;
  ReactRouterRoute?: any;
}

export const QueryParamProvider: React.FC<QueryParamProviderProps> = ({ 
  children, 
  adapter = ReactRouter6Adapter,
  ReactRouterRoute
}) => {
  return (
    <OriginalQueryParamProvider adapter={adapter} ReactRouterRoute={ReactRouterRoute}>
      {children}
    </OriginalQueryParamProvider>
  );
};