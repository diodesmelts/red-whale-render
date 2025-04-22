import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AuthBypass from "@/pages/auth-bypass"; // Added for development login
import CompetitionsPage from "@/pages/competitions-page";
import CompetitionDetails from "@/pages/competition-details";
import HowToPlay from "@/pages/how-to-play";
import MyEntries from "@/pages/my-entries";
import MyWins from "@/pages/my-wins";
import ProfilePage from "@/pages/profile";

// Admin Pages
import { 
  AdminDashboard,
  ListingsManagement,
  CreateCompetition,
  EditCompetition
} from "@/pages/admin";

import { Layout } from "@/components/layout/layout";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

// Mock competitions for display
const mockCompetitions = [
  {
    id: 1,
    title: "Ninja Air Fryer",
    description: "Win the latest model Ninja Air Fryer with dual drawers and digital display.",
    imageUrl: "https://placehold.co/400x300/2a3035/e0e0e0/png?text=Ninja+Air+Fryer",
    category: "Home",
    brand: "Ninja",
    prizeValue: 199.99,
    ticketPrice: 1.99,
    maxTicketsPerUser: 10,
    totalTickets: 500,
    ticketsSold: 50,
    drawDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "£5,000 Cash Prize",
    description: "Win £5,000 cash deposited directly to your bank account!",
    imageUrl: "https://placehold.co/400x300/2a3035/e0e0e0/png?text=Cash+Prize",
    category: "Cash",
    prizeValue: 5000,
    ticketPrice: 4.99,
    maxTicketsPerUser: 50,
    totalTickets: 2000,
    ticketsSold: 875,
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "Dyson Vacuum Cleaner",
    description: "Win a Dyson V12 Detect Slim cordless vacuum cleaner.",
    imageUrl: "https://placehold.co/400x300/2a3035/e0e0e0/png?text=Dyson+Vacuum",
    category: "Home",
    brand: "Dyson",
    prizeValue: 599.99,
    ticketPrice: 2.99,
    maxTicketsPerUser: 20,
    totalTickets: 1000,
    ticketsSold: 365,
    drawDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    title: "Family Adventure Package",
    description: "Win a family adventure package including theme park tickets and accommodation.",
    imageUrl: "https://placehold.co/400x300/2a3035/e0e0e0/png?text=Adventure+Package",
    category: "Experience",
    prizeValue: 799.99,
    ticketPrice: 3.99,
    maxTicketsPerUser: 15,
    totalTickets: 1200,
    ticketsSold: 380,
    drawDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  }
];

// TEMPORARY: Completely simplified app to just display the homepage without any auth or routing
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Simple Header */}
      <header className="bg-background border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Blue Whale</span> Competitions
          </h1>
          <div>
            <span className="text-primary">Demo Mode</span>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Win Amazing <span className="text-primary">Prizes</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your premier destination for discovering, participating in, and winning exclusive competitions across multiple platforms.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md font-medium">
                Browse Competitions
              </button>
              <button className="border border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-md font-medium">
                How It Works
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Competitions */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">
              <span className="text-primary">Featured</span> Competitions
            </h2>
            <p className="text-muted-foreground mt-2">
              Don't miss your chance to win these amazing prizes!
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {mockCompetitions.map(comp => (
              <div key={comp.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-md">
                <div className="relative">
                  <img 
                    src={comp.imageUrl || "https://placehold.co/400x300/2a3035/e0e0e0/png?text=No+Image"} 
                    alt={comp.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-0 left-0 m-2 px-2 py-1 text-xs font-semibold rounded-md bg-black/50 text-white">
                    {comp.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{comp.title}</h3>
                  <div className="flex justify-between mb-3">
                    <span className="font-bold text-primary">£{comp.ticketPrice.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">
                      {comp.totalTickets - comp.ticketsSold} tickets left
                    </span>
                  </div>
                  <button className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded font-medium">
                    Get Tickets
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Simple Footer */}
      <footer className="mt-auto bg-foreground/5 border-t border-border p-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Blue Whale Competitions. Demo Mode.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
