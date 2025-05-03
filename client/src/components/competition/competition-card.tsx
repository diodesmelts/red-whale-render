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
  
  const ticketsSold = competition.ticketsSold || 0;
  const remainingTickets = competition.totalTickets - ticketsSold;
  const percentSold = (ticketsSold / competition.totalTickets) * 100;
  
  // Format ticket price
  const ticketPrice = formatCurrency(competition.ticketPrice);
  
  // Get color classes based on category
  const getBorderColorClass = () => {
    switch (competition.category) {
      case "family":
        return "border-accent";
      case "household":
        return "border-pink-400";
      case "cash":
        return "border-primary";
      default:
        return "border-primary";
    }
  };
  
  const getButtonColorClass = () => {
    switch (competition.category) {
      case "family":
        return "bg-accent hover:bg-accent/90";
      case "household":
        return "bg-pink-500 hover:bg-pink-600";
      case "cash":
        return "bg-primary hover:bg-primary/90";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  };
  
  const getGlowColorClass = () => {
    switch (competition.category) {
      case "family":
        return "shadow-[0_0_15px_rgba(255,149,40,0.5)]";
      case "household":
        return "shadow-[0_0_15px_rgba(255,77,148,0.5)]";
      case "cash":
        return "shadow-[0_0_15px_rgba(5,138,99,0.5)]";
      default:
        return "shadow-[0_0_15px_rgba(5,138,99,0.5)]";
    }
  };

  return (
    <motion.div
      className={cn(
        "bg-white rounded-xl overflow-hidden shadow-lg border-2 border-border transform transition-all duration-300",
        isHovered && `${getBorderColorClass()} ${getGlowColorClass()}`
      )}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        <img 
          className="w-full h-60 object-cover" 
          src={competition.imageUrl || "https://placehold.co/600x400/f0f0f0/333333/png?text=No+Image"}
          alt={competition.title}
        />
        
        <CategoryBadge category={competition.category} brand={competition.brand || undefined} className="absolute top-0 left-0 m-2" />
        
        {/* Highlight badges for special competitions */}
        {percentSold > 80 && (
          <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-2 py-1 m-2 rounded-md animate-pulse">
            HOT ITEM
          </div>
        )}
        {timeRemaining.days === 0 && timeRemaining.hours < 12 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 m-2 rounded-md animate-pulse">
            ENDING SOON
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/70 to-transparent h-16"></div>
      </div>
      
      <div className="p-6">
        <Link href={`/competitions/${competition.id}`}>
          <h3 className="text-xl font-semibold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors">{competition.title}</h3>
        </Link>
        
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-primary text-xl">
            {ticketPrice} <span className="text-muted-foreground text-sm">per ticket</span>
          </span>
          <span className="text-muted-foreground text-sm">
            <Ticket className="h-4 w-4 inline mr-1 text-primary" /> {remainingTickets} tickets remaining
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-5">
          <CountdownTimer drawDate={competition.drawDate} />
        </div>
        
        <Link href={`/competitions/${competition.id}`}>
          <div className={cn(
            "block w-full px-4 py-3 text-white text-center rounded-md font-medium transform transition-all duration-200 cursor-pointer shadow-md",
            getButtonColorClass(),
            "relative overflow-hidden group text-lg"
          )}>
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-300"></div>
            <Ticket className="h-5 w-5 inline mr-2" /> GET TICKETS
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
