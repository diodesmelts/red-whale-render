import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Bell, Menu, ChevronDown, User, Shield, ClipboardList, Wallet, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="sticky top-0 bg-background/90 backdrop-blur-sm z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Logo size="md" />
                </div>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/">
                  <a className={cn(
                    "px-3 py-2 text-sm font-medium hover:text-primary transition duration-150",
                    location === "/" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                  )}>
                    <i className="fas fa-home mr-1"></i> Home
                  </a>
                </Link>
                <div className="relative group">
                  <Link href="/competitions">
                    <a className={cn(
                      "px-3 py-2 text-sm font-medium hover:text-primary transition duration-150 flex items-center",
                      location.includes("/competitions") ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                    )}>
                      <i className="fas fa-trophy mr-1"></i> Competitions <ChevronDown className="h-4 w-4 ml-1" />
                    </a>
                  </Link>
                  <div className="hidden group-hover:block absolute left-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-10">
                    <Link href="/competitions">
                      <a className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                        All Competitions
                      </a>
                    </Link>
                    <div className="border-t border-border my-1"></div>
                    <Link href="/competitions?category=family">
                      <a className="block px-4 py-2 text-sm text-yellow-400 hover:bg-accent hover:text-accent-foreground">
                        <span className="w-2 h-2 inline-block bg-yellow-400 rounded-full mr-2"></span> Family
                      </a>
                    </Link>
                    <Link href="/competitions?category=appliances">
                      <a className="block px-4 py-2 text-sm text-pink-400 hover:bg-accent hover:text-accent-foreground">
                        <span className="w-2 h-2 inline-block bg-pink-400 rounded-full mr-2"></span> Appliances
                      </a>
                    </Link>
                    <Link href="/competitions?category=cash">
                      <a className="block px-4 py-2 text-sm text-green-400 hover:bg-accent hover:text-accent-foreground">
                        <span className="w-2 h-2 inline-block bg-green-400 rounded-full mr-2"></span> Cash
                      </a>
                    </Link>
                  </div>
                </div>
                <Link href="/how-to-play">
                  <a className={cn(
                    "px-3 py-2 text-sm font-medium hover:text-primary transition duration-150",
                    location === "/how-to-play" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                  )}>
                    <i className="fas fa-question-circle mr-1"></i> How to Play
                  </a>
                </Link>
                {user && (
                  <>
                    <Link href="/my-entries">
                      <a className={cn(
                        "px-3 py-2 text-sm font-medium hover:text-primary transition duration-150",
                        location === "/my-entries" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                      )}>
                        <i className="fas fa-clipboard-list mr-1"></i> My Entries
                      </a>
                    </Link>
                    <Link href="/my-wins">
                      <a className={cn(
                        "px-3 py-2 text-sm font-medium hover:text-primary transition duration-150",
                        location === "/my-wins" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                      )}>
                        <i className="fas fa-award mr-1"></i> My Wins
                      </a>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <>
                  <Button variant="ghost" size="icon" className="mr-3 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" className="flex items-center bg-primary/30 hover:bg-primary/50">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                          <span className="font-semibold text-sm">
                            {user.displayName ? user.displayName[0].toUpperCase() : user.username[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="mr-1">{user.displayName || user.username}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-primary">{user.displayName || user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.isAdmin && (
                            <div className="mt-2">
                              <span className="px-2 py-1 rounded-md bg-purple-600 text-white text-xs">
                                <Shield className="h-3 w-3 inline mr-1" /> Admin
                              </span>
                            </div>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        {user.isAdmin && (
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2 text-purple-600" />
                            <span>Admin Dashboard</span>
                          </DropdownMenuItem>
                        )}
                        {user.isAdmin && (
                          <DropdownMenuItem>
                            <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Listings Management</span>
                          </DropdownMenuItem>
                        )}
                        <Link href="/profile">
                          <DropdownMenuItem>
                            <User className="h-4 w-4 mr-2 text-primary" />
                            <span>My Profile</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem>
                          <Wallet className="h-4 w-4 mr-2 text-green-500" />
                          <span>My Balance</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Account Settings</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth">
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth?tab=register">
                    <Button size="sm">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%]">
                <div className="flex flex-col space-y-6 mt-6">
                  <Link href="/" onClick={() => setIsMenuOpen(false)}>
                    <a className={cn(
                      "flex items-center text-lg font-medium",
                      location === "/" ? "text-primary" : "text-foreground"
                    )}>
                      <i className="fas fa-home mr-2"></i> Home
                    </a>
                  </Link>
                  <Link href="/competitions" onClick={() => setIsMenuOpen(false)}>
                    <a className={cn(
                      "flex items-center text-lg font-medium",
                      location.includes("/competitions") ? "text-primary" : "text-foreground"
                    )}>
                      <i className="fas fa-trophy mr-2"></i> Competitions
                    </a>
                  </Link>
                  <div className="pl-5 space-y-3">
                    <Link href="/competitions?category=family" onClick={() => setIsMenuOpen(false)}>
                      <a className="flex items-center text-yellow-400">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                        Family
                      </a>
                    </Link>
                    <Link href="/competitions?category=appliances" onClick={() => setIsMenuOpen(false)}>
                      <a className="flex items-center text-pink-400">
                        <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                        Appliances
                      </a>
                    </Link>
                    <Link href="/competitions?category=cash" onClick={() => setIsMenuOpen(false)}>
                      <a className="flex items-center text-green-400">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Cash
                      </a>
                    </Link>
                  </div>
                  <Link href="/how-to-play" onClick={() => setIsMenuOpen(false)}>
                    <a className={cn(
                      "flex items-center text-lg font-medium",
                      location === "/how-to-play" ? "text-primary" : "text-foreground"
                    )}>
                      <i className="fas fa-question-circle mr-2"></i> How to Play
                    </a>
                  </Link>
                  {user ? (
                    <>
                      <Link href="/my-entries" onClick={() => setIsMenuOpen(false)}>
                        <a className={cn(
                          "flex items-center text-lg font-medium",
                          location === "/my-entries" ? "text-primary" : "text-foreground"
                        )}>
                          <i className="fas fa-clipboard-list mr-2"></i> My Entries
                        </a>
                      </Link>
                      <Link href="/my-wins" onClick={() => setIsMenuOpen(false)}>
                        <a className={cn(
                          "flex items-center text-lg font-medium",
                          location === "/my-wins" ? "text-primary" : "text-foreground"
                        )}>
                          <i className="fas fa-award mr-2"></i> My Wins
                        </a>
                      </Link>
                      <div className="border-t border-border pt-4">
                        <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                          <a className="flex items-center text-lg font-medium">
                            <User className="h-5 w-5 mr-2 text-primary" />
                            My Profile
                          </a>
                        </Link>
                        <button 
                          onClick={() => { 
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center text-lg font-medium text-red-500 mt-4"
                        >
                          <LogOut className="h-5 w-5 mr-2" />
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col space-y-3">
                      <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full">Login</Button>
                      </Link>
                      <Link href="/auth?tab=register" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Register</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
