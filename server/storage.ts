import { users, type User, type InsertUser, competitions, type Competition, type InsertCompetition, entries, type Entry, type InsertEntry, winners, type Winner, type InsertWinner } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "confirmPassword" | "agreeToTerms">): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  promoteToAdmin(id: number): Promise<User | undefined>;
  
  // Competition operations
  getCompetition(id: number): Promise<Competition | undefined>;
  listCompetitions(options?: { 
    category?: string, 
    limit?: number, 
    offset?: number,
    isLive?: boolean,
    isFeatured?: boolean,
    sortBy?: 'newest' | 'endingSoon' | 'popular'
  }): Promise<Competition[]>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: number, competition: Partial<Competition>): Promise<Competition | undefined>;
  
  // Entry operations
  createEntry(entry: InsertEntry): Promise<Entry>;
  getEntries(userId: number): Promise<Entry[]>;
  getEntriesByCompetition(competitionId: number): Promise<Entry[]>;
  updateEntryPaymentStatus(id: number, status: string, paymentId?: string): Promise<Entry | undefined>;
  
  // Winner operations
  createWinner(winner: InsertWinner): Promise<Winner>;
  getWinners(userId: number): Promise<Winner[]>;
  getWinnersByCompetition(competitionId: number): Promise<Winner[]>;
  updateWinnerClaimStatus(id: number, status: string): Promise<Winner | undefined>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private competitions: Map<number, Competition>;
  private entries: Map<number, Entry>;
  private winners: Map<number, Winner>;
  
  userCurrentId: number;
  competitionCurrentId: number;
  entryCurrentId: number;
  winnerCurrentId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.competitions = new Map();
    this.entries = new Map();
    this.winners = new Map();
    
    this.userCurrentId = 1;
    this.competitionCurrentId = 1;
    this.entryCurrentId = 1;
    this.winnerCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add sample competitions
    this.seedCompetitions();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(userData: Omit<InsertUser, "confirmPassword" | "agreeToTerms">): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id,
      mascot: userData.mascot ?? 'blue-whale',
      isAdmin: false,
      notificationSettings: userData.notificationSettings ?? { email: true, inApp: true },
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Method to promote a user to admin
  async promoteToAdmin(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isAdmin: true };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Competition operations
  async getCompetition(id: number): Promise<Competition | undefined> {
    return this.competitions.get(id);
  }
  
  async listCompetitions(options: { 
    category?: string, 
    limit?: number, 
    offset?: number,
    isLive?: boolean,
    isFeatured?: boolean,
    sortBy?: 'newest' | 'endingSoon' | 'popular'
  } = {}): Promise<Competition[]> {
    let competitions = Array.from(this.competitions.values());
    
    // Filter by category if provided
    if (options.category) {
      competitions = competitions.filter(comp => comp.category === options.category);
    }
    
    // Filter by live status if provided
    if (options.isLive !== undefined) {
      competitions = competitions.filter(comp => comp.isLive === options.isLive);
    }
    
    // Filter by featured status if provided
    if (options.isFeatured !== undefined) {
      competitions = competitions.filter(comp => comp.isFeatured === options.isFeatured);
    }
    
    // Sort by option
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'newest':
          competitions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case 'endingSoon':
          competitions.sort((a, b) => a.drawDate.getTime() - b.drawDate.getTime());
          break;
        case 'popular':
          competitions.sort((a, b) => b.ticketsSold - a.ticketsSold);
          break;
      }
    }
    
    // Apply pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || competitions.length;
      competitions = competitions.slice(offset, offset + limit);
    }
    
    return competitions;
  }
  
  async createCompetition(competitionData: InsertCompetition): Promise<Competition> {
    const id = this.competitionCurrentId++;
    const now = new Date();
    const competition: Competition = {
      ...competitionData,
      id,
      ticketsSold: 0,
      createdAt: now
    };
    this.competitions.set(id, competition);
    return competition;
  }
  
  async updateCompetition(id: number, competitionData: Partial<Competition>): Promise<Competition | undefined> {
    const competition = this.competitions.get(id);
    if (!competition) return undefined;
    
    const updatedCompetition = { ...competition, ...competitionData };
    this.competitions.set(id, updatedCompetition);
    return updatedCompetition;
  }
  
  // Entry operations
  async createEntry(entryData: InsertEntry): Promise<Entry> {
    const id = this.entryCurrentId++;
    const now = new Date();
    const entry: Entry = {
      ...entryData,
      id,
      createdAt: now
    };
    this.entries.set(id, entry);
    
    // Update competition ticket count
    const competition = await this.getCompetition(entryData.competitionId);
    if (competition) {
      await this.updateCompetition(competition.id, {
        ticketsSold: competition.ticketsSold + entryData.ticketCount
      });
    }
    
    return entry;
  }
  
  async getEntries(userId: number): Promise<Entry[]> {
    return Array.from(this.entries.values()).filter(entry => entry.userId === userId);
  }
  
  async getEntriesByCompetition(competitionId: number): Promise<Entry[]> {
    return Array.from(this.entries.values()).filter(entry => entry.competitionId === competitionId);
  }
  
  async updateEntryPaymentStatus(id: number, status: string, paymentId?: string): Promise<Entry | undefined> {
    const entry = this.entries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry: Entry = {
      ...entry,
      paymentStatus: status,
      ...(paymentId ? { stripePaymentId: paymentId } : {})
    };
    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  // Winner operations
  async createWinner(winnerData: InsertWinner): Promise<Winner> {
    const id = this.winnerCurrentId++;
    const now = new Date();
    const winner: Winner = {
      ...winnerData,
      id,
      announcedAt: now,
      claimStatus: 'pending'
    };
    this.winners.set(id, winner);
    return winner;
  }
  
  async getWinners(userId: number): Promise<Winner[]> {
    return Array.from(this.winners.values()).filter(winner => winner.userId === userId);
  }
  
  async getWinnersByCompetition(competitionId: number): Promise<Winner[]> {
    return Array.from(this.winners.values()).filter(winner => winner.competitionId === competitionId);
  }
  
  async updateWinnerClaimStatus(id: number, status: string): Promise<Winner | undefined> {
    const winner = this.winners.get(id);
    if (!winner) return undefined;
    
    const updatedWinner: Winner = {
      ...winner,
      claimStatus: status
    };
    this.winners.set(id, updatedWinner);
    return updatedWinner;
  }
  
  // Seed method for demo competitions
  private seedCompetitions() {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    
    const demoCompetitions: Omit<Competition, 'id' | 'createdAt'>[] = [
      {
        title: "Ninja Air Fryer",
        description: "Enter for your chance to win an air fryer.",
        imageUrl: "https://images.unsplash.com/photo-1613825787641-2e6f3d85a6d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        category: "appliances",
        prizeValue: 25000, // £250.00
        ticketPrice: 100, // £1.00
        maxTicketsPerUser: 10,
        totalTickets: 1000,
        ticketsSold: 50,
        brand: "Ninja",
        drawDate: new Date(now.getTime() + 5 * oneDay), // 5 days from now
        isLive: true,
        isFeatured: true
      },
      {
        title: "Family Adventure Package",
        description: "Win a family adventure package for four with all expenses paid.",
        imageUrl: "https://images.unsplash.com/photo-1553174241-8e01301bd424?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        category: "family",
        prizeValue: 100000, // £1,000.00
        ticketPrice: 250, // £2.50
        maxTicketsPerUser: 5,
        totalTickets: 800,
        ticketsSold: 380,
        brand: "Adventure Co",
        drawDate: new Date(now.getTime() + 3 * oneDay), // 3 days from now
        isLive: true,
        isFeatured: false
      },
      {
        title: "£5,000 Cash Prize",
        description: "Win £5,000 cash delivered directly to your account.",
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        category: "cash",
        prizeValue: 500000, // £5,000.00
        ticketPrice: 500, // £5.00
        maxTicketsPerUser: 20,
        totalTickets: 1000,
        ticketsSold: 875,
        brand: "Cash Rewards",
        drawDate: new Date(now.getTime() + oneDay / 3), // 8 hours from now
        isLive: true,
        isFeatured: true
      },
      {
        title: "Dyson Vacuum Cleaner",
        description: "Win a brand new Dyson V11 vacuum cleaner.",
        imageUrl: "https://images.unsplash.com/photo-1600495772677-8b1ff7256ebe?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        category: "appliances",
        prizeValue: 50000, // £500.00
        ticketPrice: 350, // £3.50
        maxTicketsPerUser: 8,
        totalTickets: 1000,
        ticketsSold: 365,
        brand: "Dyson",
        drawDate: new Date(now.getTime() + 2 * oneDay), // 2 days from now
        isLive: true,
        isFeatured: false
      }
    ];
    
    // Add demo competitions to the map
    demoCompetitions.forEach(comp => {
      this.createCompetition({
        ...comp,
        ticketsSold: 0 // ticketsSold will be set by createCompetition
      });
    });
  }
}

export const storage = new MemStorage();
