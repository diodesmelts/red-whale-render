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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <ShieldAlert className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded mt-4"
          >
            Return Home
          </button>
        </div>
      ) : (
        <Component />
      )}
    </Route>
  );
}
