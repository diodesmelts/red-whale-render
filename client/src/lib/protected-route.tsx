import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route } from "wouter";

// TEMPORARY: Allow all routes to be accessible without authentication
export function ProtectedRoute({
  path,
  component: Component,
  adminRequired = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  adminRequired?: boolean;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        // Temporarily disable authentication check
        <Component />
      )}
    </Route>
  );
}
