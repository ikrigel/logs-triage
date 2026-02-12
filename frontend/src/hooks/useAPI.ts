import { useState, useCallback } from 'react';
import { REQUEST_TIMEOUT } from '../config/api';

interface APIError {
  message: string;
  status?: number;
}

export function useAPI<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const fetchData = useCallback(
    async (
      url: string,
      options: RequestInit = {}
    ): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: 'Failed to parse error response',
          }));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        const apiError: APIError = {
          message:
            err instanceof Error ? err.message : 'An unknown error occurred',
          status:
            err instanceof Error && 'status' in err
              ? (err.status as number)
              : undefined,
        };
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { fetchData, loading, error, data };
}
