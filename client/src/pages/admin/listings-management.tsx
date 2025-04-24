import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/competition/category-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Competition } from "@shared/schema";
import { 
  Edit, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft
} from "lucide-react";

export default function ListingsManagement() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState<Competition | null>(null);

  // Get competitions data
  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['/api/competitions'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Toggle competition status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isLive }: { id: number, isLive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/competitions/${id}`, { isLive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: "Status updated",
        description: "Competition status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete competition mutation
  const deleteCompetitionMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`🔍 DEBUG[CLIENT]: Attempting to delete competition with ID: ${id}`);
      
      // Use the direct SQL deletion endpoint which bypasses all middlewares
      // This endpoint is specially designed to work in Render production environment
      const endpointPath = `/api/competitions/direct/${id}`;
      console.log(`🔗 Using direct SQL deletion endpoint: ${endpointPath}`);
      
      try {
        console.log(`🚀 DEBUG[CLIENT]: Sending DELETE request to ${endpointPath}`);
        
        // Include session credentials and additional debug headers
        const res = await apiRequest("DELETE", endpointPath, undefined, {
          headers: {
            'X-Admin-Operation': 'delete-competition',
            'X-Request-Source': 'admin-panel',
            'X-Debug-Client': 'true',
            'X-Client-Timestamp': new Date().toISOString(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        console.log(`✅ DEBUG[CLIENT]: Delete operation response:`, {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          headers: Object.fromEntries([...res.headers.entries()])
        });
        
        // Try to parse response body for additional error details
        if (!res.ok) {
          try {
            const errorBody = await res.json();
            console.error('❌ DEBUG[CLIENT]: Server returned error:', errorBody);
          } catch (parseError) {
            console.error('❌ DEBUG[CLIENT]: Could not parse error response:', parseError);
          }
        }
        
        return res.ok;
      } catch (error) {
        // Enhanced error logging for debugging
        console.error('❌ DEBUG[CLIENT]: Delete operation failed with exception:', error);
        console.error('❌ DEBUG[CLIENT]: Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
        
        // Throw a more descriptive error
        throw new Error(`Failed to delete competition: ${error.message}. Please check console for details.`);
      }
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setCompetitionToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: "Competition deleted",
        description: "The competition has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting competition",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle status toggle
  const handleStatusToggle = (id: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isLive: !currentStatus });
  };

  // Handle delete competition
  const handleDeleteClick = (competition: Competition) => {
    setCompetitionToDelete(competition);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (competitionToDelete) {
      deleteCompetitionMutation.mutate(competitionToDelete.id);
    }
  };

  // Filter competitions based on search query
  const filteredCompetitions = competitions.filter((comp: Competition) => 
    comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (comp.brand && comp.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  console.log("Competitions data:", competitions);

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate("/admin")}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Listings Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage all competition listings on the platform
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/admin/create-competition">
              <Plus className="h-4 w-4 mr-2" />
              Add Competition
            </Link>
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitions..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Competition listings table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Competition</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ticket Price</TableHead>
                <TableHead>Tickets Sold</TableHead>
                <TableHead>Draw Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompetitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No competitions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompetitions.map((competition: Competition) => (
                  <TableRow key={competition.id}>
                    <TableCell className="font-medium">
                      {competition.title}
                      {competition.isFeatured && (
                        <Badge className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
                          Featured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={competition.category} brand={competition.brand ?? undefined} />
                    </TableCell>
                    <TableCell>{formatCurrency(competition.ticketPrice)}</TableCell>
                    <TableCell>
                      {competition.ticketsSold} / {competition.totalTickets}
                    </TableCell>
                    <TableCell>{formatDate(competition.drawDate)}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={competition.isLive}
                        onCheckedChange={() => handleStatusToggle(competition.id, competition.isLive)}
                        aria-label="Toggle competition status"
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/competitions/${competition.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/edit-competition/${competition.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(competition)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this competition?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the competition
              {competitionToDelete && <strong> "{competitionToDelete.title}"</strong>} and
              remove all data associated with it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteCompetitionMutation.isPending}
            >
              {deleteCompetitionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}