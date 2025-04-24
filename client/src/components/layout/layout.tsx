import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/98">
      <Navbar />
      <main className="flex-1 relative">
        {/* Subtle design elements - will be behind all content */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        </div>
        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}