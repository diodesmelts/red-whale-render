import React, { useState, Component, ErrorInfo, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CompetitionStats } from "@/components/admin/competition-stats";
import { GlobalWinnerLookup } from "@/components/admin/global-winner-lookup";
import { AlertCircle } from "lucide-react";
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

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CompetitionStats error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function CompetitionOverview() {
  // Fetch all competitions
  const { data: competitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    onError: (error) => {
      console.error("Error fetching competitions for overview:", error);
    }
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
                  <ErrorBoundary 
                    key={competition.id}
                    fallback={
                      <Card className="p-4">
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
                          <h3 className="font-medium">{competition.title}</h3>
                          <p className="text-muted-foreground text-sm mt-2">
                            Stats temporarily unavailable
                          </p>
                        </div>
                      </Card>
                    }
                  >
                    <CompetitionStats competition={competition} />
                  </ErrorBoundary>
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
                  <ErrorBoundary 
                    key={competition.id}
                    fallback={
                      <Card className="p-4">
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
                          <h3 className="font-medium">{competition.title}</h3>
                          <p className="text-muted-foreground text-sm mt-2">
                            Stats temporarily unavailable
                          </p>
                        </div>
                      </Card>
                    }
                  >
                    <CompetitionStats competition={competition} />
                  </ErrorBoundary>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}