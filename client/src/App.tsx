import React from "react";
import { Switch, Route } from "wouter";
import { queryClient, getApiBaseUrl } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "./lib/protected-route";
import { useEffect } from "react";
import ApiTest from "./api-test";
import { DebugOverlayProvider } from "@/components/ui/debug-overlay-provider";

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
import TestRegister from "@/pages/test-register";
import CartPage from "@/pages/cart";
import TermsConditions from "@/pages/terms-conditions";
import PrivacyPolicy from "@/pages/privacy-policy";
import CookiePolicy from "@/pages/cookie-policy";
import FAQsPage from "@/pages/faqs";

// Admin Pages
import AdminDashboard from "@/pages/admin/index";
import CompetitionsManagement from "@/pages/admin/competitions";
import UsersManagement from "@/pages/admin/users";
import AdminSettings from "@/pages/admin/settings";
import SiteConfigPage from "@/pages/admin/site-config";
import DevTools from "@/pages/admin/dev-tools";

// Dynamically import create-competition to avoid TypeScript issues
const CreateCompetition = () => {
  const CreateCompPage = React.lazy(() => import("@/pages/admin/create-competition"));
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <CreateCompPage />
    </React.Suspense>
  );
};

import { Layout } from "@/components/layout/layout";
import { Navbar } from "@/components/layout/navbar-new";
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
              <ProtectedRoute path="/cart" component={CartPage} />
              <Route path="/test-register" component={TestRegister} />
              
              {/* Policy Pages */}
              <Route path="/terms-conditions" component={TermsConditions} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/cookie-policy" component={CookiePolicy} />
              <Route path="/faqs" component={FAQsPage} />
              
              {/* Admin Routes - protected and require admin role */}
              <ProtectedRoute path="/admin" component={AdminDashboard} adminRequired={true} />
              <ProtectedRoute path="/admin/competitions" component={CompetitionsManagement} adminRequired={true} />
              <ProtectedRoute path="/admin/create-competition" component={CreateCompetition} adminRequired={true} />
              <ProtectedRoute path="/admin/users" component={UsersManagement} adminRequired={true} />
              <ProtectedRoute path="/admin/settings" component={AdminSettings} adminRequired={true} />
              <ProtectedRoute path="/admin/site-config" component={SiteConfigPage} adminRequired={true} />
              <ProtectedRoute path="/admin/dev-tools" component={DevTools} adminRequired={true} />
              
              {/* Fallback to 404 */}
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

// Simplified connectivity check component with no frontend diagnostics logging
function ApiConnectivityCheck() {
  useEffect(() => {
    // Simple API connectivity check without client-side diagnostics
    const checkApiConnectivity = async () => {
      try {
        // Basic health check only - server-side logging handles the diagnostics
        const apiUrl = getApiBaseUrl();
        const healthCheckUrl = `${apiUrl || ''}/api/health`;
        
        await fetch(healthCheckUrl, { 
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (error: any) {
        // Only log critical errors
        console.error('API connectivity check failed:', error.message);
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
          <CartProvider>
            <TooltipProvider>
              <DebugOverlayProvider>
                <Toaster />
                <ApiConnectivityCheck />
                <Router />
              </DebugOverlayProvider>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
