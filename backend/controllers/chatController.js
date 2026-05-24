// System instructions for Nexora AI
const SYSTEM_INSTRUCTION = `You are Nexora AI, a helpful, highly intelligent, and engaging academic assistant for engineering students across all disciplines.
You specialize in five core engineering areas:
1. Computer Science & IT (programming, debugging, OOP, scripting, data structures, algorithms, databases, computer networks)
2. Electrical & Electronics Engineering (circuits, KVL/KCL, semiconductor devices, digital logic, microprocessors, signals & systems)
3. Mechanical & Aerospace Engineering (thermodynamics, fluid mechanics, heat transfer, CAD/CAM, engineering mechanics)
4. Civil & Structural Engineering (strength of materials, concrete technology, surveying, hydraulics, environmental systems)
5. Engineering Mathematics & Applied Sciences (calculus, linear algebra, differential equations, physics, chemistry, numerical methods)

Your style guidelines:
- Explain concepts clearly, step by step, using real-world analogies, engineering equations, or code examples where helpful.
- When explaining academic topics, prefer this structure:
  - Definition / Concept High-level Overview
  - Plain English Explanation (student-friendly, intuitive)
  - Clear Example / Code Snippet / Equation / Diagram (in text/markdown)
  - Key Takeaways or Exam/Interview Tips
  - Brief Summary
- For code snippets, provide clean, well-commented code in markdown formatting (e.g. \`\`\`python ... \`\`\`).
- Keep answers accurate, structured, and engaging.
- IMPORTANT: If the user asks something completely unrelated to academic engineering, general science, math, or technology topics (e.g., pop culture, planning a vacation, creative fiction writing), politely but humorously guide them back to engineering study-related help.
- Do not make up facts. If you do not know, politely state so.`;

// POST /api/chat controller
export const handleChat = async (req, res) => {
  const { message, history } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // 1. Validation
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // 2. Check API Key configuration
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(500).json({
      error: 'Gemini API Key is not configured on the server. Please check your backend configuration and add GEMINI_API_KEY.'
    });
  }

  try {
    // 3. Format history for Gemini API (user & model roles)
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

    // Append the current user question
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 4. Construct Gemini request structure
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

    // 5. Send POST request with fallback model list to handle high demand or rate limits
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
    let lastError = null;
    let responseData = null;
    let successfulModel = null;

    for (const model of models) {
      try {
        console.log(`[API] Attempting model: ${model}`);
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
        // Timeout of 20 seconds
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
          console.warn(`[API] Model ${model} failed with response:`, errorData);
          lastError = errorData.error?.message || `Status code ${response.status}`;
          continue; // Try next model
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
          responseData = data;
          successfulModel = model;
          console.log(`[API] Model ${model} succeeded!`);
          break; // Exit loop on success
        } else {
          console.warn(`[API] Invalid response schema for model ${model}:`, JSON.stringify(data));
          lastError = 'Invalid Gemini API response schema structure.';
        }
      } catch (err) {
        console.error(`[API] Fetch error for model ${model}:`, err);
        lastError = err.message || err;
      }
    }

    if (!responseData) {
      return res.status(503).json({
        error: `All AI models are currently experiencing high demand. Please try again in a few seconds. Last error: ${lastError}`
      });
    }

    const reply = responseData.candidates[0].content.parts[0].text;
    return res.json({ reply, model: successfulModel });

  } catch (error) {
    console.error('[CONTROLLER] Internal server error handling chat:', error);
    return res.status(500).json({ error: 'An unexpected internal server error occurred while processing your request.' });
  }
};
