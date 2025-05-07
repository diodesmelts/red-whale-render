/**
 * Initialize Ticket Statuses for All Competitions
 * 
 * This script creates the ticket_statuses table and initializes it with status entries
 * for all existing competitions.
 */

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const main = async () => {
  try {
    console.log('🔄 Starting ticket status initialization script...');
    
    // Check if ticket_statuses table exists
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ticket_statuses'
      );
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('📊 Creating ticket_statuses table...');
      
      // Create ticket_status enum type if it doesn't exist
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
            CREATE TYPE ticket_status AS ENUM ('available', 'reserved', 'purchased');
          END IF;
        END
        $$;
      `);
      
      // Create the ticket_statuses table
      await pool.query(`
        CREATE TABLE ticket_statuses (
          id SERIAL PRIMARY KEY,
          competition_id INTEGER NOT NULL,
          ticket_number INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'available',
          user_id INTEGER,
          entry_id INTEGER,
          reserved_until TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_ticket_statuses_competition_id ON ticket_statuses(competition_id);
        CREATE INDEX idx_ticket_statuses_status ON ticket_statuses(status);
        CREATE INDEX idx_ticket_statuses_ticket_number ON ticket_statuses(ticket_number);
        CREATE UNIQUE INDEX idx_ticket_statuses_comp_ticket ON ticket_statuses(competition_id, ticket_number);
      `);
      
      console.log('✅ Created ticket_statuses table and indexes');
    } else {
      console.log('📊 Ticket_statuses table already exists, skipping creation');
    }
    
    // Get all competitions
    const competitionsResult = await pool.query(`
      SELECT id, title, total_tickets FROM competitions ORDER BY id;
    `);
    
    const competitions = competitionsResult.rows;
    console.log(`📊 Found ${competitions.length} competitions to process`);
    
    // For each competition, initialize ticket statuses if needed
    for (const competition of competitions) {
      const { id, title, total_tickets } = competition;
      
      // Check if statuses already exist for this competition
      const statusCountResult = await pool.query(`
        SELECT COUNT(*) FROM ticket_statuses WHERE competition_id = $1;
      `, [id]);
      
      const statusCount = parseInt(statusCountResult.rows[0].count);
      
      if (statusCount > 0) {
        console.log(`📊 Competition #${id} "${title}" already has ${statusCount} ticket statuses, skipping`);
        continue;
      }
      
      console.log(`📊 Initializing ticket statuses for competition #${id} "${title}" with ${total_tickets} tickets`);
      
      // Prepare batch insert values
      const valuePlaceholders = [];
      const values = [];
      let paramIndex = 1;
      
      for (let ticketNumber = 1; ticketNumber <= total_tickets; ticketNumber++) {
        valuePlaceholders.push(`($${paramIndex++}, $${paramIndex++}, 'available')`);
        values.push(id, ticketNumber);
      }
      
      // Use batched inserts for better performance
      if (valuePlaceholders.length > 0) {
        const query = `
          INSERT INTO ticket_statuses (competition_id, ticket_number, status)
          VALUES ${valuePlaceholders.join(', ')};
        `;
        
        await pool.query(query, values);
        console.log(`✅ Created ${total_tickets} ticket status entries for competition #${id}`);
      }
    }
    
    // Sync ticket statuses with existing entries
    console.log('🔄 Syncing ticket statuses with existing entries...');
    
    // Update ticket statuses based on completed entries
    await pool.query(`
      UPDATE ticket_statuses ts
      SET status = 'purchased', 
          user_id = e.user_id,
          entry_id = e.id
      FROM entries e, 
           jsonb_array_elements_text(e.selected_numbers) as ticket_num
      WHERE ts.competition_id = e.competition_id
      AND ts.ticket_number = ticket_num::integer
      AND e.payment_status = 'completed';
    `);
    
    // Update ticket statuses based on pending entries
    await pool.query(`
      UPDATE ticket_statuses ts
      SET status = 'reserved', 
          user_id = e.user_id,
          entry_id = e.id,
          reserved_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes'
      FROM entries e, 
           jsonb_array_elements_text(e.selected_numbers) as ticket_num
      WHERE ts.competition_id = e.competition_id
      AND ts.ticket_number = ticket_num::integer
      AND e.payment_status = 'pending';
    `);
    
    console.log('✅ Ticket status initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Error initializing ticket statuses:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();