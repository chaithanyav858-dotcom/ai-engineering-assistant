import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Verify Gemini API Key exists
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: GEMINI_API_KEY is not set or is using the placeholder. Please configure it in your .env file.');
}

// System instructions for the AI Study Buddy
const SYSTEM_INSTRUCTION = `You are AI Study Buddy, a helpful, highly intelligent, and engaging academic assistant for engineering and computer science students.
You specialize in five core subjects:
1. Python Programming (debugging code, explaining syntax, object-oriented concepts, algorithms, scripting)
2. Database Management Systems (DBMS) (SQL queries, normalization, transactions, indexing, ER modeling)
3. Operating Systems (OS) (processes, threads, CPU scheduling, deadlocks, memory management, file systems)
4. Computer Networks (CN) (TCP/IP model, routing protocols, subnetting, 3-way handshake, DNS, OSI layers)
5. Data Structures & Algorithms (DSA) (arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, time complexity)

Your style guidelines:
- Explain concepts clearly, step by step, using real-world analogies or code examples where helpful.
- When explaining academic topics, prefer this structure:
  - Definition / Concept High-level Overview
  - Plain English Explanation (student-friendly, intuitive)
  - Clear Example / Code Snippet / Diagram (in text/markdown)
  - Key Takeaways or Exam/Interview Tips
  - Brief Summary
- For code snippets, provide clean, well-commented, and beginner-friendly code in markdown formatting (e.g. \`\`\`python ... \`\`\`).
- Keep answers accurate, structured, and engaging.
- IMPORTANT: If the user asks something completely unrelated to academic engineering, computer science, or general science topics (e.g., pop culture, planning a vacation, creative fiction writing), politely but humorously guide them back to engineering study-related help.
- Do not make up facts. If you do not know, politely state so.`;

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  // 1. Validation
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // 2. Check API Key
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(500).json({
      error: 'Gemini API Key is not configured on the server. Please check your backend configuration and add GEMINI_API_KEY to the .env file.'
    });
  }

  try {
    // 3. Format history for Gemini API
    // Gemini expects role: 'user' and role: 'model' (which corresponds to 'assistant')
    // and content structured as { role: string, parts: [{ text: string }] }
    const contents = [];

    if (Array.isArray(history)) {
      history.forEach((msg) => {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 4. Construct Gemini API Request Body
    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      }
    };

    // 5. Send POST request to Gemini 2.5 Flash Endpoint
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Set a timeout of 20 seconds for safety
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error details:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || `Gemini API returned status code ${response.status}.`
      });
    }

    const data = await response.json();

    // Validate structure of return data
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.json({ reply });
    } else {
      console.error('Invalid Gemini API response structure:', JSON.stringify(data));
      return res.status(502).json({
        error: 'Received an invalid or empty response from the AI model service.'
      });
    }
  } catch (error) {
    console.error('Error handling chat API request:', error);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'The request to Gemini API timed out. Please try again.' });
    }
    return res.status(500).json({ error: 'An unexpected internal server error occurred while processing your request.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `AI Study Buddy server running successfully!`);
  console.log(`- Local Access: http://localhost:${PORT}`);
  console.log(`- Environment: ${process.env.NODE_ENV || 'development'}`);
});
