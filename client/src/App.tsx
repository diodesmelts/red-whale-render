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
import AuthBypass from "@/pages/auth-bypass"; // Added for development login
import CompetitionsPage from "@/pages/competitions-page";
import CompetitionDetails from "@/pages/competition-details";
// import CompetitionCheckout from "@/pages/checkout"; // Will be added later
import HowToPlay from "@/pages/how-to-play";
import MyEntries from "@/pages/my-entries";
import MyWins from "@/pages/my-wins";
import ProfilePage from "@/pages/profile";

// Admin Pages
import { 
  AdminDashboard,
  ListingsManagement,
  CreateCompetition,
  EditCompetition
} from "@/pages/admin";

import { Layout } from "@/components/layout/layout";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

function Router() {
  return (
    <>
      {/* For all routes except auth pages, show the layout */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth-bypass" component={AuthBypass} />
      <Route path="/:rest*">
        {(params) => {
          // Don't render Layout for auth pages
          if (params["rest*"] === "auth" || params["rest*"] === "auth-bypass") return null;
          
          return (
            <Layout>
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/competitions" component={CompetitionsPage} />
                <Route path="/competitions/:id" component={CompetitionDetails} />
                <Route path="/how-to-play" component={HowToPlay} />
                {/* Checkout feature will be added later */}
                <ProtectedRoute path="/my-entries" component={MyEntries} adminRequired={false} />
                <ProtectedRoute path="/my-wins" component={MyWins} adminRequired={false} />
                <ProtectedRoute path="/profile" component={ProfilePage} adminRequired={false} />
                
                {/* Admin Routes - protected and require admin role */}
                <ProtectedRoute path="/admin" component={ListingsManagement} adminRequired={true} />
                <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminRequired={true} />
                <ProtectedRoute path="/admin/listings" component={ListingsManagement} adminRequired={true} />
                <ProtectedRoute path="/admin/create-competition" component={CreateCompetition} adminRequired={true} />
                <Route path="/admin/edit-competition/:id">
                  {(params) => (
                    <ProtectedRoute 
                      path={`/admin/edit-competition/${params.id}`} 
                      component={() => <EditCompetition id={params.id} />} 
                      adminRequired={true} 
                    />
                  )}
                </Route>
                
                {/* Fallback to 404 */}
                <Route component={NotFound} />
              </Switch>
            </Layout>
          );
        }}
      </Route>
    </>
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
