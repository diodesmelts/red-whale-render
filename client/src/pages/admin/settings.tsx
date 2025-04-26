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
import { Loader2, Save } from "lucide-react";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { ApiDiagnostics } from "@/components/admin/api-diagnostics";

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
                  <CardFooter>
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
                          Save Banner
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