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
      className="bg-white text-[#002147] rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full border-2 border-[#002147]/10 shadow-[0_4px_20px_rgba(0,33,71,0.15)]"
      whileHover={{ scale: 1.03, boxShadow: "0 15px 30px -8px rgba(0, 33, 71, 0.25)", borderColor: "rgba(0, 33, 71, 0.3)" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >      
      <div className="relative">
        <div className="aspect-square overflow-hidden flex items-center justify-center bg-gray-50">
          <img 
            className="w-full h-full object-cover" 
            src={competition.imageUrl || "https://placehold.co/600x400/f0f0f0/333333/png?text=No+Image"}
            alt={competition.title}
          />
        </div>
        
        {/* Draw date badge with countdown timer */}
        <div className="absolute -bottom-5 w-full flex justify-center">
          <div className="w-[90%] shadow-xl">
            <CountdownTimer drawDate={competition.drawDate} variant="badge" />
          </div>
        </div>
      </div>
      
      <div className="px-5 pt-10 pb-5 flex flex-col h-full">
        <Link href={`/competitions/${competition.id}`}>
          <h3 className="text-xl font-bold text-[#002147] mb-3 cursor-pointer hover:text-[#3bbff2] transition-colors text-center">
            {competition.title}
          </h3>
        </Link>
        
        {/* Chance of winning badge */}
        <div className="flex justify-center mb-3">
          <div className="py-1 px-3 inline-block text-center bg-[#002147]/5 rounded-full">
            <span className="text-sm font-medium text-[#002147] flex items-center justify-center">
              <span className="text-amber-500 mr-1.5">👉</span> 1 in 10 Chance Of Winning! <span className="text-amber-500 ml-1.5">👈</span>
            </span>
          </div>
        </div>
        
        {/* Ticket price */}
        <div className="text-[#bbd665] text-4xl font-bold mb-4 text-center drop-shadow-sm">
          {ticketPrice}
        </div>
        
        {/* Progress bar for tickets sold */}
        <div className="mb-4 bg-[#f7f9fc] p-3 rounded-lg border border-[#002147]/10">
          <div className="text-xs font-medium text-[#002147]/70 mb-1.5">TICKETS SOLD: {percentSold}%</div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-[#002147] rounded-full" 
              style={{ width: `${percentSold}%` }}
            ></div>
          </div>
        </div>
        
        {/* Instant win badge */}
        <div className="mb-4 flex justify-center">
          <div className="text-[#002147] border-2 border-[#002147] font-bold py-1.5 px-5 rounded-full flex items-center transform hover:scale-105 transition-transform shadow-sm">
            <span className="mr-1">INSTANT</span>
            <Zap className="fill-[#002147] h-5 w-5 stroke-white" />
            <span className="ml-0.5">WIN</span>
          </div>
        </div>
        
        <Link href={`/competitions/${competition.id}`} className="mt-auto w-full">
          <div className="bg-[#002147] border-2 border-[#002147] text-white hover:bg-[#003167] hover:border-[#003167] text-center py-3.5 px-4 rounded-xl font-semibold cursor-pointer flex items-center justify-center transition-all duration-300 w-full shadow-md hover:shadow-xl hover:scale-[1.02] hover:translate-y-[-2px]">
            Enter now <Ticket className="h-5 w-5 ml-2 animate-pulse" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
