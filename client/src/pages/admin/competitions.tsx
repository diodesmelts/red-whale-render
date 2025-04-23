import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash, Edit, Eye, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { Competition } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function CompetitionsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ['/api/competitions'],
  });

  const deleteCompetitionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/competitions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: 'Competition deleted',
        description: 'The competition has been successfully removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete competition: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

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
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update competition status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Filter competitions based on search query
  const filteredCompetitions = competitions.filter(competition => 
    competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    competition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    competition.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCompetition = (id: number) => {
    if (window.confirm('Are you sure you want to delete this competition? This action cannot be undone.')) {
      deleteCompetitionMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleCompetitionStatus.mutate({ id, isLive: !currentStatus });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Competitions Management</h1>
          <Button className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Competition
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Competitions</CardTitle>
            <CardDescription>Manage your competitions catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Ticket Sales</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Draw Date</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompetitions.length > 0 ? (
                      filteredCompetitions.map((competition) => (
                        <TableRow key={competition.id}>
                          <TableCell className="font-medium">{competition.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{competition.title}</div>
                            {competition.brand && (
                              <div className="text-sm text-muted-foreground">{competition.brand}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {competition.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">£{competition.ticketPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {competition.ticketsSold || 0}/{competition.totalTickets}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className="cursor-pointer" 
                              variant={competition.isLive ? "default" : "secondary"}
                              onClick={() => handleToggleStatus(competition.id, !!competition.isLive)}
                            >
                              {competition.isLive ? 'Live' : 'Draft'}
                            </Badge>
                            {competition.isFeatured && (
                              <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
                                Featured
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {competition.drawDate ? format(new Date(competition.drawDate), 'MMM dd, yyyy') : 'TBD'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  <span>Duplicate</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteCompetition(competition.id)} className="text-red-600">
                                  <Trash className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          {searchQuery ? (
                            <div>
                              <p className="text-muted-foreground">No competitions matching "{searchQuery}"</p>
                              <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No competitions found. Create your first competition to get started.</p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">Showing {filteredCompetitions.length} of {competitions.length} competitions</p>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}