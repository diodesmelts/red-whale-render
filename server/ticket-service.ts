import { db } from './db';
import { competitions, entries, ticketStatuses, users, type TicketStatusResponse } from '@shared/schema';
import { eq, and, gt, isNull, inArray, sql, desc, asc } from 'drizzle-orm';

/**
 * Enhanced Ticket Service - Centralized Ticket Status Management
 * 
 * This service provides a single source of truth for ticket statuses,
 * ensuring consistency between the admin dashboard and customer frontend.
 */
export class TicketService {
  /**
   * Initialize the ticket statuses for a competition
   * This should be called when a competition is created or reset
   */
  static async initializeTicketStatuses(competitionId: number): Promise<void> {
    try {
      console.log(`🎟️ Initializing ticket statuses for competition ${competitionId}`);
      
      // First get the competition to verify existence and get total tickets
      const competition = await db.select()
        .from(competitions)
        .where(eq(competitions.id, competitionId))
        .limit(1);
        
      if (!competition.length) {
        console.error(`🎟️ Competition ${competitionId} not found for initialization`);
        throw new Error('Competition not found');
      }
      
      // Check if statuses already exist for this competition
      const existingStatuses = await db.select({ count: sql<number>`count(*)` })
        .from(ticketStatuses)
        .where(eq(ticketStatuses.competitionId, competitionId));
      
      const statusCount = existingStatuses[0]?.count || 0;
      
      if (statusCount > 0) {
        console.log(`🎟️ ${statusCount} ticket statuses already exist for competition ${competitionId}`);
        return; // Statuses already initialized
      }
      
      // Create ticket statuses for each ticket number
      const totalTickets = competition[0].totalTickets;
      const bulkInsertValues = [];
      
      for (let i = 1; i <= totalTickets; i++) {
        bulkInsertValues.push({
          competitionId,
          ticketNumber: i,
          status: 'available' as 'available' | 'reserved' | 'purchased',
        });
      }
      
      // Use batch insert for better performance
      const batchSize = 1000;
      for (let i = 0; i < bulkInsertValues.length; i += batchSize) {
        const batch = bulkInsertValues.slice(i, i + batchSize);
        await db.insert(ticketStatuses).values(batch);
      }
      
      console.log(`🎟️ Successfully initialized ${totalTickets} ticket statuses for competition ${competitionId}`);
    } catch (error) {
      console.error(`Error initializing ticket statuses: ${error}`);
      throw error;
    }
  }

  /**
   * Get the current status of all tickets for a competition
   * This is the central source of truth for the entire application
   */
  static async getTicketStatuses(competitionId: number): Promise<TicketStatusResponse> {
    try {
      console.log(`🎟️ Getting ticket statuses for competition ${competitionId}`);
      
      // First ensure the competition exists
      const competition = await db.select()
        .from(competitions)
        .where(eq(competitions.id, competitionId))
        .limit(1);
        
      if (!competition.length) {
        console.error(`🎟️ Competition ${competitionId} not found`);
        throw new Error('Competition not found');
      }
      
      // Check if we need to initialize this competition's ticket statuses
      const statusCheck = await db.select({ count: sql<number>`count(*)` })
        .from(ticketStatuses)
        .where(eq(ticketStatuses.competitionId, competitionId));
      
      if (statusCheck[0].count === 0) {
        await this.initializeTicketStatuses(competitionId);
      }
      
      // Prepare containers for results
      const result: TicketStatusResponse = {
        competitionId,
        totalTickets: competition[0].totalTickets,
        ticketStatuses: {
          available: [],
          reserved: [],
          purchased: []
        }
      };
      
      // Get all ticket statuses for the competition
      const allStatuses = await db.select()
        .from(ticketStatuses)
        .where(eq(ticketStatuses.competitionId, competitionId))
        .orderBy(asc(ticketStatuses.ticketNumber));
      
      // Sort tickets by status
      for (const ticket of allStatuses) {
        if (ticket.status === 'available') {
          result.ticketStatuses.available.push(ticket.ticketNumber);
        } else if (ticket.status === 'reserved') {
          result.ticketStatuses.reserved.push(ticket.ticketNumber);
        } else if (ticket.status === 'purchased') {
          result.ticketStatuses.purchased.push(ticket.ticketNumber);
        }
      }
      
      // Add metadata for convenience
      result._meta = {
        ticketsSold: result.ticketStatuses.purchased.length,
        ticketsReserved: result.ticketStatuses.reserved.length,
        ticketsAvailable: result.ticketStatuses.available.length,
        statusTimestamp: new Date().toISOString()
      };
      
      console.log(`🎟️ Returning ticket statuses for competition ${competitionId}: ` +
        `${result.ticketStatuses.purchased.length} purchased, ` +
        `${result.ticketStatuses.reserved.length} reserved, ` +
        `${result.ticketStatuses.available.length} available`);
      
      return result;
    } catch (error) {
      console.error(`Error getting ticket statuses: ${error}`);
      throw error;
    }
  }
  
