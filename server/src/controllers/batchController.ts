import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { URL } from 'url';

/**
 * Interface for a batch request item
 */
interface BatchRequestItem {
  id: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Interface for a batch response item
 */
interface BatchResponseItem {
  id: string;
  status: number;
  data: any;
  error?: string;
}

/**
 * Process a batch of API requests and return the responses
 */
export const processBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests)) {
      return res.status(400).json({
        error: 'Invalid batch request format. Expected an array of requests.'
      });
    }

    // Get the base URL from the request
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Execute all requests in parallel
    const responses: BatchResponseItem[] = await Promise.all(
      requests.map(async (request: BatchRequestItem) => {
        try {
          // Validate the request
          if (!request.id || !request.endpoint) {
            return {
              id: request.id || 'unknown',
              status: 400,
              data: null,
              error: 'Invalid request format. Missing id or endpoint.'
            };
          }

          // Ensure the endpoint is relative (for security)
          if (request.endpoint.startsWith('http')) {
            return {
              id: request.id,
              status: 400,
              data: null,
              error: 'External URLs are not allowed in batch requests.'
            };
          }

          // Create the full URL
          const url = new URL(request.endpoint, baseUrl).toString();

          // Set default method to GET
          const method = request.method || 'GET';

          // Prepare headers
          const headers = {
            'Content-Type': 'application/json',
            ...request.headers,
            // Copy authentication from the original request
            ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {})
          };

          // Execute the request
          const response = await fetch(url, {
            method,
            headers,
            body: request.body ? JSON.stringify(request.body) : undefined
          });

          // Parse the response
          let data: any;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          // Return the response
          return {
            id: request.id,
            status: response.status,
            data
          };
        } catch (error) {
          // Handle errors for individual requests
          console.error(`Error processing batch request ${request.id}:`, error);
          return {
            id: request.id,
            status: 500,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Return all responses
    res.status(200).json({ responses });
  } catch (error) {
    // Handle errors for the entire batch
    console.error('Error processing batch:', error);
    res.status(500).json({
      error: 'Error processing batch request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Simple health check for the batch API
 */
export const healthCheck = (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    message: 'Batch API is operational'
  });
};

export default {
  processBatch,
  healthCheck
}; 