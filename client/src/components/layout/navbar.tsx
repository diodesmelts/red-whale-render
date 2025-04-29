import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Menu, ChevronDown, User, Shield, ClipboardList, Wallet, Settings, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CartIcon } from "@/components/cart/cart-icon";
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
    <nav className="sticky top-0 z-[200]">
      {/* Announcement strip with brighter, vibrant purple */}
      <div className="bg-[#5B1ECB] text-white py-2.5 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center text-sm font-medium">
          <span className="inline-flex items-center">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Every ticket includes free bonus draw entry
          </span>
        </div>
      </div>
      
      {/* Main navbar with darker background */}
      <div className="bg-gradient-to-r from-[#081731] via-[#0c1e42] to-[#081731] backdrop-blur-md border-b border-primary/10 shadow-sm relative overflow-hidden">
        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">          
          <div className="flex items-center justify-between h-24 relative z-10">
            <div className="flex items-center">
              <div className="flex-shrink-0 pl-2 sm:pl-4">
                <Link href="/">
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <Logo size="lg" />
                  </div>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-center space-x-6">
                  <Link href="/" className={cn(
                    "px-4 py-3 text-base font-medium flex items-center rounded-md transition-all duration-200",
                    location === "/" 
                      ? "text-primary relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )}>
                    <i className="fas fa-home mr-2"></i> Home
                  </Link>
                  <Link href="/competitions" className={cn(
                    "px-4 py-3 text-base font-medium flex items-center rounded-md transition-all duration-200",
                    location.includes("/competitions") 
                      ? "text-primary relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )}>
                    <i className="fas fa-trophy mr-2"></i> Competitions
                  </Link>
                  <Link href="/how-to-play" className={cn(
                    "px-4 py-3 text-base font-medium flex items-center rounded-md transition-all duration-200",
                    location === "/how-to-play" 
                      ? "text-primary relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )}>
                    <i className="fas fa-question-circle mr-2"></i> How to Play
                  </Link>
                  <Link href="/faqs" className={cn(
                    "px-4 py-3 text-base font-medium flex items-center rounded-md transition-all duration-200",
                    location === "/faqs" 
                      ? "text-primary relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )}>
                    <i className="fas fa-info-circle mr-2"></i> FAQs
                  </Link>
                  {user && (
                    <>
                      <Link href="/my-entries" className={cn(
                        "px-4 py-3 text-base font-medium flex items-center rounded-md transition-all duration-200",
                        location === "/my-entries" 
                          ? "text-primary relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                      )}>
                        <i className="fas fa-clipboard-list mr-2"></i> My Entries
                      </Link>
                      <Link href="/my-wins" className={cn(
                        "px-4 py-3 text-base font-medium flex items-center rounded-md transition-all duration-200",
                        location === "/my-wins" 
                          ? "text-primary relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                      )}>
                        <i className="fas fa-award mr-2"></i> My Wins
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6 pr-2 sm:pr-4">
                {user ? (
                  <>
                    <div className="flex items-center mr-6">
                      <CartIcon variant="ghost" size="icon" showTooltip={true} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="flex items-center bg-primary/30 hover:bg-primary/50 shadow-[0_0_8px_rgba(123,57,237,0.5)] border border-primary/40 transition-all hover:shadow-[0_0_12px_rgba(123,57,237,0.7)]">
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
                            <DropdownMenuItem asChild>
                              <Link href="/admin">
                                <div className="flex items-center w-full">
                                  <Shield className="h-4 w-4 mr-2 text-purple-600" />
                                  <span>Admin Dashboard</span>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {user.isAdmin && (
                            <DropdownMenuItem asChild>
                              <Link href="/admin/competitions">
                                <div className="flex items-center w-full">
                                  <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>Competitions Management</span>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {user.isAdmin && (
                            <DropdownMenuItem asChild>
                              <Link href="/admin/users">
                                <div className="flex items-center w-full">
                                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>Users Management</span>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                            <User className="h-4 w-4 mr-2 text-primary" />
                            <span>My Settings</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Wallet className="h-4 w-4 mr-2 text-green-500" />
                            <span>My Balance</span>
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
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/auth'} 
                      className="px-5 py-2 h-auto shadow-[0_0_8px_rgba(123,57,237,0.4)] border-primary/30 transition-all hover:shadow-[0_0_12px_rgba(123,57,237,0.5)]">
                      Login
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/auth?tab=register'} 
                      className="px-5 py-2 h-auto shadow-[0_0_8px_rgba(123,57,237,0.5)] transition-all hover:shadow-[0_0_12px_rgba(123,57,237,0.7)]">
                      Register
                    </Button>
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
                    <Link href="/" 
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center text-lg font-medium",
                        location === "/" ? "text-primary" : "text-foreground"
                      )}>
                      <i className="fas fa-home mr-2"></i> Home
                    </Link>
                    <Link href="/competitions" 
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center text-lg font-medium",
                        location.includes("/competitions") ? "text-primary" : "text-foreground"
                      )}>
                      <i className="fas fa-trophy mr-2"></i> Competitions
                    </Link>
                    <Link href="/how-to-play" 
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center text-lg font-medium",
                        location === "/how-to-play" ? "text-primary" : "text-foreground"
                      )}>
                      <i className="fas fa-question-circle mr-2"></i> How to Play
                    </Link>
                    <Link href="/faqs" 
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center text-lg font-medium",
                        location === "/faqs" ? "text-primary" : "text-foreground"
                      )}>
                      <i className="fas fa-info-circle mr-2"></i> FAQs
                    </Link>
                    {user ? (
                      <>
                        <Link href="/my-entries" 
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center text-lg font-medium",
                            location === "/my-entries" ? "text-primary" : "text-foreground"
                          )}>
                          <i className="fas fa-clipboard-list mr-2"></i> My Entries
                        </Link>
                        <Link href="/my-wins" 
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center text-lg font-medium",
                            location === "/my-wins" ? "text-primary" : "text-foreground"
                          )}>
                          <i className="fas fa-award mr-2"></i> My Wins
                        </Link>
                        <Link href="/cart" 
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center text-lg font-medium",
                            location === "/cart" ? "text-primary" : "text-foreground"
                          )}>
                          <i className="fas fa-shopping-bag mr-2"></i> My Cart
                        </Link>
                        <div className="border-t border-border pt-4">
                          {user.isAdmin && (
                            <>
                              <Link href="/admin" 
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center text-lg font-medium text-purple-500">
                                <Shield className="h-5 w-5 mr-2" />
                                Admin Dashboard
                              </Link>
                              <Link href="/admin/competitions" 
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center text-lg font-medium mt-4">
                                <ClipboardList className="h-5 w-5 mr-2 text-muted-foreground" />
                                Competitions Management
                              </Link>
                              <Link href="/admin/users" 
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center text-lg font-medium mt-4">
                                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                                Users Management
                              </Link>
                            </>
                          )}
                          <Link href="/profile" 
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center text-lg font-medium mt-4">
                            <User className="h-5 w-5 mr-2 text-primary" />
                            My Settings
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
                          <Button className="w-full shadow-[0_0_8px_rgba(123,57,237,0.5)] transition-all hover:shadow-[0_0_12px_rgba(123,57,237,0.7)]">Login</Button>
                        </Link>
                        <Link href="/auth?tab=register" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" className="w-full shadow-[0_0_8px_rgba(123,57,237,0.4)] border-primary/30 transition-all hover:shadow-[0_0_12px_rgba(123,57,237,0.5)]">Register</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
