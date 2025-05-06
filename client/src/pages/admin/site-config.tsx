import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeroBannerUpload } from "@/components/admin/site-config/hero-banner-upload";
import { useQuery } from "@tanstack/react-query";
import { SiteConfig } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function SiteConfigPage() {
  // Fetch the current hero banner config
  const { data: heroBannerConfig, isLoading: isLoadingBanner } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config", "heroBanner"],
    queryFn: async () => {
      const res = await fetch("/api/site-config/heroBanner");
      if (!res.ok) return null;
      return res.json();
    },
  });

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Site Configuration</h1>
        
        <Tabs defaultValue="hero-banner" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="hero-banner">Hero Banner</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hero-banner" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Hero Banner Image</CardTitle>
                  <CardDescription>
                    Upload an image for the homepage hero banner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HeroBannerUpload />
                </CardContent>
              </Card>
              
              {/* Current Banner */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Hero Banner</CardTitle>
                  <CardDescription>
                    Preview of the currently active hero banner image
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBanner ? (
                    <div className="h-40 bg-muted animate-pulse rounded-md"></div>
                  ) : heroBannerConfig?.value ? (
                    <div className="relative overflow-hidden rounded-md">
                      <img 
                        src={heroBannerConfig.value}
                        alt="Current hero banner" 
                        className={cn(
                          "w-full h-40 object-cover transition-opacity duration-300",
                        )}
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/600x200/002147/bbd665?text=No+Image";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                      No image set
                    </div>
                  )}
                  
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last updated: {heroBannerConfig?.updatedAt 
                      ? new Date(heroBannerConfig.updatedAt).toLocaleString() 
                      : 'Never'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle>Logo Settings</CardTitle>
                <CardDescription>
                  Manage your site logo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Logo configuration content will be added here</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>
                  Manage your site footer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Footer configuration content will be added here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}