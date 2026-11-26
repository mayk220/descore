import { useCallback, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL;

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    if (!apiUrl) {
      throw new Error("API URL is not configured");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || `Request failed with status ${response.status}`);
      }

      return response.status === 204 ? null : response.json();
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { request, isLoading, error };
}
