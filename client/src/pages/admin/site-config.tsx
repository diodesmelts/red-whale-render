import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SiteConfig } from "@shared/schema";
import { Loader2, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SiteConfigPage() {
  const [activeTab, setActiveTab] = useState("hero");
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

  // Form state for hero banner
  const [heroBannerImage, setHeroBannerImage] = useState<string>("");
  
  // Form state for logo
  const [logoImage, setLogoImage] = useState<string>("");
  
  // Get current hero banner value if exists
  const heroBannerConfig = siteConfigs?.find(config => config.key === "heroBanner");
  
  // Get current logo value if exists
  const logoConfig = siteConfigs?.find(config => config.key === "siteLogo");
  
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

  // Upload and save hero banner image
  const handleSaveHeroBanner = () => {
    updateConfigMutation.mutate({
      key: "heroBanner",
      value: heroBannerImage,
      description: "Homepage hero banner image URL"
    });
  };

  // Handle hero banner image upload completion
  const handleHeroBannerUploaded = (imageUrl: string) => {
    setHeroBannerImage(imageUrl);
  };
  
  // Handle logo image upload completion
  const handleLogoUploaded = (imageUrl: string) => {
    setLogoImage(imageUrl);
  };
  
  // Upload and save logo image
  const handleSaveLogo = () => {
    updateConfigMutation.mutate({
      key: "siteLogo",
      value: logoImage,
      description: "Site logo image URL"
    });
  };

  // Initialize hero banner image from config when data is loaded
  useEffect(() => {
    if (heroBannerConfig?.value) {
      setHeroBannerImage(heroBannerConfig.value);
    }
    
    if (logoConfig?.value) {
      setLogoImage(logoConfig.value);
    }
  }, [heroBannerConfig, logoConfig]);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Site Configuration</h1>
          <p className="text-muted-foreground">
            Manage site-wide settings and appearance
          </p>
        </div>

        {isLoadingConfigs ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="hero">Hero Banner</TabsTrigger>
              <TabsTrigger value="logo">Site Logo</TabsTrigger>
              <TabsTrigger value="about">About Section</TabsTrigger>
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hero">
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
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="logo">
              <Card>
                <CardHeader>
                  <CardTitle>Site Logo Settings</CardTitle>
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
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About Section</CardTitle>
                  <CardDescription>
                    Configure the about section content (coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="about-text">About Text</Label>
                      <Textarea
                        id="about-text"
                        placeholder="Enter about section text here..."
                        className="mt-2"
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button disabled>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Configure contact information (coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Contact Email</Label>
                      <Input
                        id="email"
                        placeholder="contact@example.com"
                        className="mt-2"
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        className="mt-2"
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button disabled>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}