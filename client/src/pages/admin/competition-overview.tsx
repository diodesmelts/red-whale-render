import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CompetitionStats } from "@/components/admin/competition-stats";
import { GlobalWinnerLookup } from "@/components/admin/global-winner-lookup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Competition } from "@shared/schema";

export default function CompetitionOverview() {
  // Fetch all competitions with admin endpoint and proper authentication
  const { data: competitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
    queryFn: async () => {
      console.log("🔍 Fetching competitions from admin endpoint");
      
      try {
        // First try admin endpoint
        const adminResponse = await fetch("/api/admin/competitions", {
          credentials: 'include', // Ensure cookies are sent with the request
          headers: { 'Cache-Control': 'no-cache' } // Avoid stale cached responses
        });
        
        if (adminResponse.ok) {
          const data = await adminResponse.json();
          console.log(`✅ Received ${data?.length || 0} competitions from admin endpoint`);
          return data;
        }
        
        console.warn(`Admin endpoint failed with ${adminResponse.status}, trying regular endpoint`);
        
        // Fallback to regular endpoint
        const regularResponse = await fetch("/api/competitions", {
          credentials: 'include'
        });
        
        if (!regularResponse.ok) {
          throw new Error(`Failed to fetch competitions: ${regularResponse.status}`);
        }
        
        const fallbackData = await regularResponse.json();
        console.log(`✅ Received ${fallbackData?.length || 0} competitions from regular endpoint`);
        return fallbackData;
      } catch (error) {
        console.error("Error fetching competitions:", error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds cache - shorter for admin panel to see updates faster
    retry: 2, // Allow 2 retries for more resilience 
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!competitions || competitions.length === 0) {
    return (
      <AdminLayout>
        <Card>
          <CardHeader>
            <CardTitle>Competition Overview</CardTitle>
            <CardDescription>
              There are no competitions available to display.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  // Find active and past competitions
  const activeCompetitions = competitions.filter(comp => comp.isLive);
  const pastCompetitions = competitions.filter(comp => !comp.isLive);

  // Default to the first tab (active) if available, otherwise past
  const defaultTab = activeCompetitions.length > 0 ? "active" : "past";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competition Overview</h1>
          <p className="text-muted-foreground">
            View detailed statistics for all competitions
          </p>
        </div>

        <GlobalWinnerLookup />

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" disabled={activeCompetitions.length === 0}>
              Active ({activeCompetitions.length})
            </TabsTrigger>
            <TabsTrigger value="past" disabled={pastCompetitions.length === 0}>
              Past ({pastCompetitions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeCompetitions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Competitions</CardTitle>
                  <CardDescription>
                    There are currently no active competitions.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeCompetitions.map((competition) => (
                  <CompetitionStats key={competition.id} competition={competition} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastCompetitions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Past Competitions</CardTitle>
                  <CardDescription>
                    There are no past competitions to display.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pastCompetitions.map((competition) => (
                  <CompetitionStats key={competition.id} competition={competition} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}