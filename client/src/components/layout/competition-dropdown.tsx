import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function CompetitionDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    // Only add the event listener when the dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, dropdownRef]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-4 py-3 text-base font-medium flex items-center rounded-md transition-all duration-200",
          location.includes("/competitions") 
            ? "text-primary relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
            : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
        )}
        id="competitions-menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className="fas fa-trophy mr-2"></i> 
        Competitions
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-background border-2 border-primary/20 focus:outline-none z-[1000]"
          style={{
            boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.25), 0 0 15px rgba(123, 57, 237, 0.2)"
          }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="competitions-menu"
        >
          <div className="py-3">
            <Link href="/competitions" className="flex items-center block px-5 py-3 font-medium text-base text-primary hover:bg-primary/5 transition-colors">
              <div className="flex items-center w-full">
                <span className="mr-2">🏆</span> All Competitions
              </div>
            </Link>
            <div className="border-t border-border/50 my-2 mx-3"></div>
            <div className="px-3 pb-1 text-xs uppercase text-muted-foreground font-semibold tracking-wider">Categories</div>
            <Link href="/competitions?category=family" className="flex items-center px-5 py-2.5 text-base font-medium text-yellow-500 hover:bg-yellow-500/5 hover:pl-6 transition-all">
              <span className="w-2.5 h-2.5 inline-block bg-yellow-400 rounded-full mr-2.5"></span> Family
            </Link>
            <Link href="/competitions?category=household" className="flex items-center px-5 py-2.5 text-base font-medium text-pink-500 hover:bg-pink-500/5 hover:pl-6 transition-all">
              <span className="w-2.5 h-2.5 inline-block bg-pink-400 rounded-full mr-2.5"></span> Household
            </Link>
            <Link href="/competitions?category=cash" className="flex items-center px-5 py-2.5 text-base font-medium text-green-500 hover:bg-green-500/5 hover:pl-6 transition-all">
              <span className="w-2.5 h-2.5 inline-block bg-green-400 rounded-full mr-2.5"></span> Cash
            </Link>
            <Link href="/competitions?category=beauty" className="flex items-center px-5 py-2.5 text-base font-medium text-rose-500 hover:bg-rose-500/5 hover:pl-6 transition-all">
              <span className="w-2.5 h-2.5 inline-block bg-rose-400 rounded-full mr-2.5"></span> Beauty
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}