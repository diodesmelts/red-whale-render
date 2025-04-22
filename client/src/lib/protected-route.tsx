import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route } from "wouter";

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
      ) : !user ? (
        <Redirect to="/auth" />
      ) : adminRequired && !user.isAdmin ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            You need administrator privileges to access this page.
          </p>
          <a href="/" className="text-primary hover:underline mt-4">
            Return to Home
          </a>
        </div>
      ) : (
        <Component />
      )}
    </Route>
  );
}
