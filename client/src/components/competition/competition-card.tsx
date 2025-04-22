import { Link } from "wouter";
import { useState } from "react";
import { Competition } from "@shared/schema";
import { formatCurrency, formatDate, calculateTimeRemaining, getCategoryColor } from "@/lib/utils";
import { Ticket, Calendar, Clock, Hourglass } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";
import { CategoryBadge } from "./category-badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompetitionCardProps {
  competition: Competition;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryColor = getCategoryColor(competition.category);
  const timeRemaining = calculateTimeRemaining(competition.drawDate);
  
  const remainingTickets = competition.totalTickets - competition.ticketsSold;
  const percentSold = (competition.ticketsSold / competition.totalTickets) * 100;
  
  // Format ticket price
  const ticketPrice = formatCurrency(competition.ticketPrice);
  
  // Get color classes based on category
  const getBorderColorClass = () => {
    switch (competition.category) {
      case "family":
        return "border-yellow-400";
      case "appliances":
        return "border-pink-400";
      case "cash":
        return "border-green-400";
      default:
        return "border-primary";
    }
  };
  
  const getButtonColorClass = () => {
    switch (competition.category) {
      case "family":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "appliances":
        return "bg-pink-500 hover:bg-pink-600";
      case "cash":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  };
  
  const getGlowColorClass = () => {
    switch (competition.category) {
      case "family":
        return "shadow-[0_0_15px_rgba(255,193,7,0.5)]";
      case "appliances":
        return "shadow-[0_0_15px_rgba(255,77,148,0.5)]";
      case "cash":
        return "shadow-[0_0_15px_rgba(76,175,80,0.5)]";
      default:
        return "shadow-[0_0_15px_rgba(0,153,255,0.5)]";
    }
  };

  return (
    <motion.div
      className={cn(
        "bg-card rounded-lg overflow-hidden shadow-lg border border-border transform transition-all duration-300",
        isHovered && `${getBorderColorClass()} ${getGlowColorClass()}`
      )}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        <img 
          className="w-full h-48 object-cover" 
          src={competition.imageUrl || "https://placehold.co/600x400/1a1f2b/FFFFFF/png?text=No+Image"}
          alt={competition.title}
        />
        
        <CategoryBadge category={competition.category} brand={competition.brand} className="absolute top-0 left-0 m-2" />
        
        {/* Highlight badges for special competitions */}
        {percentSold > 80 && (
          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-2 py-1 m-2 rounded animate-pulse">
            HOT ITEM
          </div>
        )}
        {timeRemaining.days === 0 && timeRemaining.hours < 12 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 m-2 rounded animate-pulse">
            ENDING SOON
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent h-16"></div>
      </div>
      
      <div className="p-4">
        <Link href={`/competitions/${competition.id}`}>
          <h3 className="text-lg font-semibold text-foreground mb-1 cursor-pointer">{competition.title}</h3>
        </Link>
        
        <div className="flex justify-between items-center mb-3">
          <span className={`font-bold text-${categoryColor}`}>
            {ticketPrice} <span className="text-muted-foreground text-xs">per ticket</span>
          </span>
          <span className="text-muted-foreground text-sm">
            <Ticket className="h-3 w-3 inline mr-1" /> {remainingTickets} tickets remaining
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <CountdownTimer drawDate={competition.drawDate} />
        </div>
        
        <Link href={`/competitions/${competition.id}`}>
          <div className={cn(
            "block w-full px-4 py-2 text-white text-center rounded-md font-medium transform transition-all duration-150 cursor-pointer",
            getButtonColorClass(),
            "relative overflow-hidden group"
          )}>
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-300"></div>
            <Ticket className="h-4 w-4 inline mr-1" /> GET TICKETS
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
