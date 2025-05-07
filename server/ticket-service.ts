import { db } from './db';
import { competitions, entries } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * A dedicated ticket service to ensure consistent ticket status 
 * between the admin view and user interface
 */
export class TicketService {
  /**
   * Get all taken ticket numbers for a competition
   * This is the source of truth for ALL ticket status inquiries
   * CRITICAL: Both admin view and user number selection MUST use this
   */
  static async getTakenNumbers(competitionId: number): Promise<{
    purchased: number[];
    inCart: number[];
    all: number[];
  }> {
    try {
      console.log(`🎫 TicketService: Getting taken numbers for competition ${competitionId}`);
      
      // First get the competition to verify existence and get total tickets
      const competition = await db.select()
        .from(competitions)
        .where(eq(competitions.id, competitionId))
        .limit(1);
        
      if (!competition.length) {
        console.error(`🎫 TicketService: Competition ${competitionId} not found`);
        throw new Error('Competition not found');
      }
      
      // Get all entries for this competition
      const entryList = await db.select()
        .from(entries)
        .where(eq(entries.competitionId, competitionId));
      
      console.log(`🎫 TicketService: Found ${entryList.length} entries for competition ${competitionId}`);
      
      // SPECIAL: Show entries for debugging
      console.log(`🔍 All entries for competition ${competitionId}:`, 
        entryList.map(entry => ({
          id: entry.id,
          paymentStatus: entry.paymentStatus,
          selectedNumbers: entry.selectedNumbers
        }))
      );
      
      // Process purchased tickets (completed payment status)
      const purchasedNumbers = new Set<number>();
      const purchasedEntries = entryList.filter(entry => entry.paymentStatus === 'completed');
      
      for (const entry of purchasedEntries) {
        if (entry.selectedNumbers && Array.isArray(entry.selectedNumbers)) {
          for (const num of entry.selectedNumbers) {
            purchasedNumbers.add(Number(num));
          }
        }
      }
      
      // Process in-cart tickets (pending payment status)
      const inCartNumbers = new Set<number>();
      const pendingEntries = entryList.filter(entry => entry.paymentStatus === 'pending');
      
      for (const entry of pendingEntries) {
        if (entry.selectedNumbers && Array.isArray(entry.selectedNumbers)) {
          for (const num of entry.selectedNumbers) {
            inCartNumbers.add(Number(num));
          }
        }
      }
      
      // Get the ticketsSold count from competition
      const ticketsSold = competition[0].ticketsSold || 0;
      
      // CRITICAL: List locked numbers for debugging - this is what's causing the issue!
      const purchasedArray = Array.from(purchasedNumbers);
      const inCartArray = Array.from(inCartNumbers);
      console.log(`🔍 TICKET CHECK: competition ${competitionId}`, {
        id: competition[0].id,
        title: competition[0].title,
        ticketsSold: competition[0].ticketsSold,
        purchasedNumbers: purchasedArray,
        inCartNumbers: inCartArray 
      });
      
      // EXTREMELY IMPORTANT: For numbers 2, 15, and 27 specifically
      if (purchasedArray.includes(2) || purchasedArray.includes(15) || purchasedArray.includes(27)) {
        console.log(`⚠️ FOUND PROBLEMATIC NUMBERS in purchased: ${purchasedArray.filter(n => [2, 15, 27].includes(n))}`);
      }
      if (inCartArray.includes(2) || inCartArray.includes(15) || inCartArray.includes(27)) {
        console.log(`⚠️ FOUND PROBLEMATIC NUMBERS in cart: ${inCartArray.filter(n => [2, 15, 27].includes(n))}`);
      }
      
      // Only generate additional tickets if ticketsSold is explicitly set to a positive number
      // AND if we actually need to add more tickets
      if (competition[0].ticketsSold !== null && ticketsSold > purchasedNumbers.size) {
        console.log(`🎫 TicketService: Generating additional ${ticketsSold - purchasedNumbers.size} purchased numbers to match ticketsSold`);
        
        // Create a range of all possible ticket numbers
        const totalRange = Array.from({ length: competition[0].totalTickets }, (_, i) => i + 1);
        
        // Find available numbers that aren't in purchasedNumbers or inCartNumbers
        // Convert Sets to Arrays before combining to fix TypeScript iteration error
        const allTakenNumbers = new Set([...Array.from(purchasedNumbers), ...Array.from(inCartNumbers)]);
        const availableNumbers = totalRange.filter(num => !allTakenNumbers.has(num));
        
        // Add enough random available numbers to match tickets_sold
        const additionalNeeded = ticketsSold - purchasedNumbers.size;
        const additionalNumbers = availableNumbers.slice(0, additionalNeeded);
        
        console.log(`📊 Adding these specific numbers: ${additionalNumbers.join(', ')}`);
        
        for (const num of additionalNumbers) {
          purchasedNumbers.add(num);
        }
      } else {
        console.log(`🎫 No additional numbers needed for competition ${competitionId} - current purchased: ${purchasedArray.length}, ticketsSold: ${ticketsSold}`);
        
        // SPECIAL DEBUG: For competition with the issue, clear any fake tickets that might be stuck
        if (competition[0].ticketsSold === null || competition[0].ticketsSold === 0) {
          console.log(`🧹 Competition ${competitionId} has no tickets sold, ensuring clean state`);
          // Don't do anything to the purchased numbers if we don't have any tickets sold
        }
      }
      
      // Return all taken numbers 
      const result = {
        purchased: Array.from(purchasedNumbers),
        inCart: Array.from(inCartNumbers),
        all: [...Array.from(purchasedNumbers), ...Array.from(inCartNumbers)]
      };
      
      console.log(`🎫 TicketService: Returning ${result.purchased.length} purchased and ${result.inCart.length} in-cart numbers`);
      
      return result;
    } catch (error) {
      console.error('Error in TicketService.getTakenNumbers:', error);
      throw error;
    }
  }
  
  /**
   * Check if a specific ticket number is available for a competition
   */
  static async isNumberAvailable(competitionId: number, ticketNumber: number): Promise<boolean> {
    try {
      const takenNumbers = await this.getTakenNumbers(competitionId);
      return !takenNumbers.all.includes(ticketNumber);
    } catch (error) {
      console.error(`Error checking ticket availability for competition ${competitionId}, ticket ${ticketNumber}:`, error);
      // Default to unavailable on error to prevent booking conflicts
      return false;
    }
  }
}