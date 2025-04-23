import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, DollarSign, Package, Users } from "lucide-react";

export default function AdminDashboard() {
  const { data: competitions } = useQuery({
    queryKey: ["/api/competitions"],
  });

  // Stats cards for the dashboard
  const stats = [
    {
      title: "Total Competitions",
      value: competitions?.length || 0,
      icon: Package,
      change: "+12.5%",
      changeType: "positive",
    },
    {
      title: "Total Revenue",
      value: "£12,500",
      icon: DollarSign,
      change: "+25.2%",
      changeType: "positive",
    },
    {
      title: "Active Users",
      value: "4,256",
      icon: Users,
      change: "+18.7%",
      changeType: "positive",
    },
    {
      title: "Tickets Sold",
      value: "1,598",
      icon: Package,
      change: "+7.4%",
      changeType: "positive",
    }
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className={`flex items-center text-xs ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.changeType === 'positive' ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowUp className="h-4 w-4 mr-1 transform rotate-180" />
                  )}
                  {stat.change}
                  <span className="text-muted-foreground ml-1">from previous month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Competitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitions?.slice(0, 5).map((comp: any) => (
                <div key={comp.id} className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${comp.imageUrl || 'https://placehold.co/200x200?text=Image'})` 
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{comp.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {comp.ticketsSold || 0} / {comp.totalTickets} tickets sold
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    £{(comp.ticketPrice / 100).toFixed(2)}
                  </div>
                </div>
              ))}
              {(!competitions || competitions.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  No competitions found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No entries data available
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}