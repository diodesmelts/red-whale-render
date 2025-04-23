import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { BarChart, DollarSign, Package, Trophy, Users } from 'lucide-react';
import { Competition, User, Entry } from '@shared/schema';

export default function AdminDashboard() {
  const { data: competitions = [], isLoading: isLoadingCompetitions } = useQuery<Competition[]>({
    queryKey: ['/api/competitions'],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: entries = [], isLoading: isLoadingEntries } = useQuery<Entry[]>({
    queryKey: ['/api/admin/entries'],
  });

  // Calculate summary statistics
  const activeCompetitions = competitions.filter(comp => comp.isLive).length;
  const totalRevenue = entries.reduce((sum, entry) => {
    if (entry.paymentStatus === 'completed') {
      const competition = competitions.find(c => c.id === entry.competitionId);
      return sum + (competition ? competition.ticketPrice * entry.ticketCount : 0);
    }
    return sum;
  }, 0);

  const recentActivity = [
    { action: "User Registration", user: "john_doe", time: "20 minutes ago" },
    { action: "Competition Entry", user: "sarah85", competition: "Spring Holiday Bundle", time: "1 hour ago" },
    { action: "Prize Claimed", user: "mark_wilson", competition: "Cash Prize Draw", time: "3 hours ago" },
    { action: "New Competition", admin: "admin", competition: "Premium Tech Bundle", time: "5 hours ago" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Competitions</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{competitions.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeCompetitions} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(user => user.isAdmin).length} administrators
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
              <p className="text-xs text-muted-foreground">
                {entries.filter(entry => entry.paymentStatus === 'completed').length} paid entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {entries.filter(entry => entry.paymentStatus === 'completed').length} paid tickets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-6">
          <Card className="col-span-1 md:col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Monitor recent activity on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="relative w-2 h-2 rounded-full bg-primary">
                        <span className="absolute w-2 h-2 rounded-full animate-ping bg-primary/50"></span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.action}
                          {activity.competition && <span className="text-muted-foreground"> - {activity.competition}</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user || activity.admin} <span className="text-xs">• {activity.time}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity to display.</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start">
                <Link href="/admin/competitions">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Competitions
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <BarChart className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Competition Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Competition Performance</CardTitle>
            <CardDescription>Ticket sales progress for active competitions</CardDescription>
          </CardHeader>
          <CardContent>
            {competitions.filter(comp => comp.isLive).slice(0, 5).map((competition) => {
              const soldPercentage = competition.ticketsSold 
                ? Math.round((competition.ticketsSold / competition.totalTickets) * 100) 
                : 0;
              
              return (
                <div key={competition.id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{competition.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {competition.ticketsSold || 0}/{competition.totalTickets} tickets
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Progress value={soldPercentage} className="h-2 flex-1" />
                    <span className="text-xs font-medium">{soldPercentage}%</span>
                  </div>
                </div>
              );
            })}
            {competitions.filter(comp => comp.isLive).length === 0 && (
              <p className="text-sm text-muted-foreground">No active competitions to display.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}