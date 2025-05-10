import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SiteConfig } from "@shared/schema";
import { Loader2, Save, Upload, Server, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { ApiDiagnostics } from "@/components/admin/api-diagnostics";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Component for the Render deploy button with confirmation dialog
const RenderDeployButton = () => {
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
    <>
      <Button 
        variant="default" 
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-6"
        onClick={() => setIsDialogOpen(true)}
      >
        <Server className="mr-2 h-5 w-5" />
        Prepare for Render Deployment
      </Button>
      
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
    </>
  );
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("branding");
  const { toast } = useToast();
  
  // Query for fetching all site configurations
  const { data: siteConfigs, isLoading: isLoadingConfigs } = useQuery<SiteConfig[]>({
    queryKey: ["/api/site-config"],
    queryFn: async () => {
      const res = await fetch("/api/site-config");
      if (!res.ok) {
        throw new Error("Failed to fetch site configurations");
      }
      return res.json();
    }
  });

  // Form state
  const [logoImage, setLogoImage] = useState<string>("");
  const [heroBannerImage, setHeroBannerImage] = useState<string>("");
  const [heroBannerTitle, setHeroBannerTitle] = useState<string>("Turbo Cash Instants. Up to £1,000 cash!");
  
  // Get current config values if they exist
  const logoConfig = siteConfigs?.find(config => config.key === "siteLogo");
  const heroBannerConfig = siteConfigs?.find(config => config.key === "heroBanner");
  const heroBannerTitleConfig = siteConfigs?.find(config => config.key === "heroBannerTitle");
  
  // Update site configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/admin/site-config", data);
      if (!res.ok) {
        throw new Error("Failed to update site configuration");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-config"] });
      toast({
        title: "Configuration updated",
        description: "Site configuration has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Upload and save logo image
  const handleSaveLogo = () => {
    updateConfigMutation.mutate({
      key: "siteLogo",
      value: logoImage,
      description: "Site logo image URL"
    });
  };
  
  // Upload and save hero banner image
  const handleSaveHeroBanner = () => {
    updateConfigMutation.mutate({
      key: "heroBanner",
      value: heroBannerImage,
      description: "Homepage hero banner image URL"
    });
  };
  
  // Save hero banner title
  const handleSaveHeroBannerTitle = () => {
    updateConfigMutation.mutate({
      key: "heroBannerTitle",
      value: heroBannerTitle,
      description: "Homepage hero banner title text"
    });
  };
  
  // Handle logo image upload completion
  const handleLogoUploaded = (imageUrl: string) => {
    setLogoImage(imageUrl);
  };
  
  // Handle hero banner image upload completion
  const handleHeroBannerUploaded = (imageUrl: string) => {
    setHeroBannerImage(imageUrl);
  };

  // Initialize form values from config when data is loaded
  useEffect(() => {
    if (logoConfig?.value) {
      setLogoImage(logoConfig.value);
    }
    
    if (heroBannerConfig?.value) {
      setHeroBannerImage(heroBannerConfig.value);
    }
    
    if (heroBannerTitleConfig?.value) {
      setHeroBannerTitle(heroBannerTitleConfig.value);
    }
  }, [logoConfig, heroBannerConfig, heroBannerTitleConfig]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage site-wide settings and appearance
            </p>
          </div>

          {isLoadingConfigs ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="branding" className="space-y-4">
                {/* Logo Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Logo Settings</CardTitle>
                    <CardDescription>
                      Upload a custom logo image to replace the default SVG logo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="logo-image">Custom Logo Image</Label>
                        <ImageUpload 
                          onImageUploaded={handleLogoUploaded}
                          currentImageUrl={logoImage}
                          className="mt-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Recommended size: 300x100px with transparent background (PNG). 
                          Leave empty to use the default SVG logo.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button 
                      onClick={handleSaveLogo}
                      disabled={updateConfigMutation.isPending}
                    >
                      {updateConfigMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Logo
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Hero Banner Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Banner Settings</CardTitle>
                    <CardDescription>
                      Configure the homepage hero banner image and appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="hero-image">Hero Banner Image</Label>
                        <ImageUpload 
                          onImageUploaded={handleHeroBannerUploaded}
                          currentImageUrl={heroBannerImage}
                          className="mt-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Recommended size: 1920x600px. This image will appear at the top of your homepage.
                        </p>
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor="hero-title">Hero Banner Title</Label>
                        <Input
                          id="hero-title"
                          value={heroBannerTitle}
                          onChange={(e) => setHeroBannerTitle(e.target.value)}
                          placeholder="Enter hero banner title"
                          className="mt-1"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Add a period (.) to separate the main title from highlighted text. 
                          Example: "Turbo Cash Instants. Up to £1,000 cash!"
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button 
                      onClick={handleSaveHeroBanner}
                      disabled={updateConfigMutation.isPending || !heroBannerImage}
                    >
                      {updateConfigMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Banner Image
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleSaveHeroBannerTitle}
                      disabled={updateConfigMutation.isPending || !heroBannerTitle}
                      variant="outline"
                    >
                      {updateConfigMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Banner Title
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Settings</CardTitle>
                    <CardDescription>
                      Manage site content and messaging (coming soon)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-40 border rounded-md border-dashed border-muted-foreground/30">
                      <p className="text-muted-foreground">Content settings will be available in a future update</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diagnostics" className="space-y-4">
                <div className="grid gap-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">API Diagnostics</h2>
                    <p className="text-muted-foreground mt-1">
                      Tools for diagnosing connectivity and authentication issues in production
                    </p>
                  </div>
                  
                  <ApiDiagnostics />

                  {/* Render Deployment Card */}
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
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-stretch gap-4">
                      <RenderDeployButton />
                      <p className="text-xs text-muted-foreground">This is the recommended approach for deploying to Render from Replit.</p>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Environment Information</CardTitle>
                      <CardDescription>
                        System environment details for debugging
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="font-medium">Build Environment:</div>
                          <div>{process.env.NODE_ENV || 'development'}</div>
                          
                          <div className="font-medium">App Version:</div>
                          <div>1.0.0</div>
                          
                          <div className="font-medium">Deployment Type:</div>
                          <div>{window.location.hostname.includes('replit') ? 'Development (Replit)' : 
                                window.location.hostname.includes('render') ? 'Production (Render)' : 
                                'Custom Domain'}</div>
                          
                          <div className="font-medium">Current URL:</div>
                          <div className="break-all">{window.location.href}</div>
                          
                          <div className="font-medium">API Base URL:</div>
                          <div className="break-all">{getApiBaseUrl() || 'Same origin'}</div>
                          
                          <div className="font-medium">Cookie Domain:</div>
                          <div>{document.cookie.includes('domain=') ? 
                              document.cookie.split('domain=')[1]?.split(';')[0] || 'Not found' : 
                              'Not set'}</div>
                          
                          <div className="font-medium">Cross-Origin:</div>
                          <div>{getApiBaseUrl() ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-muted-foreground">This information is helpful for diagnosing cross-domain authentication issues.</p>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}