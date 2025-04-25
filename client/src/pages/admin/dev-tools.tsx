import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

// This page is only for development environment
export default function DevTools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  // Check if this is a development environment
  const isDev = process.env.NODE_ENV !== 'production';

  const createTestCompetitions = async () => {
    if (!isDev) {
      toast({
        title: "Development Only",
        description: "This feature is only available in development mode",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/admin/dev-create-test-competitions', {});
      const data = await response.json();
      
      setResult(data);
      toast({
        title: "Success",
        description: `Created ${data.competitions?.length || 0} test competitions`,
      });
    } catch (error: any) {
      console.error('Error creating test competitions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test competitions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetCompetitions = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/admin/reset-competitions', {});
      const data = await response.json();
      
      setResult(data);
      toast({
        title: "Success",
        description: "All competitions have been reset",
      });
    } catch (error: any) {
      console.error('Error resetting competitions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset competitions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // If not an admin, redirect
  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p>You need to be logged in as an administrator to access this page.</p>
        <Link href="/auth">
          <Button className="mt-4">Go to Login</Button>
        </Link>
      </div>
    );
  }

  // If not dev environment, show warning
  if (!isDev) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Development Environment Only</h1>
        <p>This page is only available in development environments.</p>
        <Link href="/admin">
          <Button className="mt-4">Go to Admin Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Development Tools</h1>
      <p className="mb-6 text-gray-600">These tools are only available in the development environment and will not affect production data.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Test Competitions</CardTitle>
            <CardDescription>Create sample competitions for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This will create 3 test competitions with images and appropriate data.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={createTestCompetitions} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Test Competitions
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reset Competitions</CardTitle>
            <CardDescription>Delete all competitions and related data</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This will delete all competitions, entries, and winners from the database.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={resetCompetitions} disabled={loading} variant="destructive">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reset Competitions
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Result</h2>
          <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/admin">
          <Button variant="outline">Back to Admin Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}