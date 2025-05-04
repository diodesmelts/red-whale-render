import { Link } from "wouter";
import { useState } from "react";
import { Competition } from "@shared/schema";
import { formatCurrency, formatDate, calculateTimeRemaining, getCategoryColor } from "@/lib/utils";
import { Ticket, Calendar, Clock, Hourglass, Zap } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";
import { CategoryBadge } from "./category-badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompetitionCardProps {
  competition: Competition;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const timeRemaining = calculateTimeRemaining(competition.drawDate);
  
  const ticketsSold = competition.ticketsSold || 0;
  const remainingTickets = competition.totalTickets - ticketsSold;
  const percentSold = Math.round((ticketsSold / competition.totalTickets) * 100);
  
  // Format ticket price
  const ticketPrice = formatCurrency(competition.ticketPrice);
  
  // Determine the draw date label text and color
  const getDrawLabelClass = () => {
    const isToday = timeRemaining.days === 0 && timeRemaining.hours < 24;
    return isToday ? "bg-[#bbd665] text-black" : "bg-[#bbd665] text-black";
  };
  
  // Countdown timer is now handled directly by the CountdownTimer component

  return (
    <motion.div
      className="bg-white text-[#002147] rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full"
      whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >      
      <div className="relative">
        <div className="aspect-square overflow-hidden flex items-center justify-center">
          <img 
            className="w-full h-full object-cover" 
            src={competition.imageUrl || "https://placehold.co/600x400/f0f0f0/333333/png?text=No+Image"}
            alt={competition.title}
          />
        </div>
        
        {/* Draw date badge with countdown timer */}
        <div className="absolute -bottom-4 w-full flex justify-center">
          <div className="bg-[#002147] text-white font-medium py-2 px-4 rounded-full shadow-md text-center w-4/5 text-sm flex items-center justify-center">
            <CountdownTimer drawDate={competition.drawDate} variant="badge" />
          </div>
        </div>
      </div>
      
      <div className="px-4 pt-8 pb-4 flex flex-col h-full">
        <Link href={`/competitions/${competition.id}`}>
          <h3 className="text-xl font-bold text-[#002147] mb-2 cursor-pointer hover:text-[#3bbff2] transition-colors text-center">
            {competition.title}
          </h3>
        </Link>
        
        {/* Chance of winning badge */}
        <div className="flex justify-center mb-2">
          <div className="py-1 px-2 inline-block text-center">
            <span className="text-sm text-gray-600 flex items-center justify-center">
              <span className="text-amber-500 mr-1">👉</span> 1 in 10 Chance Of Winning! <span className="text-amber-500 ml-1">👈</span>
            </span>
          </div>
        </div>
        
        {/* Ticket price */}
        <div className="text-[#bbd665] text-4xl font-bold mb-3 text-center">
          {ticketPrice}
        </div>
        
        {/* Progress bar for tickets sold */}
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">SOLD: {percentSold}%</div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-1.5 bg-[#002147] rounded-full" 
              style={{ width: `${percentSold}%` }}
            ></div>
          </div>
        </div>
        
        {/* Instant win badge */}
        <div className="mb-3 flex justify-center">
          <div className="text-[#002147] border-2 border-[#002147] font-bold py-1 px-4 rounded-full flex items-center">
            <span className="mr-1">INSTANT</span>
            <Zap className="fill-[#002147] h-5 w-5 stroke-white" />
            <span className="ml-0.5">WIN</span>
          </div>
        </div>
        
        <Link href={`/competitions/${competition.id}`} className="mt-auto w-full">
          <div className="bg-[#002147] border-2 border-[#002147] text-white hover:bg-[#003167] hover:border-[#003167] text-center py-3 px-4 rounded-xl font-medium cursor-pointer flex items-center justify-center transition-colors w-full">
            Enter now <Ticket className="h-5 w-5 ml-2" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
