import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API route for AI Quantum Puzzle Generation
app.post("/api/ai/generate-puzzle", async (req, res) => {
  try {
    const { difficulty, theme } = req.body;
    const prompt = `Generate a unique quantum circuit puzzle for a sci-fi puzzle game. 
Difficulty: ${difficulty || 'medium'} (easy, medium, hard, expert).
Theme: ${theme || 'Cybernetic Core'}.
Return a valid JSON object with:
{
  "levelName": "string",
  "briefing": "string (sci-fi lore briefing)",
  "gridSize": number (between 5 and 8),
  "timeLimit": number (seconds),
  "targetResonance": number,
  "nodes": [
    { "x": number, "y": number, "type": "emitter"|"receiver"|"mirror"|"splitter"|"phase"|"barrier", "rotation": number (0, 90, 180, 270), "fixed": boolean }
  ]
}
Ensure the puzzle is solvable and aesthetically interesting. Output ONLY valid JSON without markdown formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8
      }
    });

    const text = response.text || "{}";
    const puzzleData = JSON.parse(text);
    res.json({ success: true, puzzle: puzzleData });
  } catch (error: any) {
    console.error("AI Puzzle Generation Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate AI puzzle" });
  }
});

// Setup Vite middleware for development
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
