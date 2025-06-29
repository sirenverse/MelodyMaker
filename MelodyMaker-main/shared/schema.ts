import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bpm: integer("bpm").notNull().default(120),
  instrument: text("instrument").notNull().default("piano"),
  notes: jsonb("notes").notNull(), // Array of note objects with frequency, duration, timestamp
  chords: jsonb("chords"), // Array of chord progressions
  scale: text("scale"), // Selected scale (major, minor, etc.)
  key: text("key").default("C"), // Selected key
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSequenceSchema = createInsertSchema(sequences).omit({
  id: true,
  createdAt: true,
});

export type InsertSequence = z.infer<typeof insertSequenceSchema>;
export type Sequence = typeof sequences.$inferSelect;

// Note structure for JSON storage
export const noteSchema = z.object({
  note: z.string(),
  frequency: z.number(),
  duration: z.number().optional(),
  timestamp: z.number(),
  velocity: z.number().optional(),
  fret: z.number().optional(), // For guitar
  string: z.number().optional(), // For guitar
});

export type Note = z.infer<typeof noteSchema>;

// Chord structure
export const chordSchema = z.object({
  name: z.string(),
  notes: z.array(z.string()),
  timestamp: z.number(),
});

export type Chord = z.infer<typeof chordSchema>;
