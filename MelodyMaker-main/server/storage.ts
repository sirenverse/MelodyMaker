import { sequences, type Sequence, type InsertSequence } from "@shared/schema";

export interface IStorage {
  getSequence(id: number): Promise<Sequence | undefined>;
  getAllSequences(): Promise<Sequence[]>;
  createSequence(sequence: InsertSequence): Promise<Sequence>;
  updateSequence(id: number, sequence: Partial<InsertSequence>): Promise<Sequence | undefined>;
  deleteSequence(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private sequences: Map<number, Sequence>;
  private currentId: number;

  constructor() {
    this.sequences = new Map();
    this.currentId = 1;
  }

  async getSequence(id: number): Promise<Sequence | undefined> {
    return this.sequences.get(id);
  }

  async getAllSequences(): Promise<Sequence[]> {
    return Array.from(this.sequences.values());
  }

  async createSequence(insertSequence: InsertSequence): Promise<Sequence> {
    const id = this.currentId++;
    const sequence: Sequence = { 
      ...insertSequence, 
      id, 
      createdAt: new Date(),
      key: insertSequence.key || "C",
      bpm: insertSequence.bpm || 120,
      instrument: insertSequence.instrument || "piano",
      scale: insertSequence.scale || "major",
      chords: insertSequence.chords || []
    };
    this.sequences.set(id, sequence);
    return sequence;
  }

  async updateSequence(id: number, updateData: Partial<InsertSequence>): Promise<Sequence | undefined> {
    const existing = this.sequences.get(id);
    if (!existing) return undefined;
    
    const updated: Sequence = { ...existing, ...updateData };
    this.sequences.set(id, updated);
    return updated;
  }

  async deleteSequence(id: number): Promise<boolean> {
    return this.sequences.delete(id);
  }
}

export const storage = new MemStorage();
