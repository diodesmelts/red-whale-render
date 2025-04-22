import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  ListChecks, 
  LayersIcon, 
  Users, 
  TrendingUp, 
  Award,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get competitions for stats
  const { data: competitions = [] } = useQuery({
    queryKey: ['/api/competitions'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Calculate dashboard stats
  const activeCompetitions = competitions.filter((comp: any) => comp.isLive).length;
  const totalCompetitions = competitions.length;
  const totalRevenue = competitions.reduce((sum: number, comp: any) => sum + (comp.ticketsSold * comp.ticketPrice), 0);
  const ticketsSold = competitions.reduce((sum: number, comp: any) => sum + comp.ticketsSold, 0);
  
  useEffect(() => {
    // Welcome toast for admin
    toast({
      title: `Welcome, ${user?.displayName || user?.username}`,
      description: "You're logged in to the admin dashboard",
    });
  }, []);

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your competitions and monitor platform activity
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 flex gap-1.5 items-center mr-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Badge>
            <Button asChild variant="default">
              <Link href="/admin/create-competition">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Competition
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Competitions
              </CardTitle>
              <LayersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCompetitions}</div>
              <p className="text-xs text-muted-foreground">
                of {totalCompetitions} total competitions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                From all competition entries
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tickets Sold
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketsSold}</div>
              <p className="text-xs text-muted-foreground">
                Across all competitions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Platform Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Stats coming soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold mt-6">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Manage Listings</CardTitle>
              <CardDescription>
                Edit, update or remove competition listings
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/admin/listings">
                  <ListChecks className="h-4 w-4 mr-2" />
                  View Listings
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Competition</CardTitle>
              <CardDescription>
                Add a new competition to the platform
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/admin/create-competition">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Competition
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <CardDescription>
                Manage system preferences and configuration
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}