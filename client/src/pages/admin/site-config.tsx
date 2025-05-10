import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeroBannerUpload } from "@/components/admin/site-config/hero-banner-upload";
import { LogoUpload } from "@/components/admin/site-config/logo-upload";
import { FooterSettings } from "@/components/admin/site-config/footer-settings";
import { PaymentCardsUpload } from "@/components/admin/site-config/payment-cards-upload";
import { PaymentCardsPreview } from "@/components/admin/site-config/payment-cards-preview";
import { RenderDeployment } from "@/components/admin/site-config/render-deployment";
import { useQuery } from "@tanstack/react-query";
import { SiteConfig } from "@shared/schema";
import { cn, getImageUrl } from "@/lib/utils";

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
  
  // Fetch the current logo config
  const { data: logoConfig, isLoading: isLoadingLogo } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config", "siteLogo"],
    queryFn: async () => {
      const res = await fetch("/api/site-config/siteLogo");
      if (!res.ok) return null;
      return res.json();
    },
  });
  
  // Fetch the current payment cards image config
  const { data: paymentCardsConfig, isLoading: isLoadingPaymentCards } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config", "paymentCardsImage"],
    queryFn: async () => {
      const res = await fetch("/api/site-config/paymentCardsImage");
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
            <TabsTrigger value="payment-cards">Payment Cards</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="deployment" className="bg-blue-50 text-blue-600 hover:text-blue-700">Deployment</TabsTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Site Logo</CardTitle>
                  <CardDescription>
                    Upload a logo image for the site navigation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LogoUpload />
                </CardContent>
              </Card>
              
              {/* Current Logo */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Logo</CardTitle>
                  <CardDescription>
                    Preview of the currently active site logo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLogo ? (
                    <div className="h-32 bg-muted animate-pulse rounded-md"></div>
                  ) : logoConfig?.value ? (
                    <div className="bg-[#002147] p-4 rounded-md">
                      <div className="relative overflow-hidden rounded-md flex justify-center items-center">
                        <img 
                          src={getImageUrl(logoConfig.value)}
                          alt="Current site logo" 
                          className="h-24 w-auto object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/300x100/002147/bbd665?text=No+Logo";
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#002147] h-32 rounded-md flex items-center justify-center text-white">
                      <div className="flex items-center">
                        <span className="text-xl font-bold">Default Logo</span>
                      </div>
                    </div>
                  )}
                  
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last updated: {logoConfig?.updatedAt 
                      ? new Date(logoConfig.updatedAt).toLocaleString() 
                      : 'Never'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payment-cards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Cards Upload Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Cards Image</CardTitle>
                  <CardDescription>
                    Upload an image showing accepted payment methods for the footer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentCardsUpload />
                </CardContent>
              </Card>
              
              {/* Current Payment Cards Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Payment Cards Image</CardTitle>
                  <CardDescription>
                    Preview of the currently active payment methods image
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Use our optimized payment cards preview component with caching */}
                  <div className="bg-[#002147] p-4 rounded-md">
                    <div className="relative overflow-hidden rounded-md flex justify-center items-center">
                      <PaymentCardsPreview />
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last updated: {paymentCardsConfig?.updatedAt 
                      ? new Date(paymentCardsConfig.updatedAt).toLocaleString() 
                      : 'Never'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>
                  Manage your site footer links, social media accounts, and copyright text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FooterSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="deployment">
            <RenderDeployment />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}