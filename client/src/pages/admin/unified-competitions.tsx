import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from '@/components/competition/category-badge';
import { 
  MoreHorizontal, 
  PlusCircle, 
  Trash, 
  Edit, 
  Eye, 
  Copy, 
  Search, 
  Filter, 
  ArrowUpDown,
  Award,
  Calendar,
  TicketIcon,
  PoundSterling,
  Star,
  AlertTriangle,
  RefreshCw,
  DatabaseZap,
  AlertCircle,
  BarChart
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CompetitionStats } from '@/components/admin/competition-stats';
import { GlobalWinnerLookup } from '@/components/admin/global-winner-lookup';
import { format, isPast, isToday } from 'date-fns';
import { Competition } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { COMPETITION_CATEGORIES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

export default function UnifiedCompetitionsManager() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'table' | 'stats'>('table');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);

  // Get competitions data
  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ['/api/competitions'],
    staleTime: 30 * 1000, // 30 seconds cache - shorter for admin panel to see updates faster
    retry: 2, // Allow a couple of retries
  });

  // Delete competition mutation
  const deleteCompetitionMutation = useMutation({
    mutationFn: async (id: number) => {
      // Using alternative endpoint for reliable deletion
      try {
        // First try the direct SQL endpoint that bypasses middleware issues
        const response = await apiRequest('DELETE', `/api/competitions/direct/${id}`);
        return response.json();
      } catch (error) {
        console.error("Direct delete failed, trying standard endpoint", error);
        // Fall back to standard endpoint
        const response = await apiRequest('DELETE', `/api/admin/competitions/${id}`);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: 'Competition deleted',
        description: 'The competition has been successfully removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete competition: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Toggle competition status mutation
  const toggleCompetitionStatus = useMutation({
    mutationFn: async ({ id, isLive }: { id: number; isLive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/competitions/${id}`, { isLive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: 'Status updated',
        description: 'The competition status has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update competition status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Toggle featured status mutation
  const toggleFeaturedStatus = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/competitions/${id}`, { isFeatured });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: 'Featured status updated',
        description: 'The competition featured status has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update featured status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Reset all competitions mutation
  const resetCompetitionsMutation = useMutation({
    mutationFn: async () => {
      // The actual route is defined in routes.ts - it's a direct endpoint, not using admin-routes.ts
      const response = await apiRequest('POST', '/api/admin/reset-competitions');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: 'Competitions Reset',
        description: 'All competitions have been successfully removed from the database.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reset Failed',
        description: `Failed to reset competitions: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // State to track if reset dialog is open
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Filter competitions based on all criteria
  const filteredCompetitions = competitions
    .filter(competition => 
      (competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       competition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (competition.brand && competition.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
       competition.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedCategory && selectedCategory !== 'all' ? competition.category.toLowerCase() === selectedCategory.toLowerCase() : true) &&
      (activeTab === 'all' ? 
        true : 
        activeTab === 'live' ? 
          competition.isLive : 
          activeTab === 'draft' ? 
            !competition.isLive : 
            activeTab === 'featured' ? 
              competition.isFeatured : 
              activeTab === 'ending-soon' ?
                (competition.isLive && !isPast(new Date(competition.drawDate)) && 
                 (isToday(new Date(competition.drawDate)) || 
                  new Date(competition.drawDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000)) : 
                true)
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt || new Date()).getTime() - new Date(b.createdAt || new Date()).getTime();
      } else if (sortOrder === 'price-asc') {
        return a.ticketPrice - b.ticketPrice;
      } else if (sortOrder === 'price-desc') {
        return b.ticketPrice - a.ticketPrice;
      } else if (sortOrder === 'draw-date') {
        return new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime();
      } else if (sortOrder === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === 'popularity') {
        return ((b.ticketsSold || 0) / b.totalTickets) - ((a.ticketsSold || 0) / a.totalTickets);
      }
      return 0;
    });

  // State to track which competition is being deleted
  const [competitionToDelete, setCompetitionToDelete] = useState<number | null>(null);
  
  const handleDeleteCompetition = (id: number) => {
    // Just set the ID in state to open the dialog
    setCompetitionToDelete(id);
  };
  
  const confirmDelete = () => {
    if (competitionToDelete) {
      deleteCompetitionMutation.mutate(competitionToDelete);
      setCompetitionToDelete(null); // Reset after confirmation
    }
  };

  const handleToggleStatus = (id: number, currentStatus: boolean | null) => {
    // Ensure we have a boolean value
    const isCurrentlyLive = !!currentStatus;
    toggleCompetitionStatus.mutate({ id, isLive: !isCurrentlyLive });
  };

  const handleToggleFeatured = (id: number, currentStatus: boolean | null) => {
    // Ensure we have a boolean value
    const isCurrentlyFeatured = !!currentStatus;
    toggleFeaturedStatus.mutate({ id, isFeatured: !isCurrentlyFeatured });
  };

  const getPercentageSold = (sold: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sold / total) * 100);
  };

  // Find active and past competitions for stats
  const activeCompetitions = competitions.filter(comp => comp.isLive);
  const pastCompetitions = competitions.filter(comp => !comp.isLive);

  // For stats view
  const [statsTab, setStatsTab] = useState(activeCompetitions.length > 0 ? "active" : "past");

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Competitions Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage competitions and monitor ticket statistics
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setViewMode(viewMode === 'table' ? 'stats' : 'table')} 
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {viewMode === 'table' ? (
                  <>
                    <BarChart className="mr-2 h-4 w-4" />
                    Show Stats View
                  </>
                ) : (
                  <>
                    <TicketIcon className="mr-2 h-4 w-4" />
                    Show Table View
                  </>
                )}
              </Button>
              <Button onClick={() => navigate('/admin/create-competition')} size="sm" className="shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Competition
              </Button>
            </div>
          </div>

          {/* Filter bar is always shown in either view mode */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(COMPETITION_CATEGORIES).map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="draw-date">Draw Date</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {viewMode === 'table' ? (
          /* Table View Mode - Similar to the original competitions management */
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all" className="flex gap-2">
                  <TicketIcon className="h-4 w-4" /> All
                  <Badge variant="secondary" className="ml-1">{competitions.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="live" className="flex gap-2">
                  <Badge variant="default" className="h-2 w-2 p-0 rounded-full bg-green-500" /> Live
                  <Badge variant="secondary" className="ml-1">
                    {competitions.filter(c => c.isLive).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="draft" className="flex gap-2">
                  <Badge variant="default" className="h-2 w-2 p-0 rounded-full bg-gray-400" /> Draft
                  <Badge variant="secondary" className="ml-1">
                    {competitions.filter(c => !c.isLive).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="featured" className="flex gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Featured
                  <Badge variant="secondary" className="ml-1">
                    {competitions.filter(c => c.isFeatured).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="ending-soon" className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" /> Ending Soon
                  <Badge variant="secondary" className="ml-1">
                    {competitions.filter(c => 
                      c.isLive && !isPast(new Date(c.drawDate)) && 
                      (isToday(new Date(c.drawDate)) || 
                       new Date(c.drawDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              
              {/* Reset competitions button */}
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={() => setResetDialogOpen(true)}
                  disabled={resetCompetitionsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {resetCompetitionsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <DatabaseZap className="h-4 w-4" />
                  )}
                  Reset All Competitions
                </Button>
              </div>

              <TabsContent value={activeTab} className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex justify-center py-32">
                        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[400px]">Competition</TableHead>
                              <TableHead className="w-[120px]">Price</TableHead>
                              <TableHead className="w-[140px]">Ticket Sales</TableHead>
                              <TableHead className="w-[120px]">Draw Date</TableHead>
                              <TableHead className="w-[120px]">Status</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCompetitions.length > 0 ? (
                              filteredCompetitions.map((competition) => (
                                <TableRow key={competition.id}>
                                  <TableCell>
                                    <div className="flex items-start gap-3">
                                      {competition.imageUrl && (
                                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                                          <img 
                                            src={competition.imageUrl} 
                                            alt={competition.title} 
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-medium">{competition.title}</div>
                                        <div className="mt-1 flex items-center gap-2">
                                          <CategoryBadge category={competition.category} />
                                          {competition.isFeatured && (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                                              Featured
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{formatCurrency(competition.ticketPrice / 100)}</div>
                                    <div className="text-xs text-muted-foreground">per ticket</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {competition.ticketsSold || 0}/{competition.totalTickets}
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full mt-1 overflow-hidden">
                                      <div 
                                        className="h-full bg-primary rounded-full" 
                                        style={{ 
                                          width: `${getPercentageSold(competition.ticketsSold || 0, competition.totalTickets)}%` 
                                        }} 
                                      />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {getPercentageSold(competition.ticketsSold || 0, competition.totalTickets)}% sold
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{format(new Date(competition.drawDate), 'MMM dd, yyyy')}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {isPast(new Date(competition.drawDate)) 
                                        ? 'Ended' 
                                        : isToday(new Date(competition.drawDate))
                                          ? 'Today'
                                          : format(new Date(competition.drawDate), 'h:mm a')}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <div 
                                        className={`h-2 w-2 rounded-full mr-2 ${
                                          competition.isLive 
                                            ? 'bg-green-500' 
                                            : 'bg-gray-400'
                                        }`} 
                                      />
                                      <span className="font-medium">
                                        {competition.isLive ? 'Live' : 'Draft'}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Actions</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem 
                                          onClick={() => navigate(`/admin/edit-competition/${competition.id}`)}
                                          className="cursor-pointer"
                                        >
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            setSelectedCompetitionId(competition.id);
                                            setViewMode('stats');
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <BarChart className="mr-2 h-4 w-4" />
                                          View Stats
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => navigate(`/competition/${competition.id}`)}
                                          className="cursor-pointer"
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          View Live
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleToggleStatus(competition.id, competition.isLive)}
                                          className="cursor-pointer"
                                        >
                                          {competition.isLive ? (
                                            <>
                                              <AlertCircle className="mr-2 h-4 w-4" />
                                              Set to Draft
                                            </>
                                          ) : (
                                            <>
                                              <Award className="mr-2 h-4 w-4 text-green-500" />
                                              Set to Live
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleToggleFeatured(competition.id, competition.isFeatured)}
                                          className="cursor-pointer"
                                        >
                                          {competition.isFeatured ? (
                                            <>
                                              <Star className="mr-2 h-4 w-4" />
                                              Remove Featured
                                            </>
                                          ) : (
                                            <>
                                              <Star className="mr-2 h-4 w-4 text-amber-500" />
                                              Set as Featured
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteCompetition(competition.id)}
                                          className="text-red-600 cursor-pointer"
                                        >
                                          <Trash className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-60 text-center">
                                  <div className="flex flex-col items-center justify-center">
                                    {isLoading ? (
                                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    ) : (
                                      <>
                                        <div className="rounded-full bg-muted p-3 mb-3">
                                          <TicketIcon className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-xl font-semibold">No competitions yet</h3>
                                        <p className="text-muted-foreground max-w-md">
                                          Get started by creating your first competition. Add prizes, set ticket prices, and manage draw dates.
                                        </p>
                                        <Button onClick={() => navigate('/admin/create-competition')} className="mt-4">
                                          <PlusCircle className="mr-2 h-4 w-4" />
                                          Create Your First Competition
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                      {filteredCompetitions.length} {filteredCompetitions.length === 1 ? 'competition' : 'competitions'} found
                    </div>
                    {filteredCompetitions.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewMode('stats')}
                      >
                        <BarChart className="mr-2 h-4 w-4" />
                        View Stats
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          /* Stats View Mode - Similar to the original competition-overview */
          <>
            <GlobalWinnerLookup />

            <Tabs defaultValue={statsTab} onValueChange={setStatsTab} className="space-y-4">
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
                    {selectedCompetitionId 
                      ? (activeCompetitions.filter(c => c.id === selectedCompetitionId).map(competition => (
                          <CompetitionStats key={competition.id} competition={competition} />
                        )))
                      : (activeCompetitions
                          .filter(competition => 
                            (competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            competition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (competition.brand && competition.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            competition.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
                            (selectedCategory && selectedCategory !== 'all' ? competition.category.toLowerCase() === selectedCategory.toLowerCase() : true)
                          )
                          .map((competition) => (
                            <CompetitionStats key={competition.id} competition={competition} />
                          ))
                      )}
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
                    {selectedCompetitionId 
                      ? (pastCompetitions.filter(c => c.id === selectedCompetitionId).map(competition => (
                          <CompetitionStats key={competition.id} competition={competition} />
                        )))
                      : (pastCompetitions
                          .filter(competition => 
                            (competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            competition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (competition.brand && competition.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            competition.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
                            (selectedCategory && selectedCategory !== 'all' ? competition.category.toLowerCase() === selectedCategory.toLowerCase() : true)
                          )
                          .map((competition) => (
                            <CompetitionStats key={competition.id} competition={competition} />
                          ))
                      )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCompetitionId(null);
                  setViewMode('table');
                }}
                className="mt-4"
              >
                <TicketIcon className="mr-2 h-4 w-4" />
                Back to Competition List
              </Button>
            </div>
          </>
        )}

        {/* Delete Competition Confirmation Dialog */}
        <AlertDialog open={!!competitionToDelete} onOpenChange={() => setCompetitionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the competition, along with all associated entries and records.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Competition
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Competitions Confirmation Dialog */}
        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Competitions?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete ALL competitions and their related entries from the database. 
                This action cannot be undone and will remove all customer purchases.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  resetCompetitionsMutation.mutate();
                  setResetDialogOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Reset All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}