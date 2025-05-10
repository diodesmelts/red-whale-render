import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Server, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RenderDeployment() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePrepareForRender = async () => {
    setIsLoading(true);
    setDeployError(null);
    setDeployResult(null);
    
    try {
      const response = await apiRequest("POST", "/api/admin/prepare-render-deploy");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to prepare deployment package");
      }
      
      const result = await response.json();
      setDeployResult(result);
      
      toast({
        title: "Deployment package created!",
        description: "The Render deployment package has been successfully created.",
      });
    } catch (error: any) {
      console.error("Deployment preparation error:", error);
      setDeployError(error.message || "An unknown error occurred");
      
      toast({
        title: "Deployment preparation failed",
        description: error.message || "Failed to prepare the deployment package",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 shadow-md">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Render Deployment
          </CardTitle>
          <CardDescription>
            Create a pre-built package ready for deployment on Render
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-sm">
              This tool helps you prepare a pre-built version of your application that can be easily deployed to Render without build issues.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
              <h4 className="font-semibold text-amber-800 mb-2">How it works:</h4>
              <ol className="list-decimal pl-5 space-y-1 text-amber-700">
                <li>This generates a simplified, pre-built package in a <code className="bg-amber-100 px-1 rounded">dist-ready</code> directory</li>
                <li>Push this directory to GitHub</li>
                <li>In Render, create a new Web Service pointing to this directory</li>
                <li>No complex build commands required - it just works!</li>
              </ol>
            </div>
            
            <Button 
              variant="default" 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 w-full"
              onClick={() => setIsDialogOpen(true)}
            >
              <Server className="mr-2 h-5 w-5" />
              Prepare for Render Deployment
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prepare Render Deployment Package</DialogTitle>
            <DialogDescription>
              This will create a pre-built deployment package that can be easily deployed to Render without build errors.
            </DialogDescription>
          </DialogHeader>
          
          {!isLoading && !deployResult && !deployError && (
            <div className="py-4">
              <p className="text-sm mb-4">
                Are you sure you want to prepare a deployment package for Render? This process will:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Build your frontend application</li>
                <li>Create a simplified server setup</li>
                <li>Package everything in a "dist-ready" directory</li>
                <li>Generate instructions for deploying to Render</li>
              </ul>
            </div>
          )}
          
          {isLoading && (
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
              <p className="text-center text-gray-600">Preparing deployment package...</p>
              <p className="text-center text-gray-500 text-sm mt-2">This may take a minute or two</p>
            </div>
          )}
          
          {deployResult && (
            <div className="py-4">
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Deployment package created successfully
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3 mt-4">
                <h4 className="font-medium">Next Steps:</h4>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  {deployResult.instructions?.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
          
          {deployError && (
            <div className="py-4">
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Error</AlertTitle>
                <AlertDescription className="text-red-700">
                  {deployError}
                </AlertDescription>
              </Alert>
              <p className="text-sm mt-4">
                Please try again or check the console for more details.
              </p>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            {!deployResult && !deployError && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handlePrepareForRender}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    "Prepare Package"
                  )}
                </Button>
              </>
            )}
            
            {(deployResult || deployError) && (
              <Button
                variant={deployResult ? "default" : "outline"}
                onClick={() => setIsDialogOpen(false)}
              >
                {deployResult ? "Done" : "Close"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}