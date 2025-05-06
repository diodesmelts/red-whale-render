import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  mascot: text("mascot").default("blue-whale"),
  stripeCustomerId: text("stripe_customer_id"),
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  notificationSettings: json("notification_settings").$type<{
    email: boolean;
    inApp: boolean;
  }>().default({ email: true, inApp: true }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Competition schema
export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(), // family, appliances, cash, etc.
  prizeValue: integer("prize_value").notNull(), // in cents
  ticketPrice: integer("ticket_price").notNull(), // in cents
  maxTicketsPerUser: integer("max_tickets_per_user").notNull(),
  totalTickets: integer("total_tickets").notNull(),
  ticketsSold: integer("tickets_sold").default(0),
  brand: text("brand"),
  drawDate: timestamp("draw_date").notNull(),
  isLive: boolean("is_live").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Entry schema
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  competitionId: integer("competition_id").notNull(),
  ticketCount: integer("ticket_count").notNull(),
  selectedNumbers: json("selected_numbers").$type<number[]>().default([]),
  paymentStatus: text("payment_status").notNull(), // pending, completed, failed
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Winners schema
export const winners = pgTable("winners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  competitionId: integer("competition_id").notNull(),
  entryId: integer("entry_id").notNull(),
  announcedAt: timestamp("announced_at").defaultNow(),
  claimStatus: text("claim_status").default("pending"), // pending, claimed, expired
});

// Site configuration schema
export const siteConfig = pgTable("site_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: "You must agree to the terms and conditions"
    })
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const insertCompetitionSchema = createInsertSchema(competitions).omit({ 
  id: true, 
  createdAt: true, 
  ticketsSold: true 
});

export const insertEntrySchema = createInsertSchema(entries).omit({ 
  id: true, 
  createdAt: true 
});

export const insertWinnerSchema = createInsertSchema(winners).omit({ 
  id: true, 
  announcedAt: true 
});

export const insertSiteConfigSchema = createInsertSchema(siteConfig).omit({
  id: true,
  updatedAt: true
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Entry = typeof entries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type SiteConfig = typeof siteConfig.$inferSelect;
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
