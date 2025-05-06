import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CompetitionStats } from "@/components/admin/competition-stats";
import { Competition } from "@shared/schema";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompetitionOverview() {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("");

  // Fetch all competitions
  const {
    data: competitions,
    isLoading: isLoadingCompetitions,
    error: competitionsError,
  } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  // Get selected competition details
  const selectedCompetition = selectedCompetitionId ? 
    competitions?.find(c => c.id.toString() === selectedCompetitionId) : 
    undefined;

  return (
    <AdminLayout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Competition Overview</h1>
          <p className="text-muted-foreground">
            View detailed statistics for each competition
          </p>
        </div>

        {isLoadingCompetitions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : competitionsError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground text-center">
                Could not load competitions
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Competition</CardTitle>
                <CardDescription>
                  Choose a competition to view detailed statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedCompetitionId} 
                  onValueChange={(value) => setSelectedCompetitionId(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a competition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Competitions</SelectLabel>
                      {competitions?.map((competition) => (
                        <SelectItem key={competition.id} value={competition.id.toString()}>
                          {competition.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCompetition && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {selectedCompetition.title}
                  </h2>
                  <p className="text-muted-foreground">
                    Ticket status and statistics
                  </p>
                </div>
                
                <CompetitionStats competition={selectedCompetition} />
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}