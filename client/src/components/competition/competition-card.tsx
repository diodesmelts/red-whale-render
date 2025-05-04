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
    return isToday ? "bg-green-400 text-white" : "bg-[#3bbff2] text-white";
  };
  
  const getDrawLabelText = () => {
    const isToday = timeRemaining.days === 0 && timeRemaining.hours < 24;
    const drawDate = new Date(competition.drawDate);
    if (isToday) {
      const hours = drawDate.getHours();
      const minutes = String(drawDate.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      return `Draw Today ${displayHours}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
    }
    return "Automated Draw";
  };

  return (
    <motion.div
      className="bg-white text-[#002147] rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col h-full"
      whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Draw date label at top */}
        <div className={`absolute top-2 left-0 right-0 ${getDrawLabelClass()} py-2 px-6 text-center font-medium z-10 mx-auto w-max rounded-full shadow-md text-sm`}>
          {getDrawLabelText()}
        </div>

        <img 
          className="w-full h-48 object-cover" 
          src={competition.imageUrl || "https://placehold.co/600x400/f0f0f0/333333/png?text=No+Image"}
          alt={competition.title}
        />
        
        {/* Automated Draw button */}
        <div className="absolute -bottom-4 w-full flex justify-center">
          <div className="bg-white text-[#3bbff2] border border-[#3bbff2] font-medium py-1.5 px-6 rounded-full shadow-md text-center w-3/4 text-sm">
            Automated Draw
          </div>
        </div>
      </div>
      
      <div className="px-3 pt-6 pb-3">
        <Link href={`/competitions/${competition.id}`}>
          <h3 className="text-lg font-bold text-[#002147] mb-1 cursor-pointer hover:text-[#3bbff2] transition-colors text-center">
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
        <div className="text-[#3bbff2] text-3xl font-bold mb-2 text-center">
          {ticketPrice}
        </div>
        
        {/* Progress bar for tickets sold */}
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">SOLD: {percentSold}%</div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-1.5 bg-[#3bbff2] rounded-full" 
              style={{ width: `${percentSold}%` }}
            ></div>
          </div>
        </div>
        
        {/* Instant win badge */}
        <div className="mb-3 flex justify-center">
          <div className="text-[#005dff] border-2 border-[#005dff] font-bold py-1 px-4 rounded-full flex items-center">
            <span className="mr-1">INSTANT</span>
            <Zap className="fill-[#005dff] h-5 w-5 stroke-white" />
            <span className="ml-0.5">WIN</span>
          </div>
        </div>
        
        <Link href={`/competitions/${competition.id}`}>
          <div className="border-2 border-[#3bbff2] text-[#3bbff2] hover:bg-[#3bbff2] hover:text-white text-center py-2 px-4 rounded-full font-medium cursor-pointer flex items-center justify-center transition-colors">
            Enter now <Ticket className="h-5 w-5 ml-2" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
