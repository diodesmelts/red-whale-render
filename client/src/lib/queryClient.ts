import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the API URL based on environment
export const getApiBaseUrl = () => {
  // Check for explicitly defined API URL in env
  if (import.meta.env.VITE_API_URL) {
    console.log(`🔌 Using API URL from environment: ${import.meta.env.VITE_API_URL}`);
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use a specific API URL
  if (import.meta.env.MODE === 'production') {
    // Use multiple potential API URLs with fallbacks
    const apiUrls = [
      'https://blue-whale-api.onrender.com',
      'https://redwhale-api.onrender.com',
      'https://api.bluewhalecompetitions.co.uk'
    ];
    
    // If we're in bluewhalecompetitions.co.uk, prefer that API domain
    if (window.location.hostname.includes('bluewhalecompetitions.co.uk')) {
      console.log('🔌 Using bluewhalecompetitions.co.uk API');
      return 'https://api.bluewhalecompetitions.co.uk';
    }
    
    // If we're in render.com domain, prefer render.com API
    if (window.location.hostname.includes('render.com')) {
      console.log('🔌 Using Render API');
      return 'https://blue-whale-api.onrender.com';
    }
    
    // Default API URL
    console.log('🔌 Using default production API: blue-whale-api.onrender.com');
    return 'https://blue-whale-api.onrender.com';
  }
  
  // In development, use the local server (empty string for same-origin)
  console.log('🔌 Using development API (same origin)');
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
    
    console.log(`🚀 API Request: ${method} ${apiUrl}`);
    if (data) {
      console.log('Request data:', { ...data, password: data && 'password' in (data as any) ? 'REDACTED' : undefined });
    }
    
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`📥 API Response: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const responseText = await res.text();
      console.error(`❌ API Error: ${res.status} ${res.statusText}`, responseText);
      
      // Format a user-friendly error message
      if (res.status === 401) {
        throw new Error("Invalid username or password. Please try again.");
      } else if (res.status === 404) {
        throw new Error("The requested resource was not found.");
      } else if (res.status >= 500) {
        throw new Error("Server error. Please try again later.");
      } else {
        throw new Error(`${res.status}: ${responseText || res.statusText}`);
      }
    }
    
    return res;
  } catch (error) {
    // Handle network errors (Failed to fetch)
    console.error('API request failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        console.error('Network error details:', {
          url,
          apiUrl: !url.startsWith('http') ? `${getApiBaseUrl()}${url}` : url,
          mode: import.meta.env.MODE
        });
        
        // Provide specific and helpful error messages by endpoint
        if (url === '/api/login') {
          throw new Error('Invalid username or password. Please try again.');
        } else if (url === '/api/register') {
          // Provide a much more detailed error message for registration failures
          const apiUrl = !url.startsWith('http') ? `${getApiBaseUrl()}${url}` : url;
          const domain = window.location.hostname;
          const isProduction = import.meta.env.MODE === 'production';
          
          throw new Error(`Registration failed - the server may be temporarily unavailable. 
          
Technical details:
- Network: ${window.navigator.onLine ? 'Online' : 'Offline'} 
- Domain: ${domain}
- API URL: ${apiUrl}
- Environment: ${isProduction ? 'Production' : 'Development'}

This issue is being investigated. Please try again later or contact support at admin@bluewhalecompetitions.com if the problem persists.`);
        } else if (url.includes('/api/test-register')) {
          throw new Error('Registration test failed - unable to reach our servers. This is likely due to a CORS or cookie restriction.');
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
      
      console.log(`🔍 Query request: GET ${apiUrl}`);
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors' // Explicitly set CORS mode
      });
      
      console.log(`📥 Query response: ${res.status} ${res.statusText}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('🔒 Unauthorized but returning null as configured');
        return null;
      }

      if (!res.ok) {
        const responseText = await res.text();
        console.error(`❌ Query error: ${res.status} ${res.statusText}`, responseText);
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      // Handle network errors (Failed to fetch)
      console.error('Query error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          console.error('Network error details:', {
            queryKey,
            apiBaseUrl: getApiBaseUrl(),
            mode: import.meta.env.MODE,
            hostname: window.location.hostname
          });
          throw new Error('Connection error. Please check your internet connection and try again.');
        }
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
