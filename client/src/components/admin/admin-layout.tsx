import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Package, Users, Shield, Image, TicketIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // If not admin, redirect to homepage
  if (!user || !user.isAdmin) {
    return <Redirect to="/" />;
  }
  
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/competitions", label: "Competitions", icon: Package },
    { href: "/admin/competitions-overview", label: "Ticket Stats", icon: TicketIcon },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/site-config", label: "Site Configuration", icon: Image },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold flex items-center text-foreground">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Admin Dashboard
          </h2>
        </div>
        <nav className="mt-6">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md group hover:bg-primary/10 transition-all",
                      isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}