import { Switch, Route } from "wouter";
import { queryClient, getApiBaseUrl } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { useEffect } from "react";
import ApiTest from "./api-test";

// Pages
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import CompetitionsPage from "@/pages/competitions-page";
import CompetitionDetails from "@/pages/competition-details";
import HowToPlay from "@/pages/how-to-play";
import MyEntries from "@/pages/my-entries";
import MyWins from "@/pages/my-wins";
import ProfilePage from "@/pages/profile";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import ListingsManagement from "@/pages/admin/listings-management";
import CreateCompetition from "@/pages/admin/create-competition";
import EditCompetition from "@/pages/admin/edit-competition";
import SiteConfigPage from "@/pages/admin/site-config";
import AdminSettings from "@/pages/admin/settings";

import { Layout } from "@/components/layout/layout";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

function Router() {
  return (
    <Switch>
      {/* Auth page without layout */}
      <Route path="/auth" component={AuthPage} />
      
      {/* All other routes with layout */}
      <Route>
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/competitions" component={CompetitionsPage} />
              <Route path="/competitions/:id" component={CompetitionDetails} />
              <Route path="/how-to-play" component={HowToPlay} />
              <ProtectedRoute path="/my-entries" component={MyEntries} />
              <ProtectedRoute path="/my-wins" component={MyWins} />
              <ProtectedRoute path="/profile" component={ProfilePage} />
              
              {/* Admin Routes - protected and require admin role */}
              <ProtectedRoute path="/admin" component={AdminDashboard} adminRequired={true} />
              <ProtectedRoute path="/admin/listings" component={ListingsManagement} adminRequired={true} />
              <ProtectedRoute path="/admin/create-competition" component={CreateCompetition} adminRequired={true} />
              <ProtectedRoute path="/admin/edit-competition/:id" component={EditCompetition} adminRequired={true} />
              <ProtectedRoute path="/admin/site-config" component={SiteConfigPage} adminRequired={true} />
              <ProtectedRoute path="/admin/settings" component={AdminSettings} adminRequired={true} />
              
              {/* Fallback to 404 */}
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

// Add a comprehensive connectivity check component that runs on app initialization
function ApiConnectivityCheck() {
  useEffect(() => {
    // Check API connectivity on app load with detailed diagnostics
    const checkApiConnectivity = async () => {
      // Start with a clear header for log readability
      console.log('\n\n🔍 API CONNECTIVITY DIAGNOSTICS 🔍');
      console.log('=================================');
      
      try {
        // Get basic configuration details
        const apiUrl = getApiBaseUrl();
        const isCrossOrigin = !!apiUrl;
        console.log(`📋 CONFIGURATION DETAILS:`);
        console.log(`🔌 API Base URL: ${apiUrl || 'same-origin'}`);
        console.log(`🌍 Cross-Origin: ${isCrossOrigin ? 'Yes' : 'No'}`);
        console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        // Collect and log full browser environment info
        const browserInfo = {
          userAgent: navigator.userAgent,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          href: window.location.href,
          cookies: {
            enabled: navigator.cookieEnabled,
            present: document.cookie.length > 0,
            count: document.cookie ? document.cookie.split(';').length : 0,
            details: document.cookie ? document.cookie.split(';').map(c => c.trim()) : []
          },
          language: navigator.language,
          platform: navigator.platform,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
          deploymentType: window.location.hostname.includes('replit') ? 'Development (Replit)' : 
                         window.location.hostname.includes('render') ? 'Production (Render)' : 
                         'Custom Domain',
          localStorage: {
            available: (() => { try { return !!window.localStorage; } catch (e) { return false; } })(),
            size: (() => { 
              try { 
                let size = 0;
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i) || '';
                  size += key.length + (localStorage.getItem(key) || '').length;
                }
                return size;
              } catch (e) { return 0; } 
            })()
          }
        };
        
        console.log(`\n🌐 BROWSER ENVIRONMENT:`);
        console.log(JSON.stringify(browserInfo, null, 2));
        
        // Check cookies specifically - critical for authentication
        console.log(`\n🍪 COOKIE STATUS:`);
        if (browserInfo.cookies.present) {
          console.log(`✅ Cookies are present (${browserInfo.cookies.count} found)`);
          console.log(`📝 Cookie details:`);
          browserInfo.cookies.details.forEach(cookie => {
            console.log(`   - ${cookie}`);
            
            // Special logging for important cookies
            if (cookie.includes('connect.sid')) {
              console.log(`     ✅ Session cookie found!`);
            }
            if (cookie.includes('domain=')) {
              const domain = cookie.split('domain=')[1]?.split(';')[0];
              console.log(`     ℹ️ Cookie domain: ${domain}`);
            }
          });
        } else {
          console.log(`❌ No cookies present - this will cause authentication issues`);
        }
        
        // Perform a health check to the API with detailed logging
        const healthCheckUrl = `${apiUrl || ''}/api/health`;
        console.log(`\n🩺 API HEALTH CHECK:`);
        console.log(`📡 Requesting: ${healthCheckUrl}`);
        
        try {
          const healthResponse = await fetch(healthCheckUrl, { 
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          console.log(`📥 Response status: ${healthResponse.status} ${healthResponse.statusText}`);
          
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log(`✅ API health check successful`);
            console.log(`📝 Health data:`, JSON.stringify(healthData, null, 2));
          } else {
            console.error(`❌ API health check failed`);
          }
        } catch (healthError: any) {
          console.error(`❌ API health check failed with error: ${healthError.message}`);
        }
        
        // Perform authentication check
        console.log(`\n🔐 AUTHENTICATION CHECK:`);
        console.log(`🔍 Query request: GET /api/user`);
        
        try {
          const authResponse = await fetch(`${apiUrl || ''}/api/user`, { 
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          console.log(`📥 Query response: ${authResponse.status} ${authResponse.statusText}`);
          
          if (authResponse.ok) {
            const userData = await authResponse.json();
            console.log(`✅ Authenticated as user:`, JSON.stringify(userData, null, 2));
          } else if (authResponse.status === 401) {
            console.log(`🔒 Unauthorized but returning null as configured`);
          } else {
            console.error(`❌ Unexpected auth response`);
          }
        } catch (authError: any) {
          console.error(`❌ Authentication check failed with error: ${authError.message}`);
        }
        
        // Log a clear footer for log readability
        console.log('\n✅ DIAGNOSTICS COMPLETE');
        console.log('======================\n\n');
        
      } catch (error: any) {
        console.error('❌ API connectivity diagnostics failed:', error.message);
      }
    };
    
    checkApiConnectivity();
  }, []);
  
  return null; // This component doesn't render anything
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="blue-whale-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <ApiConnectivityCheck />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
