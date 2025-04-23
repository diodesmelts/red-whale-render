import { useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CompetitionsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch competitions
  const { data: competitions = [] } = useQuery({
    queryKey: ["/api/competitions"],
  });

  // Filter competitions based on search
  const filteredCompetitions = competitions.filter((comp: any) => 
    comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Competitions Management</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Competition
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Competition</DialogTitle>
              <DialogDescription>
                Create a new competition listing to display on the site.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                Competition form will be implemented in the next update
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filter Competitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Competitions</h2>
            <span className="text-sm text-muted-foreground">
              {filteredCompetitions.length} total
            </span>
          </div>
        </div>
        <Separator />
        
        <div className="p-0">
          {filteredCompetitions.length > 0 ? (
            <div className="divide-y">
              {filteredCompetitions.map((competition: any) => (
                <div key={competition.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="w-16 h-16 rounded bg-cover bg-center hidden sm:block"
                      style={{ 
                        backgroundImage: `url(${competition.imageUrl || 'https://placehold.co/200x200?text=Image'})` 
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                        <h3 className="font-medium">{competition.title}</h3>
                        <div className="flex items-center gap-1 mt-1 sm:mt-0">
                          <Badge variant={competition.isLive ? "default" : "secondary"}>
                            {competition.isLive ? "Live" : "Draft"}
                          </Badge>
                          {competition.isFeatured && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {competition.description}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Price: £{(competition.ticketPrice / 100).toFixed(2)}</span>
                        <span>Tickets: {competition.ticketsSold || 0} / {competition.totalTickets}</span>
                        <span>Draw date: {new Date(competition.drawDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="icon" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={competition.isLive ? "text-red-500" : "text-green-500"}
                        title={competition.isLive ? "Unpublish" : "Publish"}
                      >
                        {competition.isLive ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No competitions found
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}