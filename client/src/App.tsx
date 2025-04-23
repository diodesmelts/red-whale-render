import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="blue-whale-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