  /**
   * Legacy method for backward compatibility
   * Use getTicketStatuses for new code
   */
  static async getTakenNumbers(competitionId: number): Promise<{
    purchased: number[];
    inCart: number[];
    all: number[];
  }> {
    try {
      console.log(`🎟️ Legacy getTakenNumbers called for competition ${competitionId}`);
      
      // Use the new method internally
      const statuses = await this.getTicketStatuses(competitionId);
      
      // Map new format to old format
      return {
        purchased: statuses.ticketStatuses.purchased,
        inCart: statuses.ticketStatuses.reserved,
        all: [...statuses.ticketStatuses.purchased, ...statuses.ticketStatuses.reserved]
      };
    } catch (error) {
      console.error(`Error in legacy getTakenNumbers: ${error}`);
      throw error;
    }
  }

  /**
   * Reserve tickets for a user (e.g., when added to cart)
   */
  static async reserveTickets(competitionId: number, ticketNumbers: number[], userId: number): Promise<boolean> {
    try {
      console.log(`🎟️ Reserving tickets ${ticketNumbers.join(', ')} for user ${userId} in competition ${competitionId}`);
      
      // Check if all requested tickets are available
      const ticketData = await db.select()
        .from(ticketStatuses)
        .where(
          and(
            eq(ticketStatuses.competitionId, competitionId),
            inArray(ticketStatuses.ticketNumber, ticketNumbers)
          )
        );
        
      // Verify all tickets exist
      if (ticketData.length !== ticketNumbers.length) {
        console.error(`🎟️ Not all requested tickets exist for competition ${competitionId}`);
        return false;
      }
      
      // Verify all tickets are available
      const unavailableTickets = ticketData.filter(t => t.status !== 'available');
      if (unavailableTickets.length > 0) {
        console.error(`🎟️ Some tickets are not available: ${unavailableTickets.map(t => t.ticketNumber).join(', ')}`);
        return false;
      }
      
      // Set reservation expiry time (30 minutes from now)
      const reservedUntil = new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + 30);
      
      // Update ticket statuses to reserved
      await db.update(ticketStatuses)
        .set({ 
          status: 'reserved', 
          userId,
          reservedUntil
        })
        .where(
          and(
            eq(ticketStatuses.competitionId, competitionId),
            inArray(ticketStatuses.ticketNumber, ticketNumbers)
          )
        );
      
      console.log(`🎟️ Successfully reserved ${ticketNumbers.length} tickets for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error reserving tickets: ${error}`);
      return false;
    }
  }

  /**
   * Mark tickets as purchased (e.g., after payment completed)
   */
  static async purchaseTickets(competitionId: number, ticketNumbers: number[], userId: number, entryId: number): Promise<boolean> {
    try {
      console.log(`🎟️ Marking tickets ${ticketNumbers.join(', ')} as purchased for user ${userId} in competition ${competitionId}`);
      
      // Update tickets to purchased status
      const result = await db.update(ticketStatuses)
        .set({ 
          status: 'purchased', 
          userId,
          entryId,
          reservedUntil: null
        })
        .where(
          and(
            eq(ticketStatuses.competitionId, competitionId),
            inArray(ticketStatuses.ticketNumber, ticketNumbers),
            eq(ticketStatuses.userId, userId)
          )
        );
      
      // Also update competition's ticketsSold count
      const [competition] = await db.select()
        .from(competitions)
        .where(eq(competitions.id, competitionId))
        .limit(1);
      
      if (competition) {
        const currentSold = competition.ticketsSold || 0;
        await db.update(competitions)
          .set({ ticketsSold: currentSold + ticketNumbers.length })
          .where(eq(competitions.id, competitionId));
      }
      
      console.log(`🎟️ Successfully marked ${ticketNumbers.length} tickets as purchased for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error purchasing tickets: ${error}`);
      return false;
    }
  }

  /**
   * Release reserved tickets (e.g., when removed from cart or reservation expired)
   */
  static async releaseTickets(competitionId: number, ticketNumbers: number[]): Promise<boolean> {
    try {
      console.log(`🎟️ Releasing tickets ${ticketNumbers.join(', ')} for competition ${competitionId}`);
      
      // Update tickets back to available status
      await db.update(ticketStatuses)
        .set({ 
          status: 'available', 
          userId: null,
          entryId: null,
          reservedUntil: null
        })
        .where(
          and(
            eq(ticketStatuses.competitionId, competitionId),
            inArray(ticketStatuses.ticketNumber, ticketNumbers),
            eq(ticketStatuses.status, 'reserved')
          )
        );
      
      console.log(`🎟️ Successfully released tickets for competition ${competitionId}`);
      return true;
    } catch (error) {
      console.error(`Error releasing tickets: ${error}`);
      return false;
    }
  }

  /**
   * Release all expired ticket reservations
   */
  static async releaseExpiredReservations(): Promise<number> {
    try {
      console.log(`🎟️ Releasing all expired ticket reservations`);
      
      const now = new Date();
      
      // Find and release all tickets with expired reservations
      const result = await db.update(ticketStatuses)
        .set({ 
          status: 'available', 
          userId: null,
          entryId: null,
          reservedUntil: null
        })
        .where(
          and(
            eq(ticketStatuses.status, 'reserved'),
            // Use SQL version of the comparison to avoid type errors
            sql`${ticketStatuses.reservedUntil} < ${now}`
          )
        );
      
      // Count affected rows
      const rowCount = result.rowCount || 0;
      
      console.log(`🎟️ Released ${rowCount || 0} expired ticket reservations`);
      return rowCount || 0;
    } catch (error) {
      console.error(`Error releasing expired reservations: ${error}`);
      return 0;
    }
  }

  /**
   * Check if a specific ticket number is available for a competition
   */
  static async isNumberAvailable(competitionId: number, ticketNumber: number): Promise<boolean> {
    try {
      // Get the current status of the ticket
      const [ticketStatus] = await db.select()
        .from(ticketStatuses)
        .where(
          and(
            eq(ticketStatuses.competitionId, competitionId),
            eq(ticketStatuses.ticketNumber, ticketNumber)
          )
        )
        .limit(1);
      
      // If ticket not found or status is available
      return !ticketStatus || ticketStatus.status === 'available';
    } catch (error) {
      console.error(`Error checking ticket availability: ${error}`);
      return false; // Default to unavailable on error for safety
    }
  }

  /**
   * Synchronize ticket statuses with entries data
   * This ensures consistency between the entries table and ticket_statuses table
   */
  static async syncWithEntries(competitionId: number): Promise<void> {
    try {
      console.log(`🎟️ Synchronizing ticket statuses with entries for competition ${competitionId}`);
      
      // First reset all tickets to available 
      await db.update(ticketStatuses)
        .set({ 
          status: 'available', 
          userId: null,
          entryId: null,
          reservedUntil: null
        })
        .where(eq(ticketStatuses.competitionId, competitionId));
      
      // Get all entries for this competition
      const entryList = await db.select()
        .from(entries)
        .where(eq(entries.competitionId, competitionId));
      
      // Process completed entries
      for (const entry of entryList) {
        if (entry.paymentStatus === 'completed' && entry.selectedNumbers && Array.isArray(entry.selectedNumbers)) {
          // Mark tickets as purchased
          for (const num of entry.selectedNumbers) {
            await db.update(ticketStatuses)
              .set({ 
                status: 'purchased', 
                userId: entry.userId,
                entryId: entry.id
              })
              .where(
                and(
                  eq(ticketStatuses.competitionId, competitionId),
                  eq(ticketStatuses.ticketNumber, Number(num))
                )
              );
          }
        } else if (entry.paymentStatus === 'pending' && entry.selectedNumbers && Array.isArray(entry.selectedNumbers)) {
          // Mark tickets as reserved
          const reservedUntil = new Date();
          reservedUntil.setMinutes(reservedUntil.getMinutes() + 30);
          
          for (const num of entry.selectedNumbers) {
            await db.update(ticketStatuses)
              .set({ 
                status: 'reserved', 
                userId: entry.userId,
                entryId: entry.id,
                reservedUntil
              })
              .where(
                and(
                  eq(ticketStatuses.competitionId, competitionId),
                  eq(ticketStatuses.ticketNumber, Number(num))
                )
              );
          }
        }
      }
      
      console.log(`🎟️ Successfully synchronized ticket statuses for competition ${competitionId}`);
    } catch (error) {
      console.error(`Error synchronizing ticket statuses: ${error}`);
      throw error;
    }
  }

  /**
   * Get user details by ticket number for a specific competition
   * Used for ticket lookup functionality
   */
  static async getUserByTicketNumber(competitionId: number, ticketNumber: number): Promise<{
    ticketStatus: string;
    user: { 
      id: number;
      username: string;
      email: string;
      phone?: string | null;
      fullName?: string | null;
    } | null;
    entryId: number | null;
    purchaseDate?: Date | null;
  }> {
    try {
      console.log(`🎟️ Looking up user for ticket number ${ticketNumber} in competition ${competitionId}`);
      
      // Get the ticket status
      const [ticket] = await db.select()
        .from(ticketStatuses)
        .where(
          and(
            eq(ticketStatuses.competitionId, competitionId),
            eq(ticketStatuses.ticketNumber, ticketNumber)
          )
        )
        .limit(1);
      
      if (!ticket) {
        console.log(`🎟️ Ticket number ${ticketNumber} not found in competition ${competitionId}`);
        return {
          ticketStatus: 'not_found',
          user: null,
          entryId: null
        };
      }
      
      // If the ticket isn't purchased, return status but no user
      if (ticket.status !== 'purchased') {
        return {
          ticketStatus: ticket.status,
          user: null,
          entryId: ticket.entryId
        };
      }
      
      // Get the user details
      if (!ticket.userId) {
        console.log(`🎟️ Ticket is purchased but no userId found for ticket ${ticketNumber}`);
        return {
          ticketStatus: ticket.status,
          user: null,
          entryId: ticket.entryId
        };
      }
      
      const [userDetails] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        fullName: users.fullName
      })
      .from(users)
      .where(eq(users.id, ticket.userId))
      .limit(1);
      
      // Get the entry to find purchase date
      let purchaseDate = null;
      if (ticket.entryId) {
        const [entryDetails] = await db.select({
          createdAt: entries.createdAt
        })
        .from(entries)
        .where(eq(entries.id, ticket.entryId))
        .limit(1);
        
        if (entryDetails) {
          purchaseDate = entryDetails.createdAt;
        }
      }
      
      if (!userDetails) {
        console.log(`🎟️ User with ID ${ticket.userId} not found for ticket ${ticketNumber}`);
        return {
          ticketStatus: ticket.status,
          user: null,
          entryId: ticket.entryId
        };
      }
      
      return {
        ticketStatus: ticket.status,
        user: userDetails,
        entryId: ticket.entryId,
        purchaseDate
      };
      
    } catch (error) {
      console.error(`Error getting user by ticket number: ${error}`);
      throw error;
    }
  }
}