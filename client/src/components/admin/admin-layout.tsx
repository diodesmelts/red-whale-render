import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Award, 
  Users, 
  Settings, 
  Ticket, 
  LogOut,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/competitions", icon: Award, label: "Competitions" },
    { href: "/admin/entries", icon: Ticket, label: "Entries" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-xl text-primary">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Manage your competitions</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Site
              </Button>
            </Link>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start mt-2 text-red-500 hover:text-red-600 hover:bg-red-100/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden p-4 border-b border-border bg-card flex items-center justify-between">
          <h2 className="font-bold text-xl text-primary">Admin Panel</h2>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back to Site</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden flex overflow-x-auto py-2 px-4 border-b border-border bg-card no-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap mr-2"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}