import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the API URL based on environment
export const getApiBaseUrl = () => {
  // In production, use a specific API URL
  if (import.meta.env.MODE === 'production') {
    // Use environment variable if provided or our known API URL
    return import.meta.env.VITE_API_URL || 
           // Check if we're on the custom domain
           (window.location.hostname.includes('bluewhalecompetitions.co.uk') 
             ? 'https://api.bluewhalecompetitions.co.uk' 
             : 'https://blue-whale-api.onrender.com');
  }
  
  // In development, use the local server
  return '';
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Provide more user-friendly error messages
    if (res.status === 401) {
      throw new Error("Invalid username or password. Please try again.");
    } else if (res.status === 404) {
      throw new Error("The requested resource was not found.");
    } else if (res.status >= 500) {
      throw new Error("Server error. Please try again later.");
    } else {
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Add the API base URL if provided and the URL doesn't already have http
    const apiUrl = !url.startsWith('http') ? `${getApiBaseUrl()}${url}` : url;
    
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        if (url === '/api/login') {
          throw new Error('Invalid username or password. Please try again.');
        } else {
          throw new Error('Connection error. Please check your internet connection and try again.');
        }
      }
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const queryUrl = queryKey[0] as string;
      // Add the API base URL if provided and the URL doesn't already have http
      const apiUrl = !queryUrl.startsWith('http') ? `${getApiBaseUrl()}${queryUrl}` : queryUrl;
      
      const res = await fetch(apiUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle network errors (Failed to fetch)
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Connection error. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
