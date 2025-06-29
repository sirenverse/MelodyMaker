import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSequenceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Audio proxy route for Salamander Piano samples
  app.get("/api/audio-proxy/:subdirectory/:filename", async (req, res) => {
    try {
      const { subdirectory, filename } = req.params;
      
      // Construct the original archive.org URL
      const archiveUrl = `https://archive.org/download/SalamanderGrandPianoV3/48khz24bit/${subdirectory}/${filename}`;
      
      console.log(`Proxying audio request: ${archiveUrl}`);
      
      // Fetch the audio file from archive.org
      const response = await fetch(archiveUrl);
      
      if (!response.ok) {
        console.error(`Failed to fetch from archive.org: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          message: `Failed to fetch audio file: ${response.statusText}` 
        });
      }
      
      // Set appropriate headers for audio streaming
      res.set({
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
        'Content-Length': response.headers.get('content-length') || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
      
      // Stream the audio data back to the client
      if (response.body) {
        const reader = response.body.getReader();
        
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } catch (error) {
            console.error('Error streaming audio:', error);
            res.status(500).end();
          }
        };
        
        await pump();
      } else {
        // Fallback for environments without streaming support
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      }
      
    } catch (error) {
      console.error('Audio proxy error:', error);
      res.status(500).json({ message: "Failed to proxy audio file" });
    }
  });

  // Get all sequences
  app.get("/api/sequences", async (req, res) => {
    try {
      const sequences = await storage.getAllSequences();
      res.json(sequences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sequences" });
    }
  });

  // Get a specific sequence
  app.get("/api/sequences/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sequence = await storage.getSequence(id);
      
      if (!sequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      
      res.json(sequence);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sequence" });
    }
  });

  // Create a new sequence
  app.post("/api/sequences", async (req, res) => {
    try {
      const validatedData = insertSequenceSchema.parse(req.body);
      const sequence = await storage.createSequence(validatedData);
      res.status(201).json(sequence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sequence" });
    }
  });

  // Update a sequence
  app.patch("/api/sequences/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSequenceSchema.partial().parse(req.body);
      const sequence = await storage.updateSequence(id, validatedData);
      
      if (!sequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      
      res.json(sequence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sequence" });
    }
  });

  // Delete a sequence
  app.delete("/api/sequences/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSequence(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      
      res.json({ message: "Sequence deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sequence" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}