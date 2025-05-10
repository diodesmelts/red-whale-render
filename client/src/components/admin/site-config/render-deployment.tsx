import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RocketIcon, CheckIcon, XIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function RenderDeployment() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
    instructions?: string[];
    logs?: string;
  } | null>(null);
  const { toast } = useToast();

  const handlePrepareRenderDeploy = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/admin/prepare-render-deploy'
      );

      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        toast({
          title: 'Deployment Package Created',
          description: 'The Render deployment package has been created successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Deployment Preparation Failed',
          description: data.message || 'Failed to prepare for Render deployment',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Deployment preparation error:', error);
      toast({
        title: 'Error',
        description: 'There was an error preparing the deployment package',
        variant: 'destructive',
      });
      setResult({
        success: false,
        message: 'Server error. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RocketIcon className="h-5 w-5" /> 
          Render Deployment
        </CardTitle>
        <CardDescription>
          Prepare a pre-built deployment package for Render
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-md border">
          <h3 className="font-medium mb-2">About Render Deployment</h3>
          <p className="text-sm text-muted-foreground mb-2">
            This tool creates a pre-built deployment package that can be pushed to GitHub
            and deployed on Render without build errors. This avoids common issues with
            the build process on Render.
          </p>
          <p className="text-sm text-muted-foreground">
            The package includes all the necessary files and a simplified package.json file
            with the correct dependencies for Render.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing Deployment Package...
                </>
              ) : (
                <>Prepare for Render Deployment</>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Prepare Render Deployment Package</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a pre-built deployment package that can be
                easily deployed to Render without build errors.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePrepareRenderDeploy}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
            <div className="flex items-center gap-2">
              {result.success ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            </div>
            <AlertDescription className="mt-2">{result.message}</AlertDescription>
            
            {result.details && (
              <div className="mt-2 text-sm">
                <p className="font-medium mt-2">Details:</p>
                <p>{result.details}</p>
              </div>
            )}
            
            {result.instructions && result.instructions.length > 0 && (
              <div className="mt-4 text-sm">
                <p className="font-medium">Deployment Instructions:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  {result.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {result.logs && (
              <div className="mt-4">
                <p className="font-medium text-sm">Build Logs:</p>
                <div className="mt-2 bg-black/10 p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-auto">
                  {result.logs}
                </div>
              </div>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}