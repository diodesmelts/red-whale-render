import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { SimpleEventEmitter } from './simple-event-emitter';

// Create a global event emitter for error events
export const errorEventEmitter = new SimpleEventEmitter();
// Custom event for showing the debug overlay
export const SHOW_DEBUG_OVERLAY_EVENT = 'show-debug-overlay';
// Custom event for error reporting
export const REPORT_ERROR_EVENT = 'report-error';

// Get the API URL based on environment
export const getApiBaseUrl = () => {
  // Check for explicitly defined API URL in env
  if (import.meta.env.VITE_API_URL) {
    console.log(`🔌 Using API URL from environment: ${import.meta.env.VITE_API_URL}`);
    return import.meta.env.VITE_API_URL;
  }
  
  // Production domain detection - in production we're likely on the main domain
  const isProduction = import.meta.env.MODE === 'production';
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  
  console.log(`🔌 API URL Determination:`, {
    mode: import.meta.env.MODE,
    isProduction,
    hostname,
    origin,
    protocol: window.location.protocol,
    port: window.location.port
  });
  
  // Check if we're on the production domain
  if (isProduction) {
    // For Render.com deployment
    if (hostname.includes('onrender.com')) {
      console.log('🔌 Render.com production environment detected - using /api prefix');
      return '/api';
    }
    
    // For official domain
    if (hostname === 'bluewhalecompetitions.co.uk' || hostname === 'www.bluewhalecompetitions.co.uk') {
      console.log('🔌 Production environment detected on official domain - using /api prefix');
      return '/api';
    }
    
    console.log('🔌 Production environment on unknown domain detected - using /api prefix');
    return '/api';
  }
  
  // Single service architecture - API is always same origin (empty string)
  console.log('🔌 Development environment - using API on same origin (empty prefix)');
  return '';
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const url = res.url;
    
    // Log additional diagnostic information for the 404 error
    if (res.status === 404) {
      const isProduction = import.meta.env.MODE === 'production';
      const hostname = window.location.hostname;
      const origin = window.location.origin;
      
      console.error('404 ERROR DIAGNOSTIC:', {
        resourceUrl: url,
        hostname,
        origin,
        mode: import.meta.env.MODE,
        apiBaseUrl: getApiBaseUrl(),
        responseText: text,
        requestMethod: res.type,
        headers: Array.from(res.headers.entries()),
        timestamp: new Date().toISOString()
      });
      
      // Special handling for authentication-related endpoints
      if (url.includes('/api/login') || url.includes('/api/user') || url.includes('/api/register')) {
        console.error(`AUTHENTICATION ENDPOINT 404 ERROR: The ${url.includes('/api/login') ? 'login' : url.includes('/api/user') ? 'user' : 'registration'} endpoint could not be found`);
        console.error('This typically happens when:');
        console.error('1. The API routes are not correctly registered');
        console.error('2. The server is not handling the route properly');
        console.error('3. There might be path prefix issues in the API URL construction');
        
        throw new Error(`The ${url.includes('/api/login') ? 'login' : url.includes('/api/user') ? 'user' : 'registration'} endpoint was not found on the server. This is likely a configuration issue - please contact support.`);
      }
      
      throw new Error("The requested resource was not found. This might be a server configuration issue.");
    }
    
    // Provide more user-friendly error messages for other status codes
    if (res.status === 401) {
      throw new Error("Invalid username or password. Please try again.");
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
  options?: {
    body?: FormData | string;
    headers?: Record<string, string>;
    processData?: boolean;
    contentType?: boolean;
  }
): Promise<Response> {
  try {
    // Add the API base URL if provided and the URL doesn't already have http
    // Special handling for URLs that already include /api
    let apiUrl;
    
    // Get environment info for proper URL construction
    const isProduction = import.meta.env.MODE === 'production';
    const hostname = window.location.hostname;
    const isRender = hostname.includes('onrender.com');
    const isMobyComps = hostname.includes('mobycomps.co.uk');
    
    // Log environment detection for debugging
    console.log(`🌐 URL processing environment:`, {
      url,
      isProduction,
      hostname,
      isRender,
      isMobyComps,
      referer: document.referrer,
      pathName: window.location.pathname,
      fullOrigin: window.location.origin,
      protocol: window.location.protocol
    });
    
    // PRODUCTION DEBUG: Additional logging specifically for MobyComps domain
    if (isMobyComps) {
      console.log(`🔍 MOBYCOMPS REQUEST DEBUGGING: ${method} ${url}`);
      console.log(`📌 Request data:`, data || {});
      
      // Log exactly where this is being called from (stack trace)
      console.log(`📚 Call stack:`, new Error().stack);
    }
    
    if (url.startsWith('http')) {
      apiUrl = url;
    } else {
      const baseUrl = getApiBaseUrl();
      
      // SIMPLIFIED URL HANDLING FOR ALL ENVIRONMENTS
      // Always use consistent URL formatting
      
      // If URL already has /api prefix and baseUrl also has /api
      if (baseUrl === '/api' && url.startsWith('/api/')) {
        // Just use the URL as is - no need for additional prefix
        console.log(`🌐 URL already has /api prefix: ${url}`);
        apiUrl = url;
      } 
      // For admin routes in production when baseUrl is /api
      else if (baseUrl === '/api' && url.startsWith('/admin/')) {
        // Add /api prefix
        console.log(`🌐 Adding /api prefix to admin route: /api${url}`);
        apiUrl = `/api${url}`;
      }
      // For all other cases
      else {
        // Add whatever baseUrl is to the URL
        console.log(`🌐 Standard URL construction: ${baseUrl}${url}`);
        apiUrl = `${baseUrl}${url}`;
      }
    }
    
    console.log(`🚀 API Request: ${method} ${apiUrl}`);

    // Handle FormData or regular JSON data
    let headers = options?.headers || {};
    let body: any = undefined;
    
    if (options?.body && typeof options?.body !== 'string' && 'append' in options.body) {
      // FormData should not have content-type set (browser will set it with boundary)
      body = options.body;
      console.log('Request with FormData:', Array.from((options.body as any).keys()));
    } else if (data) {
      // Standard JSON data
      if (options?.contentType !== false) {
        headers = { ...headers, "Content-Type": "application/json" };
      }
      body = options?.body || JSON.stringify(data);
      console.log('Request data:', { ...data, password: data && 'password' in (data as any) ? 'REDACTED' : undefined });
    } else if (options?.body && typeof options.body === 'string') {
      // String body provided directly in options
      body = options.body;
    }
    
    // Enhanced debugging for admin endpoints
    if (apiUrl.includes('/api/admin/')) {
      console.log('📝 ADMIN API REQUEST:', {
        url: apiUrl,
        method,
        headers,
        withCredentials: true,
        cookiesEnabled: navigator.cookieEnabled,
        cookieLength: document.cookie.length,
        time: new Date().toISOString()
      });
    }
    
    const res = await fetch(apiUrl, {
      method,
      headers,
      body,
      credentials: "include", // This ensures cookies are sent with the request
    });

    console.log(`📥 API Response: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const responseText = await res.text();
      console.error(`❌ API Error: ${res.status} ${res.statusText}`, responseText);
      
      // Format a user-friendly error message
      let errorMessage = "";
      if (res.status === 401) {
        errorMessage = "Invalid username or password. Please try again.";
      } else if (res.status === 404) {
        errorMessage = "The requested resource was not found.";
      } else if (res.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage = `${res.status}: ${responseText || res.statusText}`;
      }
      
      // Emit error information for debug overlay
      errorEventEmitter.emit(REPORT_ERROR_EVENT, {
        title: `API Error: ${res.status} ${res.statusText}`,
        message: errorMessage,
        details: responseText,
        requestInfo: {
          method,
          url,
          apiUrl,
          data: data ? JSON.stringify(data, null, 2) : null,
          headers
        },
        responseInfo: {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(Array.from(res.headers.entries())),
          raw: responseText
        },
        apiUrl: url,
        finalApiUrl: apiUrl
      });
      
      // Trigger the debug overlay to show
      document.dispatchEvent(new Event(SHOW_DEBUG_OVERLAY_EVENT));
      
      throw new Error(errorMessage);
    }
    
    return res;
  } catch (error) {
    // Handle network errors (Failed to fetch)
    console.error('API request failed:', error);
    
    if (error instanceof Error) {
      // Special case for the "requested resource was not found" error
      if (error.message.includes('not found') || error.message.includes('Failed to fetch')) {
        // Create a very detailed diagnostic report
        // Use the same URL logic as above for consistent reporting
        let apiUrl;
        if (url.startsWith('http')) {
          apiUrl = url;
        } else {
          const baseUrl = getApiBaseUrl();
          // Prevent double /api prefix issues in production
          if (baseUrl === '/api' && url.startsWith('/api/')) {
            // Strip the leading /api from the url to avoid duplication
            apiUrl = url;
          } else {
            apiUrl = `${baseUrl}${url}`;
          }
        }
        const domain = window.location.hostname;
        const isProduction = import.meta.env.MODE === 'production';
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        
        console.error('🔍 DETAILED ERROR DIAGNOSTIC:', {
          errorMessage: error.message,
          url,
          apiUrl,
          origin,
          pathname,
          domain,
          mode: import.meta.env.MODE,
          apiBaseUrl: getApiBaseUrl(),
          networkStatus: window.navigator.onLine ? 'Online' : 'Offline',
          userAgent: window.navigator.userAgent,
          timestamp: new Date().toISOString(),
          endpoint: url
        });
        
        // Provide specific and helpful error messages by endpoint
        if (url.includes('/api/login')) {
          console.error('LOGIN ENDPOINT ERROR: The login endpoint could not be found or is not responding correctly.');
          console.error('This typically happens when:');
          console.error('1. The API server is down');
          console.error('2. The endpoint path is incorrect');
          console.error('3. CORS is blocking the request');
          console.error('4. Network connectivity issues');
          console.error(`Current API Base URL: ${getApiBaseUrl()}`);
          console.error(`Full URL attempted: ${apiUrl}`);
          
          throw new Error(`Login failed - the server returned "resource not found". 
          
Technical details:
- Network: ${window.navigator.onLine ? 'Online' : 'Offline'} 
- Domain: ${domain}
- API URL attempted: ${apiUrl}
- Environment: ${isProduction ? 'Production' : 'Development'}

This is likely a server configuration issue. Please contact support.`);
        } else if (url.includes('/api/register')) {
          // Provide a much more detailed error message for registration failures
          console.error('REGISTRATION ENDPOINT ERROR: The registration endpoint could not be found or is not responding correctly.');
          
          throw new Error(`Registration failed - the server returned "resource not found". 
          
Technical details:
- Network: ${window.navigator.onLine ? 'Online' : 'Offline'} 
- Domain: ${domain}
- API URL attempted: ${apiUrl}
- Environment: ${isProduction ? 'Production' : 'Development'}
- Error: ${error.message}

This issue is being investigated. Please try again later or contact support.`);
        } else {
          console.error(`ENDPOINT ERROR (${url}): The requested endpoint could not be found or is not responding correctly.`);
          throw new Error(`Connection error: ${error.message}. Please check your internet connection and try again.`);
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
      // Special handling for URLs that already include /api
      let apiUrl;
      if (queryUrl.startsWith('http')) {
        apiUrl = queryUrl;
      } else {
        const baseUrl = getApiBaseUrl();
        // Use the same URL formatting logic for consistency
        // If URL already has /api prefix and baseUrl also has /api
        if (baseUrl === '/api' && queryUrl.startsWith('/api/')) {
          // Just use the URL as is - no need for additional prefix
          apiUrl = queryUrl;
        } 
        // For admin routes in production when baseUrl is /api
        else if (baseUrl === '/api' && queryUrl.startsWith('/admin/')) {
          // Add /api prefix
          apiUrl = `/api${queryUrl}`;
        }
        // For all other cases
        else {
          // Add whatever baseUrl is to the URL
          apiUrl = `${baseUrl}${queryUrl}`;
        }
      }
      
      console.log(`🔍 Query request: GET ${apiUrl}`);
      
      // Enhanced debugging for admin endpoints
      if (apiUrl.includes('/api/admin/')) {
        console.log('📝 ADMIN QUERY REQUEST:', {
          url: apiUrl,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          cookiesEnabled: navigator.cookieEnabled,
          cookieLength: document.cookie.length,
          time: new Date().toISOString()
        });
      }
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        credentials: "include", // This ensures cookies are sent with the request
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
        
        // Format a user-friendly error message
        let errorMessage = "";
        if (res.status === 401) {
          errorMessage = "Invalid username or password. Please try again.";
        } else if (res.status === 404) {
          errorMessage = "The requested resource was not found.";
        } else if (res.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = `${res.status}: ${responseText || res.statusText}`;
        }
        
        // Emit error information for debug overlay
        errorEventEmitter.emit(REPORT_ERROR_EVENT, {
          title: `Query Error: ${res.status} ${res.statusText}`,
          message: errorMessage,
          details: responseText,
          requestInfo: {
            method: 'GET',
            queryKey,
            apiUrl
          },
          responseInfo: {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(Array.from(res.headers.entries())),
            raw: responseText
          },
          apiUrl: queryUrl,
          finalApiUrl: apiUrl
        });
        
        // Trigger the debug overlay to show
        document.dispatchEvent(new Event(SHOW_DEBUG_OVERLAY_EVENT));
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      // Handle network errors (Failed to fetch)
      console.error('Query error:', error);
      
      if (error instanceof Error) {
        // Enhance error reporting for both "not found" and network errors
        if (error.message.includes('not found') || error.message.includes('Failed to fetch')) {
          const queryUrl = queryKey[0] as string;
          // Use the same URL logic as above for consistent reporting
          let apiUrl;
          if (queryUrl.startsWith('http')) {
            apiUrl = queryUrl;
          } else {
            const baseUrl = getApiBaseUrl();
            // Prevent double /api prefix issues in production
            if (baseUrl === '/api' && queryUrl.startsWith('/api/')) {
              // Strip the leading /api from the url to avoid duplication
              apiUrl = queryUrl;
            } else {
              apiUrl = `${baseUrl}${queryUrl}`;
            }
          }
          const domain = window.location.hostname;
          const isProduction = import.meta.env.MODE === 'production';
          const origin = window.location.origin;
          const pathname = window.location.pathname;
          
          const diagnosticInfo = {
            errorMessage: error.message,
            queryKey,
            apiUrl,
            origin,
            pathname,
            domain,
            mode: import.meta.env.MODE,
            apiBaseUrl: getApiBaseUrl(),
            networkStatus: window.navigator.onLine ? 'Online' : 'Offline',
            userAgent: window.navigator.userAgent,
            timestamp: new Date().toISOString()
          };
          
          console.error('🔍 DETAILED QUERY ERROR DIAGNOSTIC:', diagnosticInfo);
          
          // Send to debug overlay
          errorEventEmitter.emit(REPORT_ERROR_EVENT, {
            title: `Network Error: ${error.message}`,
            message: `Failed to fetch data from ${queryUrl}`,
            details: JSON.stringify(diagnosticInfo, null, 2),
            requestInfo: {
              method: 'GET',
              queryKey,
              apiUrl,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            },
            responseInfo: {
              error: error.message,
              stack: error.stack,
              networkStatus: window.navigator.onLine ? 'Online' : 'Offline'
            },
            apiUrl: queryUrl,
            finalApiUrl: apiUrl,
            timestamp: new Date().toISOString()
          });
          
          // Trigger the debug overlay to show
          document.dispatchEvent(new Event(SHOW_DEBUG_OVERLAY_EVENT));
          
          if (queryUrl.includes('/api/user')) {
            console.error('USER ENDPOINT ERROR: The user endpoint could not be found or is not responding correctly');
            console.error('This typically happens when:');
            console.error('1. Authentication is misconfigured');
            console.error('2. Session store is not working correctly');
            console.error('3. Wrong API URL configuration');
            console.error(`Current API Base URL: ${getApiBaseUrl()}`);
            console.error(`Full URL attempted: ${apiUrl}`);
            
            // For user endpoint issues, return null instead of throwing
            // This way the app can still function in unauthenticated mode
            if (unauthorizedBehavior === "returnNull") {
              console.warn('Returning null for user endpoint error due to returnNull configuration');
              return null;
            }
            
            throw new Error(`Authentication check failed - server returned "resource not found".
            
Technical details:
- Network: ${window.navigator.onLine ? 'Online' : 'Offline'} 
- Domain: ${domain}
- API URL attempted: ${apiUrl}
- Environment: ${isProduction ? 'Production' : 'Development'}

This is likely a server configuration issue. Please contact support.`);
          }
          
          // General error for other endpoints
          console.error(`QUERY ENDPOINT ERROR (${queryUrl}): The requested endpoint could not be found or is not responding correctly.`);
          throw new Error(`Resource not found error: ${error.message}. This might be due to a server configuration issue.`);
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
