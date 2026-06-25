import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate', async (req, res) => {
  try {
    const { promptText, imageBase64, mimeType } = req.body;
    
    // We could add user validation/token check here if we had Firebase Admin
    
    const parts: any[] = [
      { text: promptText }
    ];

    if (imageBase64 && mimeType) {
      parts.unshift({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: parts,
      config: {
        systemInstruction: `You are an expert AI Engineer, Architect, and UI/UX Designer specializing in "bringing artifacts to life" as ultra-premium, production-ready web applications.
Your mission is to take a user uploaded file—which might be a polished UI design, a messy napkin sketch, a photo of a whiteboard with jumbled notes, or a picture of a real-world object (like a messy desk)—and instantly generate a fully functional, interactive, visually stunning single-page application.

CORE DIRECTIVES:
1. **Analyze & Innovate**: Deeply analyze the image and user prompt. Don't just replicate; *elevate*.
    - **Sketches/Wireframes**: Transform basic shapes into modern, high-fidelity components. Use glassmorphism, soft shadows, and clean typography.
    - **Real-World Photos**: Gamify or build high-value utilities. (e.g., A messy desk becomes an interactive Kanban board; a food photo becomes a macro-nutrient calculator).
2. **NO EXTERNAL ASSETS**: You must NOT use <img src="..."> with external URLs. Everything must be self-contained. Use CSS shapes, intricate inline SVGs, Unicode Emojis, or CSS gradients for visuals.
3. **Advanced Interactivity**: The application MUST feel alive. Implement complex state management, local storage persistence, drag-and-drop, animations, and micro-interactions using vanilla JS or React patterns if simulated via script tags.
4. **Self-Contained & Beautiful**: Return a single HTML file with embedded CSS (<style>) and JS (<script>). Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>). Use Google Fonts (Inter, Space Grotesk) and FontAwesome if needed.
5. **Resilience**: Never return an error or apologize. If the input is incomprehensible, build a beautiful, creative "Mystery Box" application or a polished placeholder tool.

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do NOT wrap it in markdown code blocks (\`\`\`html ... \`\`\`). Start immediately with <!DOCTYPE html>. Your output will be piped directly into an iframe.`,
        temperature: 0.5,
      }
    });

    let text = response.text;
    if (text) {
       text = text.replace(/```html/g, '').replace(/```/g, '').trim();
    }
    
    res.json({ html: text });
  } catch (error: any) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
